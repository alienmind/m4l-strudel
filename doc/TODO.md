# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**This file is what is still ahead.** What has shipped is described where it
belongs: [README.md](../README.md) for what a device does, and
[ARCHITECTURE.md](ARCHITECTURE.md) for how and why it does it - including §5a,
the designs that were tried and rejected, so nobody proposes them again.

---

# NEXT: the effects rack

`.lpf()` and `.gain()` work. `.room()`, `.delay()`, `.crush()` and `.hpf()` are
*named* by the device and honestly refused ("no Max chain yet") rather than
silently doing nothing.

**Read the frozen-graph law first** ([ARCHITECTURE.md](ARCHITECTURE.md) §3c): the
DSP graph is written at build time and the line only chooses values. So this is
not "add effects to a chain" - it is **building the rack the device will always
have**, in a fixed order, with every stage able to be exactly neutral.

Three pieces, in order:

1. **The neutral-value rule.** The constraint the frozen graph forces, and the one
   we do not have yet. Every stage is always in the path, so every stage needs a
   setting at which it is *bit-identical* to a wire. `gain: 1.0` and
   `cutoff: 18 kHz` are naturally neutral; a reverb is **not** - it is wet-only and
   needs an explicit dry/wet where 0 is genuinely dry. Six effects without this is
   six colourations you cannot switch off. It wants to be a declared property of a
   chain, and a test.

2. **The reverb and delay chains.** `m4l-jweb`'s maintainers have checked Live's
   own install rather than trusting memory:
   - **`cverb~`** ships inside Live (`resources/externals/m4l/`) - a mono
     reverberator, signal in, reverb time in ms on inlet 1. Mono, so one per
     channel; wet-only, so it needs the dry/wet from (1).
   - **`tapin~` / `tapout~`** for delay, with feedback via `*~` - the standard Max
     delay line. `.delay()`, `.delaytime()`, `.delayfeedback()` map straight onto
     it.

3. **The canonical order.** Since it is frozen, it has to be chosen once:
   filter → drive → delay → reverb → gain. `.lpf(800).room(0.5)` and
   `.room(0.5).lpf(800)` will produce the same signal path, and the UI should say
   so rather than let a user believe otherwise.

**Which effects earn a permanent place** is the real question, since each one costs
DSP whether or not the line mentions it. `hpf`, `room`, `delay` and a drive are a
defensible rack. Convolution-based effects probably never qualify.

**Also: drop `strudelfx` for library stages.** `@m4l-jweb` 0.5.0 makes
`chains: ["lowpass", "gain"]` build a real series (it did not, which is why the
bespoke chain exists). Once we move to 0.5.0, the hand-wired chain should go.

# `s("bd sd")` should not be silence

The single most common idiom on strudel.cc produces **zero MIDI notes, no error,
no sound** - `hapToNote()` reads `note ?? n`, and an `s()` pattern has neither. The
device looks broken; it is being asked for a sound it cannot make.
[STRUDEL-SUPPORT.md](STRUDEL-SUPPORT.md) now says so loudly, but documentation is
the consolation prize here.

**The cheap fix, and it is nearly free:** when a hap has an `s` and no note, look
the sample name up in the **drum map** - which already exists, already maps
`bd`/`sd`/`hh` to Drum Rack pads, and is already user-editable. `s("bd sd")` then
plays a Drum Rack exactly as `bd sd` does, and a rhythm copied off strudel.cc works
unchanged. An `s()` name with no mapping stays silent, as it must.

This is a change to note *generation*, not to the UI, and it deserves its own
discussion: it makes the device honour a control it currently ignores, which is
either the obvious kindness or a lie about what `s()` means, depending on your
view. Worth deciding deliberately rather than drifting into.

# Phase 7.2 - pattern-driven modulation

`.lpf(sine.range(200, 2000))` describes continuous modulation: re-query the pattern
on every transport tick and write a new value at 20 Hz - the same tick-driven
machinery `useStrudel.ts` already has for notes, driving a continuous parameter
instead of discrete ones. The parser refuses it today, loudly, which is the right
failure until this exists.

It is not free, and the cost is worth knowing before starting:

- **Whose modulation is it?** A parameter written 20x a second from the app fights
  Live's own automation lane for the same parameter, and Live has no concept of
  "the app is driving this now". The MIDI-mapping and Push story for a parameter
  under app control is genuinely unclear.
- **20 Hz is not audio rate.** A `sine` sweeping a filter at 20 Hz will step
  audibly. The honest version of fast modulation is a **Max-native LFO in the
  chain, configured by the line** - which is a different design from "the app
  writes values", and probably the right one.

---

# Parked: waiting on `m4l-jweb`

| Wanted | Needs |
|---|---|
| Sampler without `[node.script]` (which can crash Live) | fetch-to-disk, `m4l-jweb` Stage 3.1 |
| `.room()`, `.delay()`, `.crush()` | a reverb/delay chain vocabulary |

**Neither is a hard block.** A missing chain can be self-hosted here in
`patcher/chains.mjs`, exactly as `sampler` and `strudelfx` already are. The cost
is that *we* own the risk, instead of `m4l-jweb` carrying it once for every device
that will ever want it. Do it there unless waiting is genuinely blocking a release.

---

# Loose ends

Small, real, none of them blocking:

- **The playhead highlight only works for bare mini-notation.** It is computed
  from our own AST, whose tokens carry source positions; full Strudel code has no
  link back to the characters the user typed. Strudel's own editor solves this
  with hap `context.locations` from the transpiler - wiring that up means mapping
  locations in the *rewritten* string back to the user's text, which is real work
  for a feature that mostly matters in the dialect that already has it.
- **Full Strudel code does not see the Octave/Shift controls or the Live Scale
  toggle.** It is passed through untouched - correct, since it is real Strudel
  code and rewriting a user's JS would be worse - but it means `note("c5")` there
  is MIDI **72** (Strudel's note names are scientific), while `c5` in bare
  mini-notation is whatever the octave convention says. The UI warns in amber; it
  cannot fix it.
- **The drum map does not travel with the Live set.** It is in `localStorage`, so
  it survives a device reload but not a move to another machine, and two instances
  on two tracks share one map. Per-device persistence needs the wrapper to own it.
- **From Clip flattens structure.** It reads MIDI back as a flat grid of notes, so
  `<a b>` returns as its expanded note list. Inherent to reading MIDI - the
  structure is not in the clip - but now that To Clip exports the *whole* loop, a
  round trip produces a much longer flat pattern than it used to.
- **`MAX_CYCLES` is 64.** A pathologically nested pattern is truncated rather than
  exported. Nobody has hit it; it exists so a typo cannot ask for a
  ten-thousand-bar clip.
- **The Audio FX device has no Live-session persistence either.** Its line lives in
  React state, so it is retyped on reload - the parameters it wrote survive (they
  are real Live parameters), but the text that produced them does not.
