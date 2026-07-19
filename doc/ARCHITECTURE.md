# m4l-strudel - Architecture

One repo → four self-contained Max for Live devices, each with its own React UI bundle, built on the [M4L-JWEB](https://github.com/alienmind/m4l-jweb) library. 

This document describes the high-level architecture, the build pipeline, the runtime anatomy, the message protocol, and exactly how we integrate with upstream Strudel. For the underlying M4L-JWEB approach itself (the `.amxd` container writer, generated patchers, the `[js]` lifecycle, the Surface) see [m4l-jweb's own doc/ARCHITECTURE.md](https://github.com/alienmind/m4l-jweb/blob/main/doc/ARCHITECTURE.md).

```
┌──────────────────────────── one repo ────────────────────────────┐
│  src/app/midi/          the MIDI device's UI                      │
│  src/app/drums-midi/    the Drums MIDI device's UI                │
│  src/app/drums-sampler/ the Drums Sampler device's UI             │
│  src/app/sample-browser/ the sample browser's UI                  │
│  src/app/fx/            the Audio FX device's UI                  │
│  src/app/shared/        engine hook + worker + shared Button, etc │
│  src/lib/mini/          the mini-notation parser + resolver       │
│  src/lib/fx.ts          the effects-line reader                   │
│  src/lib/samples.ts     the sample-map catalog (fetched in page)  │
│  src/max/shared/        engine.mjs, transport.mjs (engine devices)│
│  wrapper/device.ts      [js] glue shared by all devices, ES5      │
│  patcher/devices.mjs    the manifest; patcher/chains.mjs: chains  │
│  strudel/               upstream Strudel (git submodule)          │
└──────────────────────────────┬────────────────────────────────────┘
                          pnpm build
                 (@m4l-jweb/build under the hood)
  ┌───────────┬───────────┬─────────┴──────┬──────────────┬─────────────┐
  ▼           ▼           ▼                ▼              ▼             ▼
-midi.amxd  -drums-midi  -drums-sampler  -sample-browser -fx.amxd
(MIDI)      .amxd (MIDI)  .amxd (instr.)  .amxd (audio)   (audio)
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
| js → UI (midi) | `notes ...`, `clip_available`, `read_error`, `write_error`, `scale` | clip replies + Live scale (`*_error` carry `no_track`/`no_clip`/`no_slot`) |
| UI → Max (midi) | `midinote ...`, `flush` | scheduled engine output, via `sendNote()`/`flushNotes()` |
| UI ⇄ worker (midi) | `code`/`hush`/`tick` in, `ready`/`evalok`/`evalerr`/`notes`/`flush` out | postMessage, not Max messages |
| UI ⇄ Max (browser) | `fetch_to_file` / `fetch_done`, `buffer_load` / `buffer_ready`, `buffer_play` | the `download` and `samples` chains |
| UI ⇄ js (drums, fx) | `sync_state <id> <json>`, `state_<id> <json>` | state slots, via `useStateSync()` |

## 4. Device Features

### 4a. MIDI Devices: The Resolver and Clip Export

The MIDI devices support both bare mini-notation (`0 [2 ~] bd*2`) and full Strudel code (`note("c3").fast(2)`).

**The Resolver:** `src/lib/mini/resolve.ts` ensures Live Play and To Clip always agree. It rewrites bare mini-notation into absolute MIDI numbers in place (e.g. `"0 [2 ~] bd*2"` becomes `"60 [64 ~] 36*2"`). Live Play and To Clip then compile the exact same string, eliminating any divergence in scale degrees or octaves. The active scale is maintained in `src/lib/mini/scales.ts` and synced with Live's active scale.

**To Clip Export:** The clip exporter uses the Strudel engine. The UI sends the code to the Web Worker, which evaluates it, computes the true loop length (`patternCycles()`), and queries the whole window at once. Because the engine handles it, all Strudel transformations (`.jux()`, `.transpose()`, `.add()`) are fully supported when exporting.

**Macro-mappable transport.** `play` is a real Live parameter (a `live.text` "Play/Stop" button), so a Rack macro or a Push button can start and stop the sequencer. A Live parameter is only *mappable* if it has a presentation rect - an invisible parameter cannot be clicked in map mode - so the MIDI device reveals it in a native panel behind a view switch, exactly like the FX device's knob panel (`layout.native` with `panel: true` + `switch`, driven by `useNativePanel`). The web editor stays the default view; the "Macro" button flips to the native panel to expose the button for mapping, and its "Back" switch returns. (Only the MIDI device places it natively today; the Drums device shares the parameter but not the panel.)

**Clip I/O inside a Rack.** Clip read/write target the device's *track*, but `this_device canonical_parent` is the **Chain**, not the Track, when the device sits in an Instrument/Audio Rack - a Chain has no `clip_slots`, so the naive path both broke `getcount` (a `jsliveapi: invalid property name` once a second from the availability poll) and would have written to the wrong object. The wrapper's `ownTrack()` therefore climbs `canonical_parent` until it reaches a `Track` (no hop on a bare track, one in a rack, several when nested). Where no track resolves at all, `read_notes`/`write_clip` reply `read_error`/`write_error` with reason `no_track`, and the UI disables **both** clip buttons with a tooltip - the "disable on first fail" fallback - distinct from `no_clip` (nothing to read) and `no_slot` (track full), which are transient, not structural. (Fix lives upstream in `@m4l-jweb/wrapper` `liveapi.ts`.)

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
- **Cost, so it is not a surprise:** `@strudel/core` in the fx app took the UI bundle from 269 kB to 448 kB.

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

### 4d. Strudel Drums Sampler: a code-driven, bank-based sampler

`alienmind-strudel-drums-sampler` (`src/app/drums-sampler/`) is the repo's first INSTRUMENT device (`type: "instrument"`), built on the library's `instrument` chain: a `[poly~]` of sample voices over a keymap of sixteen named `[buffer~]`s. It keeps its MIDI input ports (an instrument does) and loads samples via the `download` chain - the same acquire path the browser uses, fired automatically. It is NOT a pad rack: sounds are keyed by NAME, and the device is driven by CODE first.

- **`s()` -> sound, via a bank.** The CODE screen runs a Strudel `s("bd sd, hh*8")` pattern through the shared engine (`voiceSink`, §3a) - bare mini-notation (`bd sd, hh!6`) is wrapped in `s(...)` by `asSampleCode`, not resolved to pitches. Each hap's sample name resolves against the selected BANK - a tidal-drum-machine, strudel's `bank()` prefix: `bd` with bank `RolandTR909` is the catalog key `RolandTR909_bd`. A `.bank("AkaiLinn")` in the pattern overrides the dropdown per-hap. The catalog is strudel's own generated `tidal-drum-machines.json` (`DRUM_MACHINES_URL` in `lib/samples.ts`, base rewritten ritchse->geikha for the moved repo).
- **MIDI notes drive it too.** A note into the track maps to a drum sound by the Drum Rack / General MIDI convention (`NOTE_SOUND`: 36 = bd, 38 = sd, 42 = hh, ...) and plays the selected bank's sample for it - so a MIDI sequencer (or the Drums MIDI device) in front of the Sampler plays the same bank.
- **Auto-download + a name->slot allocator.** The first time a sound is named, it is fetched to disk (`fetchToFile`, cached) and read into a slot (`loadSample`); it sounds from the next cycle. Up to 16 distinct sounds are resident at once (one `[buffer~]` each); the 17th evicts the least-recently-used. A slot is reserved the moment its load starts, so two concurrent loads never grab the same one. `playVoice({ slot, rate, velocity, durationMs, channels })`; `[poly~]` (16 voices) allocates a free voice or steals the oldest, so overlapping sounds never cut each other. The wrapper's samples-folder paths (`device_folder`, `reveal_folder`) are shared with the browser via `HAS_SAMPLES_FOLDER`, so "Show folder" works here too.
- **Instance-scoped buffers.** The slot buffers are `---`-prefixed (device-scoped), so two Sampler instances in one set keep their own sounds - the same mechanism the browser preview relies on.

### 4e. Shared device chrome

Every device draws from one set of parts, so the five faces read as one product rather than five apps:

- **`shared/Button.tsx`** - one black-and-white (grey) button. `active` is the only lift (a faint primary wash, e.g. Run while playing); there are no accent/primary/destructive colours any more. Primary actions sit in the top bar, the `?` (`HelpButton`) rightmost.
- **`shared/AboutPanel.tsx`** - the title opens it. It carries an **Advanced** section with the device's set-once, native affordances so they do not clutter the top bar: **Full Studio** (the pattern devices' big editor window, `onOpenStudio`) and **Controls** (`onShowControls`, revealing the native panel - the MIDI device's mappable Play/Stop). The FX device is the exception: its native **Knobs** panel is the primary interaction, so it keeps that button in the top bar.

### 4f. Superdough render device (Route B)

The REAL superdough (samples, synths, effects) in the track, as audio. Master plan:
[IDEA-STRUDEL-INSTRUMENT.md](IDEA-STRUDEL-INSTRUMENT.md). Proven end to end in Live: the
render (browser spike S1), the disk + loop pipe (m4l-jweb `hello-render`, S2/S3), the
transport lock (S3b), and the device itself on real superdough content (synths, the full
trance example, transport lock - confirmed by ear). Shape:

- **Render offline, on the main thread.** `src/lib/render/offline.ts` injects an
  `OfflineAudioContext` into superdough's singletons and schedules each hap through the real
  `superdough()`; `wav.ts` encodes the result. `scope.ts` supplies the eval-scope shims a
  full strudel.cc pattern needs (`setCpm`, `slider`, `register`'d draw params) that the
  headless engine's `bootScope` (core+mini+tonal) does not. `OfflineAudioContext` does not
  exist in a Worker, so this runs where the UI does, not in the engine worker. Renders are
  **serialized** (one at a time): superdough's context is a module-level singleton, so two
  overlapping renders would connect nodes across two contexts ("cannot connect to an
  AudioNode belonging to a different audio context"). A superseded render is discarded by
  the conductor's generation guard. The finally step also clears superdough's node POOL
  (`clearNodePools`): the pool is keyed by node type, not by context, so a node built in
  one render's OfflineAudioContext would otherwise be handed to the next and throw on
  connect - the same cross-context error, seen intermittently on rapid Play/Stop.
- **The conductor** (`src/lib/render/conductor.ts`) is a pure, deps-injected state machine:
  compile -> probe period -> determinism -> render -> `saveToFile` -> `render_load` -> arm.
  Design decisions worth keeping (all unit-tested):
  - **Loop period is `renderPeriod` (`determinism.ts`), not engine.mjs `patternCycles`.**
    The latter signatures haps by MIDI pitch, so `s("bd <sd cp>")` (no pitch) and
    `.lpf("<400 800>")` (effect-only variation) collapse to period 1. `renderPeriod`
    signatures the full hap value - what the renderer actually plays.
  - **No engine worker.** A second compile (for a playhead) would run in a scope without
    the full-Strudel shims and throw on the very patterns this device is for; and the
    playhead spans are bare-mini-only, empty for full code. The conductor's compile is the
    single source of truth for errors; `tick`/`tempo` are bound by the hook directly.
  - **Per-instance WAV filenames** (`superdough-<id>-rndA.wav`, conductor `filePrefix`):
    two instances share the device folder, so bare `rndA.wav` would clobber.
  - **Rolling mode** (random patterns) renders one cycle ahead, each a fresh realization.
    Paced by the transport when playing (kick the next render on the loop-boundary
    crossing in `tick()`), and self-timed at the loop period when the transport is stopped
    (the groove keeps looping self-clocked, so the render window must keep advancing or the
    randomness freezes). Never chained off `ready()` - that free-runs many-x realtime,
    racing ahead of playback.
- **Playback is Max's** via the m4l-jweb `renderplay` chain: a double-buffered `[buffer~]`
  pair, crossfaded at cycle boundaries. `saveToFile` writes the WAV to disk (flat filename -
  a subdir fails the maxurl place).
- **Transport sync comes from LiveAPI, not `[plugsync~]`.** The wrapper polls `is_playing` +
  `current_song_time` (beats) and emits `tick <playing> <beats>` at 20 Hz; the conductor
  aligns the loop to the exact transport phase on (re)start / relocate, then a rate-1
  `@loop` holds the lock (shared clock, no drift within a tempo). `[plugsync~]` outlet 6
  read 0 in Live - a dead end (see the drawer). The strudel wrapper (`wrapper/device.ts`)
  gates its clip poll and scale observers OFF for mode `superdough` (an instrument with no
  clips and no MIDI pitches - running the midi defaults threw LiveAPI noise).
- **The render FOLLOWS Live's tempo** (`beatsPerCycleForTempoLock`, `tempo.ts`). One cycle
  occupies a FIXED number of Live beats (default 4 = one bar), set by the pattern's own cps,
  NOT by the current bpm - so the render `cps = bpm/60/beatsPerCycle` scales with the
  transport and the WAV is exactly `lengthBeats` long at whatever tempo it renders at, the
  premise the rate-1 lock needs. Raise Live's BPM and the pattern speeds up and stays
  bar-locked, like any track instrument; a tempo change re-renders (debounced) into a buffer
  of the new length. A `setcpm(x)` in the code is a FEATURE, not a fight with this: it
  OVERRIDES the default tracking, so the pattern runs at its own declared rate relative to
  the grid (a `setcpm(100)` under a 120 bpm set runs the Strudel clock proportionally
  faster) - default = follow Live, `setcpm` = pin your own tempo.
- **Slider knobs (H.7 v1).** Each compile captures the code's `slider()` occurrences in
  source order (`scope.ts` `beginSliderCapture`/`getSliderSpecs`) and auto-binds slider N
  to native dial `s<N>` (a static pool of eight, in the panel behind the transport switch).
  The web slider row and the dial write the same normalized parameter; a turn re-renders
  (debounced) with the value denormalized into the slider's own range (`setSliderOverrides`).
  The wrapper's `knob_label` renames the dial after the code's term for it
  (`.lpf(slider(...))` -> "lpf") via `_parameter_shortname`, and resets unused dials back to
  `S<n>`. Live finding: the rename takes on the DEVICE PANEL but does NOT reach the Rack
  macro / Live parameter registry (those stay `s1..s8`) - a frozen-device limit, accepted.
  A parallel spike to carry the slider's real min..max on the dial via runtime
  `_parameter_range` was tried and REVERTED: it takes but also shifts the value domain the
  dial reports, breaking the normalized knob math (the dial stuck at its minimum). The dials
  stay normalized 0..1; the generalisation (a native-knob POOL the Surface declares, dials
  that borrow their range) is an m4l-jweb backlog item.

## 5. Strudel Integration

We consume Strudel by bundling the `@strudel/core`, `mini`, `transpiler`, and `tonal` packages directly from a pinned git submodule.
The submodule points to our own fork (`https://github.com/alienmind/strudel.git`) instead of upstream. This is a temporary measure required for the `superdough` offline render path. Specifically, we added a `clearNodePools()` export to `@strudel/superdough`'s `nodePools.mjs`. The offline renderer generates a new `OfflineAudioContext` for every render pass, and because superdough's node pool is a module-level singleton keyed by node type (not audio context), nodes from a previous render pass linger in the pool. When handed to the next pass, they throw a cross-context error ("cannot connect to an AudioNode belonging to a different audio context"). Our fork allows the host to clear the pool between contexts. This will be cleaned up in a future release once an upstream solution is available.

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
│   │   ├── sample-browser/   # the sample browser: App.tsx, protocol.ts, surface.ts
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

