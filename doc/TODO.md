# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**This file is what is still ahead.** What has shipped is described where it
belongs: [README.md](../README.md) for what a device does, and
[ARCHITECTURE.md](ARCHITECTURE.md) for how and why it does it - including §5a,
the designs that were tried and rejected, so nobody proposes them again.

---

# Unblocked by `m4l-jweb` 0.6.5 - the priority now

*(The 0.6.0 migration that used to head this file has shipped - see the DONE section at
the bottom. It came back with three upstream gaps attached. **0.6.5 has closed all
three**, plus shipped two capabilities we were parked on. What was "still waiting" is now
"ready to build", in the order below. The one prerequisite for every item is bumping the
`@m4l-jweb/*` dependencies from `^0.6.0` to `^0.6.5` and reinstalling - the tree still has
0.6.0 pinned.)*

## P1 - the quick wins (one build, three problems gone) - SHIPPED 2026-07-15

*Deps bumped to `^0.6.5`, the FX device swapped onto the library's `delay`/`reverb` chains,
`patcher/chains.mjs` deleted (custom chains and the `fanParamInto()` copy with it), and the
build + 157 tests are green. Owed: a Live listening A/B on the FX chains, since the
library's neutrality null-test is structural, not audible.*

These were deletions and a version bump. No new UI, low risk, and they closed three of the
long-standing gaps at once.

- **[P1-a] Bump to 0.6.5 - and the mono preview fixes itself.** `#4` shipped *inside* the
  library's `samples` chain: a runtime `[selector~ 2]`, gated by the slot's measured
  channel count, folds a mono `groove~` outlet to both ears. We had filed this as
  unfixable from here, and it was - so the fix arrives with the version, no code change.
  A tidal-drum-machines preview (mostly mono) now plays centred instead of in one ear.
- **[P1-b] Swap the FX device onto the library's `delay`/`reverb` chains, and delete
  `patcher/chains.mjs`.** `2A` shipped `delay` and `reverb` as first-class chains, and
  their param ids are **exactly** the ones `src/app/fx/surface.ts` already declares
  (`delay`, `delaytime`, `delayfeedback`, `room`) - checked against the library source.
  So the manifest line becomes `["lowpass","drive","delay","reverb","gain"]`, our local
  `strudel-delay`/`strudel-room` go away, and with them the whole of `patcher/chains.mjs`.
  The library's chains carry the **neutrality contract** (null-tested at their neutral
  setting), which our hand-rolled ones never proved. Owed: a Live listening A/B, because
  the library's null-test is structural, not audible.
- **[P1-c] Delete our copy of `fanParamInto()`.** `#5` exported it from
  `@m4l-jweb/build/chains`. P1-b already deletes the file it lives in, so this is subsumed
  the moment P1-b lands - noted separately only because if P1-b is deferred, this is still
  a standalone four-line cleanup (import it, drop the copy).

## P2 - the floating-window editors (the big UX win `#6` bought us)

`#6` shipped and is verified in Live: a window's `[jweb]` is now routed back to `[js]`,
and a window's page reads and writes the device's shared `state()`, with edits broadcast
to every view. `m4l-jweb`'s `hello-window` is the worked reference, including the silent
`reply()` trap (fixed `(selector, value)`, never `.apply`).

- **[P2-a] The drum map, redrawn as an Ableton DRUM RACK** (`alienmind-strudel-midi-drums`)
  - **SHIPPED 2026-07-15.** The list editor is gone; the map is now a `DrumRack.tsx` - a
  4-wide pad grid, chromatic and bottom-up (C1 = MIDI 36 at bottom-left, Live's own
  layout). A pad is a note; you map a word onto it three ways: **type it into the pad, or
  drag one of the abbreviations from the palette on the right onto it**. The mini device
  view shows a 16-pad window with a **scroll stripe** down the left (a compact mini-map of
  the range; click to scroll octaves). The **"Expand" button** opens the SAME component in
  a floating window (`Window.tsx`, `entry: "Window"`) showing the whole **C1..C6** range at
  once, no stripe. Both bind the one `drumMap` `state()` slot with `useStateSync()`, so the
  mini rack and the window are one write to one persisted `[dict]`, kept in sync by the
  library. The window-aware build harness was ported to make this work
  (`scripts/build-ui.mjs` per-window loop, `vite.config.ts` `@device/App`/`WINDOW_ENTRY`);
  the `.amxd` embeds `editor.html` alongside the device view. **Note:** pad LABELS use
  Live's drum-rack convention (36 = C1), independent of the pattern note-name toggle -
  pads are triggered by drum words, not by typing note names. Owed: a Live check that the
  window opens, drag-and-drop works inside `[jweb]`, and the two views stay in sync.
- **[P2-b] The sample browser in a window** (`alienmind-strudel-sampler-browser`) - not yet
  done. Same shape as P2-a: the catalog/list/audition UI moves to a window, the device view
  keeps the small transport. Reuses the drag-source and reveal-in-folder work already
  there, and the build harness is now in place for it.

## P3 - the polyphonic Strudel sampler (a genuine new device) - PARKED on an upstream fix

`m4l-jweb` item 1, the `instrument` chain, is built and its polyphony is confirmed in Live
(multi-sample keymap, `[poly~]` voices around `groove~`, a `playVoice()` bridge API) - the
whole substrate for a Strudel **drum rack**. We checked the 0.6.5 source before building on
it, and **the buffer-name collision is still open**: `instrumentChain()` names buffers
`buf-<device>-<slot>`, global to Max and fixed at BUILD time, so two copies of the drum
rack on two tracks would name their buffers alike and corrupt each other's samples,
silently. A drum rack is exactly the multi-instance case, so this is not a corner we can
ship past.

**Decision (2026-07-15): defer the device, file the fix upstream first.** The requirement
- N instances of one instrument device, each with its own buffers, no shared global name -
is written up in [m4l-jweb TODO](../../m4l-jweb/doc/TODO.md) under item 1, with two
candidate routes (`#0` instance argument vs. a wrapper-minted id) to be settled by a spike
there. It is a library change: the name cannot vary per instance from where it is set
today. **P3 resumes the day `m4l-jweb` ships instance-scoped buffer names.**

---

# Still blocked on `m4l-jweb` (do not start)

- **Pattern-driven modulation (Phase 7.2)** - `.lpf(sine.range(200, 2000))` is a *signal*,
  not a parameter: as 20 Hz of parameter writes it steps audibly and fights the automation
  lane. Waiting on the **modulation seam** (`m4l-jweb` item 3, still open). `live.remote~`
  may make this modulate *Ableton's own* devices, which is a bigger feature than an LFO on
  our filter.
- **Strudel Audio Instrument (Phase 8)** - Strudel's own WebAudio synthesis reaching the
  track. `FEAT-STRUDEL-002`; `m4l-jweb` Priority 2, "hard, and possibly never". **Do not
  wait for the C++ external**: see
  [../../m4l-jweb/doc/ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md), which argues a
  native bridge is the *least* promising of four routes, and that offline rendering to
  disk - now that fetch-to-disk and `[buffer~]` both work - gets there without one.

# A cheap upstream ask, not a block

- **`.hpf()` and `.crush()` as library chains.** `m4l-jweb`'s 2A deliberately stopped at
  `delay`/`reverb` because those are the two our `fx` surface declares; it says `hpf` (the
  cheap sibling of `lowpass`) and `crush` (`degrade~`/`downsamp~`) are "easy follow-ons,
  add them when `m4l-strudel` asks". So the unblock is: declare the two params in
  `fx/surface.ts` and ask. Until then the FX device honestly refuses them, which is fine.

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
- **Full Strudel code does not see the Octave/Shift controls or the Live Scale toggle.** It is passed through untouched - correct, since it is real Strudel code and rewriting a user's JS would be worse - but it means `note("c5")` there is MIDI **72** (Strudel's note names are scientific), while `c5` in bare mini-notation is whatever the octave convention says. The UI warns in amber; it cannot fix it.

## 2. Playhead highlighting for full Strudel code (Medium)
- **The playhead highlight only works for bare mini-notation.** It is computed from our own AST, whose tokens carry source positions; full Strudel code has no link back to the characters the user typed. Strudel's own editor solves this with hap `context.locations` from the transpiler - wiring that up means mapping locations in the *rewritten* string back to the user's text, which is real work for a feature that mostly matters in the dialect that already has it.

---

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

*What did NOT ship in 0.6.0: the floating-window editors, dropping our `fanParamInto()`,
and the mono-preview fold. All three hit upstream gaps - and all three were closed by
0.6.5. See the "Unblocked" section at the top of this file.*

# DONE: Refactor `ableton-midi` into two devices

The old `ableton-midi` served two conflicting use cases - generating standard MIDI notes,
and mapping drum words to Drum Rack pads - which made it complex and its UI cramped. Split
into `ableton-midi` (a pure MIDI generator) and `ableton-midi-drums` (drum mapping only).

*The drum map now travels with the Live set (see the 0.6.0 section below). The cramped
mapping UI is still cramped: it was to get a floating window of its own, and that is the
one thing 0.6.0 could not give it - a window cannot send a message back to Max, so it
cannot host an editor. See the top of this file.*

---

# DONE: the effects rack

`.lpf()`, `.gain()`, `.delay()` and `.room()` work (the last two via our own
`strudel-delay` / `strudel-room` chains). `.crush()` and `.hpf()` are *named* by the
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
