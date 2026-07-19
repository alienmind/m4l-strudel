# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**Only open work lives here**, ordered from smallest effort to biggest. What has
shipped is recorded where it belongs: **what the devices do** in
[README.md](../README.md), **how and why (including every design tried, rejected or
measured)** in [ARCHITECTURE.md](ARCHITECTURE.md). Ideas tried and abandoned are in
[DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

---

## For 0.9.0

All 0.9.0 Live checks are **confirmed** (clip I/O in a Rack, macro-map Play/Stop, the
bank-based Sampler, native controls + Full Studio in About).
The standing re-check recipes live in DRAWER_OF_FAILED_IDEAS.md's "Verified in Live".

---

## Shipped in 0.9.5

**Strudel's own audio in the track (Route B) - DONE.** The
`alienmind-strudel-superdough` device renders ALL of Strudel offline with the real
superdough and loops it on the track, transport-locked, following Live's tempo. Confirmed
in Live 2026-07-19. Mechanism in [ARCHITECTURE.md](ARCHITECTURE.md) §4f; the whole design
history that used to live in the master plan is folded there. Its remaining follow-ups are
now in "Future features" below.

## Deferred to 1.0.0

### 1. FEAT - Sampler Device needs to be able to render a WAV
And ideally, this needs to be able to be saved to clip
Same functionality as the MIDI clip save.
This does not necesarily needs Superdough (see next items), instead
we render the polysynth device output to disk and then reimport back as audio.

### 2. FIX - "Open folder" is not functional on any device

The **Show folder** button (sample browser and the Drums Sampler) does nothing in Live -
the wrapper now sends the device folder so the button ENABLES, but the reveal itself is
dead. It goes out as `messnamed("max", "launchbrowser", "file://<dir>")` (wrapper
`reveal_folder`), and that does not open the OS file manager here. Find the reveal that
works - a different Max object (`; max launchbrowser` variants, `sprintf` to an OS
`open`/`explorer` shell, or a `[dropfile]`/`[folder]` approach) - and confirm it opens
Finder/Explorer on the samples folder. Until then, samples are still on disk at the path
the status line implies, just not one click away.

### 3. FEAT - Cross-device coordination in the Rack (enhancement)

Today the Rack's devices are independent: the pattern is typed in Strudel MIDI, the fx
line in the FX device. A single expression spanning both - `note("c3 e3").lpf(800)` split
automatically across the rack's sequencer and fx device - would need a cross-device
channel. Max `[send]`/`[receive]` are global and collide across tracks; LOM observation
of a sibling device is plausible but unproven. A real enhancement, not v1 - do not let it
block anything. (Note: this is coordination BETWEEN our own devices, distinct from the
abandoned "control a foreign device" adopt idea in the drawer.)

---

## Future features (post-0.9.5, the roadmap to the ultimate instrument)

These were the gap analysis in the retired master plan, moved
here now that the render device has shipped. Each is a real feature for a future release,
none blocks anything. Ordered roughly small-to-big.

### Superdough follow-ups (ride the shipped render path)

- **One-click Freeze/flatten** goes silent - the page re-instantiates offline and its async
  generate/load/arm cannot finish an offline pass. Record/resample is the capture path
  meanwhile. Route: a render-to-clip drop via the existing `saveToFile`.
- **`readFile()` offline sample cache.** Sample patterns need network on the first render
  (Chromium blocks `fetch()` of `file://`); a bridge `readFile(path) -> ArrayBuffer` reads
  the already-downloaded samples back in. Label the limit in the UI until then.
- **Latency shaving** for long loops (render a window smaller than the full period).
- **H.7 explicit knob binder** - a "map this slider to knob X" picker replacing the v1
  auto-bind (slider N -> knob N). Earns its complexity only past eight sliders or when two
  patterns fight over knob order. The general version is the native-knob POOL feature in
  [m4l-jweb's TODO](../../m4l-jweb/doc/TODO.md) - a Surface-declared pool of static dials
  that dynamic controls borrow from, which superdough then adopts.

### Bigger native-instrument features

- **H.1 Native MIDI input (`midiIn`/`kb()`).** Ingest the track's incoming MIDI so Live's
  sequencer can drive the pattern; a chain with no note generator implicitly reads MIDI in.
  Needs a `midi_in` wrapper outlet and wiring into strudel's realtime MIDI. Realtime MIDI is
  non-deterministic, so it forces rolling mode.
- **H.2 IPC / external DSP offloading.** Delegate native effects (`.lpf()`, `.crush()`) from
  the instrument to a downstream `alienmind-strudel-fx` over a track-scoped `[send]`/`[receive]`
  channel, instead of baking them into the rendered WAV.
- **H.3 Native Rack integration + macros.** A master `.adg` with superdough (instrument) +
  fx (linked via H.2), the Rack's 16 macros mapped to both devices' native dials for Push.
- **H.4 `orbit()` / `duck()` native sidechaining.** Render multichannel (a stereo pair per
  orbit), route each pair out via `[send~ track-N-orbit-M]`, catch them in parallel Rack
  chains for a native Ableton compressor sidechain.
- **H.5 Multi-orbit processing in the FX device.** Wrap its DSP in `[poly~]` (or parallel
  chains), one per active orbit, driven by orbit-tagged IPC (H.2).
- **H.6 Minimalist superdough synth.** A dedicated `superdough-synth` that takes standard
  Ableton MIDI and evaluates a static sound/effect chain against note events - no timeline
  scheduler, a pure sound module after any MIDI sequencer.
- **Hybrid single-expression instrument.** One line spanning sequencing + sound + fx across
  the rack's devices - the connective tissue is the cross-device channel above (item 3).
- **Route A (no edit latency).** superdough voices built natively as `[poly~]` over the
  `instrument` chain - no offline render, random patterns fully supported. The deferred
  native-external (Route D) is revived only by a confirmed need for zero-latency live-coding
  of non-deterministic patterns.