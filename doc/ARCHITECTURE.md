# m4l-strudel - Architecture

One codebase → three self-contained Max for Live devices, with the **real
Strudel engine** running headlessly inside each. This document describes the
build pipeline, the `.amxd` container writer, the runtime message protocol,
and exactly how (and how much) we depend on upstream Strudel.

```
┌────────────────────────── one repo ──────────────────────────┐
│  src/ (React UI + engine worker)          strudel/ (submodule)
│  strudel-wrapper.js ([js] glue, ES5)   ableton-amxd/ (patcher templates)
└──────────────────────────────┬───────────────────────────────┘
                          pnpm build
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
 alienmind-strudel-   alienmind-strudel-   alienmind-strudel-
    midi.amxd            sampler.amxd           audio.amxd
  (MIDI effect,        (audio effect,        (instrument,
   'mmmm')              'aaaa')               'iiii')
```

## 1. Runtime anatomy of a device

Every device contains the same actors, generated into the patcher by
`scripts/generate-patchers.mjs`. **The Strudel engine runs in a Web Worker
inside `[jweb]`** for the midi/audio devices; only the sampler still hosts a
`[node.script]` (it needs fetch + filesystem access, which Chromium pages do
not get). This is a deliberate pivot: Node for Max proved unstable inside
Live in field testing - first silent non-starts of `script start` (a known
issue, see the Cycling '74 forums), then a full Live crash on device load.

```
 [live.thisdevice] ─▶ [js strudel-wrapper.js <mode>]  (ES5, LiveAPI work)
                          │ outlet0 ▲
                          ▼         │ (unmatched [route] output:
                       [jweb] ──────┘  ui_ready, write_clip, read_notes)
                       │    ▲
   React UI + engine   │    │
   Web Worker          │    └── ticks + tempo from [js] (LiveAPI poll/observer)
                       ▼
        [route midinote flush] / [route voice allnotesoff]
                       │
        device-specific output (pipe→makenote→midiformat→midiout,
        or pipe→pak→poly~→plugout~)

 sampler only: [node.script strudel-node-sampler.cjs] between jweb and
 sfplay~/plugout~, fed by the same tick chain (beat-synced preview).
```

- **`[jweb]`** hosts the React UI (one app for all devices; the wrapper sends
  `mode midi|sampler|audio` after `ui_ready` and the app switches screens via
  `useDeviceMode`) **and the engine**: `src/workers/engine.worker.js` is a
  dedicated Web Worker bundled into `strudel-ui.html`. A worker rather than
  the page thread for two reasons: `queryArc()` never competes with React
  rendering, and dedicated workers are exempt from the background-page timer
  clamping Chromium applies to hidden views. Neither actually relies on
  timers: ticks arrive as messages, and message/event delivery is not
  throttled the way `setTimeout` is.
- **`[js] strudel-wrapper.js`** is the only place LiveAPI exists. It owns:
  UI/payload extraction, clip read/write, clip-availability polling, Live 12
  `root_note`/`scale_name` observers, and (sampler only) the node.script
  start sequence. It is **ES5 only** - Max's `[js]` has no modern JS. The
  device mode arrives as `jsarguments[0]`.
- **Transport ticks** come from the wrapper: a 50 ms LiveAPI poll of
  `live_set is_playing` + `current_song_time` emits `tick <playing> <beats>`
  to jweb (midi/audio) and node (sampler). A [plugsync~] signal chain was
  tried first and read zero in the field (MIDI-effect devices do not
  reliably run a DSP graph). While a pattern runs with the transport
  stopped, the worker free-runs on an internal clock at the current tempo
  and hands over to Live's clock when the transport starts.

### Transport → pattern scheduling (the interesting part)

`src/max/shared/transport.mjs` (`LiveTransport`) converts ticks to Strudel
time: **1 cycle = 1 bar of 4/4**, so `cps = bpm/240`. On each tick it extends
a **lookahead window** (120-150 ms) past the playhead and asks the engine for
new events only in the not-yet-covered slice - the same query-ahead model as
Strudel's own `cyclist.mjs`, but clocked by Live instead of `setInterval`.
Loop wraps and scrubs are detected as discontinuities and reset the window.

Each event ("hap") is normalized by `hapToNote()`; the worker posts the
batch to the UI thread, which forwards each note out of jweb as
`midinote <pitch> <vel> <durMs> <chan> <delayMs>` (or `voice ...` for the
audio device). The Max-side `[pipe]` applies `delayMs` so the note-on lands
on its exact transport position regardless of tick/messaging jitter.
Transport stop → `flush` → `[makenote]` releases hanging notes. The clock
never lives in Chromium: Max pushes time in, jweb pushes scheduled events
out, and precision is applied Max-side.

### The `$:` collector

Strudel's transpiler rewrites `$: <pattern>` lines into `.p(id)` calls, but
`Pattern.prototype.p` only exists inside strudel's browser `repl()`. The
engine re-implements that collector (`installDollarCollector()` in
`src/max/shared/engine.mjs`, mirroring `strudel/packages/core/repl.mjs`):
each `$:` line registers itself, `compile()` stacks all registered patterns,
`x_`/`_x` ids mute a line. **This is the one piece of repl behavior we
maintain by hand - check it against `repl.mjs` when bumping the submodule.**

## 2. The build pipeline

`pnpm build` = five stages, all plain Node scripts, zero manual Max steps:

```
tsc -b && vite build            # React UI + engine worker → dist/index.html
                                #   (vite-plugin-singlefile inlines everything;
                                #    the worker is inlined as a blob)
scripts/build-node-bundles.mjs  # esbuild: src/max/sampler/main.mjs →
                                #   dist/node/strudel-node-sampler.cjs
scripts/generate-patchers.mjs   # ableton-amxd/patcher.json → dist/patchers/<dev>.json
scripts/postbuild.mjs           # orchestrates build-amxd per device + zips a release
  └─ scripts/build-amxd.mjs     # writes the binary .amxd container
```

### Engine bundling

The engine (`@strudel/{core,mini,transpiler,tonal}`) is aliased **directly
into the `strudel/` git submodule** in both bundlers:

- **vite** (midi/audio): `src/workers/engine.worker.js` is imported with
  `?worker&inline`, so the whole engine lands inside `strudel-ui.html` as an
  inlined module-worker blob. `worker.format: "es"` +
  `inlineDynamicImports: true` are required - `evalScope` uses dynamic
  imports, and a blob URL cannot resolve relative chunks.
- **esbuild** (sampler only): bundles `src/max/sampler/main.mjs` into one
  self-contained CJS file, `nodePaths` pointed at the submodule's own
  `node_modules`, `max-api` external (Node for Max injects it). One file
  because the Node process cannot see Max's frozen virtual filesystem and
  there is no `node_modules` at runtime.

### Patcher generation (`generate-patchers.mjs`)

The hand-authored base (`ableton-amxd/patcher.json`, ~120 lines: midiin/out,
live.thisdevice, js, jweb) is parsed, deep-cloned and mutated per device:
set `project.amxdtype` (`'mmmm'`/`'aaaa'`/`'iiii'`), give `[js]` its mode
argument, splice in the tick chain, then the device-specific output chain
fed from jweb's outlet (MIDI: route/pipe/makenote/midiformat; audio: poly~
voice bank; sampler: node.script + sfplay~ + plugin~→plugout~ passthrough).
For midi/audio each `[route]`'s unmatched outlet feeds `[js]`, carrying the
UI's clip-I/O messages; for the sampler the route's unmatched outlet feeds
`[jweb]`, carrying node's catalog feedback to the UI.

### The `.amxd` container writer (`build-amxd.mjs`)

`.amxd` is an undocumented binary format; this script writes it from scratch
(layout reverse-engineered from devices saved by Max 8/9): `ampf` header with
the device-type fourcc, then a `ptch` chunk containing an `mx@c` frozen-file
region - patcher JSON first, then each embedded dependency - and a `dlst`
directory of `dire` entries (name/size/offset per file). The result is
byte-for-byte the shape of a **frozen** device, so Live/Max load it with no
external files.

Self-containment is belt-and-braces:

1. The UI html (which now contains the engine worker) - and for the sampler
   the node bundle - are frozen into the container as dependency files, *and*
2. they are appended to `strudel-wrapper.js` as base64 payloads
   (`UI_PAYLOAD_*`, `NODE_PAYLOAD_*`). On first load the wrapper extracts
   them to real files next to the `.amxd` - necessary because jweb (Chromium)
   cannot read Max's virtual filesystem, and it doubles as the fallback if
   `[node.script]` can't resolve its frozen script.

In addition, the installed layout ships the sampler's `.cjs` loose next to
the devices (postbuild copies it into the dist folder and the installers
carry it over): `[node.script]` resolves its script argument when the device
loads, before the wrapper can extract anything, so a first load from a bare
`.amxd` would find no script. The wrapper then only has to send
`script start` (node.script accepts no message to repoint the script file).

Two Max quirks shape the extractor: frozen files never exist on disk, and
`File.writebytes` silently truncates (~16 KB), hence 4096-byte slices.

## 3. Message protocol (jweb ⇄ js, jweb ⇄ node)

Payloads that may contain commas/newlines travel **base64-encoded** through
Max messages (they split on `,`/`;`); code no longer needs this - it goes to
the engine worker via `postMessage` and never crosses Max.

| Direction | Message | Meaning |
|---|---|---|
| UI → js | `ui_ready`, `write_clip ...`, `read_notes` | handshake, clip I/O |
| js → UI | `url`, `mode`, `notes ...`, `clip_available`, `read_error`, `scale` | boot + clip replies + Live scale |
| Max → UI | `tick <playing> <beats>`, `tempo <bpm>` (LiveAPI observer via js) | transport, forwarded to the worker |
| UI → Max | `midinote ...`, `flush` (midi) / `voice ...`, `allnotesoff` (audio) | scheduled engine output |
| UI ⇄ worker | `code`/`hush`/`tick` in, `ready`/`evalok`/`evalerr`/`notes`/`flush` out | postMessage, not Max messages |
| UI → node (sampler) | `load_map`, `preview`, `preview_stop`, `download`, `download_all`, `open_folder` | catalog workflow |
| node → UI (sampler) | `engine_ready`, `catalog <b64 json>`, `downloaded`, `progress`, `fetcherr` | feedback |
| Max → node (sampler) | `tick ...` | beat-synced preview timing |

In the sampler, jweb's outlet fans out to both `[js]` and `[node.script]`;
each side ignores the other's selectors (node registers no-op handlers, the
wrapper has an ES5 `anything()` catch-all). In midi/audio the `[route]`
consumes note events and passes everything else to `[js]`.

## 4. Strudel: what we depend on, and on what terms

**The engine is vendored, not fetched.** `@strudel/core`, `mini`,
`transpiler` and `tonal` are bundled **at build time from the pinned
`strudel/` git submodule**. Consequences:

- **No runtime dependency on strudel.cc.** The MIDI and audio devices work
  fully offline; upstream can change or vanish without affecting shipped
  devices.
- **No npm `@strudel/*` dependency either** - bundle version == submodule
  commit, and `workspace:*` deps inside the monorepo resolve naturally.
- **Upgrades are deliberate:** bump the submodule, re-run `pnpm test`
  (headless engine tests exercise `evaluate`/`queryArc` against the real
  packages), rebuild. Two hand-maintained mirrors must be re-checked on each
  bump - the `$:` collector (vs `core/repl.mjs`) and the sample-map URL
  resolution (vs `superdough/sampler.mjs`). Both are small and commented
  with their upstream source.
- **What we deliberately do NOT use:** `@strudel/webaudio` / `superdough`.
  Even though the engine now runs in Chromium where `AudioContext` exists,
  audio must come out of the *device*, not the embedded browser view. Sound
  output is native: MIDI streaming for device 1, Max `poly~` synthesis for
  device 3 (v1 covers superdough's basic-waveform subset:
  sine/sawtooth/square/triangle + cutoff/gain).

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
src/workers/engine.worker.js   Web Worker hosting the engine (midi/audio),
                               bundled inline into strudel-ui.html
src/max/sampler/main.mjs       the sampler's [node.script] entry
strudel-wrapper.js             [js] glue (ES5): payload extraction, clip I/O,
                               scale observers, mode dispatch, node start
src/App.tsx, src/components/SampleCatalog.tsx, src/hooks/useDeviceMode.ts,
src/hooks/useStrudel.ts        mode-switched React UI + worker wiring
src/lib/mini/                  standalone mini-notation parser - powers only
                               the clip To/From converter, NOT live eval
ableton-amxd/patcher.json      base patcher template (versioned as JSON)
ableton-amxd/voice.maxpat      poly~ synth voice (audio device; generated
                               skeleton - verify in the Max editor)
scripts/build-node-bundles.mjs esbuild bundling (sampler node entry)
scripts/generate-patchers.mjs  patcher mutation per device
scripts/build-amxd.mjs         binary .amxd container writer
scripts/postbuild.mjs          per-device orchestration + release zip
scripts/install-*.{ps1,sh}     User Library installers (all 3 devices)
strudel/                       upstream Strudel monorepo (git submodule, pinned)
```

## 6. Known verification gates (need a real Live/Max session)

Generated blind, flagged in-source, cheap to check in Max's console/editor:

1. `PLUGSYNC_OUT` outlet indices in `generate-patchers.mjs` (the most likely
   wrong constant - fix the map if bar/beat/tempo arrive shuffled). The
   `[loadbang]→[print strudel-gen]` probe in every device confirms the
   generated boxes instantiated at all.
2. The engine worker booting inside jweb: the device status line must show
   *Strudel engine ready* shortly after load.
3. `[pipe]` spreading a 5-element list across its inlets including the delay
   inlet.
4. Whether the kept `midiin→midiout` thru double-notes (then sever it in
   `generate-patchers.mjs`).
5. `voice.maxpat` - a generated JSON skeleton; open in the Max editor and
   verify envelope/`thispoly~` behavior before trusting the audio device.
6. The sampler's `[node.script]`. History to know: Node for Max hosted the
   midi/audio engines first, and in field testing `script start` was
   silently ignored in Live, then a device load **crashed Live outright**
   (minidump captured 2026-07-12). That is why the engines moved into the
   jweb Web Worker. The sampler still depends on node for fetch+filesystem;
   if it shows the same instability, the fallback design is jweb `fetch` +
   base64 → `[js] File` writes (slower, but no node).
