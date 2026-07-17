# m4l-strudel - Architecture

One repo → four self-contained Max for Live devices, each with its own React UI bundle, built on the [M4L-JWEB](https://github.com/alienmind/m4l-jweb) library. 

This document describes the high-level architecture, the build pipeline, the runtime anatomy, the message protocol, and exactly how we integrate with upstream Strudel. For the underlying M4L-JWEB approach itself (the `.amxd` container writer, generated patchers, the `[js]` lifecycle, the Surface) see [m4l-jweb's own doc/ARCHITECTURE.md](https://github.com/alienmind/m4l-jweb/blob/main/doc/ARCHITECTURE.md).

```
┌──────────────────────────── one repo ────────────────────────────┐
│  src/app/midi/       the MIDI device's UI                         │
│  src/app/midi-drums/ the Drums device's UI                        │
│  src/app/sampler-    the sample browser's UI                      │
│      browser/                                                     │
│  src/app/fx/         the Audio FX device's UI                     │
│  src/app/shared/     the engine hook + worker, both MIDI devices  │
│  src/lib/mini/       the mini-notation parser + resolver          │
│  src/lib/fx.ts       the effects-line reader                      │
│  src/lib/samples.ts  the sample-map catalog (fetched in the page) │
│  src/max/shared/     engine.mjs, transport.mjs (MIDI devices only)│
│  wrapper/device.ts   [js] glue shared by all devices, ES5         │
│  patcher/devices.mjs the manifest; patcher/chains.mjs: the        │
│                      strudel-delay and strudel-room chains        │
│  strudel/            upstream Strudel (git submodule)             │
└──────────────────────────────┬────────────────────────────────────┘
                          pnpm build
                 (@m4l-jweb/build under the hood)
   ┌────────────────┬─────────┴────────┬─────────────────┐
   ▼                ▼                  ▼                 ▼
 -midi.amxd    -midi-drums.amxd  -sampler-browser  -fx.amxd
 (MIDI,'mmmm') (MIDI,'mmmm')     .amxd (audio)     (audio,'aaaa')
```

## 1. The Build Pipeline

`pnpm build` runs three stages, all plain Node scripts, with no manual Max steps:

```bash
tsc -b                          # typecheck every device's app + the scripts
scripts/build-ui.mjs            # ONE vite build per device → dist/ui/<device>/index.html
m4l-jweb build                  # @m4l-jweb/build: wrapper compile + patcher generation + amxd writer
```

This repo defines the manifest (`patcher/devices.mjs`), custom chains (`patcher/chains.mjs`), LiveAPI extensions (`wrapper/device.ts`), and the React UI (`src/app/<device>/`). The complex lifting of generating patchers and writing `.amxd` containers is handled by `@m4l-jweb/build`.

### Engine Bundling

The engine (`@strudel/{core,mini,transpiler,tonal}`) is aliased directly into the `strudel/` git submodule. For the MIDI devices, `engine.worker.js` is imported with `?worker&inline`, so the entire engine is compiled into an inlined module-worker blob inside the UI bundle. The Audio FX and Sample Browser devices never import this file, keeping their payloads very small.

### The `.amxd` Container Writer

The build writes self-contained `.amxd` files from scratch. The UI html (and inlined worker) is frozen into the container as a dependency file, and it is appended to `wrapper.js` as a base64 payload. This is extracted to a real file on first load, since the embedded Chromium cannot read Max's virtual filesystem.

## 2. Runtime Anatomy of a Device

Every device runs entirely within `[jweb]` and `[js] wrapper.js`. **We do not use `[node.script]` anywhere in this repository.**

```
 [live.thisdevice] ─▶ [js wrapper.js <mode>]  (ES5, LiveAPI work - wrapper/device.ts
                          │ outlet0 ▲          on top of @m4l-jweb/wrapper's core.ts/liveapi.ts)
                          ▼         │ (unmatched [route] output: ui_ready, write_clip, read_notes)
                       [jweb] ──────┘  
                       │    ▲
   React UI (+ engine  │    │
   worker, MIDI only)  │    └── ticks + tempo from [js] (LiveAPI poll/observer)
                       ▼
              [route midinote flush]        (packaged `midiout` chain)
                       │
        pipe→makenote→midiformat→midiout

 sample browser only:  [maxurl] writes the file  (`download` chain)
                       [buffer~] -> [groove~] -> +~ -> plugout~  (`samples` chain)
```

- **`[jweb]`**: Hosts each device's own React UI bundle. For MIDI devices, it also runs the Strudel engine in a dedicated Web Worker (`engine.worker.js`).
- **`[js] wrapper.js`**: Owns the lifecycle, payload extraction, and transport observers. `wrapper/device.ts` extends this with specific mode resolution, clip I/O, and Live 12 scale observers. It also responds to `buffer_load` and `fetch_to_file` requests from `[jweb]`.
- **Transport Ticks**: The wrapper polls Live's transport and emits `tick <playing> <beats>` into `[jweb]`. Every device sequences against those ticks.

### Transport → Pattern Scheduling

`LiveTransport` converts incoming ticks to Strudel time (1 cycle = 1 bar of 4/4). On each tick, it extends a lookahead window (120-150 ms) and asks the engine for new events in that slice. The worker posts this batch to the UI thread, which dispatches `midinote` events through `@m4l-jweb/bridge`. Delay amounts are applied Max-side by `[pipe]` to ensure precise timing, eliminating Chromium timer jitter.

### The `$:` Collector

Strudel's `$:` assignment is not part of the standard engine build. We implement this collector inside `engine.mjs`, registering `$:` patterns and evaluating them together at `compile()`. Check this against `strudel/packages/core/repl.mjs` when updating the submodule.

## 3. Message Protocol (jweb ⇄ js)

Each device defines its selectors in `src/app/<device>/protocol.ts`, extending `@m4l-jweb/bridge` base events.

| Direction | Message | Meaning |
|---|---|---|
| UI → js (all) | `ui_ready` | handshake |
| js → UI (all) | `mode`, `build`, `tick <playing> <beats>`, `tempo <bpm>` | `DEVICE_IN`, sent by the packaged wrapper |
| UI → js (midi) | `write_clip ...`, `read_notes` | clip I/O |
| js → UI (midi) | `notes ...`, `clip_available`, `read_error`, `scale` | clip replies + Live scale |
| UI → Max (midi) | `midinote ...`, `flush` | scheduled engine output, via `sendNote()`/`flushNotes()` |
| UI ⇄ worker (midi) | `code`/`hush`/`tick` in, `ready`/`evalok`/`evalerr`/`notes`/`flush` out | postMessage, not Max messages |
| UI ⇄ Max (browser) | `fetch_to_file` / `fetch_done`, `buffer_load` / `buffer_ready`, `buffer_play` | the `download` and `samples` chains |
| UI ⇄ js (drums, fx) | `sync_state <id> <json>`, `state_<id> <json>` | state slots, via `useStateSync()` |

## 4. Device Features

### 4a. MIDI Devices: The Resolver and Clip Export

The MIDI devices support both bare mini-notation (`0 [2 ~] bd*2`) and full Strudel code (`note("c3").fast(2)`).

**The Resolver:** `src/lib/mini/resolve.ts` ensures Live Play and To Clip always agree. It rewrites bare mini-notation into absolute MIDI numbers in place (e.g. `"0 [2 ~] bd*2"` becomes `"60 [64 ~] 36*2"`). Live Play and To Clip then compile the exact same string, eliminating any divergence in scale degrees or octaves. The active scale is maintained in `src/lib/mini/scales.ts` and synced with Live's active scale.

**To Clip Export:** The clip exporter uses the Strudel engine. The UI sends the code to the Web Worker, which evaluates it, computes the true loop length (`patternCycles()`), and queries the whole window at once. Because the engine handles it, all Strudel transformations (`.jux()`, `.transpose()`, `.add()`) are fully supported when exporting.

### 4b. Audio FX Device: The Frozen Graph

`src/lib/fx.ts` reads effect lines (e.g. `.lpf(800).gain(1.2)`) and produces parameter values. There is no parser; method chaining is evaluated against a recorder object.

**Real Units:** Parameters are defined in real units (`Hz`, `dB`), not normalized 0-1 ranges. `.lpf(800)` always means 800 Hz. The scaling curve is configured in the `Surface` parameter definition (`src/app/fx/surface.ts`).

**The Frozen Graph Law:** The Max patcher DSP graph is generated at build time. The JS only provides values.
- Every effect always exists in the graph. Setting an effect means altering its values. Missing effects are disabled by setting their parameter to a neutral state.
- The order of effects is frozen (`lowpass, hpf, drive, crush, delay, reverb, gain`). Typing `.gain(1.2).lpf(800)` produces the same routing as `.lpf(800).gain(1.2)`.
- All nine stages make sound: `.lpf()`, `.hpf()`, `.drive()`, `.crush()`, `.delay()` (+ time/feedback), `.room()` and `.gain()`, all confirmed audible in Live.
- **`hpf` is the lowpass's COMPLEMENT, not a highpass object.** Max's `onepole~` is lowpass-only, and a one-pole highpass is exactly `dry - lowpass(dry)`. That is what makes 0 Hz a TRUE neutral: a lowpass at 0 Hz passes nothing, so the subtraction returns the dry signal bit-for-bit. A highpass object would rest at its cutoff floor, still turning DC - an always-on colouration the frozen-graph law forbids.
- **`crush` rests at 24 bits, NOT Strudel's 16.** Strudel calls `.crush(16)` "minimum crush", but 16-bit quantisation is a quiet crush, not a wire, and a stage always in the path needs a setting where it does nothing. `.crush(16)` still gives 16-bit quantisation exactly as superdough does.

**Pattern modulation (`.lpf(sine.range(200, 2000))`):** a signal argument parses into a `patterned` stage carrying the Strudel pattern AND its source text; `src/app/fx/useModulation.ts` makes it move, on the library's `remote` chain (one `live.remote~` per slot, `remotes: 9` in the manifest, mapped by RACK index - no allocator). Verified end to end in Live. The design in one paragraph:

- **The clock**: one cycle = one 4/4 bar (`beats/4`), locked to `current_song_time` from the wrapper's 20 Hz `tick` - sweeps land on the downbeat at any tempo and survive loop jumps. No cps to honour: a one-line fx chain has no `setcpm()`.
- **Bind/stream/release**: `resolveParamId()` + `bindRemote()` when a stage becomes modulated; `queryFxPattern()` + `writeRemote()` per tick while the transport runs; `bindRemote(slot, 0)` when the stage stops - a bound `live.remote~` owns the parameter exclusively and would freeze the dial. LOM ids are resolved on mount and never persisted (a set reload reloads `[jweb]`, so the hook re-resolves; ids do not survive a reload).
- **The units warp**: `live.remote~` takes knob TRAVEL, not the parameter's units (measured upstream - see m4l-jweb's ARCHITECTURE.md). `toRemote()` clamps into the dial's range and aims the travel at `norm(v)^(1/exponent)` so Live's re-applied exponent lands where the pattern asked. Exponent-1 dials pass through untouched.
- **Source persistence**: a modulated stage's expression is the only record of what the user asked for - a Pattern cannot say what it was written as, and the parameter holds only where the sweep last was. The `sources` state slot (param -> expression) persists it; without it a committed `.lpf(sine.range(200, 2000))` reprinted as `.lpf(18000)`.
- **Cost, so it is not a surprise:** `@strudel/core` in the fx app took the UI bundle from 269 kB to 448 kB. This machinery also modulates REAL Live devices by the same bind - the basis of Adopt mode (TODO).

**The Two-Screen Native UI (m4l-jweb 0.7.0):** The nine fx parameters are NATIVE `live.dial` objects, declared in `src/app/fx/surface.ts` via `layout: { native: { ..., panel: true, switch: "knobs" } }`. This shed the HTML sliders, so the dials automate, MIDI-map and hit Push like any factory device. Nine dials broke the Push bank budget (8 per page - the library throws on a ninth), so the banks split where the rack splits: **Tone** (cutoff, hpfreq, drive, crush) and **Space** (delay, delaytime, delayfeedback, room, gain).

Because a frozen M4L device can hide/show native objects at runtime but **cannot reposition them** (measured — see m4l-jweb's ARCHITECTURE.md), the device is not one reflowing view but **two layered screens**, flipped by `useNativePanel`:
- **Web mode** — the `[jweb]` (full width) shows the Strudel line UI; all dials hidden.
- **Knob panel** — the `[jweb]` is hidden, revealing all nine dials in two rows, plus a "Back" `button` (a `live.text`, top-right) that returns to the web UI. The web UI paints a matching "Knobs" button at the same spot.

**Defensive state coercion:** `App.tsx` coerces the `named` slot to an array and `sources` to an object before use. The two bugs that motivated it are both fixed upstream (the `[dict]` envelope, and state-default seeding - see m4l-jweb's ARCHITECTURE.md), but the coercion stays: a malformed slot must degrade to "nothing named yet", not unmount the device to a black screen.

### 4b-2. The reference and help windows

The three Strudel-taking devices have a `?` (shared `HelpButton`) opening a "Supported Strudel features" window - **our reference, not a link to strudel.cc**, because a Live set is often open with no internet, and because strudel.cc documents Strudel while this documents THESE DEVICES: `.crush()` is real here, `.vowel()` silently is not, and a bare number is a scale degree in our mini-notation but a raw MIDI pitch in full code. Each entry carries a `status` (works / not yet / syntax) and the list is filtered per device; `only` is REQUIRED on every entry so a new one cannot be added without answering which devices it belongs to. The sample browser has no `?`, deliberately: it takes no Strudel at all. `src/lib/__tests__/reference.test.ts` ties the data to the code it describes - every RACK stage must be listed as working, and nothing marked working may be an effect the parser refuses.

The floating window is pinned (`alwaysOnTop`) and follows the caret: the device view writes the token being typed into a `helpQuery` state slot and the window narrows to it. It is a HEURISTIC, not a parser - half-typed code does not parse, and that is exactly when help is wanted. The wart, named: the slot persists, so the last word typed about is saved with the set - the library has no transient channel between views. Window placement stops at "420 px wide, remembers where you drag it": nothing reports where Live draws a device on screen.

The **Full Studio window** is the same pattern grown up: a big editor over the same `code` state slot, so the window and device view are two views of ONE pattern. An EDITOR, not an engine - the device view alone receives `tick`, so there is one scheduler however many views are open (the claim to re-check: exactly ONE stream of notes; doubled notes mean the window has grown an engine).

### 4c. Sample Browser: Downloader and Preview

The sample browser browses, downloads, and previews Strudel sample maps.

- **The Catalog:** A `fetch()` request directly in the browser page reads `strudel.json` data, resolving pseudo-URLs into fully qualified absolute URLs.
- **The Download:** Handled by the `download` chain. `fetchToFile()` calls `[maxurl]` which downloads the audio to the local `samples/` directory relative to the device.
- **The Preview:** Handled by the `samples` chain. Files are read via `[buffer~]` and auditioned by `[groove~]`, summed into the Live track's signal path using `[+~]`. Previews are quantized to Live's `clip_trigger_quantization` grid and loop appropriately based on tempo.

All file handling is asynchronous and will never hang the UI thread. The system is designed to degrade gracefully if offline (playing already downloaded samples seamlessly).

## 5. Strudel Integration

We consume Strudel by bundling the `@strudel/core`, `mini`, `transpiler`, and `tonal` packages directly from a pinned git submodule.
- **No runtime dependency on strudel.cc** (except for the sample browser which reaches out to fetch sample packs).
- **No npm dependencies on `@strudel/*`.**

Audio generation inside Chromium using `AudioContext` or `@strudel/webaudio` is intentionally **not** used. All sound is handled natively via Max MIDI streams or Max DSP objects.

## 6. Verification Gates

When testing manually, ensure:
1. **Engine boot**: The MIDI device's status line must show *Strudel engine ready* shortly after load.
2. **Timing**: `[pipe]` inside `midiout` must successfully route delay amounts to correctly synchronize notes.
3. **Sample browser preview**: Downloading and previewing a sample must play audio through the track's native fader in Live.
4. **State persistence**: Edited settings must survive a full save/close/reopen of the Live set.

## 7. File Map

```
├── patcher/
│   ├── chains.mjs             # repo-specific max chains
│   └── devices.mjs            # the device manifest
├── scripts/                   # build scripts
├── src/
│   ├── app/
│   │   ├── fx/                # the Audio FX device: App.tsx, protocol.ts, surface.ts
│   │   ├── midi/              # the MIDI device: App.tsx, useStrudel.ts
│   │   ├── midi-drums/        # the Drums device: App.tsx, useStrudel.ts, DrumMapPanel.tsx
│   │   ├── sampler-browser/   # the sample browser: App.tsx, protocol.ts, surface.ts
│   │   └── shared/            # shared engine and UI: PatternEditor.tsx, protocol.ts, engine.worker.js, surface.ts
│   ├── lib/
│   │   ├── mini/              # the mini-notation parser & resolver logic
│   │   ├── fx.ts              # the effects line -> parameter values (a recorder, not a parser)
│   │   ├── samples.ts         # sample map URL resolution and fetch logic
│   │   └── strudelCode.ts     # bare mini vs code; wraps mini in note(...)
│   └── max/
│       └── shared/
│           ├── engine.mjs     # headless engine eval Scope
│           └── transport.mjs  # LiveTransport tick processing
├── strudel/                   # upstream Strudel monorepo (git submodule)
└── wrapper/
    └── device.ts              # [js] glue (ES5) extensions
```

---

## Not possible - measured, so nobody re-opens it

- **The LOM cannot create an audio clip from a file on disk.** `ClipSlot.create_clip`
  is MIDI-only (it takes a length, makes an empty MIDI clip); there is no LOM call
  that points a clip slot at a WAV. It is a drag-and-drop operation in the
  application, not an API. The sample browser therefore goes as far as the API
  allows: the file is on disk at a known path, the row is a drag source, and
  reveal-in-folder is the fallback (whether the drag lands is the open
  [SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md)).
- **Live's Browser is unreachable from `[js]`** (the R2 spike, 2026-07-17).
  `new LiveAPI("live_app browser")` resolves to id 0 -
  `jsliveapi: component 'browser' is not an object`. The Browser (`load_item`,
  hotswap) is exposed to control-surface Python scripts only, so a device can never
  INSTANTIATE another device. Translate mode is therefore adopt-only: bind to
  devices the user placed by hand, never create them.

## Verified in Live - claims worth re-checking

Each of these was confirmed by hand, and each could quietly stop being true. What to
re-check, and when:

- **Instance-scoped buffers** (if buffer naming in m4l-jweb's `chains.mjs` changes):
  two copies of Strudel Samples on two tracks, different samples - each must keep its
  own sound. `---` scopes per device; `#0` was tried first and never expands in an
  `.amxd`.
- **Chain neutrality** (if the fx chains change): `.hpf(0)` and `.crush(24)` must be
  SILENT - bit-for-bit the dry signal, A/B'd against bypass. `.lpf(18000)`, `.gain(1)`,
  `.delay(0)`, `.room(0)` likewise.
- **Modulation** (if useModulation, the `remote` chain, or the surface ranges
  change): `.lpf(sine.range(200, 2000))` + play must sweep Cutoff between the actual
  200 Hz and 2 kHz once per bar, with the automation lane EMPTY; replacing the line
  with `.lpf(800)` must give the dial back; save/close/reopen must restore the line
  and resume the sweep on play.
- **Editor persistence** (if state slots or the engine's restore path change): an
  empty editor is a VALUE - select-all-and-cut, save, reopen must come back empty,
  not restore the default. Multi-space runs in a pattern must survive verbatim.
- **One scheduler** (if the Studio window changes): however many views are open,
  exactly ONE stream of notes. The device view alone receives `tick`.
- **Engine boot / timing / preview / persistence** - the four gates in §6 above.

## Appendix: Past Architectural Decisions

The following architectural designs were moved away from. They are documented here to preserve context on why the system is built the way it is today.

### The end of `[node.script]`
Early versions of the MIDI engine and the Sample browser ran on Node for Max (`[node.script]`). In field testing, Node for Max proved unstable when embedded inside Live, leading to silent non-starts and hard crashes on device load. Everything previously running in Node has been migrated: the engine now runs in a Web Worker inside Chromium, and network operations use native `fetch` or `[maxurl]`. `[node.script]` is completely banned.

### Two Parsers
Initially, there was a local parser for the UI preview and the live engine for execution. This caused drift where the two understood tokens differently. We now use a single resolver (`src/lib/mini/resolve.ts`) that transforms mini-notation into absolute MIDI pitches, ensuring that both preview and execution paths always read the exact same data. We also moved "To Clip" export purely into the engine worker so it supports all advanced Strudel transformations directly.

### The "Instrument" Device
An earlier device attempted to act as an instrument by driving a `[poly~]` synth, but it ended up reinventing a crude oscillator without utilizing Strudel's real audio capabilities. This was removed entirely in favor of the Audio FX device which processes track audio natively.

### Normalized (0-1) Parameters
A previous design mapped all audio parameters to a 0-1 range and applied scaling secretly inside the Max patch. This broke Live automation lanes and Push controllers, which displayed meaningless 0-1 values instead of real units (e.g. Hz). All parameters are now declared in their real units.

### The `ui:` merge that must not happen (the "unified app")
Sharing one `ui:` folder between the midi and fx devices was specified and then rejected on mechanism: the build loads ONE SURFACE per UI folder and generates a `live.*` object for every param in it, for every device using it - so the MIDI device would ship nine audio dials that drive nothing, and the FX device a Play toggle that does nothing, all visible in automation lanes and on Push. The stated intent ("share CODE across container types while each device keeps its identity") is what `src/app/shared/` already does. Revisit only if the library ever separates a device's surface from its UI folder.

### `#0` buffer scoping
The first attempt at instance-scoped buffer names used `#0`, documented for abstractions. An `.amxd` device patcher does not count as one: the token stayed literal everywhere, writer and reader agreed on one global name, and the collision survived silently. Replaced by Live's `---` device-scoped prefix (verified). The wrapper-minted-id route was ruled out earlier still: a `[buffer~]` takes its name from its creation argument and has no documented runtime rename, so a name minted after load cannot reach a box frozen at build time.
