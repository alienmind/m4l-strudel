# The Strudel Instrument - SHIPPED (0.9.5)

This was the master plan for making ONE Strudel expression drive sequencing, sound and
processing inside Ableton, on the track, locked to the transport. The core of it - **all
of Strudel as the track's audio** - shipped in 0.9.5 as the `alienmind-strudel-superdough`
device (Route B: offline render with the real superdough into a transport-locked,
tempo-following WAV loop).

The design and mechanism that used to live here are now recorded where they belong:

- **How it works** (the renderer, the conductor, determinism/rolling, `saveToFile` + the
  `renderplay` chain, the LiveAPI transport lock, tempo-follows-Live, the slider knobs):
  [ARCHITECTURE.md](ARCHITECTURE.md) §4f.
- **What it does**, for a user: [README.md](../README.md).
- **What was tried and rejected** (the `[plugsync~]` transport source, the unified
  super-device, the runtime `_parameter_range` dial spike):
  [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md).

The forward-looking gap analysis that this document also carried - native MIDI input
(`kb()`), IPC/external DSP offloading, native Rack macros, `orbit()`/`duck()`
sidechaining, the minimalist synth, the explicit knob binder, Route A native voices - is
now the **Future features** section of [TODO.md](TODO.md), one release-shaped item each.

## Durable design constraints (still bind every future stage)

- **A window is an editor, not an engine.** A window's `[jweb]` gets no transport ticks and
  has no signal outlets; the engine stays in the DEVICE view, a window binds the code
  through a shared `state()` slot. Exactly one thing ever schedules.
- **LOM ids are not stable across set reloads.** Persist how you FOUND a thing (name +
  position, a pad's `s()` name), re-resolve on load - never a raw id.
- **Instance-scoped buffers are mandatory.** `---`-prefixed buffer names and per-instance
  WAV filenames; the Rack makes two-instances-in-one-set the normal case.
- **Compose, do not merge; keep the shipped device names.** Separate, properly-typed devices
  sharing `src/app/shared/` beat a forced unified bundle. Renaming an installed device
  breaks user sets and the Rack preset.
- **The `.adg` is hand-saved, never generated.** Re-save the Rack preset whenever a device's
  parameter surface changes shape.
