# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* - patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in `m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

Ideas tried and abandoned are in [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

Every item below was re-assessed after the 0.9.9 jweb~ rewrite (native Web Audio out,
see [ARCHITECTURE.md §2c](ARCHITECTURE.md)). The rewrite changed the ground under
several of them: some got easier, one became impossible in its original form, and two
regressions the rewrite introduced are tracked here as item 0.

---

## Open Tasks (Ordered from least to most difficult)

### 0. FIX - regressions from the jweb~ rewrite

**Assessment.** Two capabilities of the 0.9.5 offline pipeline did not survive the
move to live playback, because they lived in the render path that was deleted:

- **`slider()` and repl helpers fail to eval.** The engine worker boots only
  core+mini+tonal (`bootScope()` in `src/max/shared/engine.mjs`); the offline
  renderer shimmed `slider`/`sliderWithID`/`setcps`/`setCpm`/visual params via
  `installRenderScope()` (`src/lib/render/scope.ts` - the file survives, unused by
  the worker). Any strudel.cc pattern using them now throws `X is not defined`.
- **Sample patterns have no sound source registered.** The superdough device calls
  `registerSynthSounds()` only; nothing calls `samples()` for the default dirt-samples
  / drum-machine maps, so `s("bd")` resolves to nothing and superdough logs
  "sound not found".

**DONE (0.9.9).**
- `installReplShims()` in `src/max/shared/engine.mjs`, called from `bootScope()` - so
  every compile path (the worker, the export path, the node tests) gets the shims with
  no per-caller opt-in. setCps/setcps/setCpm/setcpm return silence, slider/sliderWithID
  return the numeric default, the visualiser methods pass through, and the @strudel/draw
  params are registered via `createParams`. `installRenderScope()` (scope.ts) still
  OVERRIDES slider with the capturing version for the knob binding of item 5 - it runs
  after bootScope, so last-writer-wins is the intended order.
  Covered by three tests in `src/max/__tests__/engine.test.mjs` ("repl eval shims"),
  written red first: they failed with the exact `sliderWithID is not defined` /
  `setcps is not defined` this item predicted.
- The superdough device loads strudel's prebaked sample maps (`SAMPLE_MAPS` in
  `useSuperdoughRender.ts`, the same six URLs as `strudel/packages/repl/prebake.mjs`)
  after `initAudio()`, in the background and with `allSettled` - a dead map cannot
  silence the others, and synth patterns never wait on the network. The status line
  reports how many maps are offline. Persistent caching of those fetches is item 2.

**Still open here:** slider VALUES do not yet flow from the native knobs into the
worker's compile (the shim returns the code's default). That is item 5's other half.

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

### 3. FEAT - render a pattern to a WAV (export to audio)

**Assessment.** Valid and now BETTER scoped: this is the one legitimate heir of the
retired offline pipeline. Playback is live, but an explicit "Export audio" action
wants a bounce - and every piece except the orchestration still exists: superdough
renders under OfflineAudioContext (proven by the 0.9.x S1 spike), `src/lib/render/wav.ts`
survives with tests, `saveToFile` ships, and period detection (`determinism.ts`
renderPeriod) survives too. LOM cannot create audio clips (drawer, known wall), so
the product is a WAV next to the device plus the drag-out handle, exactly like the
sample browser's files.

**DONE (0.9.9), pending a Live listen.** `src/lib/render/offline.ts` is restored from
`main` intact - the S1-proven recipe (`loadWorklets()` + `setMaxPolyphony()`, never
`initAudio()` which hangs offline; renders serialized behind one queue because
superdough's context and controller are module-level singletons; `clearNodePools()`
in `finally` because the pool is keyed across contexts). What is NOT restored is the
conductor, the double buffer, the transport lock or the Max-side loop: this is a
one-shot bounce.

`exportAudio()` in `useSuperdoughRender.ts` compiles the pattern fresh on the MAIN
thread (the worker's pattern lives in another one and is not transferable), takes
`renderPeriod()` capped at 32 cycles, renders at the page AudioContext's own sample
rate so Live imports without resampling, and `saveToFile`s a flat
`superdough-export-<timestamp>.wav` into the device folder - flat because the drawer
records that a subdirectory makes [maxurl]'s atomic place return -1, and timestamped
so two device instances cannot clobber each other. The Export button sits next to Run.

**Unverified:** the render itself needs a browser (OfflineAudioContext), so it is
green on typecheck/build here but has NOT been heard in Live on this branch. First
Live pass should check: a synth pattern bounces non-silent, a sample pattern bounces
(sample loads are awaited before startRendering), and the file is draggable from the
device folder.

**Next for this item:** the same call from the drums sampler, and a "reveal the file"
affordance once item 1 lands.

### 4. FEAT - one-click Freeze/flatten for Superdough

**Assessment.** RECLASSIFIED: impossible in its original form, by design of Freeze.
Freeze bounces the device OFFLINE and faster than realtime; a jweb~ page is a live
Chromium instance that neither re-instantiates in time nor renders faster than
realtime. No amount of our code changes that. The honest answers are (a) resampling
onto an audio track, which works today, and (b) item 3's export-to-WAV, which is the
"flatten" the user actually wants. Document the limitation in ABOUT.

**Preliminary design.** Nothing to build - item 3 shipped the replacement (the Export
button next to Run). All that is left is one ABOUT.md paragraph: "Freeze silences the
device (the browser cannot run in Live's offline bounce); use Export to bounce the
pattern to a WAV, or resample the track."

### 5. FEAT - explicit knob binder (and restore the slider row)

**Assessment.** Item 0 restored the EVAL half - `slider()` now compiles and returns
the code's default, so patterns using it play. What is still missing is the VALUE
half (a knob turn does not reach the worker's compile) and the slider UI row. The
native knobs s1..s8 still build (surface.ts untouched), and `installRenderScope()`
in scope.ts still holds the capture machinery (`beginSliderCapture`/`getSliderSpecs`/
`setSliderOverrides`) with its own passing tests - it is simply not wired into the
worker yet. v1 auto-bind (slider N -> knob N) is the baseline to restore; the binder
is the upgrade on top.

**Preliminary design.** Wire the capture into the worker: it calls
`beginSliderCapture()` before each compile, posts `{t:'sliders', specs}` back, and
accepts `{t:'sliderValues', values}` which it feeds to `setSliderOverrides()` before
recompiling. Then re-add the slider
row to the superdough App (git history has the component), then the binder - a
small popover per slider: "knob s1..s8 / unbound", persisted in the device state
slot (`useStateSync`) keyed by slider source-order index. Auto-bind stays the
default for the first 8 unbound sliders, so zero-config behavior is unchanged.

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

### 7. FEAT - minimalist superdough synth

**Assessment.** Went from "needs design" to "small": with live superdough in the
page, a MIDI-driven synth is `onNote -> superdough(value, now)` - no timeline, no
transport, no worker. The design questions left are product ones (how the sound is
specified, how much UI).

**Preliminary design.** New device `alienmind-strudel-synth` (instrument, chains
`webaudio` + `midiin`): a one-line sound spec (`s("sawtooth").lpf(800).room(.3)` -
a superdough VALUE, not a pattern), parsed once at eval into a control object; each
incoming note plays it with `note` and `velocity` merged in, held notes tracked for
release. The fx knobs pattern from the fx device applies (native dials writing into
the value). Ship after item 0 (it reuses the samples() registration).

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
(browser preview, sampler hits, superdough `s()` patterns after item 0). Disk cache
only exists for the browser's saved files; the sampler's cache is in-memory
(per-session) until item 2's persistent cache lands.

**Checklist (network OFF in Live):**
- **Responsiveness**: UI thread not blocked (list/search must not stutter).
- **Catalog timeout**: fails within ~12 s with a clear message.
- **Download timeout**: fetches fail within ~30 s, row/status unsticks from "Fetching...".
- **Synths offline**: superdough synth patterns play with no network at all.
- **Session cache**: a sound already auditioned this session still plays.
- **After item 2**: previously downloaded samples play across a Live restart.

### 11. FEAT - hydra.js visuals (Code screen + View screen)

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
  item 8). Without one, the page can never see another track's audio.
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
