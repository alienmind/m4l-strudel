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
   
### 1. FEAT - The local strudel.cc REPL and hydra visuals in the "strudel" device

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
- **Mini view rebuild - THREE VIEWS, switched by a strip of buttons down the left.**
  The device view stops being a small editor and becomes the device's own panel.
  It is 169 px tall and does not scroll, so the strip is icons, not labels.

  1. **Knobs (default).** The eight controls as REACT faders - the ones the fx
     device has, at a bigger scale, VERTICAL rather than horizontal, using the
     whole width. Not the native dials: those stay where they are, one click away
     behind the Controls button, exactly as now.
     They are FED BY THE PATTERN, wherever it lives: a `slider()` in the mini
     view's own code, or an `m4lKnob(n, {...})` in the Studio's. A fader shows the
     name when the pattern gave one and stays draggable either way; units are
     Live's business on the native dial and need not be repeated here.
     This is the view that makes the device usable with the Studio window shut.

  2. **Visualizer.** The Studio's picture (see the spike below).

  3. **Code.** The small editor comes back, EMPTY by default and empty is the
     normal state - it is not where the music is written. It is a scratchpad for
     seeing and controlling: a `scope()`, a hydra sketch, later some MIDI control
     code.
     It is a SEPARATE strudel instance with its own state slot, not a second view
     of the Studio's pattern. The device page already runs an engine and its
     `[jweb~]` already sums into the track, so this view can make sound as well as
     draw - it is audio-OUT capable like any strudel page.

  **The limit that shapes view 3, measured against the Max 9 reference:** `jweb~`
  is "Web browser with audio OUTPUT". One inlet, control only - there is NO signal
  inlet, so a page cannot be given audio. The mini view therefore cannot receive
  the Studio's sound as a signal, and `scope()` there cannot show the Studio's
  waveform sample-accurately. What can cross is described in the spike below.
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

#### Spikes - status ledger

Work happens on branch `feat/full-strudel` in BOTH repos (m4l-strudel and
m4l-jweb, linked with `link:../m4l-jweb/packages/*`). Each spike can kill or
reshape the item, so each one stops at a gate somebody has to actually observe.
A spike is only ticked once the observation is written down here.

- **[x] Spike 0 - the offline REPL bundle. PASS (2026-07-22), with one new
  unknown attached.**
  `scripts/build-repl.mjs` builds the submodule from its ROOT (`pnpm build` there
  runs the jsdoc pass the site imports - building `website/` directly fails on the
  missing `doc.json`) and overlays the output for `file://`: drops the docs
  directories, rewrites root-absolute URLs in HTML and CSS - **including Astro's
  `component-url` / `renderer-url` island attributes, which is what actually loads
  the REPL** - drops the PWA service worker, rewrites hydra's unpkg default to a
  vendored `hydra-synth`, and injects `src/app/strudel/repl-shim/m4l-shim.js` (a
  stub that only announces itself until spike 4).
  **Measured:** `dist/repl-site` is **16.8 MB** (from 21.1 MB), fine as a sidecar.
  Every URL in `index.html` resolves to a file that exists. Loaded headless from
  `file://` the REPL hydrates, CodeMirror renders, the console is silent except
  `[m4l-shim] REPL found` - so `window.strudelMirror`, the seam spike 4 drives,
  is there.
  **THE NEW UNKNOWN, and it is load-bearing for spike 2:** Chromium blocks ES
  MODULE loading over `file://` unless it is told not to. Without
  `--allow-file-access-from-files` the page renders its shell and the island never
  hydrates - blank REPL, no error. With the flag it works. Every window this repo
  ships today is a single inlined HTML file, so nothing has ever exercised this,
  and whether `jweb`'s CEF allows it is UNVERIFIED. If it does not, the answers in
  order are: a jweb attribute for local file access, then inlining the REPL's
  chunk graph, then serving from localhost.
  Repro, both ways:
  `chrome --headless=new --dump-dom file:///.../dist/repl-site/index.html`
  (island stays `ssr`, nothing mounts) versus the same with
  `--allow-file-access-from-files` (CodeMirror mounts).
  Still worth doing by hand: open it in a real browser with the network OFF and
  evaluate `note("c3 e3 g3").s("sawtooth")` to hear it, which headless cannot.

- **[x] Spike 1 - windowed `jweb~` lifecycle. PASS (2026-07-22), in Live. THE
  DECISIVE ONE, AND IT WENT THE RIGHT WAY: the Studio can own the engine.**
  The page loads at device load without the window ever being opened, its
  AudioContext runs, the tone reaches the track, and it keeps running with the
  window shut - `tone_state` keeps arriving from a closed window, which is the
  whole finding. So the plan of record stands and the editor-only fallback below
  is dead.
  Two notes the log left behind, neither fatal:
  - The window's URL is sent TWICE (once on `loadbang`, once on device-ready), so
    the page loads twice. Harmless for a test tone; for a 17 MB REPL it is worth
    fixing before spike 2 is judged on performance.
  - `jweb` reports its own status to the wrapper (`onloadstart`, `url`, `title`,
    `onloadend`) and the wrapper logs each as "unhandled". Noise, not error.
  Original instructions, kept for re-running:
  Upstream now has the second window primitive: `window({ audio: true })` emits
  `[jweb~]` in the window's subpatcher, its L/R leave on a pair of `[outlet]`s and
  are summed into the device's audio path at the same `[+~]` stage the `webaudio`
  chain uses, and a `loadbang` pulses the window open-then-closed once at load so
  the page exists whether or not anyone opens it. The plain `[jweb]` window is
  untouched - verified by regenerating every other device in this repo and
  diffing: identical, byte for byte.
  Scratch device `alienmind-spike-audiowin` (delete after this spike) is the
  smallest question: no chains, no parameters, one audio window whose page holds a
  220 Hz oscillator and a per-second heartbeat.
  **TEST NEXT, in Live, in this order:**
  1. Drop `dist/m4l-strudel/alienmind-spike-audiowin.amxd` on a track WITHOUT
     opening its window. A window flashes open and shuts again (that is the
     keepalive). Within a few seconds the tone must be on the track meter.
  2. Open the window with its button, then close it. The tone must CONTINUE, and
     the Max console must keep printing `tone_state running`.
  3. Note Live's CPU meter with the window hidden and with it open.
  4. Save the set, reopen it: the tone comes back untouched.
  Gate: 1 and 2 both pass. If 2 fails while 1 passes, retry with the keepalive's
  auto-close removed (leave the window open) - if a user-driven close also kills
  the sound, the whole shape is dead and the FALLBACK above is what gets built.
  Record CPU and the verdict here.

- **[x] Spike 2 - the REPL inside the audio window. PASS (2026-07-22), in Live.**
  The local strudel.cc loads from the sidecar folder, the REPL runs, and the
  shim's `shim_ready` comes back - **so jweb's CEF does NOT enforce the `file://`
  ES-module block that plain Chrome does.** That was the open risk out of spike 0
  and it is now closed: no local-file switch, no inlining, no localhost server.
  Fixed straight after the run, from the log: `listWindowIds()` includes the site
  windows (the state fan-out needs them), so the payload loop was ALSO pointing
  `repl` at a `<device>_repl.html` that does not exist - a wasted load of a
  missing file before the real page. Site windows are skipped there now.
  Unrelated noise seen in the same log, not from this work, worth a look sometime:
  `get: no valid object set` and `SendMessage returned with error 2` around
  device load.
  What the ledger said to test, kept for re-running:
  `window({ site: "<dir>" })` compiles now. A site window is NOT embedded as
  base64 - 17 MB would become 23 MB of text inside wrapper.js - so the folder
  ships next to the `.amxd` and the wrapper points the window at
  `file:///<device folder>/<device>-site/<id>/index.html`, saying so in the Max
  console if the folder is not there. Both installers and the release zip carry
  the folder; `pnpm install:device` has already put it in the User Library.
  Also fixed on the way past, because a 17 MB page made it matter: the wrapper
  used to send every window URL TWICE (loadbang and live.thisdevice both call
  `loadWebview`), so every page was fetched twice. It now skips a URL identical to
  the one that window was last given; `reload` still forces a re-fetch.
  The strudel device declares the new window as `repl` and the mini view has a
  temporary **REPL** button in its header row, next to Export. The hand-rolled
  `studio` and the online `strudel` windows are untouched - they are only deleted
  once this one has parity.
  **TEST NEXT, in Live:** delete any existing `alienmind-strudel` instance and
  re-drag it from the browser (Live embeds a copy per set - an instance already on
  a track will NOT pick this up). Then:
  1. Max console: `window repl -> file:///.../alienmind-strudel-site/repl/index.html`
     and NO "missing its sidecar folder" line.
  2. Press REPL. **The decisive observation is whether the editor appears at all**
     - a shell with no CodeMirror in it is the `file://` ES-module block from
     spike 0, and means CEF needs the local-file switch (or the site needs
     inlining, or a localhost server).
  3. Click once in the page (the first-click gate is manual until spike 4),
     evaluate `note("<c3 eb3 g3 bb3>*4").s("sawtooth")`. Expect it ON THE TRACK.
  4. Close the window: the sound must continue (spike 1's finding, now under real
     load).
  5. Compare Live's CPU with today's device-view engine playing the same pattern.
  Known-not-working at this stop, by design: the pattern does not save with the
  set, the native knobs do not reach it, the mini Run/Stop still drives the OLD
  in-page engine, and both engines exist at once - so expect to hear the mini
  device and the REPL separately.

- **[ ] Spike 3 - the mini view shows what the Studio is DRAWING.**

  The requirement: whatever the Studio window renders behind its editor - a
  `.scope()`, a `.pianoroll()`, hydra - should be visible in the device view. Not
  a visual of our own that moves with the sound: the Studio's actual picture.

  **What is already settled, so the spike does not re-open it:**
  - `jweb~` has NO signal inlet (Max 9 reference: "Web browser with audio
    output", one control inlet). A page cannot be handed audio, so there is no
    route by which the mini view's own `scope()` sees the Studio's waveform.
  - Pixels cannot cross between two Chromium contexts directly - no shared
    memory, no server, and jweb has no frame-grab.
  - Re-running hydra in the mini page from mirrored code reproduces HYDRA and
    nothing else - not `.scope()`, not `.pianoroll()`.

  **So there are two feeds, and they answer different halves:**

  a) **The picture: a JPEG through Max.** The shim reads the Studio's canvas
     (`getDrawContext()`, and hydra's own) with `toDataURL("image/jpeg", ~0.5)`
     at 320x180 or smaller, sends the string as an ordinary message, and the mini
     page paints it into an `<img>`. This is the only thing that shows `.scope()`,
     because strudel drew it.
     **Measure, because any of these can kill it:** the size of a frame (a Max
     symbol carrying ~10 kB, several times a second), the rate that survives the
     round trip, and above all the CPU cost of `toDataURL` - it is a synchronous
     GPU read running in the page that is MAKING THE SOUND, so a stall there is a
     dropout, not a dropped frame.
     Fallbacks in order if it costs the audio: 2-4 fps (a slideshow of the scope
     is still the Studio's picture), then drop it.

  b) **The level: a `[peakamp~]` tap.** Cheap, message-rate, and enough to drive
     the mini view's OWN visuals - a meter, and audio-reactivity for a hydra
     sketch typed in view 3. Worth having whatever happens to (a), and it is the
     only feed that survives if (a) is unaffordable.

  Also still unverified and needed by view 3 either way: **hydra rendering inside
  a jweb page at all** (WebGL in CEF). Probe it early - if WebGL is missing, view
  3's hydra half dies and the scratchpad is left with `scope()` of its own sound.

  Gate: the Studio's picture visible in the device view at 10 fps or better with
  no audible cost, or a recorded reason why not plus the level meter shipping
  instead.

- **[x] Spike 4 - the shim and the controls. PASS (2026-07-22), in Live.**
  All four: the audio arms with no click, the pattern saves with the set and comes
  back on reopen, the device's native Play/Stop drives the REPL, and a native dial
  moves the sound while the pattern plays.
  `src/app/strudel/repl-shim/m4l-shim.js` is the real thing now, and it is still
  the only line of ours inside the app:
  - **Arms the audio.** The REPL creates its AudioContext on the first `mousedown`
    on the document (`initAudioOnFirstClick`, superdough.mjs). A window that loads
    hidden never gets one, so the shim dispatches a synthetic one.
  - **Pins the output device** to `System Standard`, because `initAudio` calls
    `setSinkId` for anything else - which would send the sound to a sound card and
    away from the `[jweb~]` outlets that ARE the track. A setting left over from a
    browser session would have taken the device off the track silently.
  - **Persists the pattern** to the `code` state slot, so it saves with the LIVE
    SET rather than in the page's localStorage. It restores on load, but only once
    the REPL's own `initCode()` has settled (the buffer stops reading
    `// LOADING`) - restoring earlier just gets overwritten.
    The write is a one-second poll of the buffer, not a hook on evaluate: typing
    that has not been evaluated yet is still work a musician expects to survive a
    save, and the REPL changes the buffer by several paths.
  - **Takes Play/Stop and the eight dials** as `set_play` / `set_s1..s8`, which
    become `evaluate()` / `stop()` and `m4lKnob(1..8)` for a pattern to read.
  Getting the controls there needed one new library message, because a knob turn
  is delivered to the DEVICE VIEW's page and to no other: `window_send <winId>
  <selector> <value>` in the wrapper, `sendToWindow()` in the bridge. NOT a state
  slot - a slot saves with the set, and a knob being swept would write the Live
  set on every frame. `src/app/strudel/useReplRemote.ts` is the device view's end
  of it, with one re-send a few seconds in for the case where the window's page
  was not listening yet.
  Nine tests run the shim against a faked page (`__tests__/repl-shim.test.ts`) -
  every one of its behaviours fails SILENTLY in Live, which is why they exist.
  The knobs took a second pass, and the bug is worth keeping: `m4lKnob(n)`
  returned a plain NUMBER, so a pattern read it once at evaluation and froze it -
  the dial did nothing until the pattern was evaluated again. A pattern is
  evaluated once and then plays, so anything meant to be turned WHILE it plays has
  to be a signal, queried per cycle. Hence pattern arithmetic, not JavaScript
  arithmetic:

      note("c3 e3 g3").s("sawtooth").lpf(m4lKnob(1).range(200, 2200))

  `m4lKnobValue(n)` is still the raw number for a pattern that wants it frozen.
  The first dial to arrive logs one line into the REPL's own console, so "the knob
  does nothing" can be told apart from "the value never reached the page".
  Still true at this stop: the mini view's own engine is still there and still
  sounds separately. That goes with the mini rebuild.

- **[ ] Then:** the mini window rebuild, and the deletions - the hand-rolled
  editor, the online-redirect window, the engine in the device page, and the
  scratch spike device.

#### Acceptance

Offline, in Live: the device is `alienmind-strudel`, and old sets keep their knob
and code values. The Studio opens the real local strudel.cc with all its
capabilities; evaluating there IS the track's audio, and closing the Studio window
does not stop the sound. The mini window types no code: it launches the windows,
shows a live visual of the Studio's audio, and runs hydra when the pattern asks
for it. The pattern still saves with the set. The `.amxd` stays small; the sidecar
folder is documented as part of the install. m4l-jweb's existing `[jweb]` window
behaviour is unchanged.


### 2. FIXME - Export writes nothing: "could not place save: -1 bytes"

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

### 3. FIXME - the clipboard copy cannot be confirmed, and could not be tested

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

SOLVED FOR THE STUDIO PATH (2026-07-22), verified in Live. A pattern in the local
strudel.cc can now describe a dial, and all three parts take:

    note("c3 e3").s("sawtooth").lpf(m4lKnob(1, { name: 'cutoff', unit: 'Hz', range: [200, 2200] }))

    strudel: knob_label param-s1 'S1' -> 'cutoff'
    strudel: knob_unit  param-s1 'Hz' -> style 3
    strudel: knob_range param-s1 -> 200,2200

The dial reads `cutoff`, its value reads in Hz across 200..2200, and turning it
still lands the right value in the pattern while it plays.

**What made the range work this time.** It is the same `_parameter_range` the
earlier spike set and reverted. That attempt failed because the attribute TAKES:
the dial then reports its value in the new domain, while the page went on
normalizing 0..1, so two scalings fought and the knob sat at its minimum. Now the
wrapper answers the page that asked - `knob_range_ok` / `knob_range_failed` - and
the shim scales only while the answer is no. Exactly one scaling, wherever it
lives.

**What is left of this item.**

- The OLD path is unchanged and still 0..1: `shared/useSliderKnobs.ts` derives a
  label from the method wrapping a `slider()` call and normalizes in the page. It
  does not hear the range reply, so a dial given a real range reads oddly in the
  mini view. That resolves itself when the mini engine is retired (item 1); if any
  of it survives, it needs the same handshake.
- Live's parameter REGISTRY was measured previously to keep showing `S1..S8` in
  the Rack macro picker even when the panel rename takes, and nothing here changes
  that - a frozen device cannot rename a parameter there. Worth re-checking now
  that the panel side demonstrably works; if it still lags, document it in help
  and stop rather than spiking a frozen-device limit again.

**Acceptance (met for the Studio path):** a user turning S1 on Push can tell which
parameter they are moving and roughly where in its range they are.


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
