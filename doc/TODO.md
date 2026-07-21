# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* - patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in `m4l-jweb`'s own [doc/TODO.md](https://github.com/alienmind/m4l-jweb/blob/main/doc/TODO.md), not here.

Ideas tried and abandoned are in [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

Anything finished has been REMOVED from this file rather than left as a done-list -
git history is the record of what shipped. 1.0.0 took the transport follow, the offline
sample cache and the Synth device out of here, all three verified in Live.

The items below were re-assessed after the 0.9.9 jweb~ rewrite (native Web Audio out,
see [ARCHITECTURE.md §2c](ARCHITECTURE.md)). The rewrite changed the ground under
several of them: some got easier, and one became impossible in its original form.

---

## Open Tasks - aiming for v1.1

1.0.0 shipped with the transport follow, the offline sample cache and the Synth device
all verified in Live; those items are gone from this file, as finished work always is.
Two things did NOT come out clean, and they head this list.

### 0. FIXME - Export writes nothing: "could not place save: -1 bytes"

**Seen in Live, 1.0.0, on the Strudel device.** Pressing Export renders and then fails at
the last step with `could not place save: -1 bytes at destination`. `-1` is what the
wrapper reports when it cannot size the destination file at all - so the `.part` was
never placed over the target, not merely placed short.

The save protocol is the library's (`@m4l-jweb/wrapper` core: `save_begin` /
`save_chunk` / `save_end`, then a `file://` GET through [maxurl] to place the verified
`.part`), so the fault may well be upstream rather than here. m4l-jweb 1.0.0 carries a
related fix ("reuse one scratch file for saves so exports stop stranding empty `.part`
files") that landed after this was seen; re-test against it FIRST, before debugging
anything in this repo.

Where to look, in order:
1. Does the `.part` exist next to the device with the right size after `save_end`? If it
   does, the failure is purely the place step.
2. Does the device folder resolve to a real, writable directory (an UNSAVED patcher has
   no folder - `deviceFolder()` returns nothing and the whole path is relative to
   nowhere)?
3. Is the `download` chain present on the device? [maxurl] lives there, and the place is
   a `file://` GET through it. The Strudel device declares it, but the wiring is worth
   confirming rather than assuming.

Everything downstream of Export is blocked on this: the WAV cannot be dragged out, and
the clipboard item below cannot be tested at all, because the button that reveals the
path only appears once something has been written.

### 1. FIXME - the clipboard copy cannot be confirmed, and could not be tested

**Status: unverified, because Export never wrote a file** (item 0). The code is in place
and its failure mode is understood, but nobody has yet seen it work in Live.

What is known, the hard way: `document.execCommand("copy")` **returns true in the device
page and puts nothing on the system clipboard**, and the page cannot detect this -
`navigator.clipboard.readText()` needs a secure context and a device page is `file://`,
so a copy can be claimed but never read back. `src/app/shared/clipboard.ts` therefore
trusts no claim inside jweb: it attempts the copy, then shows the path in a focused,
pre-selected field and treats the browser's own `copy` event as the only confirmation.

The full history of what does NOT work here - `; max launchbrowser` for a reveal, both
clipboard APIs, the false-success trap - is in
[DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

**Remaining:** fix item 0, then verify end to end. If the manual field turns out not to
receive Ctrl+C inside jweb either, the honest conclusion is that a device page cannot
reach the system clipboard at all, and the answer becomes a Max-side one (or none).

   
### 4. FEAT - The local strudel.cc REPL and hydra visuals in the "strudel" device

**The Idea.** The rename this item opened with is DONE (1.0.0): the device is
`alienmind-strudel`. What is left here are the two major improvements it was bundled
with: replacing the Studio window with a real local `strudel.cc` instance, and
integrating `hydra.js` visuals into the main device view.

**The chosen direction: the Studio OWNS the engine and the audio.** The full local
strudel.cc runs unmodified (all its capabilities: its scheduler, its superdough, its
visualisers, hydra) in a window backed by a NEW `jweb~` window primitive. The mini
window types no code at all: it is a launchpad and a visualizer that only channels
audio IN. The two pages are independent Chromium contexts that talk through Max -
which is already m4l-jweb's own model for windows ("two pages, two Chromium
contexts... they talk through Max, exactly as two devices would").

#### Feasibility check (done, against the code as of 0.9.9)

1. **A `jweb~`-backed window is buildable; it is codegen, not physics.** Today
   `applyWindows()` (m4l-jweb `packages/build/src/surface.mjs`) emits a plain
   `[jweb]` in a `[p]` subpatcher, messages only. But Max signals cross subpatcher
   boundaries through `[outlet~]`, and the `webaudio` chain already mixes a
   `jweb~`'s L/R into the device path with `[+~]` (`chains.mjs`, `ctx.audioIn` /
   `setAudioOut`). A new window primitive that emits `[jweb~]` + `[outlet~]` pair
   inside the subpatcher and feeds the same mix point is a contained upstream
   feature. The existing `[jweb]` window primitive stays untouched - two
   primitives, exactly as proposed.
2. **The load-bearing unknown is page LIFECYCLE, not routing.** The window opens
   and closes through `[pcontrol]` (`open` / `wclose`). Whether a `[jweb~]` inside
   a closed subpatcher window (a) loads its page at device load, (b) keeps the
   page - and its AudioContext - RUNNING while the window is closed, and (c) is
   throttled by CEF while hidden, is unverified. If closing the Studio kills or
   suspends the sound, this whole shape dies; that is spike 1, and it runs before
   any REPL work. (A likely mitigation if hidden pages survive but never-opened
   ones do not: auto-open-then-hide once at load.)
3. **"Independent" does not cost the bridge: jweb injects `window.max` into every
   page it loads.** The local strudel.cc does not need to become a React app of
   ours or share code with the mini window. One injected `<script>` (added by our
   site build, not a fork of the app) gets `bindInlet`/`outlet` and can: persist
   the evaluated code to the `code` state slot (so the pattern still SAVES WITH
   THE SET), mirror the code text to the mini window (for its hydra), and receive
   `tick`/`tempo` if we ever sync clocks. Without the shim everything still plays;
   we lose persistence and cross-window awareness only.
4. **One stream of notes holds by construction.** Only the Studio evaluates
   patterns; the mini window has no editor and no engine. Two AudioContexts exist
   (one per page) but only the Studio's reaches the track. The mini window's
   context, if it has one at all, is input-only.
5. **The mini window cannot tap the Studio's AudioContext - audio must be
   CHANNELED IN through Max.** Separate Chromium contexts share nothing. Two
   candidate feeds for the mini scope, cheapest that works wins:
   - **Message-rate analysis:** the device signal path already passes through the
     patcher; `[snapshot~]`/`[peakamp~]` -> `[js]` -> the mini page at 20-30 Hz.
     Enough for a level meter / envelope view; not a real oscilloscope.
   - **`jweb~` audio INPUT:** whether `[jweb~]` has signal INLETS that surface to
     the page (as an input device) is unverified - check the Max 9 reference, do
     not assume. If it does, the mini window becomes a `jweb~` with audio in and
     gets a true scope and audio-reactive hydra for free.
6. **Hydra renders wherever it is evaluated - the mini window as hydra SINK means
   a second hydra instance, not a mirrored canvas.** Pixels cannot cross Chromium
   contexts here (no shared memory, no server). But hydra sketches are generative
   source CODE: the shim mirrors the evaluated text, the mini page runs its own
   vendored hydra-synth on its own canvas, with audio-reactivity fed from finding
   5. The Studio meanwhile shows hydra natively anyway (it is the full app).
7. **The payload gap stands.** Window bundles today are one self-contained HTML
   file base64-embedded in the wrapper `[js]`. A multi-file Astro site needs the
   sidecar-folder delivery either way (below).
8. **The webapp's audio sink IS hackable - verified in the submodule, with
   official seams, no fork needed.** Everything superdough plays funnels through
   `SuperdoughOutput.destinationGain` (one GainNode) into
   `audioContext.destination` (`packages/superdough/superdoughoutput.mjs`), and
   in a `jweb~` page "destination" IS the signal outlets - so routing the whole
   REPL to the track needs NO patching at all. The seams that exist if we want
   them: `setAudioContext(context)` swaps the context before first use
   (`audioContext.mjs`), `setSuperdoughAudioController(newController)` swaps the
   whole output stage (`superdough.mjs`), and
   `getSuperdoughAudioController().output.destinationGain` is the one-line tap
   point for an AnalyserNode. Three shim-level caveats, none structural:
   - **First-click gate.** The REPL arms audio with `initAudioOnFirstClick`
     (waits for a `mousedown`, `useReplContext.jsx`). A window that auto-loads
     hidden gets no click: the shim calls `initAudio()` directly (or dispatches a
     synthetic mousedown) once `window.max` says the device is up.
   - **Output device setting.** `initAudio({ audioDeviceName })` calls
     `setSinkId`, which would steer audio AWAY from the jweb~ outlets. The shim
     pins the REPL's audio-device setting to the default and hides that
     settings row.
   - **Tap completeness.** A couple of paths connect straight to
     `audioContext.destination` bypassing `destinationGain` (`dspworklet.mjs`,
     muted timing nodes in `helpers.mjs`). Irrelevant for the track (same
     destination), only means a destinationGain analyser misses dspworklet
     output - fine for a scope, worth knowing.

#### Fallback (recorded, not chosen)

If spike 1 fails - the windowed `jweb~` page dies or stalls when closed/hidden -
the fallback is the editor-only Studio: engine and audio stay in the device view's
`jweb~` exactly as today, the REPL is patched into a pure editor whose evaluate
writes `code` + an `evalRequest` nonce, and the mini window keeps the scope. Less
of strudel.cc survives (its own visualisers would show nothing), which is why it
is the fallback and not the plan.

#### Concrete changes - this repo

- **Rename - DONE (1.0.0), ahead of the rest of this item.** `src/app/superdough/`
  is `src/app/strudel/`, the device is `alienmind-strudel`, the wrapper mode is
  `strudel`, and the docs follow. Every param and state slot NAME is unchanged
  (`play`, `s1..s8`, `code`, `transport`). The old `.amxd` was NOT kept: a Live set
  embeds its own copy of a device, so an existing set keeps working untouched and
  only a re-add picks up the new name - that is the note in the README, in place of
  a deprecated duplicate nobody would install.
- **`scripts/build-repl.mjs`.** Builds the submodule's Astro site into a static
  offline bundle: strip CDN/network references, vendor `hydra-synth` (never let
  the unpkg default run), fix asset paths for `file://`, inject the m4l shim
  script (finding 3). The shim is additive - the app is NOT patched into an
  editor; its engine stays whole. Overlay/patch files over the submodule, never a
  vendored copy.
- **Studio window swap.** `surface.ts` `studio` becomes the new upstream
  `jweb~` + `site:` window pointing at the built REPL. The hand-rolled
  `shared/StudioWindow.tsx` editor and the online-redirect `strudel` window are
  deleted once parity is confirmed.
- **Mini window rebuild.** `PatternEditor` goes; in its place a canvas: level/
  scope view fed per finding 5, swapped for the local hydra instance when the
  mirrored code contains hydra calls. Header keeps the icon buttons; Studio
  button promoted from About > Advanced to the main row; Run/Stop become remote
  controls that message the Studio (via the shim) rather than a local engine.
- **Engine retirement in the device page.** `useSuperdoughRender`, the worker
  round-trip, the superdough boot and the sample maps LEAVE the mini page (the
  Studio owns all of it). Decide what happens to Export (WAV bounce) - it needs
  an engine, so it either moves behind the shim into the Studio page or is cut
  from the mini window.
- **Knobs and transport.** `s1..s8` dials and the native Play/Stop must now reach
  the Studio's engine: wrapper already fans params to every view; the shim maps
  them onto the REPL (sliders -> pattern `slider()` bindings, play/stop ->
  evaluate/hush). This is the piece with real design left - scope it in spike 4.

#### Concrete changes - upstream m4l-jweb

- **`audioWindow()` (or `window({ audio: true })`)** - a second window primitive
  emitting `[jweb~]` in the subpatcher with an `[outlet~]` pair, mixed into the
  device audio path at the same `[+~]` point the `webaudio` chain uses. The
  existing `[jweb]` primitive is untouched - the CRITICAL CONSTRAINT is honoured
  by adding, not altering.
- **Lifecycle guarantee.** Whatever spike 1 finds becomes codegen: ensure the
  window's page is loaded at device load and keeps running while hidden
  (auto-open-then-hide, `[pcontrol]` flags, or a documented "must stay open"
  limitation if nothing works).
- **`window({ site: "<dir>" })`** - window content from a prebuilt static
  directory instead of an `entry` component (mutually exclusive with `entry`);
  `build-ui.mjs` copies instead of running vite.
- **Sidecar payload delivery.** Base64-in-`[js]` will not scale to a site (tens
  of MB). Release artifact becomes `.amxd` + sibling folder; the wrapper checks
  it exists, reports a clear error if not, and sends
  `url file:///<folder>/index.html` (cache-busted) through
  `messnamed("window-read-<id>", ...)` as today.
- **Optional: audio-in plumbing** for the mini scope if `jweb~` proves to have
  signal inlets (finding 5); otherwise a `[snapshot~]`-to-messages analysis tap
  as a small chain.

#### Spikes (in order; each can kill or reshape the item)

- **Spike 0 (REPL bundle).** `astro build` the submodule, open from `file://`
  with the network OFF - plain browser first, then a scratch jweb window. Expect
  root-absolute asset paths to need a `base` config or rewrite pass; a service
  worker or wasm under `file://` are the likely hard failures. Measure size.
  Gate: boots offline; size acceptable as a sidecar folder.
- **Spike 1 (windowed jweb~ lifecycle - THE decisive one).** Scratch device: a
  `[p]` window holding `[jweb~]` + `[outlet~]` wired to the track, page playing a
  test tone. Does audio reach the track? Does it survive `wclose`? Does it start
  without the window ever being opened? CPU while hidden? Gate: sound flows and
  survives the window closing - else fall back to the editor-only shape.
- **Spike 2 (REPL in the audio window).** The spike 0 bundle inside the spike 1
  window: evaluate a pattern in the real REPL, hear it on the track. Watch CPU
  and scheduling under a hidden window. Gate: performance comparable to the
  device-view engine today.
- **Spike 3 (audio into the mini window).** Establish the scope feed: check the
  `jweb~` reference for signal inlets; if absent, prototype the
  `[snapshot~]`/`[peakamp~]` message tap. Also first hydra render in a jweb page
  (WebGL in CEF still unverified). Gate: a moving visual in the mini window
  driven by the Studio's sound.
- **Spike 4 (shim and controls).** The injected script: `code` slot persistence
  on eval, code mirroring to the mini page, Play/Stop and `s1..s8` reaching the
  REPL. Gate: pattern saves with the set; knobs still move the sound.
- **Then:** the rename, the mini window rebuild, delete the hand-rolled editor
  and the redirect window.

#### Acceptance

Offline, in Live: the device is `alienmind-strudel`, and old sets keep their knob
and code values. The Studio opens the real local strudel.cc with all its
capabilities; evaluating there IS the track's audio, and closing the Studio window
does not stop the sound. The mini window types no code: it launches the windows,
shows a live visual of the Studio's audio, and runs hydra when the pattern asks
for it. The pattern still saves with the set. The `.amxd` stays small; the sidecar
folder is documented as part of the install. m4l-jweb's existing `[jweb]` window
behaviour is unchanged.

### 5. FEAT - rework native knobs

# 5.1 - Knob placement

All knobs should placed in two rows, down below the play/stop button, hidden in the secondary knob screen
behind the jweb~ device. Currently the layout is a mess, with knobs misaligned.

# 5.2 - Explicit knob binder

Sliders already bind automatically, in source order, to the S1..S8 pool. That is right
by default and wrong in two cases: more than eight sliders (the ninth silently gets no
knob), and two patterns that fight over the order after an edit.

**Preliminary design.** A small popover per slider: "knob S1..S8 / unbound", persisted
in the device state slot (`useStateSync`) keyed by the slider's source-order index.
Auto-bind stays the default for the first eight unbound sliders, so zero-config
behaviour does not change. Only worth building if the eight-slider ceiling is actually
hit in use.


# 5.3 -Native knobs carry no NAME and no SCALE

Split out of the slider work (item 4), which is otherwise done: the sliders exist, and
turning a native knob does move the pattern. What the dials do NOT carry is any sense
of WHAT they are or WHAT RANGE they span. In Live they all read `S1..S8`, all travel
0..1, and a knob at 0.5 says nothing about whether that is 600 Hz or 0.5 gain.

Two separate problems that happen to land on the same object.

**1. Naming - partly a Max limit, partly ours.**

The device already sends `knob_label <index> <name>` after each compile
(`shared/useSliderKnobs.ts`), and the wrapper writes `_parameter_shortname` on
`param-s<n>` (`wrapper/device.ts`). The label is derived from the method wrapping the
call, so `.lpf(slider(500,100,1000))` should give a dial called `lpf`.

Measured in Live previously: **the rename takes on the DEVICE PANEL but does not reach
the Rack macro picker or Live's parameter registry**, which keep showing `S1..S8`. A
frozen device cannot rename a parameter there. So a full fix may not exist - but before
concluding that, confirm what is actually happening now:

- Does the Max console print `knob_label ... 'S1' -> 'lpf'`, or `(rename did NOT take)`,
  or nothing at all? Nothing at all means the message is not arriving and this is our
  bug, not Max's.
- `getnamed("param-s<n>")` returning null would mean the varname convention changed.
- If the panel rename works and only the registry lags, the honest answer is to document
  it in help and stop - not to keep spiking a frozen-device limit.

**2. Scale - ours, and fixable.**

The dials are declared 0..1 and the slider's real min..max is applied in the page
(`useSliderKnobs` normalizes on the way in and out). So the dial is honest about its own
travel and useless about the pattern's: `slider(500, 100, 1000)` shows `0.44`, not
`500`.

A previous spike set `_parameter_range` at runtime and was **REVERTED**: it takes, but
it also shifts the value domain the dial reports back, which broke the normalized math
and left the knob stuck at its minimum. Do not simply retry it - if it is attempted
again, the acceptance is that a dial at its midpoint reads the slider's midpoint IN REAL
UNITS *and* that dragging it still lands the right value in the pattern.

Cheaper alternatives worth costing first:
- **Unit in the name.** Fold the range into the label the rename already sends
  (`lpf 100-1k`). Costs nothing beyond what exists, and dies with problem 1 if the
  rename does not take.
- **Show it in the web row.** `SliderRow` already prints the real value next to each
  slider; make that the place range is communicated, and treat the native dial as a
  control surface rather than a display. This is probably the right answer.

**Acceptance:** a user turning S1 on Push can tell which parameter they are moving and
roughly where in its range they are - by whatever route proves possible.


### 6. FEAT - native MIDI input (`midiIn`/`kb()`) and MIDI output

**Assessment.** Valid, and cheaper than when written: the `midiin` chain already
exists (the Drums Sampler uses it - `onNote()` delivers the track's MIDI to the
page), and the note sink already turns haps into MIDI-shaped events for the midi
devices. What is missing is (in) feeding live notes into the pattern scope and
(out) letting the SUPERDOUGH device emit MIDI alongside audio.

**Preliminary design.**
- **In:** add `midiin` to the superdough manifest; `onNote()` forwards
  `{t:'midi', pitch, velocity}` to the worker; the worker keeps a small held-notes
  set and publishes strudel's expected accessors (`kb()`, `midiIn` stream) into the
  pattern scope before compile. Latency is one tick (fine for chords/drones, not
  for playing leads - say so in help).
- **Out:** compile-time split of the pattern's haps: haps carrying `.midichan()`
  (or a `.midi()` tag) route to the existing note sink -> `midiout` chain (add the
  chain to the manifest), everything else to the superdough sink. Channel comes
  from `.midichan(n)`, so one pattern sequences external gear and plays superdough
  at once. The two sinks already coexist in the worker protocol; this is a per-hap
  dispatch, not a new engine mode.

  NOTE: For this one, I would need examples on how to use (concrete strudel patterns) for midi routing from within the device

### 8. FEAT - orbit() support (multichannel out)

**Assessment.** Valid, UNVERIFIED at its foundation. superdough can already render
orbits to separate channel pairs (`initAudio({ multiChannelOrbits: true })` exists),
so the whole question is whether jweb~ carries more than 2 signal outlets. The
0.9.9 template uses the stereo default. If jweb~ has a channel-count attribute
(check its Max 9 reference page - do NOT assume), the rest is plumbing; if not,
this needs a different transport (worklet -> shared buffer -> [mc.] tricks) and
stops being worth it.

**Preliminary design (contingent on the spike).** SPIKE FIRST: a bare Max patcher
with jweb~ @channels (or whatever the attribute is) and a test page playing on
channels 3/4; scope~ the outlets. If it passes: manifest grows `orbits: N`, the
build emits jweb~ with 2N channels and the `webaudio` chain fans pairs to
`[send~ <device-scope>-orbit-M]`; a Rack preset catches them on parallel chains.
`duck()` then works inside superdough with no Max help at all (it is orbit-level
DSP in the page). If the spike fails: park in the drawer with the finding.

### 9. FEAT - cross-device coordination in the Rack

**Assessment.** Valid, big, and last for a reason: it depends on nothing above but
informs its value. Two separable halves that the original text mixed: (a) a
track-scoped message channel between our devices, (b) the product feature on top
(one expression spanning sequencer + fx, `.lpf()` delegated to the fx device's
native dials instead of baked into the page's audio). Half of (b)'s old rationale
died with the WAV pipeline - effects are no longer "baked into the render", they
are live - so the remaining value is: native dials/Push/automation on effects while
superdough only sequences. Re-validate that this is still wanted before building.

**Preliminary design (sketch, revisit after 8).** Channel: `[send]`/`[receive]`
with a name derived from the track (the wrapper reads its own track id via LOM at
init - ids are session-stable, and re-derived on load, never persisted). Protocol:
the superdough device broadcasts per-stage effect values (`fx cutoff 800`), the fx
device consumes them exactly like its app's own `set_<id>` writes (the fan-in
already exists in `fanParamInto`). A Rack the user builds maps its 16 macros
across both devices' dials. Explicitly out of scope: any cross-TRACK routing.

### 10. TEST - verify offline behavior in Live

**Assessment.** Partly done. The persistent page-side cache shipped in 1.0.0 and was
verified in Live: a sample played once online still plays after a restart with the
network off (ARCHITECTURE §4i). What has NOT been swept is the rest of the checklist -
the timeouts and the UI's behaviour while a fetch is failing.

**Checklist (network OFF in Live):**
- **Responsiveness**: UI thread not blocked (list/search must not stutter).
- **Catalog timeout**: fails within ~12 s with a clear message.
- **Download timeout**: fetches fail within ~30 s, row/status unsticks from "Fetching...".
- **Synths offline**: superdough synth patterns play with no network at all.
- **Session cache**: a sound already auditioned this session still plays.
- **Persistent cache (DONE)**: previously played samples survive a Live restart.
