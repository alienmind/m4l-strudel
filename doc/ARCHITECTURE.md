# m4l-strudel — Architecture

One codebase → three self-contained Max for Live devices, with the **real
Strudel engine** running headlessly inside each. This document describes the
build pipeline, the `.amxd` container writer, the runtime message protocol,
and exactly how (and how much) we depend on upstream Strudel.

```
┌────────────────────────── one repo ──────────────────────────┐
│  src/ (React UI)   src/max/ (node engine)   strudel/ (submodule)
│  strudel-wrapper.js ([js] glue, ES5)   ableton-amxd/ (patcher templates)
└──────────────────────────────┬───────────────────────────────┘
                          pnpm build
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
 alienmind-strudel-    alienmind-strudel-    alienmind-strudel-
    midi.amxd            sampler.amxd           audio.amxd
  (MIDI effect,        (audio effect,        (instrument,
   'mmmm')              'aaaa')               'iiii')
```

## 1. Runtime anatomy of a device

Every device contains the same four actors, generated into the patcher by
`scripts/generate-patchers.mjs`:

```
 [live.thisdevice] ─▶ [js strudel-wrapper.js <mode>]  (ES5, LiveAPI work)
                          │ outlet0 ▲                │ outlet1
                          ▼         │ ui_ready etc.  ▼
                       [jweb]  ─────┘            [node.script strudel-node-<mode>.cjs]
                          ▲   (code/hush/preview…)   ▲            │
                          │                          │            ▼
                          └── unmatched [route] ─────┘   device-specific output
                              output (evalok, catalog…)  (makenote→midiout, sfplay~,
 [plugsync~]→[snapshot~ 10]×5→[pak]→[prepend tick] ──▶    poly~→plugout~)
```

- **`[jweb]`** hosts the React UI (one app for all devices; the wrapper sends
  `mode midi|sampler|audio` after `ui_ready` and the app switches screens via
  `useDeviceMode`).
- **`[js] strudel-wrapper.js`** is the only place LiveAPI exists. It owns:
  UI/payload extraction, clip read/write (MIDI device), clip-availability
  polling, and Live 12 `root_note`/`scale_name` observers (sampler). It is
  **ES5 only** — Max's `[js]` has no modern JS. The device mode arrives as
  `jsarguments[0]`.
- **`[node.script]`** runs a real Node process (Node for Max) hosting the
  bundled Strudel engine. It has **no LiveAPI and no signal I/O** by design;
  everything crosses as Max messages.
- **The tick chain** (`[plugsync~]` → five `[snapshot~ 10]` → `[pak]` →
  `prepend tick`) samples Live's transport (~every 10 ms) into
  `tick <bar> <beat> <unit> <tempo> <playing>` for node.

### Transport → pattern scheduling (the interesting part)

`src/max/shared/transport.mjs` (`LiveTransport`) converts ticks to Strudel
time: **1 cycle = 1 bar of 4/4**, so `cps = bpm/240`. On each tick it extends
a **lookahead window** (120–150 ms) past the playhead and asks the engine for
new events only in the not-yet-covered slice — the same query-ahead model as
Strudel's own `cyclist.mjs`, but clocked by Live instead of `setInterval`.
Loop wraps and scrubs are detected as discontinuities and reset the window.

Each event ("hap") is normalized by `hapToNote()` and emitted as
`midinote <pitch> <vel> <durMs> <chan> <delayMs>`; the Max-side `[pipe]`
applies `delayMs` so the note-on lands on its exact transport position
regardless of tick jitter. Transport stop → `flush` → `[makenote]` releases
hanging notes.

### The `$:` collector

Strudel's transpiler rewrites `$: <pattern>` lines into `.p(id)` calls, but
`Pattern.prototype.p` only exists inside strudel's browser `repl()`. The
engine re-implements that collector (`installDollarCollector()` in
`src/max/shared/engine.mjs`, mirroring `strudel/packages/core/repl.mjs`):
each `$:` line registers itself, `compile()` stacks all registered patterns,
`x_`/`_x` ids mute a line. **This is the one piece of repl behavior we
maintain by hand — check it against `repl.mjs` when bumping the submodule.**

## 2. The build pipeline

`pnpm build` = five stages, all plain Node scripts, zero manual Max steps:

```
tsc -b && vite build            # React UI → dist/index.html (single file,
                                #   vite-plugin-singlefile inlines everything)
scripts/build-node-bundles.mjs  # esbuild: src/max/<dev>/main.mjs →
                                #   dist/node/strudel-node-<dev>.cjs (one file each)
scripts/generate-patchers.mjs   # ableton-amxd/patcher.json → dist/patchers/<dev>.json
scripts/postbuild.mjs           # orchestrates build-amxd per device + zips a release
  └─ scripts/build-amxd.mjs     # writes the binary .amxd container
```

### Engine bundling (`build-node-bundles.mjs`)

esbuild bundles each `[node.script]` entry into **one self-contained CJS
file**, with `@strudel/{core,mini,transpiler,tonal}` aliased **directly into
the `strudel/` git submodule** and `nodePaths` pointed at the submodule's own
`node_modules` (for acorn/escodegen etc.). `max-api` stays external — Node
for Max injects it at runtime. Why one file: the Node process cannot see
Max's frozen virtual filesystem and there is no `node_modules` at runtime.

### Patcher generation (`generate-patchers.mjs`)

The hand-authored base (`ableton-amxd/patcher.json`, ~120 lines: midiin/out,
live.thisdevice, js, jweb) is parsed, deep-cloned and mutated per device:
set `project.amxdtype` (`'mmmm'`/`'aaaa'`/`'iiii'`), give `[js]` its mode
argument, splice in the node.script + tick chain, then the device-specific
output chain (MIDI: route/pipe/makenote/midiformat; sampler: sfplay~ +
plugin~→plugout~ passthrough; audio: poly~ voice bank). Each `[route]`'s
unmatched outlet feeds `[jweb]`, which is how engine→UI messages travel.

### The `.amxd` container writer (`build-amxd.mjs`)

`.amxd` is an undocumented binary format; this script writes it from scratch
(layout reverse-engineered from devices saved by Max 8/9): `ampf` header with
the device-type fourcc, then a `ptch` chunk containing an `mx@c` frozen-file
region — patcher JSON first, then each embedded dependency — and a `dlst`
directory of `dire` entries (name/size/offset per file). The result is
byte-for-byte the shape of a **frozen** device, so Live/Max load it with no
external files.

Self-containment is belt-and-braces:

1. The UI html **and** the node engine bundle are frozen into the container
   as dependency files, *and*
2. both are appended to `strudel-wrapper.js` as base64 payloads
   (`UI_PAYLOAD_*`, `NODE_PAYLOAD_*`). On first load the wrapper extracts
   them to real files next to the `.amxd` — necessary because jweb (Chromium)
   cannot read Max's virtual filesystem, and it doubles as the fallback if
   `[node.script]` can't resolve its frozen script.

Two Max quirks shape the extractor: frozen files never exist on disk, and
`File.writebytes` silently truncates (~16 KB), hence 4096-byte slices.

## 3. Message protocol (jweb ⇄ js ⇄ node)

Code and any payload that may contain commas/newlines travels
**base64-encoded** — Max messages split on `,`/`;`.

| Direction | Message | Meaning |
|---|---|---|
| UI → js | `ui_ready`, `write_clip …`, `read_notes` | handshake, clip I/O |
| js → UI | `url`, `mode`, `notes …`, `clip_available`, `read_error`, `scale` | boot + clip replies + Live scale |
| UI → node | `code <b64>`, `hush` | live evaluation |
| UI → node (sampler) | `load_map`, `preview`, `preview_stop`, `download`, `download_all`, `open_folder` | catalog workflow |
| node → UI | `evalok`, `evalerr <b64>`, `engine_ready`, `catalog <b64 json>`, `downloaded`, `progress`, `fetcherr` | feedback |
| node → Max | `midinote …`, `flush` / `voice …`, `allnotesoff` / `preview_open/go/stop` | audio/MIDI output |
| Max → node | `tick <bar> <beat> <unit> <tempo> <playing>` | transport |

jweb's single outlet fans out to both `[js]` and `[node.script]`; each side
ignores the other's selectors (node registers no-op handlers, the wrapper has
an ES5 `anything()` catch-all).

## 4. Strudel: what we depend on, and on what terms

**The engine is vendored, not fetched.** `@strudel/core`, `mini`,
`transpiler` and `tonal` are bundled **at build time from the pinned
`strudel/` git submodule**. Consequences:

- **No runtime dependency on strudel.cc.** The MIDI and audio devices work
  fully offline; upstream can change or vanish without affecting shipped
  devices.
- **No npm `@strudel/*` dependency either** — bundle version == submodule
  commit, and `workspace:*` deps inside the monorepo resolve naturally.
- **Upgrades are deliberate:** bump the submodule, re-run `pnpm test`
  (headless engine tests exercise `evaluate`/`queryArc` against the real
  packages), rebuild. Two hand-maintained mirrors must be re-checked on each
  bump — the `$:` collector (vs `core/repl.mjs`) and the sample-map URL
  resolution (vs `superdough/sampler.mjs`). Both are small and commented
  with their upstream source.
- **What we deliberately do NOT use:** `@strudel/webaudio` / `superdough`
  (browser-only — `AudioContext` doesn't exist in Node for Max). Sound
  output is re-implemented natively: MIDI streaming for device 1, Max
  `poly~` synthesis for device 3 (v1 covers superdough's basic-waveform
  subset: sine/sawtooth/square/triangle + cutoff/gain).

**The one networked feature** is the sampler's catalog: sample maps and
audio files are fetched at runtime from their canonical hosts
(`raw.githubusercontent.com` for `github:` maps, `shabda.ndre.gr` for
`shabda:`). That's inherent to the feature (it's a downloader), cached under
`~/Music/StrudelSamples`, and isolated to the sampler device.

## 5. File map

```
src/max/shared/engine.mjs      headless engine: evalScope boot, $: collector,
                               compile(), queryWindow(), hapToNote()
src/max/shared/transport.mjs   LiveTransport: ticks → lookahead cycle windows
src/max/{midi,sampler,audio}/main.mjs   per-device [node.script] entries
strudel-wrapper.js             [js] glue (ES5): payload extraction, clip I/O,
                               scale observers, mode dispatch
src/App.tsx, src/components/SampleCatalog.tsx, src/hooks/useDeviceMode.ts
                               mode-switched React UI
src/lib/mini/                  standalone mini-notation parser — powers only
                               the clip To/From converter, NOT live eval
ableton-amxd/patcher.json      base patcher template (versioned as JSON)
ableton-amxd/voice.maxpat      poly~ synth voice (audio device; generated
                               skeleton — verify in the Max editor)
scripts/build-node-bundles.mjs esbuild engine bundling
scripts/generate-patchers.mjs  patcher mutation per device
scripts/build-amxd.mjs         binary .amxd container writer
scripts/postbuild.mjs          per-device orchestration + release zip
scripts/install-*.{ps1,sh}     User Library installers (all 3 devices)
strudel/                       upstream Strudel monorepo (git submodule, pinned)
```

## 6. Known verification gates (need a real Live/Max session)

Generated blind, flagged in-source, cheap to check in Max's console/editor:

1. `PLUGSYNC_OUT` outlet indices in `generate-patchers.mjs` (the most likely
   wrong constant — fix the map if bar/beat/tempo arrive shuffled).
2. `[node.script]` booting from the frozen bundle (`strudel engine ready` in
   the console); otherwise the wrapper's `NODE_PAYLOAD` extraction is the
   fallback.
3. `[pipe]` spreading a 5-element list across its inlets including the delay
   inlet.
4. Whether the kept `midiin→midiout` thru double-notes (then sever it in
   `generate-patchers.mjs`).
5. `voice.maxpat` — a generated JSON skeleton; open in the Max editor and
   verify envelope/`thispoly~` behavior before trusting the audio device.
