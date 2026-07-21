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

## Open Tasks - before releasing v1.0.0

Items are ordered by priority

### 0. FIX - "Play" a track or a clip that contains a strudel device should automatically signal it to start playing

The transport should be automatically triggering the device on. If it's a sequencing device (ie: superdough, midi)
it should automatically start playing, and stop when the clip is disabled.

### 1. FIX - "Show folder" is not functional

**Assessment.** Scope grew back: three devices write files and offer the button
(sample browser downloads, superdough and drums sampler export WAVs). Two rounds of
Live testing on Windows 11 fixed part of it and left one open question:

- FIXED: the wrapper revealed `<device folder>/samples/` for EVERY device. Only the
  sample browser writes there; the exporters write to the device folder itself, so
  Windows raised "cannot find the file" naming a folder that never existed.
- FIXED (unverified): `launchbrowser` with a percent-encoded `file:///C:/...` URL
  reaches the shell - a wrong path raised a real error dialog - but a CORRECT one
  opens nothing and reports nothing. The handler now sends a native backslash path
  on Windows and keeps the `file://` URL on macOS.

**Remaining.** Confirm the native-path form actually opens Explorer in Live, and
that macOS still opens Finder. The Max console logs the exact string sent
(`strudel: reveal ...`), so a silent no-op can be told apart from a bad path. If
`launchbrowser` refuses the native form too, the fallback is a different Max object
for the reveal - [js] cannot shell out on its own.

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

   
### 3. FEAT - minimalist superdough synth

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


## Open Tasks - aiming for v1.1
   
### 4. FEAT - Refactor the Superdough device into the "strudel" device

**The Idea.** The superdough device becomes the main device of this chain and therefore changes its name to just `alienmind-strudel` (dropping the "superdough" moniker). The rest of the devices remain unchanged. This refactor combines two major improvements: replacing the Studio window with a real local `strudel.cc` instance, and integrating `hydra.js` visuals into the main device view.

#### Window Architecture & Roles

1. **Mini Window (Main Device View).** The minimal screen is not enough for writing any code. Instead, it serves as a mini window to represent a minimal visualization and to trigger/open external windows to any code related activity. It will have the minimal buttons we currently have. It will render a  `_scope()` by default (rendering the whole master chain of the superdough). Note: Do not necessarily use `_scope()`, we can create a mini oscillator if necessary.
   - **Secondary Purpose (Hydra Sink):** If the strudel screen has `hydra()` code, the mini window becomes the rendering target of the hydra visuals.
2. **External "Studio" Window.** Becomes a locally served version of the astro app that serves `strudel.cc` (copy/adapt the current design). The hand-rolled editor will never catch up with the real REPL's syntax highlighting, inline docs, and visualisers.

#### Audio Routing & Inter-Window Communication

- Audio is routed from either the main window or the external window, but needs to be performant.
- **CRITICAL CONSTRAINT:** If routing audio from the Studio fundamentally changes how an external window renders audio (so far it was a "subsidiary" window and the main window was the mini window), **DO NOT ALTER THE CURRENT BEHAVIOUR** of m4l-jweb external windows. Instead, add a new feature that allows to open up fully independent external windows, or where the priority is reversed and the mini window becomes a subsidiary.
- **Independent `jweb~` Devices?** Regarding the communication between the two windows, explore if we can make them both independent `jweb~` devices: the first is the full external window, and the second (sink) is just an audio processor with another instance that renders the hydra visuals.
- **One AudioContext:** Must still resolve the "exactly one stream of notes" constraint, ensuring the REPL's scheduler does not conflict with the audio sink.

#### Implementation Details from Previous Spikes

**Serving the REPL:**
- The REPL is an Astro site in the `strudel/` submodule. It must build to a self-contained bundle with no CDN.
- **Bundle size is a risk**: Measure before committing so the `.amxd` does not become unusable.
- **Transport:** The REPL's scheduler has to be driven from our `tick` (Live's clock).

**Hydra Integration:**
- The integration already ships in `strudel/packages/hydra/hydra.mjs`.
- "Audio in" is already solved for superdough since the analyser and sound are on the same side of the bridge.
- **Worker/main split:** The pattern compiles in `engine.worker.js`; hydra and `@strudel/draw` must run on the main thread.
- **Unknowns:** WebGL inside jweb~'s CEF is unverified, as is a 60 fps GPU loop alongside the audio sink.
- **Vendor hydra-synth:** Bundle it and pass `initHydra({ src: <bundled url> })`; never let the unpkg default run for offline support.

#### Suggested Sequence

- **Spike 0 (REPL Bundle):** Build the REPL from `strudel/` as a static offline bundle. Confirm size and offline boot.
- **Spike 1 (WebGL & Hydra):** Test a page in jweb~ that gets a WebGL context and runs hydra while a superdough pattern plays. Watch for clock drift / late events.
- **Spike 2 (Window Architecture):** Test the independent `jweb~` devices vs. standard m4l-jweb window routing. Ensure audio priority and communication can be established without breaking existing `m4l-jweb` behaviour.
- **Then:** Execute the rename to `alienmind-strudel`, replace the Studio window, setup the mini window default scope/hydra sink, and wire the communication.

#### Acceptance

Offline, in Live: The device is renamed to `alienmind-strudel`. The Studio opens the real REPL; evaluating there plays performantly. The mini window acts as a launchpad, visualizer, and hydra sink. The two windows communicate seamlessly, and the `.amxd` is still a size a user will accept.

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
already exists in `fanParamInto`). The master `.adg` maps the Rack's 16 macros
across both devices' dials. Explicitly out of scope: any cross-TRACK routing.

### 10. TEST - verify offline behavior in Live

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
