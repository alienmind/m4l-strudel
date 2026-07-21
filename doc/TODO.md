# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* - patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in `m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

Ideas tried and abandoned are in [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

Every item below was re-assessed after the 0.9.9 jweb~ rewrite (native Web Audio out,
see [ARCHITECTURE.md §2c](ARCHITECTURE.md)). The rewrite changed the ground under
several of them: some got easier, and one became impossible in its original form.

Anything finished has been REMOVED from this file rather than left as a done-list -
git history is the record of what shipped. What remains of the slider work, for
instance, is item 4 (choosing a binding) and item 11 (the dials' name and scale);
the parts that work are simply gone from here.

---

## Open Tasks

**Item 3 is the priority.** The rest run roughly least-difficult to most.

### 1. FIX - "Show folder" is not functional (sample browser)

**Assessment.** Still valid, scope shrank: the Drums Sampler no longer downloads
files at all (samples decode in-page since 0.9.9), so its button is gone. Only the
sample browser has a folder to reveal (`saveToFile` still writes the drag-out file).
The button emits `reveal_folder`; the wrapper handler behind it never worked in Live.

**Preliminary design.** Do the reveal wrapper-side with `;max launchbrowser
file:///<device folder>` - a folder `file://` URL opens Explorer/Finder, and
`launchbrowser` is a documented `max` message that needs no [shell] external and
survives freezing. Fallback if a frozen device refuses it: [js] `max.launchbrowser()`
call. Verify on Windows AND macOS before closing; the path must be URI-encoded (Live
library paths contain spaces).

### 2. FEAT - offline sample cache for Superdough

**Assessment.** Still needed, and the shape changed. There is no render step any
more: superdough fetches samples at PLAY time, so no network means silence for
`s()` patterns (synths are unaffected). Chromium still blocks `fetch()` of
`file://`, so "read the file back from disk" needs help. But jweb's Chromium also
has page-side persistent storage, which the old design ignored - if it survives a
Live restart, no bridge API is needed at all.

**Preliminary design.** Two stages, cheapest first:
1. **Page-side cache (probe first).** Wrap superdough's sample loading in a
   CacheStorage/IndexedDB layer keyed by URL: on fetch success store the bytes, on
   fetch failure serve from the cache. SPIKE: confirm jweb's CEF profile persists
   IndexedDB across Live sessions and device reloads (open device, store a value,
   restart Live, read it). If it persists, done - and the Drums Sampler gets the
   same cache for free.
2. **Bridge `readFile(path) -> ArrayBuffer`** only if storage does NOT persist:
   wrapper-side [js] File object reads the bytes, base64-chunks them over the
   bridge (the mirror of `saveToFile`'s save_chunk protocol). Slower and more code;
   build it only when stage 1 fails the spike.

   
### 3. FEAT (PRIORITY, PLANNED NOT BUILT) - replace the Studio window with a real local strudel.cc

**The idea.** The "Full Studio" window is a bigger textarea over the same `code` slot. It
is a worse version of something that already exists and that we already ship: the actual
**strudel.cc REPL**, which lives in the `strudel/` submodule. Rather than maintain a
hand-rolled editor forever, serve the real REPL inside the window and route its audio out
through `[jweb~]` like everything else. The device view stays the small pattern box; the
Studio becomes the full site - highlighting, docs, visualisations, the reference, the lot.

**Also in scope:** the Studio button moves to the MAIN SCREEN. It is currently buried in
About > Advanced, which is where set-once affordances belong - and this stops being one
the moment it is the primary way to write a pattern.

#### Why this is worth it

- The hand-rolled editor will never catch up. strudel.cc has syntax highlighting tied to
  the parser, inline docs, the pattern visualisers, error positions, autocompletion.
- We already carry the source. The submodule is pinned and bundled; this is packaging
  work, not a new dependency.
- It removes a whole class of divergence bugs: today the device's editor and strudel.cc
  can disagree about what a pattern means, and the user has no way to tell which is right.

#### The hard parts, honestly

1. **Serving it offline, inside a frozen `.amxd`.** The REPL is an Astro site. It has to
   build to a fully self-contained bundle with no CDN, no network fetch at boot, and no
   absolute paths, then be embedded as a window payload the way device UIs already are
   (base64 in `wrapper.js`, extracted on load). **Bundle size is the first risk**: the
   superdough device is already ~2.9 MB and the REPL is much larger. Measure before
   committing - if the packed `.amxd` becomes unusable, this dies here.
2. **One AudioContext, not two.** The REPL boots its own superdough and its own audio
   context. A window is a SEPARATE `[jweb]` page, so it cannot share the device's
   context - and a second context in a second page does NOT reach `[jweb~]`'s signal
   outlets. Two candidate routes, and this is the decision the spike must make:
   - **(a) The window is an EDITOR ONLY.** It never makes sound; on evaluate it sends the
     code to the device view over the existing `code` state slot, and the device (which
     owns the audio) plays it. Keeps exactly one engine and one audio path, which is the
     rule the current Studio already follows. The REPL must be patched to suppress its own
     scheduler - that is the real work.
   - **(b) The window OWNS the audio,** and the device view becomes a remote control.
     Requires the window's page to be the one wired to `[jweb~]`, which the window
     codegen does not do today (windows carry messages, not signal). Bigger, and it
     inverts the device's architecture.
   Start by costing (a). It preserves the "exactly ONE stream of notes however many views
   are open" invariant that the current Studio was built around.
3. **Transport.** strudel.cc has its own clock and its own play/stop. Live owns both here.
   Under (a) this is free - the device keeps scheduling. Under (b) the REPL's scheduler
   has to be driven from our `tick`, which is a fork of its clock.
4. **Keeping the fork maintainable.** Any patching of the REPL has to live as a small,
   documented build step over the submodule, not as a vendored copy that can never be
   updated.

#### Suggested sequence

- **Spike 0 (half a day, can fail):** build the REPL from `strudel/` as a static offline
  bundle. Open it from `file://` with the network off. Does it boot, and how big is it?
  If it needs the network or blows the size budget, park the whole item with the finding.
- **Spike 1:** load that bundle in a `useWindow` window in a scratch device. Confirm it
  renders and that our bridge still reaches it.
- **Spike 2:** suppress the REPL's own audio/scheduler and make evaluate write the `code`
  state slot instead. Confirm the device view plays what the window evaluates, and that
  there is still exactly ONE stream of notes.
- **Then:** replace `StudioWindow.tsx` with it, move the Studio button to the main screen
  of the pattern devices, and delete the hand-rolled editor.

#### Acceptance

Offline, in Live: the Studio opens the real REPL; typing and evaluating there plays
through the track; the device view and the window agree about the pattern; closing and
reopening the set restores it; and the `.amxd` is still a size a user will accept.

### 4. FEAT - explicit knob binder

Sliders already bind automatically, in source order, to the S1..S8 pool. That is right
by default and wrong in two cases: more than eight sliders (the ninth silently gets no
knob), and two patterns that fight over the order after an edit.

**Preliminary design.** A small popover per slider: "knob S1..S8 / unbound", persisted
in the device state slot (`useStateSync`) keyed by the slider's source-order index.
Auto-bind stays the default for the first eight unbound sliders, so zero-config
behaviour does not change. Only worth building if the eight-slider ceiling is actually
hit in use.

### 5. FEAT - native MIDI input (`midiIn`/`kb()`) and MIDI output

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

### 6. FEAT - minimalist superdough synth

**Assessment.** Went from "needs design" to "small": with live superdough in the
page, a MIDI-driven synth is `onNote -> superdough(value, now)` - no timeline, no
transport, no worker. The design questions left are product ones (how the sound is
specified, how much UI).

**Preliminary design.** New device `alienmind-strudel-synth` (instrument, chains
`webaudio` + `midiin`): a one-line sound spec (`s("sawtooth").lpf(800).room(.3)` -
a superdough VALUE, not a pattern), parsed once at eval into a control object; each
incoming note plays it with `note` and `velocity` merged in, held notes tracked for
release. The fx knobs pattern from the fx device applies (native dials writing into
the value). It reuses the sample-map registration the Superdough device already does.

### 7. FEAT - orbit() support (multichannel out)

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

### 8. FEAT - cross-device coordination in the Rack

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
already exists in `fanParamInto`). The master `.adg` maps the Rack's 16 macros
across both devices' dials. Explicitly out of scope: any cross-TRACK routing.

### 9. TEST - verify offline behavior in Live

**Assessment.** Still valid; the checklist shifts with the new architecture.
Network use is now: catalog fetches (browser + sampler), page-side sample fetches
(browser preview, sampler hits, superdough `s()` patterns). Disk cache
only exists for the browser's saved files; the sampler's cache is in-memory
(per-session) until item 2's persistent cache lands.

**Checklist (network OFF in Live):**
- **Responsiveness**: UI thread not blocked (list/search must not stutter).
- **Catalog timeout**: fails within ~12 s with a clear message.
- **Download timeout**: fetches fail within ~30 s, row/status unsticks from "Fetching...".
- **Synths offline**: superdough synth patterns play with no network at all.
- **Session cache**: a sound already auditioned this session still plays.
- **After item 2**: previously downloaded samples play across a Live restart.

### 10. FEAT - hydra.js visuals (Code screen + View screen)

**Assessment.** Wanted, feasible, and CHEAPER than the framing suggests, because the
audio-input problem the idea starts from mostly dissolves once the pieces are traced.

- **The integration already ships with us.** `strudel/packages/hydra/hydra.mjs` is 50
  lines: `initHydra(options)` creates the `hydra-canvas` via `@strudel/draw`'s
  `getDrawContext()`, loads hydra-synth, and (with `feedStrudel`) hides the strudel
  draw canvas and binds it as hydra source `s0`. `H(p)` is
  `reify(p).queryArc(getTime(), getTime())[0].value` - a strudel pattern sampled at the
  current cycle, used as a hydra parameter. Deps are `@strudel/draw` + `hydra-synth`.
- **The example is not mic-reactive.** `initHydra` forces `detectAudio: false`, so
  hydra's own `a.fft` (Meyda over getUserMedia) is off. The reactivity in the sample
  code comes from `all(x => x.fft(4).scope(...))`, which is `@strudel/draw` painting
  strudel's OWN analyser onto the draw canvas, and `feedStrudel: 1` then feeds that
  canvas into hydra as `s0`. The analyser is superdough's
  (`getAnalyserById`, superdough.mjs:383), wired per voice when a hap carries the
  `analyze` control (superdough.mjs:991).
- **So "audio in" is already solved for the superdough device, and only there.** That
  device's superdough runs in the PAGE (`useSuperdoughRender.ts`), so the analyser and
  the sound are on the same side of the bridge; nothing needs to enter jweb~. A
  SEPARATE audio-fx device is the hard version: `webaudioChain` (m4l-jweb
  `packages/build/src/chains.mjs`) only sums jweb~'s outlets 0/1 INTO the track, and
  whether jweb~ has a signal INLET is unverified (do not assume - same discipline as
  item 7). Without one, the page can never see another track's audio.
- **The real blocker is the worker/main split.** The pattern compiles and is queried in
  `engine.worker.js`; hydra, `@strudel/draw` and WebGL are DOM/canvas and must run on
  the main thread. The worker deliberately stubs the visual controls as plain params
  "without pulling @strudel/draw (canvas) into the bundle" (`engine.mjs` header). Two
  halves separate cleanly: the ANALYSER half already works (the `analyze` control rides
  along inside `ev.value` to the page's superdough), the DRAWING and CLOCK half does
  not exist. `getTime()` throws until something calls `setTime()`
  (`@strudel/core/schedulerState.mjs`), and nothing on the main thread does.
- **Two more unknowns worth naming.** (a) WebGL inside jweb~'s CEF is unverified. (b)
  hydra runs a `requestAnimationFrame` loop on the same main thread as the superdough
  sink, which ALREADY logs late events and clock drift; a 60 fps GPU loop is a
  plausible way to make that worse. (c) `initHydra` defaults `src` to
  `https://unpkg.com/hydra-synth` - a live CDN import, which is silence in an offline
  Live session (item 2's world).

**Preliminary design.** Ship it INSIDE the superdough device first, as a second screen,
not as a new device. No new chain, no new audio path, and the analyser is already there.

1. **SPIKE FIRST (two questions, one patcher).** A test page in jweb~ that (a) gets a
   WebGL context and runs `osc().out()`, and (b) does it while a superdough pattern
   plays, watching the existing `[superdough-sink] N late events` warning for a
   regression. If WebGL is absent or the drift warning explodes, park in the drawer
   with the finding and stop - everything below depends on this.
2. **Vendor hydra-synth.** Bundle it and pass `initHydra({ src: <bundled url>,
   feedStrudel: 1, pixelRatio: 1 })`; never let the unpkg default run. Measure the dist
   growth first - hydra-synth is not small and every device instance loads the bundle.
3. **Main-thread visual scope.** A second, page-side `bootScope()` variant registering
   core+mini+hydra+draw (the worker keeps its canvas-free scope untouched), plus
   `setTime(() => cycle)` and `setCpsFunc()` fed from the transport ticks the worker
   already publishes, so `H()` is locked to the Live clock rather than a free-running
   one.
4. **Drawing `.fft()` / `.scope()`.** Preferred: a small main-thread painter that reads
   `getAnalyzerData(type, id)` in a rAF and draws onto the draw canvas, with NO pattern
   involved - the analyser ids are stable and this avoids compiling the pattern twice.
   Fall back to a second, audio-less main-thread eval of the same pattern (for its
   `onPaint` callbacks only) if per-pattern painting turns out to be needed.
5. **UI.** Code screen / View screen toggle in the superdough App. Hydra text lives in
   its OWN `useStateSync` slot, separate from the pattern text, and evals separately:
   a broken visual must never block audio, so hydra errors go to their own status line.
   `clearHydra()` on stop and on device close. Note the Live device view is short - the
   View screen is only really usable in the floating window; say so in help rather than
   fighting it.
6. **Only then, the standalone device.** `alienmind-strudel-hydra`, type "audio", is a
   follow-up that exists to react to audio the page does not make. It needs the jweb~
   signal-inlet spike; if that fails, the fallback is Max-side band analysis
   ([fffb~] + [peakamp~] banged at ~30 Hz) sent over the bridge as a short list and
   installed as a synthetic `a.fft` array. Hydra reads 4 bins by default, so the
   message path is cheap - the doubt is about jweb~, not bandwidth.

### 11. FIX - the native knobs carry no NAME and no SCALE

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
