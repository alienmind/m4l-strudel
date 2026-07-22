# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* - patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in `m4l-jweb`'s own [doc/TODO.md](https://github.com/alienmind/m4l-jweb/blob/main/doc/TODO.md), not here.

Ideas tried and abandoned are in [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md);
what was built and how it works is in [ARCHITECTURE.md](ARCHITECTURE.md).

Anything finished has been REMOVED from this file rather than left as a done-list -
git history is the record of what shipped.

---

## Open Tasks - aiming for v1.1

The Studio landed: the real local strudel.cc is the track's instrument, the pattern
saves with the set, and Live's transport and dials reach it (ARCHITECTURE.md 4k).
What is left of that work is the device view around it, and it heads this list.

### 1. FEAT - finish the device view around the Studio

The three views are BUILT and UNTESTED IN LIVE: a visualizer fed by the window's
`[peakamp~]` level, a bank of vertical faders, and a code scratchpad on its own
`miniCode` state slot. The strip down the left switches them, and a fader appearing
in the code switches to the knobs by itself until the user picks a view by hand.

Remaining:

- **Test all of it in Live** - the table at the end of this file is the list.
- **Export.** It still bounces the SCRATCHPAD's pattern, because that is the engine
  the device page has. The music is in the Studio now, so Export either moves behind
  the shim (the Studio renders and saves) or is cut until it can. Decide before 1.1.
- **`useSliderKnobs` should become the library's `useControls`.** It already speaks
  `describeParam`/`onParamRange`, but the borrowing bookkeeping is still duplicated
  here; m4l-jweb item 2 owns that contract now.
- **MIDI in the scratchpad.** The point of a second instance is control code, and
  `midiin` is not on this device's chain list yet (item 6 covers the vocabulary).

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


### 4. FEAT - native MIDI input (`midiIn`/`kb()`) and MIDI output

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

### 5. FEAT - orbit() support (multichannel out)

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

### 6. FEAT - cross-device coordination in the Rack

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

### 7. TEST - verify offline behavior in Live

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

---

## What needs testing in Live, right now

Everything below is BUILT and INSTALLED and none of it has been run in Live. Device
under test is **`alienmind-strudel`** unless a row says otherwise. Report back by row
number plus the Max console output.

| # | Do this | Should happen |
|---|---------|---------------|
| 1 | Load the device | Three buttons down the left; `~` is up and reads "silent" |
| 2 | Press Controls | Play alone on the top row, then two rows of four dials, aligned |
| 3 | Open the Studio (REPL), evaluate `note("c3 e3 g3").s("sawtooth")`, close the window | Trace moves in the device view with the window shut |
| 4 | Click `{}` | Scratchpad is EMPTY. Nothing plays from it |
| 5 | Type `s("bd*4")` in the scratchpad and Run | It plays, and it is the only thing playing besides the Studio |
| 6 | Save the set, reopen it | Studio has its pattern; scratchpad has its own text; the two never swapped |
| 7 | In the Studio evaluate `note("c3 e3").s("sawtooth").lpf(m4lKnob(1,{name:'cutoff',unit:'Hz',range:[200,2200]}))` | View switches to the faders; one fader named `cutoff`; console shows `param_label`, `param_unit`, `param_range` all taking |
| 8 | Drag that fader; then turn native S1 | Filter follows both; the two never disagree |
| 9 | Click `~` yourself, then evaluate another knob in the Studio | View stays where you put it |
| 10 | Drag the Studio window bigger | REPL UI grows to fill it |
| 11 | Device: **`alienmind-strudel-synth`**, press Controls | Two rows of four dials, aligned |
| 12 | Synth: type `s("sawtooth").lpf(slider(800,200,4000))`, Run, play a note, turn S1 | Filter moves; S1 reads in the slider's own range, not 0..1 |

Row 12 is the one I would bet against: it is the OLD `useSliderKnobs` path taking the
library's range handshake for the first time. If the knob sticks at its minimum, the
handshake did not arrive and the page is scaling twice.
