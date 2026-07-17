# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**The strategic roadmap is [PLAN.md](PLAN.md)** - native declarative UI, dynamic
chains, and the m4l-strudel Rack - and this file is sequenced against it. **Open work
is at the top, in priority order; what has shipped and been tested is at the
[END](#done).** What a device does is in [README.md](../README.md); how and why it does
it (including the designs tried and rejected) is in [ARCHITECTURE.md](ARCHITECTURE.md).
**What a human still has to check in Live - every interactive test and both open spikes -
is in [TESTING.md](TESTING.md).**

---

# What comes next (priority order)

> **STATE (2026-07-17).** Everything built is **confirmed working in Live**. What is left
> at the top of this file is: **two spikes**, the half of R3 that needs a transport tick,
> and the Rack.
>
> **-> The two spikes are written up in [TESTING.md](TESTING.md).** Both are gates: R2
> decides whether Translate mode exists at all, and the `#0` spike (m4l-jweb item 0)
> decides whether P3's drum rack can be built at all.
>
> Released as **0.9.0**, alongside `m4l-jweb` 0.9.0 - the two versions move together from
> here.

## R2 - Spike: can a device populate the user's rack? (PLAN.md Part 2 gate) - RUN 2026-07-17, ANSWER: NO

Ran per [TESTING.md](TESTING.md) section 1, on the strudel-midi device inside a rack.
Stopped at the first NO, as designed:

- **Q1 browser reachable: NO.** `new LiveAPI("live_app browser")` resolves to id 0,
  and the console says why: `jsliveapi: component 'browser' is not an object`. The
  Browser is exposed to control-surface Python scripts only, not to the LOM that
  `[js]`/`live.object` see. Q2-Q5 are moot.
- **Verdict: Translate mode is adopt-only.** The documented fallback applies - ADOPT,
  don't create. The user drops an Auto Filter in the rack once; the device binds
  `.lpf()` to it and the UI says what to add. Most of the value survives.

The throwaway `spike_rack` block has been deleted from `wrapper/device.ts`.

## R3 - Pattern-driven modulation (Phase 7.2) - BUILT END TO END, UNVERIFIED IN LIVE

The `remote` chain exists upstream (`live.remote~` per declared slot, each value ramped
by a `[line~]` so a control-rate stream leaves Max as continuous modulation, bound by
LOM id, automation writing suppressed by design). `bindRemote()` / `writeRemote()` /
`resolveParamId()` are on the bridge.

Here, `parseFxChain()` no longer refuses a signal: `.lpf(sine.range(200, 2000))` comes
back as a `patterned` stage carrying the Strudel pattern AND its source text, and
`queryFxPattern(stage, cycle)` is what a tick asks for its value.

- **The line stopped being a pure projection of the parameters, and had to.** A Pattern
  cannot say what it was written as, so printing a modulated stage from its parameter
  would rewrite `.lpf(sine.range(200, 2000))` into `.lpf(1372)` - the user's modulation
  silently replaced by a snapshot of it, on nothing more than a re-render. Patterned
  stages persist their SOURCE (recovered with acorn, which walks the same chain the
  recorder does); constant stages are still derived from the parameters, so the
  round-trip invariant holds everywhere it was ever true.
- **Cost, so it is not a surprise:** `@strudel/core` in the fx app took the UI bundle
  from 269 kB to 448 kB and the `.amxd` from 465 kB to 707 kB.
- **This modulates REAL Live devices too** - including ones the user placed by hand -
  so it is valuable with or without R2 passing.

**The consumer is BUILT (2026-07-17), unverified in Live** - see
[TESTING.md](TESTING.md) section 3. `src/app/fx/useModulation.ts` is the whole of it:

- **The tick:** the wrapper already sent `tick <playing> <beats>` at 20 Hz to every
  device; the fx app now listens. One cycle = one 4/4 bar (beats/4), locked to
  `current_song_time` - so `.lpf(sine)` sweeps once a bar at any tempo and survives
  loop jumps. No cps to honour: a one-line fx chain has no `setcpm()`.
- **Slots:** `remotes: 9` is now in the manifest, mapped by RACK index - slot 0 is
  cutoff, slot 8 is gain, forever. No allocator to get wrong.
- **Bind/release:** `resolveParamId()` + `bindRemote()` when a stage becomes
  modulated; `bindRemote(slot, 0)` when it stops, because a bound live.remote~ owns
  the parameter exclusively and would freeze the dial. Set reload needs no observer:
  it reloads [jweb], and the hook re-resolves on mount. Ids are never persisted.
- **The missing half of persistence:** patterned SOURCES now survive - a `sources`
  state slot (param -> expression). Before this, committing
  `.lpf(sine.range(200, 2000))` reprinted as `.lpf(18000)` from the parameters - the
  exact snapshot bug the parse layer was built to avoid.

## R4 - The m4l-strudel Rack (PLAN.md Part 3) - can start ANY TIME

**What we deliver is a rack, not a super-device**: an Ableton Instrument Rack preset
(`presets/m4l-strudel Rack.adg`, hand-saved in Live, committed) with every required
device pre-added, each with its proper type - Sequencer (MIDI effect) -> Instrument
(instrument) -> FX (audio effect) - hand-composable, macros mappable, one drag from the
library. A single toggling device is impossible (container types are build-time) and
the rack is better anyway: users can swap, remove and reorder the parts.

Steps. R4-a and R4-b are settled (see DONE); these are what is left:

- **R4-c: the preset.** Compose the rack in Live with a native Ableton instrument in the
  middle slot (honest and useful until ours exists), save the .adg, commit under
  `presets/`. **Upstream:** `m4l-jweb` item 5 (installers copy `presets/` next to the
  devices).
- **R4-d: Translate mode.** The FX device's toggle, only rendered when the wrapper
  reports `in_rack` - lands with R2's outcome (reconciler or adopt-fallback).
- **Later, the instrument slot:** replaced by the Strudel instrument when Phase 8
  Route B ships AND `m4l-jweb` ships instance-scoped buffer names (see P3).

## P3 - The polyphonic Strudel sampler - GATE OPEN (buffer scoping verified 2026-07-17)

**The `#0` route FAILED the spike (2026-07-17)**: `#0` never expands inside an
`.amxd`, so writer and reader agreed on one global name and the first device played
the second's sample - the same silent collision the fix was meant to kill.

**The upstream fix is now `---`** (m4l-jweb item 0): Max for Live's own device-scoped
prefix. `---buf-<device>-<slot>` expands per DEVICE instance, voices included, so the
`[poly~]` voice spells the same name and the `#0`/`#1` hand-off is gone. A
wrapper-minted id was never an option: **a `[buffer~]` takes its name from its
creation argument and has no documented runtime rename**, so a name minted after load
cannot reach a box frozen at build time.

**The `---` route PASSED (2026-07-17)**: two copies of the sampler on two tracks,
different samples, each kept its own sound. See [TESTING.md](TESTING.md) confirmed
section. The gate is open.

**The device itself is still to build**: a new instrument device on
the `instrument` chain, a slot per pad, notes routed to `playVoice()`. The substrate and
its polyphony are already confirmed in Live; what was missing was only the ability to put
two of them in a set, which is the normal case for a drum rack and what R4's Rack makes
normal for everything.

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
it. **R4-b has now raised those stakes for real**: the Full Studio window is a big
editor, it invites full-code use, and it carries the same amber warning because that is
still all anyone can honestly do about it.

### 2. Playhead highlighting for full Strudel code (Medium)
The playhead highlight only works for bare mini-notation, computed from our own AST whose
tokens carry source positions. Full Strudel code has no link back to the typed
characters. Strudel's editor solves this with hap `context.locations` from the
transpiler - wiring that up means mapping locations in the *rewritten* string back to the
user's text, real work for a feature that mostly matters in the dialect that already has
it.

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

## R4-a / R4-b - the unified app, and the Full Studio window (2026-07-17)

- **R4-a: the unified app - NOT AS SPECIFIED. Do not do the `ui:` merge.**
  **The mechanism does not work**, and it is worth writing down why rather than
  rediscovering it: the build does `loadSurface(root, d.ui ?? d.name)` - **one surface
  per UI FOLDER** - and `applySurface()` generates a `live.*` object for every param in
  it, for every device using it. So sharing `ui: "unified"` between the midi and fx
  devices means sharing ONE SURFACE: the MIDI device would ship **nine audio dials that
  drive nothing** (it has no audio chains to drive), and the FX device a Play toggle that
  does nothing. Both would show up in automation lanes, in the parameter list, and on
  Push. That is a regression for every user, traded for a refactor.
  **The stated intent is already met**: "share CODE across container types while each
  shipped device keeps its identity" is what `src/app/shared/` does, and it grew again
  this round - `useStrudelEngine`, `PatternEditor`, `AboutPanel`, `ClipPanel`, and now
  `HelpWindow`, `HelpButton`, `StudioWindow`. Share components there. Revisit only if the
  library ever separates a device's surface from its UI folder.
- **R4-b: the Full Studio window - WAS BROKEN, NOW FIXED.** It shipped empty and dead in
  both directions, and the cause was the `[dict]` bug at the top of this file: the `code`
  slot is a STRING, a dict cannot hold one, so the window and the device view were each
  reading their own default and neither could write. Fixed upstream. It also grew a
  **contextual help panel** (see P2-b) - the reference, following the caret, in the one
  place where you are actually typing.
  `StudioWindow.tsx`,
  shared, with a per-device entry file that does the `code` binding (a surface is
  invariant in its params, so a component taking "any surface with a code slot" is either
  one device's or `any` - the entry file is the seam). An EDITOR, not an engine: the
  device view alone receives `tick` and does all scheduling, so there is one scheduler
  however many views are open, and Live's quantization and scale are enforced for free.
  It makes no sound, ever.
  **It fixed a real bug on the way, which nobody had written down: the pattern text was
  never saved.** It lived in `useState`, so reopening a set silently restored the
  built-in default over whatever the user wrote. It is now the `code` `state()` slot -
  which is also the only thing two Chromium contexts can share, so the same change is
  what makes the window and the device view two views of ONE pattern. Moving it there is
  what exposed the `[dict]` bug: the slot was the right home, and the home was broken.

## R1b - `.crush()` and `.hpf()` as real chains - CONFIRMED WORKING IN LIVE (2026-07-17)

Both are real static chains now, in the frozen order
(`lowpass, hpf, drive, crush, delay, reverb, gain`). What landed, and the two decisions
worth knowing:

- **`hpf` is the lowpass's COMPLEMENT, not a highpass object.** Max's `onepole~` is
  lowpass-only, and a one-pole highpass is exactly `dry - lowpass(dry)`. That is also
  what makes 0 Hz a *true* neutral: a lowpass at 0 Hz passes nothing, so the
  subtraction returns the dry signal bit-for-bit. A highpass object would rest at its
  cutoff floor, still turning DC and the bottom octave - an always-on colouration the
  frozen-graph law forbids.
- **`crush` rests at 24 bits, NOT Strudel's 16.** Strudel calls `.crush(16)` "minimum
  crush", but 16-bit quantisation is not a wire, and a stage always in the path needs a
  setting where it does nothing. `.crush(16)` still gives 16-bit quantisation exactly as
  superdough does; a line that never says `.crush()` gets its signal back untouched.
- Nine dials broke the **Push bank budget** (8 per page - the library throws on a
  ninth), so the banks split where the rack splits: **Tone** (cutoff, hpfreq, drive,
  crush) and **Space** (delay, delaytime, delayfeedback, room, gain).

## P2-b - Help buttons - CONFIRMED IN LIVE (2026-07-17)

**On the three devices that take Strudel. NOT on the sample browser**, which was the last
correction: that device takes no Strudel at all - it is a catalog, a download and an
audition - so a Strudel reference there answered a question nobody was asking, and worse,
implied a box to type into that does not exist.

**Two rounds of feedback changed it**, all from real use:

- **The split was wrong and the fix is structural.** `only` used to be optional, meaning
  "every device", so mini-notation was listed on the FX device - whose line is
  `.lpf(800).gain(1.2)`, a method chain, where `<a b>` has never meant anything. `only`
  is now REQUIRED on every entry, so a new one cannot be added without answering the
  only question the list exists to answer. FX gets Effects + Modulation; the MIDI devices
  get Mini-notation + Patterns; the browser gets nothing, because it takes no Strudel.
- **The framing was wrong.** It is not "what this device can do" - it is **which
  strudel.cc features this collection supports**. Strudel is the language; these devices
  implement a subset, and a different subset each.
- **It floats** (`alwaysOnTop`, new upstream). Without it the window is useless in the
  way that matters: clicking back into Live to type is exactly what buried it.

The three Strudel-taking devices have a `?` (shared `HelpButton`) opening a "Supported
Strudel features" window (`src/app/shared/HelpWindow.tsx`, one component, a thin entry
file per device).

**It is OUR reference, not a link to strudel.cc, and that is the point.** Two reasons,
and the second is the one that matters: a Live set is often open with no internet, and -
**strudel.cc documents Strudel, while this has to document THESE DEVICES.** They are not
the same list. `.crush()` is real here as of R1b; `.vowel()` is real on strudel.cc and
silently does nothing here; a bare number is a scale degree in our mini-notation and a
raw MIDI pitch in full Strudel code. A reference that told you what strudel.cc says would
be wrong in exactly the places a user is stuck - which is why they opened it. So each
entry carries a `status` (**works** / **not yet** / **syntax**) and the list is filtered
per device: `sine` is the FX device's, `s("bd sd")` is the MIDI devices'.

`src/lib/__tests__/reference.test.ts` ties the data to the code it describes - every
stage in the `RACK` must be listed as working, and nothing marked working may be an
effect the parser refuses. A doc that drifts is worse than none, because it is believed.

**Context-sensitivity SHIPPED, in BOTH windows.** The Studio has a `ReferencePanel` down
its right-hand side; the floating `?` window follows the DEVICE's box, which is what was
actually asked for - type `.del` in the device and the floating reference narrows to
`.delay` while you type. That crosses a Chromium context boundary, so it rides a
`helpQuery` state slot: the device view writes the token the caret is on, the help window
reads it. **The wart, named rather than hidden: the slot persists**, so the last word you
typed about is saved with the set. The library has no transient channel between views,
only persisted state, and inventing a wrapper message type for a UI hint was not worth
it.

**Placement is where it stops.** "Put the window above the device, aligned to it" is not
reachable: a device view is drawn inside Live's own device chain, and nothing - not Max,
not the LOM - reports where that is on screen, while `thispatcher window size` wants
absolute screen coordinates. The window is 420 px wide (the device view's own width) so
it at least reads as an extension of it, and Max windows remember where you drag them.

It is a HEURISTIC, not a parser, deliberately: it reads backwards from the caret for the
nearest word. Half-typed code does not parse - and that is exactly when help is wanted -
so a parser would be wrong at the only moment that matters, and would be a second
dialect to keep in step with the engine's (the lesson from `src/lib/mini`). Inside a
call it looks up the FUNCTION rather than the number being typed into it.

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
