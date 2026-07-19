# TESTING - what a human still has to check in Live

The test suites pin what the generated patcher SAYS; nothing in CI can hear a filter,
watch a window open, or see a Push encoder page. This file holds **only the open
checks**. What is already confirmed lives where it belongs: the feature in
[README.md](../README.md), the mechanism in [ARCHITECTURE.md](ARCHITECTURE.md) §4f, and
the standing re-check recipes in [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md)
under "Verified in Live".

Proven and no longer tracked here: the browser offline render (spike S1), the m4l-jweb
`renderplay` disk+loop+swap pipe and transport lock (S2/S3/S3b via `hello-render`), and
the superdough device's basic render/playback/transport-lock on real content (synths, the
full trance example - confirmed by ear 2026-07-19).

Confirmed in Live 2026-07-19, no longer tracked (the whole superdough 0.9.5 pass):
serialized renders + node-pool clear (no cross-context connect errors on rapid Play/Stop),
rolling advances while the transport is stopped, console clean, web slider row + re-render,
native dials S1..S8 map and track (both S1 and S2, after the range spike was reverted),
slider->dial rename and reset, re-seed on code edit, two instances isolated,
record/resample capture, set reload recovering the pattern text, and TEMPO LOCK - the
render follows Live's tempo and stays bar-locked at any BPM, with `setcpm()` overriding to
pin the pattern's own rate.

Accepted limits (not bugs): the slider->dial rename takes on the DEVICE PANEL but not the
Rack macro / parameter registry (they stay `s1..s8`), a frozen-device limit; the native
dial travels 0..1 (the app denormalises into the slider's units) because a live.dial's
range is stamped at build time.

## Before you start

```bash
cd m4l-strudel
pnpm build            # writes dist/m4l-strudel/*.amxd
pnpm install:device   # copies them into the User Library
```

Then in Live: **File > New Live Set**, drag **Strudel Superdough** onto a track. If a
device shows a stale build stamp, quit Live entirely and reopen - **Live caches `.amxd`
metadata by filename**; when in doubt, copy the amxd to a new filename and drag that.

---

## No open checks

The superdough 0.9.5 pass is complete - see the confirmed list above. New Live-only checks
land here as they arise. The standing re-check recipes live in
[DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md) under "Verified in Live".
