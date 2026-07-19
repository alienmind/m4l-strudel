# TESTING - what a human still has to check in Live

The test suites pin what the generated patcher SAYS; nothing in CI can hear a filter,
watch a window open, or see a Push encoder page. This file holds **only the open
checks**. Everything already confirmed - and the recipe to re-check it if the code
underneath changes - lives in [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md) under
"Verified in Live".

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

## Open check: S1 - superdough offline render (browser only, no Live)

The first spike of the SUPERDOUGH Rendering feature (doc/IDEA-STRUDEL-INSTRUMENT.md,
section E). It proves the load-bearing claim of Route B: the REAL superdough - worklets,
synths, samples, effects - renders inside an `OfflineAudioContext` in Chromium, and the
ported WAV encoder produces a playable file. This runs in a plain browser; Live is not
involved yet (that is spikes S2/S3, once the device ships).

**Run it:**

```bash
cd m4l-strudel
pnpm spike:render        # starts a vite dev server on http://127.0.0.1:4180
```

Open `http://127.0.0.1:4180/` in Chrome. Then:

1. Click **Render** (the default pattern is `s("bd sd").lpf(800).room(.5)` - a sample
   pattern, so the first render fetches the dirt-samples map over the network; give it a
   few seconds). The log line should read `OK: ... bytes, ... s audio, rendered in ...ms`.
2. Click **Play**. **You should HEAR a filtered, reverbed kick-snare loop.** That is the
   whole test: if it sounds like the pattern, superdough rendered offline correctly.
3. Click **Download WAV** and open the file in any audio editor to confirm it is a valid
   16-bit stereo WAV (this exercises `src/lib/render/wav.ts`, the same encoder the device
   ships).
4. Edit the textarea and re-render to spot-check other patterns:
   - a synth line, e.g. `note("c e g a").s("supersaw").lpf(sine.range(200,2000))`
   - multiple `$:` lines (paste two `$: ...` lines) - `compile()` stacks them
   - a busier effect chain: `.room(.8).delay(.5).crush(4)`
   - a REAL strudel.cc pattern from [examples/](examples/), e.g. paste
     `switch_angel - trance example.strudel` wholesale. This exercises the full-Strudel
     scope shims (`src/lib/render/scope.ts`): `setCpm`/`setCps` (tempo, auto-fills the cps
     box), `slider`/`sliderWithID` (returns its value), `register` (custom combinators),
     the `@strudel/draw` params like `.fill()`, and `._scope()` (no-op offline). If a
     pasted pattern throws `X is not defined`, X is a repl helper the headless engine does
     not provide yet - add the shim to scope.ts. Confirmed: the trance example renders
     (headless `?auto&trance`, cps 0.625 from its `setCpm(150/4)`).

**What passes:** every pattern that plays on strudel.cc plays here, and the downloaded WAV
matches what you heard. **What fails the spike:** silence, a thrown error in the log, or a
worklet-related console error (`AudioWorklet` failing to add a module) - that would kill
Route B and is the reason this spike exists.

**Headless smoke test (CI-ish, no listening):** `http://127.0.0.1:4180/?auto` auto-renders
a synth+effects pattern and writes a `S1:PASS peak=... bytes=...` verdict to the page
`<title>`; add `&samples` for the sample path, or `&trance` to render the trance example
end to end. `spike/cdp-run.mjs` drives this over the DevTools protocol for an automated
pass/fail. Confirmed PASS 2026-07-19 for synth, lpf+room, sample patterns, and the trance
example.

> Gotcha: the whole render can look like it "hangs" when the only thing wrong is that the
> dev server has stopped. Confirm `http://127.0.0.1:4180/` still serves before believing a
> stall.

## Open Live check: the renderplay pipe (m4l-jweb hello-render)

S2 + S3 are confirmed via the `hello-render` demo device in m4l-jweb - see that repo's
[doc/TEST-CHAIN-RENDERPLAY.md](../../m4l-jweb/doc/TEST-CHAIN-RENDERPLAY.md). Save-to-disk,
the double-buffered loop, the boundary-quantized crossfade swap, and stop all work.

## NEXT SPIKE (open): transport sync

The renderplay loop currently SELF-CLOCKS off `[groove~]`'s sync outlet - it plays and
swaps, but is not locked to Live's bar (fails acceptance G.2). The next spike proves the
real lock, and it can be done on `hello-render` before the superdough device exists:

1. Drive the groove's play position from the transport. The wrapper already emits `tick
   <playing> <beats>` (from LiveAPI `current_song_time`, NOT `[plugsync~]` - that read 0).
2. On transport start / relocate, set the groove position to the exact phase
   `(beats mod loopBeats)/loopBeats * loopFrames` via a new `render_sync <slot> <positionMs>`
   renderplay message, then let rate-1 `@loop` hold it.
3. **Passes if:** a rendered downbeat lands on Live's downbeat, the loop stays in the pocket
   across bars with no per-loop click, and it re-aligns after a transport relocate. **Freeze
   / flatten** the track and confirm the captured audio is in time - that is the whole point.

See [IDEA-STRUDEL-INSTRUMENT.md](IDEA-STRUDEL-INSTRUMENT.md) "Implementation status and one
design revision" for the why.

The standing re-check recipes for shipped 0.9.x behaviour live in
[DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md) under "Verified in Live".

# The dependency note

`package.json` points `@m4l-jweb/*` at `^0.9.0`, and m4l-jweb 0.9.0 is published to
npm - a fresh clone or CI installs the published packages, no local link needed.

(In-progress cross-repo work bumps to a not-yet-published 0.9.1 and temporarily
consumes it via `link:../m4l-jweb/packages/*` on disk; that link is dropped and
0.9.1 published once the round is confirmed working.)
