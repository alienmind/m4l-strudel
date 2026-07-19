# Idea: The Strudel Instrument (1.0.0 target)

The end state: ONE Strudel expression drives sequencing, sound and processing at once -
`n("...").scale(...).s("...").rlpf(...).gain(...)` - inside Ableton, on the track, locked
to the transport. This document is the design and the staged path there, and it is
written to REUSE what already shipped in 0.9.0 rather than rebuild it.

## What we already have to build on (0.9.0)

- **Sequencing.** The MIDI device evaluates full Strudel (`n()`, `add()`, `scale()`,
  `.jux()`, ...) against Live's transport and emits notes. The engine, the tick-driven
  scheduler, the resolver and clip export live in `src/app/shared/useStrudelEngine.ts`.
- **Sound.** The Sampler is an `instrument`-chain device: a `[poly~]` of eight sample
  voices over named `[buffer~]`s, played by `playVoice(slot, rate, vel, dur, chans)`,
  with `---` device-scoped buffers so instances do not collide.
- **Processing.** The FX device applies a Strudel effect line (`.lpf().crush().gain()...`)
  as native DSP, with pattern modulation (`.lpf(sine.range(...))`) through the `remote`
  chain and native `live.dial` parameters on Push.
- **Composition.** The shipped **Instrument Rack** preset wires MIDI -> instrument -> FX
  in one draggable library entry, each device its proper Live type, hand-composable.

The instrument is the seam between these, not a rewrite of any of them.

---

## Stage 0 (0.9.0): the code-driven Sampler

**Scheduled for 0.9.0 ([TODO.md](TODO.md) item 2) - the first device to process `s()`
sound-selection code.** Today the Sampler only responds to external MIDI (notes 36..43 ->
pads). It is missing the fundamental Strudel part: it should PROCESS STRUDEL CODE that
names sounds - `s("bd sd, hh*8")` - and play the loaded pads polyphonically from a
pattern.

### Two screens (same UX as the other devices, a Back button)

Restructure the Sampler as a two-view device, flipped by a button - the same shape the
FX device uses for its knob panel, and the MIDI device for its Studio. Here BOTH screens
are the web UI (a code editor and a pad grid), so it is an in-app view switch, not the
native-panel codegen the FX device needs.

- **Primary screen - CODE.** A Strudel pattern editor (reuse `PatternEditor`), where the
  user writes `s("...")` patterns naming the pads: `s("bd sd, hh*8")`. Commas layer,
  `*`/`[]`/`<>` sequence - full mini-notation and full code, exactly like the MIDI device,
  but the tokens are SAMPLE NAMES, not pitches. Polyphony falls out for free: layered
  haps in one tick become several `playVoice()` calls, and `[poly~]` allocates a voice
  each - overlapping sounds do not cut each other.
- **Secondary screen - PADS ("Kit").** The current UI: the eight-pad grid, load a sample
  per pad from any Strudel sample map, click-audition, Show folder. This screen is where
  the KIT is built; the code screen is where it is PLAYED.

### The wiring: `s()` -> `playVoice`

The net-new piece is a sample-driven sink for the engine. Reuse `useStrudelEngine`'s
tick-driven scheduling, but where the MIDI device calls `sendNote` (MIDI out), the
Sampler routes each scheduled hap to `playVoice`:

- Each pad carries a NAME - the `s()` token that triggers it (like the drum-map word ->
  pad idea in `src/lib/mini/drums.ts`). Loading a sound defaults the name from the sample
  (`bd:3` -> `bd`); the pad screen lets the user edit it. `s("bd")` -> the pad named `bd`
  -> its slot index -> `playVoice`.
- Hap controls map onto the voice: `s` picks the slot; `gain` -> velocity; `speed`/`n`
  could pick a variation or a playback `rate` (a melodic sampler repitches, `rate =
  2^((note-root)/12)`; a drum pad stays `rate: 1`). `channels` comes from the pad's
  measured `loadSample`.
- Unknown `s("name")` (no pad of that name) is reported, not silent - the same "say what
  is missing" rule the FX adopt hint used well.

### Why this is the right first step

It is a self-contained upgrade of an existing device (no cross-device channel needed
yet), and it delivers the `s()` half of the hybrid instrument for real. Once the Sampler
processes `s()` code and plays it from the transport, Stage 1 is "also parse `n()` and the
fx tail, and route each part to the engine it already has."

---

## Stage 1: The Hybrid Instrument

**Purpose:** process one comprehensive Strudel line that combines MIDI sequencing, sound
selection and audio transformation into a single expression.

**Example:**
```javascript
$: n("<3@3 4 5 @3 6>*2".add(-14)).scale("g:minor").
  s("supersaw").
  trancegate(1.5,45,1).
  orbit(2).
  rlpf(slider(0.571,0,1)).
  lpenv(2).
  gain(0.5)
```

**Deconstruction, mapped to what exists:**
- **Sequencing** (`n()`, `add()`, `scale()`) - the MIDI device's resolver + engine.
- **Sound** (`s("supersaw")`) - the Sampler's `s()` sink (Stage 0), extended to synth
  voices in Stage 2.
- **Processing** (`rlpf()`, `lpenv()`, `gain()`, `trancegate()`) - the FX device's chain
  + `remote` modulation.

**The approach - COMPOSE, do not merge.** Deliver this by reusing and composing the
modules already built, sharing code through `src/app/shared/` (and `ui:` reuse) where it
already pays. **Do NOT force everything into one unified app / super-device** - that shape
was tried and dropped (see [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md)): device
container types are stamped at build time, and the Rack already delivers the
one-thing-to-drag goal while staying hand-composable. A single line spanning devices needs
the **cross-device coordination** channel that is the open enhancement in
[TODO.md](TODO.md) - that is the connective tissue, and the honest gate for the fully
unified expression.

---

## Stage 2: The Fully Native Instrument

**Purpose:** bring Strudel's own audio engine (superdough) into the track, bit-identical
to the browser, without waiting on a C++ external.

**The offline-rendering route** (see [SPIKE-OFFLINE.md](SPIKE-OFFLINE.md)):

1. **Ahead-of-time render.** `OfflineAudioContext` renders cycle `N+1` of the
   deterministic pattern with the real superdough - the exact web sound.
2. **File handoff.** A new `saveToFile()` wrapper primitive writes the render to a WAV on
   disk.
3. **Double-buffered playback.** `[buffer~]` + `[play~]` locked to `current_song_time`
   play it back, swapping cycle `N`/`N+1` seamlessly.

**Constraints & fallbacks:**
- **Latency:** one-cycle edit latency, unavoidable when audio is generated ahead of time.
- **Stateful/random patterns:** `rand()` and friends cannot be predicted a cycle ahead;
  on detection, fall back with a visible notice.

**Long-term vision:** offline rendering fills the Rack's instrument slot first; the ideal
end state is superdough's voices built natively as `[poly~]` patches over the `instrument`
chain (Route A) - no edit latency, random patterns fully supported. The Sampler's `[poly~]`
keymap (Stage 0) is the on-ramp to that.

---

## Salvaged design constraints (durable, from the retired master plan)

Rules learned the hard way; they bind every stage above.

- **A window is an editor, not an engine.** A window's `[jweb]` is a separate Chromium
  context that receives NO transport ticks and has no signal outlets (measured). The
  ENGINE (worker, scheduler, note/voice stream) stays in the DEVICE view; a window binds
  the code through a shared `state()` slot and broadcasts commits to the device view.
  Exactly ONE thing ever schedules, so Live's quantization and scale are enforced for
  free. (This is why the Sampler's two screens share one engine in the device view.)
- **LOM ids are not stable across set reloads.** Never persist a raw id as "the thing we
  own/bind"; persist how you FOUND it (name + position, a pad's `s()` name) and
  re-resolve on load. The `remote` modulation and the clip-in-rack `ownTrack` climb both
  follow this.
- **Instance-scoped buffers are mandatory for multi-instance.** `---`-prefixed buffer
  names scope per device; the Rack makes two-instances-in-one-set the NORMAL case, so any
  audio buffer the instrument uses must be device-scoped.
- **Compose, do not merge; keep the shipped device names.** Separate, properly-typed
  devices sharing `src/app/shared/` beat a forced unified bundle. Renaming an installed
  device breaks user sets AND the Rack preset - the rack references its `.amxd`s by
  User Library path.
- **The `.adg` is hand-saved, never generated.** Re-save the Rack preset whenever a
  device's parameter surface changes shape.

---

# SUPERDOUGH Rendering - detailed design

**This is the 1.0.0 master plan.** The goal: a device that runs ALL of Strudel -
multiple `$:` lines, every combinator, superdough's real synths, samples and effects -
and delivers its sound as the audio output of the M4L device, on the track, through
Live's fader, sends, freeze and export. Any LLM or human should be able to implement
this end to end from this section alone.

**The verdict up front:** Route B (offline render with the REAL superdough into a WAV,
played back by `[buffer~]`-family objects locked to Live's transport) is the product,
not the spike. The dissection below shows why it is far cheaper than FEAT-NATIVE-AUDIO.md
assumed when it was written: strudel upstream has since shipped most of the render half.
Route D (a C/C++ external streaming an AudioWorklet ring buffer) stays deferred, with its
trigger condition named in D.6.

## Implementation status and one design revision (2026-07-19)

Built and verified so far: the renderer (C.2-C.4 + a `scope.ts` for full-Strudel eval),
proven end to end in Chromium (S1); the m4l-jweb pipe - `saveToFile`, the `renderplay`
chain, `render_load`, and a `hello-render` demo device - with S2 (bytes to disk) and S3
(loop + boundary crossfade swap + stop) confirmed in Live; and the conductor core (C.5,
`src/lib/render/conductor.ts`, unit-tested). See TESTING.md and the m4l-jweb commit.

**One design assumption was WRONG and is revised. TRANSPORT SYNC does not come from
`[plugsync~]`.** This section (A.3, B) assumed the render loop would be driven by the same
`[plugsync~]` the engine worker uses. In Live, `[plugsync~]` outlet 6 (beats) measured
**stuck at 0** while the transport played - and it turns out the shipping devices never
used `[plugsync~]` for transport at all: the wrapper polls `is_playing` +
`current_song_time` (beats) from **LiveAPI** and emits `tick <playing> <beats>` at 20 Hz
(`m4l-jweb packages/wrapper/src/liveapi.ts`). That is the real, proven transport source.

So the loop is driven from `tick`, in the CONDUCTOR (which already receives it), not by a
Max-side transport clock:

- The WAV is rendered to be exactly `loopBeats` long at the current tempo (a tempo change
  is a full re-render anyway), so `[groove~ @loop 1]` at rate 1 loops every `loopBeats` of
  transport time - Live's transport and the audio share ONE clock.
- ALIGN ONCE, on (re)start or relocate: set the groove position to the exact transport
  phase `(beats mod loopBeats)/loopBeats * loopFrames`. Then it stays locked with NO
  per-loop re-sync (which also removes the loop-boundary click a periodic re-sync caused).
- This needs one new `renderplay` message, `render_sync <slot> <positionMs>`. The S3
  self-clock (`groove sync -> edge`) stays only as the transport-stopped fallback.

The consequence for D.3/D.1: the timing brain lives in the app/conductor (TypeScript,
testable), and `renderplay` becomes a play/position/gain primitive. Everything else in
sections C and D stands.

**Implemented (2026-07-19, pending the Live proof).** `render_sync <slot> <positionMs>`
now exists in the `renderplay` chain and the bridge (`renderSync()`), and the conductor's
`tick(playing, beats)` aligns the audible slot on the transport start edge and on a relocate
(`phaseMs = (beats mod loopBeats)/loopBeats * loopSeconds * 1000`), never per-tick. Both are
unit-tested; `hello-render` drives the same path as the S3b proving harness. The one thing
left before C.6 is running S3b in Live (freeze/flatten, confirm bar-lock) - see m4l-jweb
`doc/TEST-CHAIN-RENDERPLAY.md`.

## A. What the dissection found (facts, with file references)

These were all read from the code on 2026-07-19, strudel submodule at its current pin.

### A.1 Strudel already ships the offline renderer

`strudel/packages/webaudio/webaudio.mjs` exports `renderPatternAudio(pattern, cps,
begin, end, sampleRate, maxPolyphony, multiChannelOrbits, downloadName)`:

- It builds an `OfflineAudioContext(2, frames, sampleRate)`, injects it with
  `setAudioContext()` (`superdough/audioContext.mjs:17`) and swaps the output graph with
  `setSuperdoughAudioController(new SuperdoughAudioController(offlineCtx))`
  (`superdough/superdough.mjs:342`).
- It queries the pattern arc, sorts haps by onset ("important for controls that depend
  on audio graph state like `cut`"), and `await`s `superdough(value, t, dur, cps, cycle)`
  per hap. The awaits matter: sample loads (`sampler.mjs loadBuffer` = `fetch` +
  `decodeAudioData`) complete BEFORE `startRendering()`, so samples work offline-rendered.
- `startRendering()` resolves to an `AudioBuffer`; a complete `audioBufferToWav()`
  16-bit PCM WAV encoder lives in the same file (`webaudio.mjs:120-213`).

So "render one cycle with the real superdough" is not a project. What upstream's
function does WRONG for us (and why we write our own thin variant, section C.2):

1. It `close()`s the global realtime AudioContext first and leaves globals swapped
   (restored to `null` in `finally`). Fine for us - our device never plays realtime
   WebAudio at all - but we want a function that does not assume a document.
2. It delivers the WAV via `document.createElement("a")` download click. We need bytes
   handed to `saveToFile()` instead.
3. It is not exported granularly for reuse in a jweb page bundled as one file; we alias
   the submodule anyway (vite.config.ts already does for `@strudel/core` etc), so we
   import the superdough primitives directly and keep `audioBufferToWav` as a small port.

### A.2 superdough is fully context-injectable

- `audioContext.mjs`: module-level singleton with `setAudioContext(ctx)` /
  `getAudioContext()`. Every node creation in `superdough.mjs`, `sampler.mjs`,
  `synth.mjs` goes through `getAudioContext()`.
- `superdoughoutput.mjs`: `SuperdoughAudioController` owns orbits, buses and the
  destination merger; also injectable via `setSuperdoughAudioController()`.
- `initAudio()` (`superdough.mjs:272`) sets polyphony, loads worklets via
  `loadWorklets()`, and only `resume()`s a non-offline context. The worklet URL is a
  `data:text/javascript;base64,...` produced by
  `strudel/packages/vite-plugin-bundle-audioworklet` - a data URL, so it survives our
  single-file jweb bundle, and `OfflineAudioContext.audioWorklet.addModule(dataUrl)`
  works in Chromium (jweb is Chromium). Superdough's fancy DSP (coarse, crush,
  distort shapes, phaser, djf, supersaw detune, ola/stretch) lives in these worklets
  (`worklets.mjs`, `dspworklet.mjs`), so worklets-in-OfflineAudioContext is the single
  most important claim to spike (S1 below).
- The one guard to know: `superdough()` refuses `t < ac.currentTime`
  (`superdough.mjs:484`). An OfflineAudioContext's `currentTime` stays 0 until
  `startRendering()`, so scheduling the whole chunk at t >= 0 is safe.

### A.3 Our engine architecture constrains WHERE rendering runs

- The Strudel scheduler lives in a Web Worker (`src/app/shared/engine.worker.js`),
  fed `[plugsync~]` ticks as messages. **`OfflineAudioContext` does not exist in a
  Worker.** Rendering must therefore run on the jweb page's MAIN thread.
- That is fine: rendering is not tick-driven. The worker keeps owning time (it already
  posts `{t:"phase", cycle}` ~20 Hz); the main thread owns pattern compilation for
  RENDERING (a second, independent `compile()` - `src/max/shared/engine.mjs compile()`
  is pure and already used twice, live + export, without interference).
- Main-thread rendering can jank the editor UI during `startRendering()`. Rendering
  is faster than realtime but not free; the render call itself is async and the WAV
  encode (~1 MB loops) is the only long synchronous piece. Acceptable; measure in S1.
- `patternCycles(pat, cps, ctx, maxCycles)` (`src/max/shared/engine.mjs:181`) already
  measures a pattern's true loop period by signature comparison. We reuse it (raised
  cap) to render ONE FULL PERIOD and loop it, instead of rendering every cycle forever.

### A.4 m4l-jweb: what exists and what is missing

Exists:
- `fetchToFile(url, destPath, onProgress)` in `packages/bridge/src/index.ts:322` +
  the `download` chain: [maxurl] writes straight to disk, two-phase (.part then a
  `file://` GET as the atomic move). The move trick is reusable for saveToFile.
- The wrapper already writes base64 to disk correctly: `extractPayload()` in
  `packages/wrapper/src/core.ts:523` - `File.writebytes` in 4 KB slices (measured
  ~16 KB truncation cap), byte-count verification, `.stamp` sidecar. `saveToFile`
  is this function fed from the bridge instead of from an embedded constant.
- The chains vocabulary (`packages/build/src/chains.mjs`): device-scoped `---` buffer
  names, `samples` ([buffer~]+[groove~] preview), `instrument` ([poly~] sample voices),
  audio endpoints owned by the build, series chaining with `claimAppMessages()`.

Missing (the two upstream deliverables):
1. **`saveToFile(path, bytes)`** - bridge primitive + wrapper handler. No new chain
   needed ([js] does the write), but the atomic-place step reuses [maxurl], so devices
   using it should also declare `download`.
2. **A `renderplay` chain** - double-buffered, transport-locked loop playback of a WAV
   pair from disk. Nothing like it exists yet; full spec in D.3.

### A.5 Sample loading inside jweb (the one genuinely open risk)

`loadBuffer()` fetches sample URLs with `fetch()`. Online, in jweb, that works (the
sample browser already `fetch()`es catalogs). But the jweb page is served from
`file:///...` and Chromium blocks `fetch()`/XHR of `file://` URLs, so samples already
downloaded to disk by `fetchToFile()` CANNOT be read back into the page directly.
Consequences:

- First render of a sample-using pattern needs network (superdough fetches from the
  https URL; its module-level `loadCache`/`bufferCache` then hold decoded buffers for
  the session, so subsequent renders are free).
- For offline parity with the samples already cached on disk, add a bridge
  **`readFile(path) -> ArrayBuffer`** (the inverse of saveToFile: [js] `readbytes`,
  base64 chunks in via the existing inlet path). This is the ONE place bulk bytes
  cross the bridge inbound; it is a user-triggered cache load, not a data plane.
  Ship it as a follow-up (Phase 4), not in the critical path; label the limitation
  in the UI until then ("sample patterns need network on first render").

## B. Architecture overview

```
  jweb page (main thread)                         Max side
  +--------------------------------+
  | PatternEditor (full Strudel,   |
  |   multi-line $:)               |
  |                                |
  | useSuperdoughRender            |     saveToFile (base64 chunks)
  |  - compile() (engine.mjs)      | --> [js] wrapper: writebytes .part,
  |  - patternCycles => period P   |     maxurl file:// place, save_done
  |  - determinism check           |
  |  - renderChunk(P cycles)       |     render_load / render_arm
  |    OfflineAudioContext         | --> renderplay chain:
  |    + real superdough           |     [buffer~ ---rndA] [buffer~ ---rndB]
  |  - audioBufferToWav            |     [phasor~ @lock 1] -> [*~][+~] -> play
  +--------------------------------+     crossfade swap at cycle boundary
  | engine.worker.js (existing)    |     -> [plugout~] = the track's audio
  |  - keeps owning transport time |
  |  - posts phase for playhead    |
  +--------------------------------+
```

One sentence: **the pattern is compiled twice (live playhead + renderer), rendered one
full period at a time into alternating WAV files next to the device, and Max plays the
current file in a transport-locked loop, swapping to the freshly rendered file at the
next cycle boundary.**

Edit latency = render time + save time + buffer read, quantized up to the next cycle
boundary. For a 2 s cycle this is well under one cycle in the common case.

## C. m4l-strudel work items (code level)

### C.1 Build wiring

`vite.config.ts`: add submodule aliases and the worklet plugin.

```ts
import bundleAudioWorklet from "vite-plugin-bundle-audioworklet"; // add to devDeps,
// or import directly: ./strudel/packages/vite-plugin-bundle-audioworklet/vite-plugin-bundle-audioworklet.js

// plugins: [..., bundleAudioWorklet()],
// resolve.alias, next to the existing @strudel/* entries:
{ find: "superdough", replacement: strudelPkg("superdough/index.mjs") },
{ find: "@strudel/webaudio", replacement: strudelPkg("webaudio/index.mjs") },
```

Note `webaudio.mjs` imports `supradough` (`./supradough.mjs` within the webaudio
package plus the `supradough` package for `workletUrl`); follow the import errors and
alias what it asks for. If pulling `@strudel/webaudio` drags too much (kabelsalat is
lazy-imported so it should not), import only `superdough` and port
`audioBufferToWav` (200 lines, section C.3) - that is the recommended shape.

### C.2 `src/lib/render/offline.ts` - the renderer

```ts
import {
  superdough, initAudio, setAudioContext, setSuperdoughAudioController,
  resetGlobalEffects,
} from "superdough";
import { SuperdoughAudioController } from "superdough/superdoughoutput.mjs";
import { audioBufferToWav } from "./wav"; // ported encoder, C.3

export interface RenderResult { wav: ArrayBuffer; seconds: number; }

/**
 * Render cycles [begin, begin+cycles) of `pat` with the real superdough.
 * Pure with respect to the engine worker: `pat` comes from a fresh compile()
 * on the main thread. Superdough's globals are swapped for the duration; this
 * device has no realtime superdough, so nothing is disturbed.
 */
export async function renderCycles(
  pat: Pattern, cps: number, begin: number, cycles: number,
  sampleRate = 44100,
): Promise<RenderResult> {
  const seconds = cycles / cps;
  const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
  setAudioContext(ctx);
  setSuperdoughAudioController(new SuperdoughAudioController(ctx));
  try {
    await initAudio({}); // loads worklets into THIS context (data: URLs)
    const haps = pat.queryArc(begin, begin + cycles, { _cps: cps })
      .filter((h) => h.hasOnset())
      .sort((a, b) => a.whole.begin.valueOf() - b.whole.begin.valueOf());
    for (const hap of haps) {
      hap.ensureObjectValue();
      // times relative to the chunk start, in seconds
      await superdough(
        hap.value,
        (hap.whole.begin.valueOf() - begin) / cps,
        hap.duration.valueOf() / cps,
        cps,
        hap.whole.begin.valueOf() - begin,
      );
    }
    const buffer = await ctx.startRendering();
    return { wav: audioBufferToWav(buffer), seconds };
  } finally {
    setAudioContext(null);          // next getAudioContext() re-defaults
    setSuperdoughAudioController(null);
    resetGlobalEffects();
  }
}
```

Details that matter:
- `setAudioContext(null)` then `resetGlobalEffects()`: mirrors upstream's `finally`.
  `getAudioContext()` lazily builds a fresh (realtime) context if anyone asks later;
  nobody should, but do not leave a closed offline context installed.
- `initAudio({})` per render re-loads worklets into the new context. `loadWorklets()`
  caches only the in-flight promise, not per-context - verify it actually re-adds for
  a NEW context (it calls `getAudioContext()` at call time; the `workletsLoading`
  reset to `undefined` on completion makes repeat calls work). If a stale-guard bug
  bites, call `audioCtx.audioWorklet.addModule(...)` ourselves.
- Superdough's sound map: `registerSound()` for synths happens on import of
  `superdough` (synth.mjs registers sine/saw/supersaw/...); `samples()` maps must be
  loaded once on the main thread via `@strudel/webaudio`'s `samples()` (or the
  superdough `registerSound` path our samples.ts already mirrors) before the first
  sample render. Load the default strudel map (`https://raw.githubusercontent.com/...
  dirt-samples`) the same way strudel.cc's repl does - reuse `src/lib/samples.ts`
  resolution which is already ported from `sampler.mjs`.

### C.3 `src/lib/render/wav.ts`

Straight port of `audioBufferToWav` + `encodeWAV` + `interleave` +
`floatTo16BitPCM` + `writeString` from `strudel/packages/webaudio/webaudio.mjs:120-213`
(AGPL, same license family as this repo - keep the copyright header). 16-bit PCM,
interleaved stereo. No changes.

### C.4 `src/lib/render/determinism.ts`

A pattern that is random or history-dependent cannot be pre-rendered without changing
what it means. Detect, do not guess:

```ts
/** Query the same arc twice and compare serialized haps. Strudel's rand family
 *  is time-seeded-per-query in ways that make two queries disagree; a
 *  deterministic pattern serializes identically. Also scan the source for the
 *  known offenders as a belt (query equality is the suspenders). */
const RANDOM_RE = /\b(rand|irand|perlin|chooseIn?|wchoose|degrade(By)?|sometimes(By)?|often|rarely|almost(Never|Always)|randcat|shuffle|scramble)\b/;

export function isDeterministic(code: string, pat: Pattern, cycles: number, cps: number): boolean {
  if (RANDOM_RE.test(code)) return false;
  const sig = (arc: Hap[]) => arc.map(h =>
    `${JSON.stringify(h.value)}@${h.whole?.begin}+${h.duration}`).sort().join("|");
  const a = pat.queryArc(0, cycles, { _cps: cps });
  const b = pat.queryArc(0, cycles, { _cps: cps });
  return sig(a) === sig(b);
}
```

Non-deterministic verdict does NOT kill the feature: it drops to **rolling mode** -
render cycle N+1 (not a loop), always one cycle ahead, accept that each rendered cycle
freezes one roll of the dice. The UI says so: "random pattern: rendering ahead, each
cycle is one realization". Only patterns whose NEXT cycle depends on live input have
no honest render, and Strudel has none of those today.

### C.5 `src/app/shared/useSuperdoughRender.ts` - the conductor

State machine, main thread, one instance per device:

```
idle -> compiling -> probing (patternCycles + determinism)
     -> rendering(chunk) -> saving(saveToFile) -> loading(render_load)
     -> armed (Max swaps at boundary) -> looping
edit / tempo change / Run  => back to compiling, into the OTHER slot (A/B)
```

Key logic (sketch):

```ts
const MAX_LOOP_SECONDS = 60;          // cap: period * cycleSeconds
const SLOTS = ["rndA", "rndB"] as const;

async function evaluate(code: string, bpm: number, beatsPerCycle: number) {
  const cps = bpm / 60 / beatsPerCycle;
  const pat = await compile(code);          // same engine.mjs compile: $:-aware
  const period = patternCycles(pat, cps, null, 64);
  const deterministic = isDeterministic(code, pat, period, cps);
  const cycles = deterministic
    ? Math.min(period, Math.max(1, Math.floor(MAX_LOOP_SECONDS * cps)))
    : 1;                                    // rolling mode: one cycle at a time
  const { wav, seconds } = await renderCycles(pat, cps, nextBegin(), cycles);
  const slot = SLOTS[generation++ % 2];
  const path = `render/${slot}.wav`;        // relative => device folder, like fetchToFile
  await saveToFile(path, wav);              // bridge, D.1
  outlet(OUT.render_load, slot, path, cycles * beatsPerCycle);  // Max reads buffer~
  // wrapper replies render_ready -> outlet(OUT.render_arm, slot) to swap at boundary
}
```

- **Loop mode** (deterministic): render once, Max loops it forever; re-render only on
  edit or tempo change (debounce tempo 300 ms; a tempo change alters cps and thus
  every duration, so it is a full re-render).
- **Rolling mode**: on each `phase` message crossing a cycle boundary, kick the next
  cycle's render into the idle slot. If a render misses its boundary (too slow),
  Max keeps looping the stale buffer and the UI shows "render behind".
- Transport lock: playback position comes from Max ([phasor~ @lock 1]), not from us;
  we only choose WHAT is in the buffers and WHEN to swap.
- Reuse from `useStrudelEngine`: keep the worker alive purely for the playhead
  highlight and the free-run clock display; notes/voices sinks are unused here. Add a
  third sink value `"none"` in the worker `code` message so haps are not pointlessly
  posted (one-line change in `engine.worker.js`).

### C.6 The new device

`patcher/devices.mjs`:

```js
{
  name: "alienmind-strudel-superdough",
  ui: "superdough",
  type: "instrument",                   // sits in the Rack's instrument slot
  mode: "superdough",
  chains: ["renderplay", "download"],   // renderplay is new (D.3); download for the
                                        // atomic file place + future sample prefetch
  renderSlots: ["rndA", "rndB"],        // consumed by the renderplay chain
  unmatchedTo: "js",
}
```

`src/app/superdough/`: `App.tsx` (PatternEditor + status + determinism notice + render
health line), `surface.ts` (params: `play`, plus `code` state slot - same shape as the
MIDI device's). The editor accepts FULL Strudel: no mini-notation resolving, no
NoteContext - the code goes to superdough verbatim, which is precisely how ALL of
Strudel gets supported, multiple `$:` lines included (`compile()` stacks them).

Update the Rack preset (hand-saved .adg, per the standing rule) with this device as an
alternative instrument chain once it ships.

## D. m4l-jweb work items (code level)

### D.1 Bridge: `saveToFile(path, bytes)` in `packages/bridge/src/index.ts`

```ts
const SAVE_B64_CHUNK = 8192; // chars per message; well under Max atom limits

export function saveToFile(destPath: string, bytes: ArrayBuffer): Promise<{ bytes: number }> {
  bindSaveRepliesOnce();  // save_done / save_error, same shape as fetch_done
  return new Promise((resolve, reject) => {
    const id = Math.random().toString(36).slice(2, 10);
    saveResolvers.set(id, { resolve, reject });
    const b64 = arrayBufferToBase64(bytes); // chunked btoa, 32 KB slices
    outlet(CHAIN_OUT.save_begin, id, destPath, bytes.byteLength);
    for (let o = 0; o < b64.length; o += SAVE_B64_CHUNK)
      outlet(CHAIN_OUT.save_chunk, id, b64.slice(o, o + SAVE_B64_CHUNK));
    outlet(CHAIN_OUT.save_end, id);
  });
}
```

Add to `CHAIN_OUT`: `save_begin/save_chunk/save_end`; to `CHAIN_IN`:
`save_done/save_error`. Base64 has no spaces/commas, so a chunk travels as one Max
symbol safely.

### D.2 Wrapper: the save handler in `packages/wrapper/src/core.ts`

Reuses `extractPayload`'s exact write discipline:

```ts
var activeSave: { id: string; path: string; expect: number; file: File } | null = null;

function save_begin(id: string, destPath: string, byteCount: number): void {
  var target = resolveFetchPath(destPath) + ".part";   // same resolver as fetchToFile
  var f = new File(target, "write"); if (!f.isopen) f.open();
  if (!f.isopen) { outlet_msg("save_error", id, "cannot open " + target); return; }
  f.eof = 0;
  activeSave = { id: id, path: destPath, expect: byteCount, file: f };
}
function save_chunk(id: string, b64: string): void {
  if (!activeSave || activeSave.id !== id) return;
  var bytes = b64decode(b64);
  for (var off = 0; off < bytes.length; off += 4096)   // the measured 16 KB cap rule
    activeSave.file.writebytes(bytes.slice(off, off + 4096));
}
function save_end(id: string): void {
  if (!activeSave || activeSave.id !== id) return;
  activeSave.file.close();
  // verify size, then atomic place: GET file://<part> -> filename_out <dest>
  // via [maxurl], identical to fetchToFile phase 2 (placeFile()). On its
  // response: verify, then outlet save_done id bytes.
}
```

Failure modes to honor (all already learned by fetchToFile): verify byte count after
close; never touch the destination until the .part verified; `overwrite_output_file: 1`
on the place request; reply `save_error` with a reason string on any miss.

Throughput note: ~350 KB WAV -> ~470 KB base64 -> ~60 messages. The UI payload
extraction already pushes megabytes of base64 through this VM at load; a per-cycle
350 KB is comfortably inside measured behavior. Measure anyway in S2.

### D.3 Build: the `renderplay` chain in `packages/build/src/chains.mjs`

The one genuinely new Max design. Contract:

- Manifest: `renderSlots: [nameA, nameB]` (exactly two). Creates
  `[buffer~ ---<slot>]` per slot.
- Inbound messages (from the app via [js] or route):
  - `render_load <slot> <absPath> <lengthBeats>`: `replace <path>` into the slot's
    buffer~; on the buffer~ bang-on-read-complete, reply `render_ready <slot>`.
  - `render_arm <slot>`: at the NEXT loop boundary, crossfade playback to `<slot>`
    and adopt its `<lengthBeats>`.
  - `render_stop`: fade out in 10 ms, stop.
- Playback core (per slot):

```
[phasor~ <lengthBeats as note value or ticks> @lock 1]   <- Live-transport locked
   |
[*~ frames(slot)]        frames from [info~] after replace
   |
[play~ ---<slot>]        position-driven (signal inlet), loop = phasor wrap
   |
[*~ gainA]  ---crossfade--- [*~ gainB]
   \----------[+~]----------/
              |
        ctx signal tail -> [plugout~]   (the endpoints the build owns)
```

- The crossfade swap: `render_arm` sets a flag; a `[edge~]`/`[change~]` on the phasor
  wrap fires the gain lines (`[line~]`, 15 ms equal-power) so the swap lands exactly
  on the loop boundary. Loop length changes take effect with the swap.
- `@lock 1` with a tempo-relative interval is the claim to verify FIRST (S1): phasor~
  accepts note-value timing and transport lock, but `lengthBeats` is arbitrary
  (e.g. 7 beats), which note values do not spell. Fallback if note values are too
  rigid: drive position from `[plugsync~]`'s beat count - `beats % lengthBeats /
  lengthBeats * frames` in a `[snapshot~]/[sig~]`-free gen~ or scale chain; or accept
  `[groove~]` with loop points and a periodic hard re-sync (`startloop`) at each
  boundary, which hides drift under the crossfade. Decide by measurement, not taste.
- Multi-instance safe by construction: `---` buffer names (the existing `bufName`
  helper), and the WAV filenames are per-device-folder anyway.

### D.4 Docs and tests upstream

- README device table: a `hello-render` demo device (sine-beep WAV written by the
  harness, looped on the transport) - the proving ground before m4l-strudel touches it.
- `doc/TEST-CHAIN-RENDERPLAY.md` mirroring TEST-CHAIN-FX.md: load, arm, swap,
  tempo change, two instances on two tracks.
- Harness mocks: `saveToFile` resolves after writing to an in-memory map;
  `render_ready` simulated on `render_load`.

## E. Order of work (phases, each gated by a spike that can fail in an afternoon)

**S1 (spike, m4l-strudel, browser only - no Live needed):** render
`s("bd sd").lpf(800).room(.5)` and a supersaw line through `renderCycles()` in plain
Chromium; listen to the WAV. Proves: worklets in OfflineAudioContext, sample fetch
before startRendering, WAV encoder. Kills the whole plan if worklets fail (they
should not; strudel.cc's own "render audio" button uses this path).

**S2 (spike, m4l-jweb, in Live):** `saveToFile()` of a generated 500 KB WAV from a
jweb page; verify bytes on disk, time it. Proves the D.1/D.2 pipe and measures the
per-cycle budget.

**S3 (spike, m4l-jweb, in Live):** the `renderplay` chain looping a known WAV locked
to the transport; change tempo; arm-swap to a second WAV at a boundary. This is the
UNVERIFIED Max claim (phasor~ @lock with arbitrary loop lengths) - the fallbacks in
D.3 are part of the spike.

**Phase 1 (m4l-jweb 1.0.0-beta):** productize S2+S3: bridge saveToFile, wrapper
handler, renderplay chain, hello-render device, tests, CHANGELOG.

**Phase 2 (m4l-strudel):** C.1-C.5 (renderer, wav, determinism, conductor), the
superdough device C.6, loop + rolling modes, status UI.

**Phase 3 (integration):** Rack preset variant, TESTING.md checklist (two instances,
set reload, freeze/export, tempo automation, offline behavior), STRUDEL-SUPPORT.md
update - the support answer becomes "everything superdough plays, rendered".

**Phase 4 (follow-ups, not gating 1.0.0):** `readFile()` for offline sample cache
(A.5); the Sampler's own "render to audio clip" (TODO item 2) rides the same
saveToFile + a clip-slot drop; latency shaving (render window < full period for
long loops).

## F. Route D appendix - the native external, and its trigger

Kept deferred. The named requirement that would revive it: **zero-latency live-coding
of non-deterministic patterns** (rolling mode's one-cycle realization freeze is the
only musical honesty gap in this design). If that requirement is ever confirmed by
real users, the shape is: an `AudioWorklet` in jweb writes PCM into a
SharedArrayBuffer ring; a `jweb.audio~` external (min-devkit, ~300 lines, macOS
arm64/x64 + Windows x64) reads it in `perform64()`; drift handled by a resampling
read pointer. Costs that stand unchanged from FEAT-NATIVE-AUDIO.md: two platforms,
signing, a realtime thread that can crash Live, and SharedArrayBuffer needing
cross-origin isolation flags jweb may not grant (spike THAT first if this ever
starts). Everything in sections C and D remains the product either way; the external
would only replace D.3's disk hop.

## G. Acceptance criteria for "Native Strudel Superdough Rendering, 1.0.0"

1. Any pattern that plays on strudel.cc plays from the device, bit-identical modulo
   the 16-bit WAV floor, through the track's fader and sends. Multi-line `$:`,
   samples, synths, orbits, room/delay/phaser/crush included.
2. Live's transport starts/stops/relocates it; tempo changes re-render and re-lock.
3. Editing code audibly updates at the next cycle boundary (deterministic) or the
   next rendered cycle (random, with the visible notice).
4. Two instances in one set do not interfere (buffers, filenames, [poly~]-free here).
5. Freeze/flatten/export capture the sound with no extra setup.
6. Everything that could not be pre-rendered says so in the UI instead of sounding
   different in silence.
