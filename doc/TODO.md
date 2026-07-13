# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**This file is what is still ahead.** What has shipped is described where it
belongs: [README.md](../README.md) for what a device does, and
[ARCHITECTURE.md](ARCHITECTURE.md) for how and why it does it - including §5a,
the designs that were tried and rejected, so nobody proposes them again.

---

# NEXT: more effects in the Audio FX device

`.lpf()` and `.gain()` work. `.room()`, `.delay()`, `.crush()`, `.hpf()` and the
rest are *named* by the device today, and honestly refused ("no Max chain yet -
ignored") rather than silently doing nothing.

**The hard constraint, before any design:** the patcher is frozen at build time,
and the user's line changes at runtime. The DSP graph therefore cannot be built
from the line. Every effect the device will ever apply has to be **in the patcher
already**, with the line only setting values - including the value that means
"off" (a dry/wet at 0, a bypassed `*~`). Growing the vocabulary means growing the
built-in graph and giving each effect a neutral setting, not composing a graph on
the fly.

That makes the real question **which effects earn a permanent place in the
graph**, since each one costs DSP whether or not the line mentions it. A first
answer: `hpf` (the sibling of a filter we already have), `room` (the one people
reach for), `delay`. Convolution-based effects probably never qualify.

**What `m4l-jweb` can do for this:** a reverb/delay chain vocabulary, so the DSP
does not have to be hand-wired here. Composable chains would let `strudelfx` be
assembled from library pieces rather than one bespoke function - but note that
this is a *build-time* composition, not a runtime one; it does not change the
constraint above.

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
