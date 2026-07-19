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
clean; the standing re-check recipes live in DRAWER_OF_FAILED_IDEAS.md's "Verified in Live".

---

## Deferred to 1.0.0

### 1. Strudel's own audio in the track (Route B) - IN PROGRESS

The master plan is [IDEA-STRUDEL-INSTRUMENT.md](IDEA-STRUDEL-INSTRUMENT.md) "SUPERDOUGH
Rendering". `OfflineAudioContext` renders the real superdough to a WAV, `saveToFile()`
writes it to disk, and Max loops it double-buffered, crossfading at cycle boundaries.

**RESUME HERE (2026-07-19).** Where the work stands:

- **DONE + verified:**
  - S1 (renderer): `src/lib/render/{offline,wav,determinism,scope}.ts` render synth +
    effects + samples + a full strudel.cc pattern to a non-silent WAV in Chromium. Driven
    by the `spike/` harness (`pnpm spike:render`). See TESTING.md.
  - m4l-jweb library pipe (committed there, `bfb2fac`): `saveToFile`, the `renderplay`
    chain, `render_load`, and the `hello-render` demo device. S2 (bytes to disk) and S3
    (loop + boundary crossfade swap + stop) confirmed in Live.
  - C.5 conductor core: `src/lib/render/conductor.ts` (pure, deps-injected, 7 unit tests).
- **DONE this session - transport sync CODE (steps 1 + conductor half of 3):**
    1. m4l-jweb: `render_sync <slot> <positionMs>` message added to the `renderplay` chain
       (`packages/build/src/chains.mjs`: appended to the app-route, a per-slot `route` drops
       `<positionMs>` into that groove's left inlet as a play position) and the bridge
       (`renderSync()`, `CHAIN_OUT.render_sync`). Patcher regenerates, 240 tests + tsc green.
       The self-clock stays as the transport-stopped fallback.
    2. Conductor transport layer (`src/lib/render/conductor.ts`): new `tick(playing, beats)`
       consumes the LiveAPI tick and, ON THE START EDGE and ON A RELOCATE only (a beat jump
       past `loopBeats/2`), calls `renderSync(activeSlot, phaseMs(beats))` where
       `phaseMs = (beats mod loopBeats)/loopBeats * loopSeconds * 1000`. `ready()` also
       aligns a slot armed while already playing. NOT per-tick (that reintroduces the click).
       6 new unit tests (13 total in conductor.test.ts), tsc + 198 tests green.
    3. hello-render (m4l-jweb) now drives `render_sync` from `tick` the same way - the S3b
       proving harness (align on start/relocate, manual "Re-sync now", transport readout).
       `doc/TEST-CHAIN-RENDERPLAY.md` has the **S3b** Live checklist.
- **NEXT (the GATE) - prove align-once-then-lock in Live on hello-render (human step):**
  run S3b in `doc/TEST-CHAIN-RENDERPLAY.md` - set 120 BPM, arm A, start the transport, and
  confirm the loop locks to the bar; relocate and confirm it re-aligns; FREEZE/FLATTEN the
  track and confirm the beep lands in the pocket (acceptance G.2). `[plugsync~]` is NOT the
  source (outlet 6 read 0 - see the drawer); the tick is. Only AFTER this passes:
- **THEN:** C.6 - the `superdough` device (manifest + `surface.ts` + `App.tsx` full-Strudel
  editor) wired to the conductor's real deps (compile via engine.mjs, renderCycles via
  offline.ts, saveToFile + renderLoad/Arm/Sync from the bridge, tick -> conductor.tick);
  then Phase 3 (Rack preset, STRUDEL-SUPPORT update).
- **Wiring note:** m4l-strudel consumes m4l-jweb via `link:../m4l-jweb/packages/*` (package.json
  + pnpm-lock stay dirty by the standing choice). superdough's own deps (nanostores,
  @kabelsalat/*) were added as devDeps. Before any push/PR: publish the m4l-jweb render
  version and set the `@m4l-jweb/*` deps back to a `^` range.

This is also what the **Sampler's "render to WAV + drop an audio clip"** ask needs (the
MIDI device writes a MIDI clip; a sampler's output is audio). It is deferred here on
purpose: it needs the offline render above plus an upstream `saveToFile()`, neither built.

### 2. Sampler Device needs to be able to render a WAV
And ideally, this needs to be able to be saved to clip
Same functionality as the MIDI clip save.
This does not necesarily needs Superdough (see next items), instead
we render the polysynth device output to disk and then reimport back as audio.

### 3. FIX - "Open folder" is not functional on any device

The **Show folder** button (sample browser and the Drums Sampler) does nothing in Live -
the wrapper now sends the device folder so the button ENABLES, but the reveal itself is
dead. It goes out as `messnamed("max", "launchbrowser", "file://<dir>")` (wrapper
`reveal_folder`), and that does not open the OS file manager here. Find the reveal that
works - a different Max object (`; max launchbrowser` variants, `sprintf` to an OS
`open`/`explorer` shell, or a `[dropfile]`/`[folder]` approach) - and confirm it opens
Finder/Explorer on the samples folder. Until then, samples are still on disk at the path
the status line implies, just not one click away.

### 4. Cross-device coordination in the Rack (enhancement)

Today the Rack's devices are independent: the pattern is typed in Strudel MIDI, the fx
line in the FX device. A single expression spanning both - `note("c3 e3").lpf(800)` split
automatically across the rack's sequencer and fx device - would need a cross-device
channel. Max `[send]`/`[receive]` are global and collide across tracks; LOM observation
of a sibling device is plausible but unproven. A real enhancement, not v1 - do not let it
block anything. (Note: this is coordination BETWEEN our own devices, distinct from the
abandoned "control a foreign device" adopt idea in the drawer.)