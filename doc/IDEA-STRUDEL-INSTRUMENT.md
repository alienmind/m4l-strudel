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
