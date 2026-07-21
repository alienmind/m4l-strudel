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

### 1. VERIFY - "Copy folder path" replaced "Show folder"

**Why the reveal was dropped.** `; max launchbrowser <folder>` is the only reveal Max
offers, and three rounds of testing in Live on Windows 11 showed it does not work:
a percent-encoded `file:///C:/...` URL reaches the shell (a WRONG path raised a real
"cannot find the file" dialog naming it) but a correct one opens nothing and reports
nothing, and a native backslash path fared no better. [js] cannot shell out, so there
was no third form to try. The wrapper handler is gone.

**What ships instead.** The three file-writing devices (sample browser, superdough,
drums sampler) copy the folder path to the clipboard for pasting into Explorer/Finder
(`src/app/shared/clipboard.ts`). The page already knows the path - the wrapper sends
`device_folder` at ui_ready - so no Max message is involved at all.

**Remaining.** Confirm the copy actually lands on the system clipboard in Live. The
page is loaded from `file://`, which is not a secure context, so `navigator.clipboard`
is likely absent or rejects; the implementation therefore tries
`document.execCommand("copy")` FIRST and keeps the Promise API as the fallback. The
status line says `Path copied: <path>` on success and shows the path anyway on
failure, so the path is never unreachable even if both mechanisms are blocked.

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

**The Idea.** The superdough device becomes the main device of this chain and therefore
changes its name to just `alienmind-strudel` (dropping the "superdough" moniker). The
rest of the devices remain unchanged. This refactor combines two major improvements:
replacing the Studio window with a real local `strudel.cc` instance, and integrating
`hydra.js` visuals into the main device view.

#### Feasibility check (done, against the code as of 0.9.9)

The window architecture questions have answers in the m4l-jweb source; they are not
open design space:

1. **A floating window can never own the track's audio.** `applyWindows()`
   (m4l-jweb `packages/build/src/surface.mjs`) emits a plain `[jweb]` inside a
   `[p]` subpatcher, wired for MESSAGES only - there is no signal path, and a
   `[jweb]` page's Web Audio goes to the SYSTEM output device, not to the track
   (ARCHITECTURE.md: "[jweb] can not put audio on the track; [jweb~] can"). So the
   CRITICAL CONSTRAINT resolves itself: the device view's `jweb~` page keeps the
   engine and the audio, the Studio window is an editor/controller, and m4l-jweb's
   external-window behaviour is not touched at all. This is route (a) from the
   pre-merge item, now the ONLY route rather than a candidate.
2. **Window-to-device communication already exists.** `useStateSync` slots fan out
   to every open view (`broadcastState` in the wrapper), and the current Studio
   already shares `code` this way. The REPL window needs the same slot plus an
   eval trigger - no new bridge machinery upstream.
3. **The hydra sink and the scope belong in the device view, and that is free.**
   The mini window IS the `jweb~` page that owns superdough's AudioContext, so an
   AnalyserNode and hydra's audio-reactive input read the real output directly.
   No audio data ever crosses a window boundary.
4. **"Both windows as independent jweb~ devices" contradicts one-AudioContext by
   construction.** Two `jweb~` boxes are two Chromium pages with two contexts,
   whatever patcher they sit in. The closest legal shape is one audio-owning
   device plus a pure-editor device over `[send]`/`[receive]` (item 9's channel) -
   which is the same editor/engine split with extra latency and a second `.amxd`
   to install. Downgraded to a fallback spike, entered only if hosting the REPL in
   a window fails outright.
5. **The real upstream gap is payload shape, not audio.** Window bundles today are
   ONE self-contained HTML file, base64-embedded in the wrapper `[js]` and
   self-extracted next to the `.amxd`. The REPL is a multi-file Astro site and
   will not fit that mechanism; serving it is the one m4l-jweb feature this item
   needs (below).

#### Target architecture

- **Engine and audio: unchanged.** Pattern compiles in `engine.worker.js`, the
  superdough sink in the device page schedules against the anchored audio clock
  (`useSuperdoughRender`), `jweb~` carries the output. Exactly one stream of notes
  regardless of how many views are open. Live's transport keeps driving the
  scheduler through `tick`; the REPL's own clock is suppressed, not bridged.
- **Mini window (device view).** Header keeps the current icon buttons, plus
  Studio promoted from About > Advanced to the main row. The editor area becomes a
  canvas: an oscilloscope on superdough's master output by default (an
  AnalyserNode tap, drawn with requestAnimationFrame - our own mini scope, not
  strudel's `_scope()`, which is coupled to the REPL's draw context). When the
  evaluated pattern uses hydra, the same canvas becomes hydra's render target and
  the scope stands down until the next non-hydra eval.
- **Studio window.** The strudel.cc Astro app, built from the `strudel/`
  submodule, served locally, patched into an editor: its audio boot and scheduler
  are disabled, and evaluate writes the shared `code` slot and bumps an
  `evalRequest` state slot; the device page picks that up and runs the same path
  as the local Run button. Syntax highlighting, inline docs, autocompletion and
  the pattern visualisers come with the site; sound always comes from the one
  engine.

#### Concrete changes - this repo

- **Rename.** `src/app/superdough/` -> `src/app/strudel/`, device name
  `alienmind-strudel` in the build's device list, docs, README, `.adg` presets.
  Keep every param and state slot NAME as is (`play`, `s1..s8`, `code`,
  `transport`) so values saved in old sets still land after the swap. A Live set
  references the device by FILE name, so ship the old `.amxd` one release longer
  with a deprecation note rather than breaking sets silently.
- **`scripts/build-repl.mjs`.** Builds the submodule's Astro site into a static
  offline bundle, then runs the patch pass: strip every CDN/network reference,
  vendor `hydra-synth` (never let the unpkg default run), inject a small "m4l
  shim" module that disables the REPL's audio init, rewires evaluate to the
  bridge, and hides or repurposes its transport UI. Patches live as a documented
  overlay (patch files or a build plugin over the submodule), never as a vendored
  copy that can never be updated.
- **Studio window swap.** `surface.ts` `studio` window points at the built site
  (via the upstream `site:` window kind below). `shared/StudioWindow.tsx` (the
  hand-rolled editor) is deleted once the REPL reaches parity; the `strudel`
  window (the online strudel.cc redirect) becomes redundant and goes too.
- **Eval trigger.** New state slot `evalRequest` (a nonce); `useStrudelEngine`
  observes it and, on change, takes the current `code` and runs - identical to
  pressing Run locally. One slot, no new selectors.
- **Mini scope.** `webaudio.ts` (or superdough's output gain) exposes a master
  tap; a small `<Scope>` component replaces `PatternEditor` in the device view.
  Decide during build whether a read-only one-line pattern display stays (product
  call, cheap either way).
- **Hydra sink.** Vendor `strudel/packages/hydra/hydra.mjs` + `hydra-synth` into
  the device bundle; after each eval, if the pattern used hydra, call
  `initHydra({ src: <bundled url> })` against the device canvas. Hydra and
  `@strudel/draw` run on the main thread; the pattern still compiles in the
  worker - that split already holds today.

#### Concrete changes - upstream m4l-jweb

- **`window({ site: "<dir>" })`** - a window whose content is a prebuilt static
  directory instead of an `entry` component. `site` and `entry` are mutually
  exclusive. `build-ui.mjs` skips vite for site windows and copies the directory
  to `dist/ui/<device>/<winId>/`.
- **Sidecar payload delivery.** Base64-in-`[js]` will not scale to a whole site
  (the device view alone is around a megabyte; the REPL will be tens). The
  release artifact for a device with a `site:` window becomes the `.amxd` plus a
  sibling folder; the wrapper checks the folder exists at load, reports a clear
  error if it does not, and sends `url file:///<folder>/index.html` (with the
  usual cache-buster) through `messnamed("window-read-<id>", ...)` exactly as it
  does for extracted single-file windows today.
- **Nothing else.** No `jweb~` in windows, no new audio routing, no change to how
  existing external windows behave. That is the constraint, honoured by scoping
  the feature to payload delivery only.

#### Spikes (in order; each can kill or reshape the item)

- **Spike 0 (REPL bundle).** `astro build` the submodule, open it from `file://`
  with the network OFF - first in a plain browser, then in a scratch jweb window.
  Astro emits root-absolute asset paths by default, so expect a `base` config or
  a relative-links pass; a service worker or wasm under `file://` are the likely
  hard failures. Measure total size. Gate: boots offline; size is acceptable as a
  sidecar folder (the `.amxd` itself stays small under the sidecar plan).
- **Spike 1 (WebGL and hydra in jweb~).** In the DEVICE view page, get a WebGL
  context and run a hydra sketch while a superdough pattern plays. WebGL inside
  jweb~'s CEF is unverified, as is a 60 fps GPU loop beside the audio sink. The
  sink's re-anchor counter already logs clock trouble - watch it. Gate: no
  audible degradation, usable fps.
- **Spike 2 (editor takeover).** Patch the REPL's evaluate to write
  `code` + `evalRequest`; confirm the device plays what the window evaluates,
  exactly one stream of notes with both views open, and Ctrl+Enter-to-sound
  latency comparable to today's Studio.
- **Spike 3 (fallback only).** The two-device split over `[send]`/`[receive]`.
  Entered only if spike 0 or 2 fails in the window-hosted form.
- **Then:** the rename, the mini scope/hydra canvas, the Studio swap, delete the
  hand-rolled editor and the strudel.cc redirect window.

#### Acceptance

Offline, in Live: the device is `alienmind-strudel`, and old sets keep their knob
and code values. The Studio opens the real REPL from disk; evaluating there plays
through the track via the device's one engine, with no second audio stream and no
audible scheduling seam. The mini window shows the scope by default and renders
hydra when the pattern asks for it. The `.amxd` stays small; the sidecar folder is
documented as part of the install.

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
