# TESTING - what a human still has to check in Live

The test suites pin what the generated patcher SAYS; nothing in CI can hear a filter,
watch a window open, or see a Push encoder page. This file holds **only the open
checks**. Everything already confirmed - and the recipe to re-check it if the code
underneath changes - lives in [ARCHITECTURE.md](ARCHITECTURE.md) under "Verified in
Live".

## Before you start

```bash
cd m4l-strudel
pnpm install            # deps: see the dependency note at the end
pnpm build              # writes dist/m4l-strudel/*.amxd
pnpm install:device     # copies them into the User Library
```

Then in Live: **File > New Live Set**, drag each device from the User Library. If a
device shows a stale build stamp, quit Live entirely and reopen - **Live caches
`.amxd` metadata by filename**, and a same-named device can keep serving cached
parameter data (this cost a whole debugging session; when in doubt, copy the amxd to
a new filename and drag that).

---

## Confirmed in 0.9.0

Passed by hand and no longer open:

- **State-default seeding** on a fresh instance (and restore beating seed).
- **Push banks** paging as **Tone**/**Space** on hardware.
- **Presets** reaching the User Library.
- **Clip I/O from inside a Rack** - the `ownTrack()` `canonical_parent` climb reads and
  writes clips from a MIDI device inside an Instrument Rack, same as on a bare track, and
  the 1/s `jsliveapi` console error is gone.
- **Macro-map the native Play/Stop** - the transport is a real, mappable Live parameter;
  a Rack macro / Push button starts and stops the sequencer, and the web Run/Stop stays in
  sync. (The panel now lives behind **About > Advanced > Controls** - see open check 1.)
- **The bank-based Sampler** - `s("bd sd, hh*8")` plays the selected drum machine's
  sounds, `.bank()` overrides per-hap, auto-download works, layered sounds are polyphonic
  (16 voices), an unknown name is reported, and a MIDI sequencer in front drives it. The
  old pad-highlight and per-instance polyphony/scope also passed.

The re-check recipe for each, should the code underneath change, is in
[ARCHITECTURE.md](ARCHITECTURE.md) under "Verified in Live". The **drag-to-clip** spike is
closed as a failure and parked - see [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

---

## 1. Native controls moved into About (re-check)

The devices' native panels are now reached from **About > Advanced > Controls** instead of
a top-bar button (the top bars are one consistent grey set now). Confirm:

1. **Strudel MIDI**: click the title (About), then **Advanced > Controls** - the native
   Play/Stop panel appears; the native **Back** switch returns to the editor. The
   macro-map round trip still works from there.
2. **Full Studio** is under the same **Advanced** section on the pattern devices (MIDI,
   Drums MIDI, Drums Sampler) and still edits the same pattern as the device view.
3. **Strudel Audio FX** keeps its **Knobs** button in the top bar (its native panel is the
   primary interaction, not an advanced extra), and every device's **?** sits rightmost.

## 2. Sampler "Show folder" (wrapper fix)

The Sampler now owns a samples folder (`drums-sampler` mode was not resolving, so the
wrapper never sent its folder). Confirm: after **Run** downloads at least one sample,
**Show folder** enables and opens the device's samples folder in Explorer/Finder.

# The dependency note

`package.json` points `@m4l-jweb/*` at `^0.9.0`, and m4l-jweb 0.9.0 is published to
npm - a fresh clone or CI installs the published packages, no local link needed.

(In-progress cross-repo work bumps to a not-yet-published 0.9.1 and temporarily
consumes it via `link:../m4l-jweb/packages/*` on disk; that link is dropped and
0.9.1 published once the round is confirmed working.)
