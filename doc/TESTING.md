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

Passed by hand and no longer open: state-default seeding on a fresh instance (and
restore beating seed); Push banks paging as **Tone**/**Space** on hardware; presets
reaching the User Library; the sampler's polyphony and per-instance sample scope (two
instances, separate samples, overlapping notes not cut). The re-check recipe for each,
should the code underneath change, is in [ARCHITECTURE.md](ARCHITECTURE.md) under
"Verified in Live".

---

## 1. Clip I/O from inside a Rack

The recent `ownTrack()` fix climbs `canonical_parent` to the track, so a MIDI device
INSIDE an Instrument Rack should still read and write clips (and the 1/s
`jsliveapi: invalid property name` console error should be gone). Put Strudel MIDI in
the shipped Rack and:

1. **Save to Clip** writes a clip onto the Rack's track (not an error, not the wrong
   track).
2. **Load from Clip** reads a clip on that track back into mini-notation.
3. Both work the same on a bare track (no Rack) as before.
4. Where a track truly cannot be reached, both clip buttons disable with a tooltip
   rather than failing silently (hard to stage on purpose - mostly this is the "it
   still works in a Rack" check).

## 2. Macro-map the native Play/Stop

Strudel MIDI's transport is now a real, mappable Live parameter behind the **Macro**
button. Confirm the round trip:

1. Click **Macro** - the native panel with the Play/Stop control appears; **Back**
   returns to the editor.
2. Map a **Rack macro** (or a Push button / a MIDI control) to that Play/Stop control,
   and confirm moving the macro starts and stops the sequencer.
3. The web editor's own Run/Stop still works and stays in sync.

## 3. Sampler pad highlight (re-check)

Polyphony already passed; this is only the visual fix: play a chord across loaded pads -
**every** struck pad must light, not just one.

## 4. SPIKE - drag-to-clip (`DownloadURL` approach)

[SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md) has the full plan. In short: audition a
sample, then drag the row onto an audio track / a Simpler / a Drum Rack pad. With the
`DownloadURL` change in place, success = a real audio file lands (a clip appears), and a
WAV shows up in `%TEMP%`. Negative control: drag onto `notepad.exe` - if it still only
pastes a text path, `[jweb]`'s CEF is stripping `DownloadURL` and the answer is NO.
Reveal-in-folder is the fallback either way. (Not yet coded - the `DownloadURL` change
is planned in the spike doc.)

# The dependency note

`package.json` points `@m4l-jweb/*` at `^0.9.0`, and m4l-jweb 0.9.0 is published to
npm - a fresh clone or CI installs the published packages, no local link needed.

(In-progress cross-repo work bumps to a not-yet-published 0.9.1 and temporarily
consumes it via `link:../m4l-jweb/packages/*` on disk; that link is dropped and
0.9.1 published once the round is confirmed working.)
