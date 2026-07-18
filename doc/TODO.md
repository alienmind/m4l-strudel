# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**Only open work lives here**, ordered from smallest effort to biggest. What has
shipped is recorded where it belongs: **what the devices do** in
[README.md](../README.md), **how and why (including every design tried, rejected or
measured)** in [ARCHITECTURE.md](ARCHITECTURE.md). What a human still has to check in
Live is [TESTING.md](TESTING.md). Ideas tried and abandoned are in
[DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

---

## For 0.9.0

All 0.9.0 Live checks are **confirmed** (clip I/O in a Rack, macro-map Play/Stop, the
bank-based Sampler, native controls + Full Studio in About). [TESTING.md](TESTING.md) is
clean; the standing re-check recipes live in ARCHITECTURE's "Verified in Live".

---

## Deferred to 1.0.0

### 3. "Open folder" is not functional on any device

The **Show folder** button (sample browser and the Drums Sampler) does nothing in Live -
the wrapper now sends the device folder so the button ENABLES, but the reveal itself is
dead. It goes out as `messnamed("max", "launchbrowser", "file://<dir>")` (wrapper
`reveal_folder`), and that does not open the OS file manager here. Find the reveal that
works - a different Max object (`; max launchbrowser` variants, `sprintf` to an OS
`open`/`explorer` shell, or a `[dropfile]`/`[folder]` approach) - and confirm it opens
Finder/Explorer on the samples folder. Until then, samples are still on disk at the path
the status line implies, just not one click away.

### 4. Sampler Device needs to be able to render a WAV
And ideally, this needs to be able to be saved to clip
Same functionality as the MIDI clip save.
This does not necesarily needs Superdough (see next items), instead
we render the polysynth device output to disk and then reimport back as audio.

### 5. Strudel's own audio in the track (Route B first)

Check ([m4l-jweb ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md)),
Offline rendering of audio - `OfflineAudioContext` renders cycle N+1 with the real superdough (bit-identical sound), `saveToFile()` (to be built upstream) writes the WAV,
`[buffer~]`/`[play~]` locked to `current_song_time` plays it double-buffered. One
cycle of edit latency; random/stateful patterns fall back with a visible notice. See
[SPIKE-OFFLINE.md](SPIKE-OFFLINE.md). This eventually fills the Rack's instrument slot.

This is also what the **Sampler's "render to WAV + drop an audio clip"** ask needs (the
MIDI device writes a MIDI clip; a sampler's output is audio). It is deferred here on
purpose: it needs the offline render above plus an upstream `saveToFile()`, neither built.

### 6. Cross-device coordination in the Rack (enhancement)

Today the Rack's devices are independent: the pattern is typed in Strudel MIDI, the fx
line in the FX device. A single expression spanning both - `note("c3 e3").lpf(800)` split
automatically across the rack's sequencer and fx device - would need a cross-device
channel. Max `[send]`/`[receive]` are global and collide across tracks; LOM observation
of a sibling device is plausible but unproven. A real enhancement, not v1 - do not let it
block anything. (Note: this is coordination BETWEEN our own devices, distinct from the
abandoned "control a foreign device" adopt idea in the drawer.)