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

## 1. State defaults on a FRESH instance (m4l-jweb seeding)

The build now seeds every state slot's `[dict]` with its declared default
(`@embed 1` + embedded data). Two things to confirm:

1. **Fresh instance reads its default.** Drag a NEW Strudel MIDI onto a track: the
   editor must show the built-in demo pattern (not blank). Drag a new FX device: no
   black screen, empty line. The Max console `get_state` lines must show the
   defaults, not `{}`.
2. **Restore beats seed.** Type a pattern, save the set, close, reopen: your pattern
   must come back, not the default. A default that wins over a restore is worse than
   the empty dict it replaced.

## 2. Push banks on hardware

The fx surface declares two banks, and the build now writes them into the patcher
(`parameterbanks`). On a Push: the FX device's encoders must page as **Tone**
(cutoff, hpfreq, drive, crush) and **Space** (delay, delaytime, delayfeedback, room,
gain) - named pages, not "Bank 1"/"Bank 2" declaration-order pagination.

## 3. Presets reach the User Library

After R4-c commits `presets/m4l-strudel Rack.adg`: `pnpm build` must list it as a
preset, and `pnpm install:device` must place it next to the devices in
`User Library/Max For Live/m4l-strudel/`. Dragging the rack from Live's browser must
load all its devices.

## 4. SPIKE - drag-to-clip

[SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md): audition a sample in the browser,
then try to drag the row into a Simpler / a Drum Rack / an audio track. The answer
(which payload format, if any, Live accepts from `[jweb]`'s Chromium) is the
deliverable; the reveal-in-folder fallback already ships either way.

# The dependency note

`package.json` points `@m4l-jweb/*` at `^0.9.0`. **m4l-jweb 0.9.x has to be published
before a fresh clone or CI can install** - until then, the local
`link:../m4l-jweb/packages/*` is what makes both repos build together.
