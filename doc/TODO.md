# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**The strategic roadmap is [PLAN.md](PLAN.md)** - native declarative UI, dynamic
chains, and the m4l-strudel Rack - and this file is sequenced against it. **Open work
is at the top, in priority order; what has shipped and been tested is at the
[END](#done).** What a device does is in [README.md](../README.md); how and why it does
it (including the designs tried and rejected) is in [ARCHITECTURE.md](ARCHITECTURE.md).

---

# What comes next (priority order)

## R1b - `.crush()` and `.hpf()` as real chains  ← **LOW-HANGING FRUIT, DO FIRST**

The only two effects the fx device still names and refuses. Both are easy static chains
(`m4l-jweb` calls them the cheap siblings of what already ships: `hpf` next to
`lowpass`, `crush` via `degrade~`/`downsamp~`, neutral at full bit depth). Small,
self-contained, and it finishes the fx vocabulary.

- **Upstream (`m4l-jweb`):** add the `hpf` and `crush` chains to
  `packages/build/src/chains.mjs`, each neutral at rest (frozen-graph law), pinned by
  `tests/neutrality.test.mjs`.
- **Here:** declare `hpfreq` and `crush` params in `src/app/fx/surface.ts` (native
  dials, so they join the panel), add the two chains to the manifest in the frozen
  order, and drop them from the "refused" list in `src/lib/fx.ts`. Re-check the
  neutral-at-rest values by ear.

## R2 - Spike: can a device populate the user's rack? (PLAN.md Part 2 gate)

One afternoon, falsifiable, runnable HERE in a throwaway `wrapper/device.ts` handler on
any existing device. The five questions, in order, are specified in `m4l-jweb` TODO
item 1 (stop at the first NO: browser reachable? `load_item` callable? landing site
steerable? clicks during playback? sane undo?).

- **If it passes:** Translate mode (R4-d) gets its reconciler - consumer-side code in
  `wrapper/device.ts`, diff rules per PLAN.md Part 2 (only touch what you own; never
  persist raw LOM ids; idempotent).
- **If it fails:** the documented fallback - ADOPT, don't create. The user drops an
  Auto Filter in the rack once; the device binds `.lpf()` to it and the UI says what to
  add. Most of the value survives.

## R3 - Pattern-driven modulation (Phase 7.2) - WAITING on `m4l-jweb`'s `remote` chain

`.lpf(sine.range(200, 2000))` is a *signal*, not 20 Hz of parameter writes that step
audibly and fight the automation lane. The design is concrete upstream (the `remote`
chain: `live.remote~` per declared slot, values ramped by `[line~ 20]`, bound by LOM
id, automation writing suppressed by design). When it ships:

- declare `remotes: <n>` in the manifest, stream values from the engine on the
  transport tick, and route patterned fx args to `writeRemote()` instead of refusing
  them in `parseFxChain()`.
- **This modulates REAL Live devices too** - including ones the user placed by hand -
  so it is valuable with or without R2 passing.

## R4 - The m4l-strudel Rack (PLAN.md Part 3) - can start ANY TIME

**What we deliver is a rack, not a super-device**: an Ableton Instrument Rack preset
(`presets/m4l-strudel Rack.adg`, hand-saved in Live, committed) with every required
device pre-added, each with its proper type - Sequencer (MIDI effect) -> Instrument
(instrument) -> FX (audio effect) - hand-composable, macros mappable, one drag from the
library. A single toggling device is impossible (container types are build-time) and
the rack is better anyway: users can swap, remove and reorder the parts.

Steps, none of which wait on R2/R3:

- **R4-a: the unified app.** Merge the midi and fx apps into `src/app/unified/`, shipped
  into the existing containers via manifest `ui:` sharing, branched by the `mode` the
  wrapper already sends. KEEP THE SHIPPED DEVICE NAMES - renaming breaks user sets and
  the preset. Mind the Push bank budget when the surfaces merge.
- **R4-b: the Full Studio window.** `windows: { studio: ... }` + `StudioWindow.tsx` - an
  EDITOR, not an engine: it binds the code through a shared `state()` slot and the
  device-view engine (which alone receives `tick`) does all scheduling, so Live's
  quantization and scale are enforced for free. The window makes no sound, ever
  (`[jweb]` audio cannot reach the track - measured).
- **R4-c: the preset.** Compose the rack in Live with a native Ableton instrument in the
  middle slot (honest and useful until ours exists), save the .adg, commit under
  `presets/`. **Upstream:** `m4l-jweb` item 5 (installers copy `presets/` next to the
  devices).
- **R4-d: Translate mode.** The FX device's toggle, only rendered when the wrapper
  reports `in_rack` - lands with R2's outcome (reconciler or adopt-fallback).
- **Later, the instrument slot:** replaced by the Strudel instrument when Phase 8
  Route B ships AND `m4l-jweb` ships instance-scoped buffer names (see P3).

## P2-b - The sample browser in a window

Same shape as the shipped drum-rack window: the catalog/list/audition UI moves to a
floating window, the device view keeps the small transport. Reuses the drag-source and
reveal-in-folder work already there; the build harness is in place. Independent of the
roadmap above - do it whenever it is the most valuable next thing.

## P3 - The polyphonic Strudel sampler - PARKED on an upstream fix

The `instrument` chain substrate is built and its polyphony confirmed in Live, but **the
buffer-name collision is still open**: `instrumentChain()` names buffers
`buf-<device>-<slot>`, global to Max and fixed at BUILD time, so two copies of the drum
rack on two tracks would corrupt each other's samples, silently. A drum rack is exactly
the multi-instance case - and the Rack (R4) makes multi-instance the NORMAL case.

**Decision (2026-07-15): defer the device, the fix is filed upstream** in
[m4l-jweb TODO](../../m4l-jweb/doc/TODO.md) row 11, with two candidate routes (`#0`
instance argument vs. a wrapper-minted id) to be settled by a spike there. **P3 resumes
the day `m4l-jweb` ships instance-scoped buffer names.**

## Phase 8 - Strudel's own audio in the track - Route B first

`FEAT-STRUDEL-002`. **Do not wait for the C++ external**: the standing analysis
([../../m4l-jweb/doc/ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md)) ranks offline
rendering first - `OfflineAudioContext` renders cycle N+1 with the real superdough
(bit-identical sound), `saveToFile()` (to be built upstream) writes the WAV,
`[buffer~]`/`[play~]` locked to `current_song_time` plays it double-buffered. One cycle
of edit latency; random/stateful patterns fall back with a visible notice. See
[SPIKE-OFFLINE.md](SPIKE-OFFLINE.md). This eventually fills the Rack's instrument slot.

## Active backlog (Easy to Hard)

### 1. Scale and pitch matching in full Strudel code (Medium)
Full Strudel code does not see the Octave/Shift controls or the Live Scale toggle. It is
passed through untouched - correct, since it is real Strudel code and rewriting a user's
JS would be worse - but `note("c5")` there is MIDI **72** (scientific), while `c5` in
bare mini-notation follows the octave convention. The UI warns in amber; it cannot fix
it. R4-b raises the stakes: the Full Studio window invites more full-code use.

### 2. Playhead highlighting for full Strudel code (Medium)
The playhead highlight only works for bare mini-notation, computed from our own AST whose
tokens carry source positions. Full Strudel code has no link back to the typed
characters. Strudel's editor solves this with hap `context.locations` from the
transpiler - wiring that up means mapping locations in the *rewritten* string back to the
user's text, real work for a feature that mostly matters in the dialect that already has
it.

## A cheap upstream ask, not a block

- **`.hpf()` and `.crush()` as library chains.** `m4l-jweb` says they are easy
  follow-ons to `delay`/`reverb`. The unblock is: declare the two params in
  `fx/surface.ts` and ask. Until then the FX device honestly refuses them. R2 may make
  this moot for Live-native effects (Redux IS `.crush()` in Translate mode); the static
  chains remain the answer outside a rack.

---

# Not possible: "download straight into a clip slot"

Worth writing down so nobody re-opens it: **the Live Object Model cannot create an audio
clip from a file on disk.** `ClipSlot.create_clip` is **MIDI-only** (it takes a length,
makes an empty MIDI clip); there is no LOM call that points a clip slot at a WAV. It is a
drag-and-drop operation in the application, not an API.

So the browser goes as far as the API allows: the sample is on disk, and **the whole row
is a drag source** once auditioned (the wrapper sends the device's absolute folder at
`ui_ready`; the app puts the file on the drag). **Whether that drag lands is an open
spike** - [SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md): whether `[jweb]`'s Chromium
emits an OS drag at all, and which payload format Live's audio lane reads. The honest
fallback is a reveal-in-folder button; the file is on disk at a known path either way.

<a id="done"></a>

---

# DONE (and tested)

## R1 - Native fx UI: the two-screen knob panel - SHIPPED 0.7.0, VERIFIED IN LIVE
The fx device shed its HTML sliders for NATIVE `live.dial` objects (`layout.native` in
`src/app/fx/surface.ts`). Automation, MIDI-map and Push confirmed working on them. What
we learned along the way, and how it landed:

- A frozen M4L device can **hide/show** native objects at runtime (`obj.hidden`) but
  **cannot reposition/resize** them (`presentation_rect` writes are stored, never
  redrawn - measured across two mechanisms). So per-line reflow was abandoned.
- Instead, the **two screens** (`layout.native.panel` + `useNativePanel`): the web UI
  (the Strudel line, full width) OR the native knob panel (all seven dials, `[jweb]`
  hidden), flipped by a **"Back" button** (a `live.text`, top-right) in the panel and a
  matching "Knobs" button in the web UI. Dials laid out in two rows across the wide
  panel.
- A black-screen bug fixed on the way: a FRESH fx instance's `named` slot returns `{}`
  (the upstream state-default seeding bug), and `named.includes(...)` threw a few ms
  after mount - coerced to an array.

## P1 - Adopt m4l-jweb 0.6.5 - SHIPPED 2026-07-15
Deps bumped, the FX device swapped onto the library's `delay`/`reverb` chains,
`patcher/chains.mjs` deleted. **`.delay()` and `.room()` confirmed audible in Live.** The
mono preview fold shipped inside the library's `samples` chain.

## P2-a - The drum map as an Ableton DRUM RACK - SHIPPED 2026-07-15, VERIFIED IN LIVE
The list editor is gone; the map is a `DrumRack.tsx` - a 4-wide pad grid, chromatic and
bottom-up (C1 = MIDI 36 at bottom-left, Live's own layout). The mini device view shows a
16-pad window; **"Expand"** opens the SAME component in a floating window showing C1..C6.
Both bind the one `drumMap` `state()` slot with `useStateSync()`. Pad LABELS use Live's
drum-rack convention, independent of the pattern note-name toggle.

## The move to m4l-jweb 0.6.0, and the death of `[node.script]`
The sample browser's Node process (the last `[node.script]` in either repo, which could
crash the host) was DELETED. All three of its jobs had first-class answers by 0.6.0:
`fetch()` in the app (`[jweb]` is Chromium), `fetchToFile()` (the `download` chain), and
the `samples` chain (`[buffer~]` -> `[groove~]`, summed into the track). **The preview is
the point**: `[jweb]` has no `~` outlets, so audio a page plays bypasses the track;
downloading before previewing is the only path to audio Live can hear.

## Refactor `ableton-midi` into two devices
Split the old dual-purpose device into `ableton-midi` (a pure MIDI generator) and
`ableton-midi-drums` (drum mapping only). *Note: R4-a's unified app is NOT a reversal -
it shares CODE across container types while each shipped device keeps its identity.*

## The effects rack, and the frozen-graph law
`.lpf()`, `.gain()`, `.delay()` and `.room()` work. `.crush()` and `.hpf()` are *named*
and honestly refused ("no Max chain yet"). The **frozen-graph law**
([ARCHITECTURE.md](ARCHITECTURE.md) §3c): the DSP graph is written at build time and the
line only chooses values, so every stage is always in the path and must be bit-identical
to a wire at its neutral setting. The canonical order is frozen: filter -> drive ->
delay -> reverb -> gain, so `.lpf(800).room(0.5)` and `.room(0.5).lpf(800)` produce the
same path and the UI says so.

## `s("bd sd")` should not be silence
The most common idiom on strudel.cc produced zero MIDI notes, no error, no sound:
`hapToNote()` read `note ?? n`, and an `s()` pattern has neither. Now a hap with an `s`
and no note looks the sample name up in the **drum map**. An `s()` name with no mapping
stays silent, as it must.

## Themes
Live's injected CSS variables (`--live-bg-color`, ...) are mapped to Tailwind tokens in
`index.css`, so the devices follow the user's Ableton theme natively.

## Constants & caveats
- **`MAX_CYCLES` is 64.** A pathologically nested pattern is truncated rather than
  exported, so a typo cannot ask for a ten-thousand-bar clip.
- **From Clip flattens structure.** It reads MIDI back as a flat grid of notes, so
  `<a b>` returns as its expanded note list - inherent to reading MIDI.

## CICD pipeline
A GitHub Actions workflow runs `pnpm install` and `pnpm build` (compiles JS, then
`m4l-jweb build` generates the devices); a release action attaches the zip and the
individual `.amxd` files to a GitHub Release.
