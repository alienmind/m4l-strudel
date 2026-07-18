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

[TESTING.md](TESTING.md) holds the open ones. The recently-shipped work that still needs
a human in Live: **clip I/O from inside a Rack** (the `ownTrack` climb + the
disable-on-no-track fallback), and **mapping a Rack macro / Push button to the native
Play/Stop** parameter. Plus the small re-check that the sampler lights every struck pad
now, not just one.

### 2. The drag-to-clip spike  [REOPENED - new approach, not yet coded]

[SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md): can a drag from `[jweb]` produce an OS
file drop Live's audio lane accepts? Reopened with the **`DownloadURL`** approach - a
Chromium drag type that makes the browser download the URL to `%TEMP%` and hand the
drop target a real `CF_HDROP` file, exactly like an `explorer.exe` drag. The earlier
"no" was void: it tested `DownloadURL` with a `file://` URL, which the handoff never
accepts. The open question is now narrow: does Max's `[jweb]` (embedded Chromium/CEF)
carry Chrome's `DownloadURL` desktop-drop behaviour, or strip it? The spike doc has the
exact code plan and test protocol. Reveal-in-folder stays the fallback either way. (If
this also fails, it moves to [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).)

---

## Deferred to 1.0.0

### 5. Populate the Rack with the sampler instrument

Join point between the shipped Rack preset and the shipped standalone sampler. Swap the
sampler into the Rack's instrument slot, replacing the placeholder native Ableton Bass.
Held for 1.0.0 - the rack ships with the native Bass in 0.9.0.

### 6. Phase 8 - Strudel's own audio in the track (Route B first)

`FEAT-STRUDEL-002`. **Do not wait for the C++ external**: the standing analysis
([m4l-jweb ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md)) ranks offline
rendering first - `OfflineAudioContext` renders cycle N+1 with the real superdough
(bit-identical sound), `saveToFile()` (to be built upstream) writes the WAV,
`[buffer~]`/`[play~]` locked to `current_song_time` plays it double-buffered. One
cycle of edit latency; random/stateful patterns fall back with a visible notice. See
[SPIKE-OFFLINE.md](SPIKE-OFFLINE.md). This eventually fills the Rack's instrument slot.

### 7. Cross-device coordination in the Rack (enhancement)

Today the Rack's devices are independent: the pattern is typed in Strudel MIDI, the fx
line in the FX device. A single expression spanning both - `note("c3 e3").lpf(800)` split
automatically across the rack's sequencer and fx device - would need a cross-device
channel. Max `[send]`/`[receive]` are global and collide across tracks; LOM observation
of a sibling device is plausible but unproven. A real enhancement, not v1 - do not let it
block anything. (Note: this is coordination BETWEEN our own devices, distinct from the
abandoned "control a foreign device" adopt idea in the drawer.)
