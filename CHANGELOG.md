# Changelog

High-level history of m4l-strudel, grouped by milestone release. This is a 0.x
project, so each minor version is a major milestone. Newest first.

## 0.9.0 - 2026-07-18

Pattern as a first-class signal, a bank-based sampler, and one consistent chrome.

- **Drums Sampler** (was Sampler): code-driven. `s("bd sd, hh*8")` plays a
  drum-machine **bank** (strudel's `bank()`), samples auto-download from the
  tidal-drum-machines repo, 16 voices with an LRU name->slot allocator, and a MIDI
  sequencer in front drives it. Accepts bare expressions (`bd sd, hh!6`) and has its
  own `?` reference.
- **One device chrome**: a single grey `Button` across every device; the `?` sits
  rightmost; the native panels (MIDI Play/Stop) and Full Studio moved into
  **About > Advanced** (FX keeps its top-bar Knobs). MIDI options (octave/shift/scale)
  demoted to a small bottom row.
- **Renames**: `midi-drums` -> `drums-midi`, `sampler` -> `drums-sampler`,
  `sampler-browser` -> `sample-browser` (screen + disk).
- Pattern-driven modulation: patterns drive fx parameters on the tick, with
  remote values pre-warped for the knob exponent.
- fx: `.hpf()` and `.crush()` promoted to real stages; a line that takes signals.
- The Full Studio window, with the pattern kept as state that survives the set.
- A reference window listing which Strudel features each device supports.
- Drag-a-sample-into-a-clip: tried (`DownloadURL`) and failed - CEF strips the
  payload; parked. "Show folder" is the answer.
- Runs on m4l-jweb 0.9.0.

## 0.8.x - 2026-07-13 to 2026-07-16

Native Live surfaces, a real engine, and a shipping pipeline.

- fx device sheds HTML sliders for native Live dials (two-screen web UI vs.
  native knob panel, reflowed via useNativeLayout / useNativePanel).
- Drum-rack editor; empty-map silence fixed.
- Per-device surfaces, set-persistent state, and tempo-aware clip export.
- Sampler browser drops [node.script] and previews through the track.
- midi-drums split into its own device; `s("bd:3")` plays the pad, not note 3.
- Native theming: Live CSS variables mapped to Tailwind.
- Play state exposed as a native Live parameter, synced with the UI.
- User-facing warnings for MAX_CYCLES capping and MIDI structure flattening.
- CI/CD pipeline (ci.yml + release.yml).
- Consumes @m4l-jweb 0.6.x / 0.7.0 from npm.

## 0.7.0 - 2026-07-13

Scale awareness and the Surface.

- Scale awareness, full-loop clip export, drum racks, and a live playhead.
- Strudel Audio FX: a real audio effect on the Surface.
- Upgraded to @m4l-jweb 0.3.0 / 0.4.0 (the Surface); dynamic sliders and an
  add-effect overlay panel.

## 0.6.0 - 2026-07-12

The engine leaves node.script; transport goes live.

- Strudel engine moves from [node.script] to a jweb Web Worker.
- Migrate to m4l-jweb 0.2.0: per-device bundles; the Instrument device dropped.
- LiveAPI transport polling plus a free-run clock; tempo observable.
- Fixes for dead LiveAPI observers (the loadbang loading-context trap), stale
  instances, and plugsync~ outlet mapping.
- Licensed AGPL-3.0-or-later; uses published @m4l-jweb packages.

## 0.1.0 - 2026-07-07 to 2026-07-11

First devices.

- Initial Max for Live MIDI device: Strudel mini-notation to MIDI clip and back,
  on the track it is dropped on.
- Headless Strudel engine plus a multi-device build pipeline.
- Three devices: MIDI sequencer, sample fetcher, and audio instrument (poly~
  synth voice).
- Self-contained .amxd with the UI embedded as a base64 payload in wrapper.js.
- node -> jweb return path, makenote flush, and 3-device installers.
