# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**The strategic roadmap is [PLAN.md](PLAN.md)** - native declarative UI, dynamic
chains, and the m4l-strudel Rack - and this file is sequenced against it. **This
file is what is still ahead.** What has shipped is described where it belongs:
[README.md](../README.md) for what a device does, and
[ARCHITECTURE.md](ARCHITECTURE.md) for how and why it does it - including §5a,
the designs that were tried and rejected, so nobody proposes them again.

---

# The roadmap, sequenced against PLAN.md

*(The 0.6.5 adoption that used to head this file has shipped - deps bumped, the FX
device on the library's `delay`/`reverb` chains, `patcher/chains.mjs` deleted, and the
drum-rack window verified. See the DONE sections at the bottom. What heads the file now
is the PLAN.md sequence.)*

## R1 - Native dials for the FX device (PLAN.md Part 1) - SHIPPED, awaiting a Live check

The fx device sheds its HTML sliders: `src/app/fx/surface.ts` declares
`layout: { native: { params: [...seven...], rows: 3 } }`, the build lays the seven dials
out natively (three columns) next to a `[jweb]` shifted to x=164, and `App.tsx` keeps
only the Strudel line. The draft/commit model and the `named` state slot stay - the slot
kept its round-trip role (which stages the line prints) even though its display role
(which HTML sliders to show) is gone. Only the slider grid and the `ParamSlider`
component were deleted; the `+`/AddEffectPanel machinery stays, and a dial turn still
reaches the app so the line redraws from it.

- **Upstream:** `m4l-jweb` item 7 (`layout.native` codegen) - **SHIPPED 0.7.0**.
- **Done here:** `@m4l-jweb/*` pointed at local 0.7.0 (via `link:` for now, until the
  library is published; version intent is `^0.7.0`), the `layout` block added, the slider
  UI deleted, the line kept. Typecheck + build + 157 tests green; the generated fx
  patcher was inspected (seven dials at the expected rects, all fit the 169 px height).
- **Still owed:** a new fx screenshot; a Live check that the device view widens and the
  dials automate/map/Push exactly like any factory device. **Note the state-default
  seeding fix did NOT ride this release** (it needs a Max dict-embed spike upstream); the
  fx `named` slot's app-side default handling is unaffected.

## R2 - Spike R1: can a device populate the user's rack? (PLAN.md Part 2 gate)

One afternoon, falsifiable, runnable HERE in a throwaway `wrapper/device.ts` handler
on any existing device. The five questions, in order, are specified in `m4l-jweb`
TODO item 2B (stop at the first NO: browser reachable? `load_item` callable? landing
site steerable? clicks during playback? sane undo?).

- **If it passes:** Translate mode (R4) gets its reconciler - consumer-side code in
  `wrapper/device.ts`, diff rules per PLAN.md Part 2 (only touch what you own; never
  persist raw LOM ids; idempotent).
- **If it fails:** the documented fallback - ADOPT, don't create. The user drops an
  Auto Filter in the rack once; the device binds `.lpf()` to it and the UI says what
  to add. Most of the value survives.

## R3 - Pattern-driven modulation (Phase 7.2) - WAITING on `m4l-jweb` item 3

`.lpf(sine.range(200, 2000))` is a *signal*, not 20 Hz of parameter writes that step
audibly and fight the automation lane. The design is now concrete upstream: the
`remote` chain (`live.remote~` per declared slot, values ramped by `[line~ 20]`,
bound by LOM id, automation writing suppressed by design). When it ships:

- declare `remotes: <n>` in the manifest, stream values from the engine on the
  transport tick, and route patterned fx args to `writeRemote()` instead of refusing
  them in `parseFxChain()`.
- **This modulates REAL Live devices too** - including ones the user placed by hand -
  so it is valuable with or without R2 passing.

## R4 - The m4l-strudel Rack (PLAN.md Part 3) - can start ANY TIME

**What we deliver is a rack, not a super-device**: an Ableton Instrument Rack preset
(`presets/m4l-strudel Rack.adg`, hand-saved in Live, committed) with every required
device pre-added, each with its proper type - Sequencer (MIDI effect) -> Instrument
(instrument) -> FX (audio effect) - hand-composable, macros mappable, one drag from
the library. A single toggling device is impossible (container types are build-time;
Live enforces placement) and the rack is better anyway: users can swap, remove and
reorder the parts.

Steps, none of which wait on R1-R3:

- **R4-a: the unified app.** Merge the midi and fx apps into `src/app/unified/`,
  shipped into the existing containers via manifest `ui:` sharing, branched by the
  `mode` the wrapper already sends. KEEP THE SHIPPED DEVICE NAMES - renaming breaks
  user sets and the preset. Mind the Push bank budget when the surfaces merge.
- **R4-b: the Full Studio window.** `windows: { studio: ... }` +
  `StudioWindow.tsx` - an EDITOR, not an engine: it binds the code through a shared
  `state()` slot and the device-view engine (which alone receives `tick`) does all
  scheduling, so Live's quantization and scale are enforced for free. The window
  makes no sound, ever ([jweb] audio cannot reach the track - measured).
- **R4-c: the preset.** Compose the rack in Live with a native Ableton instrument in
  the middle slot (honest and useful until ours exists), save the .adg, commit under
  `presets/`. **Upstream:** `m4l-jweb` item 8 (installers copy `presets/` next to
  the devices, one install step so they cannot skew).
- **R4-d: Translate mode.** The FX device's toggle, only rendered when the wrapper
  reports `in_rack` - lands with R2's outcome (reconciler or adopt-fallback).
- **Later, the instrument slot:** replaced by the Strudel instrument when Phase 8
  Route B ships AND `m4l-jweb` ships instance-scoped buffer names (see P3 below).

## P2-b - The sample browser in a window - still pending, unchanged

Same shape as the shipped drum-rack window: the catalog/list/audition UI moves to a
floating window, the device view keeps the small transport. Reuses the drag-source
and reveal-in-folder work already there; the build harness is in place. Independent
of the roadmap above - do it whenever it is the most valuable next thing.

## P3 - the polyphonic Strudel sampler - PARKED on an upstream fix (unchanged)

The `instrument` chain substrate is built and its polyphony confirmed in Live, but
**the buffer-name collision is still open**: `instrumentChain()` names buffers
`buf-<device>-<slot>`, global to Max and fixed at BUILD time, so two copies of the
drum rack on two tracks would corrupt each other's samples, silently. A drum rack is
exactly the multi-instance case - and the Rack (R4) makes multi-instance the NORMAL
case, so this now gates two things, not one.

**Decision (2026-07-15): defer the device, the fix is filed upstream** in
[m4l-jweb TODO](../../m4l-jweb/doc/TODO.md) item 1, with two candidate routes (`#0`
instance argument vs. a wrapper-minted id) to be settled by a spike there. **P3
resumes the day `m4l-jweb` ships instance-scoped buffer names.**

## Phase 8 - Strudel's own audio in the track - Route B first (unchanged decision)

`FEAT-STRUDEL-002`. **Do not wait for the C++ external**: the standing analysis
([../../m4l-jweb/doc/ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md)) ranks
offline rendering first - `OfflineAudioContext` renders cycle N+1 with the real
superdough (bit-identical sound), `saveToFile()` (to be built upstream) writes the
WAV, `[buffer~]`/`[play~]` locked to `current_song_time` plays it double-buffered.
One cycle of edit latency; random/stateful patterns fall back with a visible notice.
See [SPIKE-OFFLINE.md](SPIKE-OFFLINE.md). This is what eventually fills the Rack's
instrument slot (R4).

---

# A cheap upstream ask, not a block

- **`.hpf()` and `.crush()` as library chains.** `m4l-jweb` says they are easy
  follow-ons to `delay`/`reverb` ("add them when `m4l-strudel` asks"). The unblock
  is: declare the two params in `fx/surface.ts` and ask. Until then the FX device
  honestly refuses them. Note R2 may make this moot for Live-native effects (Redux
  IS `.crush()` in Translate mode); the static chains remain the answer outside a
  rack.

---

# Not possible: "download straight into a clip slot"

A natural request, and worth writing down so nobody re-opens it: **the Live Object Model
cannot create an audio clip from a file on disk.** `ClipSlot.create_clip` exists and is
**MIDI-only** (it takes a length, and makes an empty MIDI clip); there is no LOM call
that points a clip slot at a WAV. Ableton simply does not expose it - it is a
drag-and-drop operation in the application, not an API.

So the browser goes as far as the API allows: the sample is on disk, and **the whole row
is a drag source** once it has been auditioned (the wrapper sends the device's absolute
folder at `ui_ready`; the app puts the file on the drag). Drag it into a Simpler, a Drum
Rack or a track.

**But whether that drag lands is an open spike, not a shipped promise** -
[SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md). Two unknowns: whether `[jweb]`'s embedded
Chromium emits an OS drag at all, and if so which payload format Live's audio lane reads.
The user's "intercept what Splice drops" idea is folded into that plan, with the caveat
that a drag between two native windows is not observable from Max - what *is* observable is
the aftermath, via `Clip.file_path`, which the spike uses as its oracle. The honest
fallback, if the drag cannot leave the view, is a reveal-in-folder button; the file is
already on disk at a known path either way.

---

# Active Backlog (Prioritized Easy to Hard)

## 1. Scale and Pitch matching in full Strudel code (Medium)
- **Full Strudel code does not see the Octave/Shift controls or the Live Scale toggle.** It is passed through untouched - correct, since it is real Strudel code and rewriting a user's JS would be worse - but it means `note("c5")` there is MIDI **72** (Strudel's note names are scientific), while `c5` in bare mini-notation is whatever the octave convention says. The UI warns in amber; it cannot fix it. Note R4-b raises the stakes: the Full Studio window invites more full-code use.

## 2. Playhead highlighting for full Strudel code (Medium)
- **The playhead highlight only works for bare mini-notation.** It is computed from our own AST, whose tokens carry source positions; full Strudel code has no link back to the characters the user typed. Strudel's own editor solves this with hap `context.locations` from the transpiler - wiring that up means mapping locations in the *rewritten* string back to the user's text, which is real work for a feature that mostly matters in the dialect that already has it.

---

# DONE: the 0.6.5 adoption (P1) and the floating-window editors (P2-a)

**P1 - SHIPPED 2026-07-15.** Deps bumped to `^0.6.5`, the FX device swapped onto the
library's `delay`/`reverb` chains, `patcher/chains.mjs` deleted (custom chains and the
`fanParamInto()` copy with it), and the build + 157 tests are green. The mono preview
fixed itself with the version (the fold shipped inside the library's `samples` chain).
Owed: a Live listening A/B on the FX chains, since the library's neutrality null-test
is structural, not audible.

**P2-a - the drum map, redrawn as an Ableton DRUM RACK - SHIPPED 2026-07-15.** The
list editor is gone; the map is a `DrumRack.tsx` - a 4-wide pad grid, chromatic and
bottom-up (C1 = MIDI 36 at bottom-left, Live's own layout). A pad is a note; map a
word onto it by typing into the pad or dragging an abbreviation from the palette. The
mini device view shows a 16-pad window with a scroll stripe; the **"Expand" button**
opens the SAME component in a floating window (`Window.tsx`, `entry: "Window"`)
showing C1..C6 at once. Both bind the one `drumMap` `state()` slot with
`useStateSync()`, kept in sync by the library. The window-aware build harness was
ported for it (`scripts/build-ui.mjs` per-window loop, `vite.config.ts`
`@device/App`/`WINDOW_ENTRY`); the `.amxd` embeds `editor.html` alongside the device
view. **Note:** pad LABELS use Live's drum-rack convention (36 = C1), independent of
the pattern note-name toggle. Owed: a Live check that drag-and-drop works inside
`[jweb]` and the two views stay in sync.

# DONE: the move to `m4l-jweb` 0.6.0, and the death of `[node.script]`

**The headline of this release was a DELETION.** The sample browser ran a Node process
(`src/max/sampler-browser/main.mjs`, 153 lines) because in 0.5.0 nothing else in the
stack could reach the network or the disk. It was the last `[node.script]` in either
repo, and the library forbids it outright - its failure modes in Live ran from silently
ignoring `script start` to crashing the host.

All three of its jobs had first-class answers by 0.6.0, and it took the whole apparatus
with it: the `payloads`/`looseFiles` manifest entries, `scripts/build-node-bundles.mjs`,
the `.cjs` artifact, the `engine_ready` handshake, and the base64 hop every reply
travelled through.

| The node process did... | ...and now |
|---|---|
| `fetch()` the catalog | **`fetch()` in the app** - `[jweb]` *is* Chromium. It lives in `src/lib/samples.ts`, and is under test for the first time: inside Node for Max it could not be |
| `fetch()` + `writeFile()` each sample | **`fetchToFile()`**, the `download` chain - `[maxurl]` writes it, and the bytes never cross the bridge |
| `sfplay~` + a `setTimeout` for BPM sync | **the `samples` chain** - `[buffer~]` -> `[groove~]`, **summed into the track**. The beat maths moved into the app, where `tick` and `tempo` already were |

**The preview is the point, and it is not a nicety.** `[jweb]` has no `~` outlets: audio
a page plays goes to the OS output device, past the track, the fader and the monitor cue.
Downloading before previewing is not a detour to optimise away - it is the only path to
audio Live can hear. See [ARCHITECTURE.md](ARCHITECTURE.md) §3d for the whole path.

**State that survives the SET.** The drums device's **drum map** and the FX device's
**line** are `state()` slots now, bound with `useStateSync()`, compiled to a `[dict]` +
`[pattr]` with `parameter_enable` - which is the one thing that makes Live save a value
with the set rather than with a patcher it never saves. The drum map used to live in the
page's localStorage: one map per machine, shared by every copy of the device, left behind
when the set travelled. It is now per instance, and it goes with the music.

# DONE: Refactor `ableton-midi` into two devices

The old `ableton-midi` served two conflicting use cases - generating standard MIDI notes,
and mapping drum words to Drum Rack pads - which made it complex and its UI cramped. Split
into `ableton-midi` (a pure MIDI generator) and `ableton-midi-drums` (drum mapping only).

*Note for R4-a: the unified app is NOT a reversal of this split. The split separated
UIs that served different USERS of one container type; the unified app shares CODE
across container types while each shipped device keeps its own identity.*

---

# DONE: the effects rack

`.lpf()`, `.gain()`, `.delay()` and `.room()` work (the last two via the library's
`delay` / `reverb` chains since P1). `.crush()` and `.hpf()` are *named* by the
device and honestly refused ("no Max chain yet") rather than silently doing nothing.

**The frozen-graph law** ([ARCHITECTURE.md](ARCHITECTURE.md) §3c) is why: the DSP graph is
written at build time and the line only chooses values, so every stage is always in the
path and every stage needs a setting at which it is *bit-identical* to a wire. `gain: 1.0`
and `cutoff: 18 kHz` are naturally neutral; a reverb is **not** - `cverb~` is wet-only and
needs an explicit dry/wet where 0 is genuinely dry. The canonical order is frozen:
filter → drive → delay → reverb → gain, so `.lpf(800).room(0.5)` and `.room(0.5).lpf(800)`
produce the same signal path and the UI says so.

**`strudelfx` is gone**: `chains: [...]` builds a real series upstream since 0.5.0, so the
hand-wired chain that existed to work around that is not needed.

# DONE: `s("bd sd")` should not be silence

The most common idiom on strudel.cc produced **zero MIDI notes, no error, no sound**:
`hapToNote()` read `note ?? n`, and an `s()` pattern has neither. Now, when a hap has an
`s` and no note, the sample name is looked up in the **drum map** - which already maps
`bd`/`sd`/`hh` to Drum Rack pads and is already user-editable. A rhythm copied off
strudel.cc works unchanged; an `s()` name with no mapping stays silent, as it must.

---

# DONE: Themes

Live's dynamically injected CSS variables (`--live-bg-color`, `--live-text-color`, ...)
are mapped to Tailwind tokens in `index.css`, so the devices follow the user's Ableton
theme natively.

---

# DONE: Constants & Caveats

- **`MAX_CYCLES` is 64.** A pathologically nested pattern is truncated rather than exported. Nobody has hit it; it exists so a typo cannot ask for a ten-thousand-bar clip.
- **From Clip flattens structure.** It reads MIDI back as a flat grid of notes, so `<a b>` returns as its expanded note list. Inherent to reading MIDI - the structure is not in the clip - but now that To Clip exports the *whole* loop, a round trip produces a much longer flat pattern than it used to.

---

# DONE: CICD pipeline

The `.amxd` devices come from the pipeline: a GitHub Actions workflow runs `pnpm install`
and `pnpm build` (which compiles the JS and uses `m4l-jweb build` to generate the
devices), and a release action attaches `dist/m4l-strudel.zip` and the individual `.amxd`
files to a GitHub Release.
