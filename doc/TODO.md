# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* - patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in `m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

Ideas tried and abandoned are in [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

---

## Open Tasks (Ordered from least to most difficult)

### 1. FIX - "Open folder" is not functional on any device
The **Show folder** button (sample browser and the Drums Sampler) does nothing in Live. Find the reveal that works (e.g., Max `launchbrowser`, `sprintf` to OS shell) and confirm it opens Finder/Explorer on the samples folder.

### 2. TEST - Verify Offline Behavior in Live
Turn network OFF in Live and verify:
- **Responsiveness**: UI thread is not blocked (list/search must not stutter).
- **Catalog Timeout**: Fails within ~12s with a clear message.
- **Download Timeout**: Fails within ~30s, row unsticks from "Fetching...".
- **Cached Samples**: Previously downloaded samples still play offline.

### 3. FEAT - `readFile()` offline sample cache for Superdough
Sample patterns need network on the first render (Chromium blocks `fetch()` of `file://`). Create a bridge `readFile(path) -> ArrayBuffer` to read already-downloaded samples back in.

### 4. FEAT - Sampler Device needs to be able to render a WAV
Ideally, this needs to be able to be saved to clip (same functionality as the MIDI clip save). Render the polysynth device output to disk and then reimport back as audio.

### 5. FEAT - One-click Freeze/flatten for Superdough
Currently, it goes silent because the page re-instantiates offline. Route a render-to-clip drop via the existing `saveToFile`.

### 6. FEAT - Latency shaving for Superdough
Optimize long loops by rendering a window smaller than the full period.

### 7. FEAT - Explicit knob binder (H.7)
A "map this slider to knob X" picker replacing the v1 auto-bind (slider N -> knob N). Useful when dealing with more than 8 sliders or multiple patterns fighting over knob order.

### 8. FEAT - Cross-device coordination in the Rack
Allow a single expression like `note("c3 e3").lpf(800)` to span the rack's sequencer and fx device by establishing a track-scoped cross-device channel (e.g., via LOM observation).

### 9. FEAT - Native MIDI input (`midiIn`/`kb()`) (H.1)
Ingest the track's incoming MIDI so Live's sequencer can drive the pattern. Needs a `midi_in` wrapper outlet and wiring into strudel's realtime MIDI.

### 10. FEAT - IPC / external DSP offloading (H.2)
Delegate native effects (`.lpf()`, `.crush()`) from the instrument to a downstream `alienmind-strudel-fx` over a track-scoped `[send]`/`[receive]` channel, instead of baking them into the rendered WAV.

### 11. FEAT - Native Rack integration + macros (H.3)
A master `.adg` with superdough + fx (linked via IPC), the Rack's 16 macros mapped to both devices' native dials for Push.

### 12. FEAT - `orbit()` / `duck()` native sidechaining (H.4)
Render multichannel (a stereo pair per orbit), route each pair out via `[send~ track-N-orbit-M]`, catch them in parallel Rack chains for native sidechaining.

### 13. FEAT - Multi-orbit processing in the FX device (H.5)
Wrap its DSP in `[poly~]` (or parallel chains), one per active orbit, driven by orbit-tagged IPC.

### 14. FEAT - Minimalist superdough synth (H.6)
A dedicated `superdough-synth` that takes standard Ableton MIDI and evaluates a static sound/effect chain against note events (no timeline scheduler).

### 15. FEAT - Route A (no edit latency)
Superdough voices built natively as `[poly~]` over the `instrument` chain - no offline render, random patterns fully supported. The ultimate native-external (Route D) revival.