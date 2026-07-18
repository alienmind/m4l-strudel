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

### 1. Run the remaining Live checks

[TESTING.md](TESTING.md) holds the open ones. The big 0.9.0 items are now **confirmed**
(clip I/O in a Rack, macro-map Play/Stop, the bank-based Sampler). What is left after the
UI rework: the **native controls moved into About > Advanced > Controls** (the panel and
Full Studio reachable there; FX keeps its top-bar Knobs; every `?` sits rightmost), and
the **Sampler "Show folder"** now that the wrapper sends its samples folder.

### 2. Recapture the screenshots

The UI changed shape (shared grey buttons, the Sampler's two screens, the reorganised MIDI
bottom row) and two devices were renamed (**Drums MIDI**, **Drums Sampler**). The
`doc/screenshot-*.png` referenced by README/ABOUT are now stale - retake them from Live:
the four device faces, the Sampler's CODE and SOUNDS screens, the Drums MIDI Kit, and the
overview. Keep the filenames so the doc links still resolve.



---

## Deferred to 1.0.0

### 4. Strudel's own audio in the track (Route B first)

**Do not wait for the C++ external**: the standing analysis
([m4l-jweb ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md)) ranks offline
rendering first - `OfflineAudioContext` renders cycle N+1 with the real superdough
(bit-identical sound), `saveToFile()` (to be built upstream) writes the WAV,
`[buffer~]`/`[play~]` locked to `current_song_time` plays it double-buffered. One
cycle of edit latency; random/stateful patterns fall back with a visible notice. See
[SPIKE-OFFLINE.md](SPIKE-OFFLINE.md). This eventually fills the Rack's instrument slot.

This is also what the **Sampler's "render to WAV + drop an audio clip"** ask needs (the
MIDI device writes a MIDI clip; a sampler's output is audio). It is deferred here on
purpose: it needs the offline render above plus an upstream `saveToFile()`, neither built.

### 5. Cross-device coordination in the Rack (enhancement)

Today the Rack's devices are independent: the pattern is typed in Strudel MIDI, the fx
line in the FX device. A single expression spanning both - `note("c3 e3").lpf(800)` split
automatically across the rack's sequencer and fx device - would need a cross-device
channel. Max `[send]`/`[receive]` are global and collide across tracks; LOM observation
of a sibling device is plausible but unproven. A real enhancement, not v1 - do not let it
block anything. (Note: this is coordination BETWEEN our own devices, distinct from the
abandoned "control a foreign device" adopt idea in the drawer.)