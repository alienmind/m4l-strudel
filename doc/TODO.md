# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk - lives in `m4l-jweb`'s own
[doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**What comes next is at the top. What is already done is at the bottom.**

---

# NEXT: Phase 7 - Strudel Audio FX

**Nothing in `m4l-jweb` blocks a v1 of this**, as long as v1 is scoped to `.lpf()`
and `.gain()`. Both DSP chains already ship there (`lowpass` and `gain`, Stage 3.4,
proven by its `hello-audio` example), and the one-line expression is parsed with
`@strudel/transpiler`, which this repo already bundles. What is NOT available is a
generated Push-visible parameter set (`m4l-jweb` Stage 2 has the declaration but
not the codegen), so v1 hand-wires `writableParams()` and the manifest's
`parameters` field, exactly as `hello-audio` does today.

## The reframe

The third device should never have been an instrument. Strudel already has a real
vocabulary of audio-effect primitives (`.lpf()`, `.hpf()`, `.room()`, `.gain()`,
`.delay()`, `.crush()`, `.pan()`, ...) - the thing this device should do is let you
write **one line** describing an effects chain and apply it to whatever audio is
already coming into the track, the way a producer reaches for Auto Filter or a
reverb send. Not a synth, not a sample player, not a note editor: an **audio
effect** (`type: "audio"`, the same container tag as the Sampler), sitting anywhere
in an audio chain.

**What it is not.** No pattern editor, no Bars/Grid/Octave/Shift, no To Clip/From
Clip - none of the MIDI device's UI has any business here. The UI it wants is
closer to `hello-audio` (a compact readout of the *live* effect parameters) than to
anything in this repo.

## 7.1 v1: static values, `.lpf()` and `.gain()` only

1.  **Parse the line with Strudel's own machinery, not a new parser.**
    `.lpf(800).gain(1.2)` is JavaScript method chaining; the transpiler that
    already backs Live Play can evaluate it. Walk the resulting pattern (or, for
    constant arguments, the AST) to pull out `{ effect: "lpf", args: [800] }`.
    Reuse `src/lib/strudelCode.ts`'s parse path rather than inventing a second one
    - the same lesson Phase 5 learned about the mini-notation parser.
2.  **Drive the real DSP chains** with `writableParams()`'s `set_<id>` pattern.
    `lpf` maps onto the packaged `lowpass` chain (`plugin~ -> onepole~ ->
    plugout~`), `gain` onto `gain` (`*~`).
3.  **Static values are the honest v1.** The user edits the line, the app parses it
    once and writes each value with `set_<param>` - `hello-audio`'s Cutoff slider,
    driven by text instead of a drag.

## 7.2 v2: pattern-driven modulation, and it is not free

`.lpf(sine.range(200,2000))` describes continuous modulation: re-query the pattern
on every transport tick and write new `set_<param>` values at 20 Hz - the same
tick-driven machinery `useStrudel.ts` already has, driving continuous parameters
instead of discrete notes. Only build this once static values work and are worth
automating.

## Open questions, not yet answered

- Which Strudel effects get a real Max-native mapping first, and which never will
  (heavily convolution-based ones may have no reasonable `plugin~`-chain
  equivalent at all)?
- Does one text line stay the whole interface, or does it need per-effect sliders
  once more than two or three effects are chained?
- Is `.lpf(800)` legible to someone who does not already have strudel.cc's docs
  open?

---

# Parked: waiting on `m4l-jweb`'s spikes

Not blocked on design - blocked on a Max behaviour nobody has verified. `m4l-jweb`
gates all three behind cheap spikes ([SPIKES.md](../../m4l-jweb/doc/SPIKES.md));
**none have been run**, so everything here is still a drawing, not code.

| Wanted | Needs | Spike |
|---|---|---|
| Sampler without `[node.script]` (which can crash Live) | fetch-to-disk, `m4l-jweb` Stage 3.1 | **1.3** - `[maxurl]` or `[jit.uldl]`? |
| `.room()`, `.delay()`, `.crush()` in the Audio FX device | a reverb/delay chain vocabulary `m4l-jweb` does not have | - |
| A Push-visible parameter set for Audio FX | Surface codegen, `m4l-jweb` Stage 2 | - |

**We are not hard-blocked on any of them.** A missing chain can be self-hosted here
in `patcher/chains.mjs`, exactly as the `sampler` chain already is. The cost of
doing that is that *we* own running the `[maxurl]` spike and eating the risk,
instead of `m4l-jweb` running it once for every device that will ever want it. Do
it there unless waiting is genuinely blocking a release.

---

# Loose ends surfaced while building Phases 1-5

Small, real, and none of them blocking:

- **The playhead highlight only works for bare mini-notation.** It is computed
  from our own AST, whose tokens carry source positions. Full Strudel code is real
  JavaScript: its events come out of the engine with no link back to the characters
  the user typed, so it gets no highlight. Strudel's own editor solves this with
  hap `context.locations` from the transpiler; wiring that up would mean mapping
  locations in the *rewritten* string back to the user's text, which is a real
  piece of work for a feature that mostly matters in the dialect that already has
  it.
- **Full Strudel code does not see the Octave/Shift controls, or the Live Scale
  toggle.** Bare mini-notation is resolved to absolute MIDI numbers before it
  reaches the engine, so Live Play and To Clip agree exactly (see DONE below). Real
  JavaScript is passed through untouched, so `note("c5")` there means whatever
  *Strudel* says it means - MIDI **72**, since Strudel's own note names are
  scientific (`c4` = 60, verified against `@strudel/core`). That is correct - it is
  real Strudel code, and rewriting the user's JS would be worse - but the two
  dialects disagree about `c5`. The UI says so in amber; it cannot fix it.
- **The drum map does not travel with the Live set.** It is in `localStorage`, so
  it survives a device reload but not a move to another machine, and two instances
  on two tracks share one map. Persisting per-device state needs the wrapper to own
  it (a `pattr`, or the Surface once it lands).
- **From Clip still flattens structure.** It reads MIDI back as a flat grid of
  notes, so `<a b>` comes back as its expanded note list, not as `<a b>`. Inherent
  to reading MIDI - the structure is not in the clip - but now that To Clip
  exports the *whole* loop, a round trip produces a much longer flat pattern than
  it used to.
- **`MAX_CYCLES` is 64.** A pathologically nested pattern is truncated rather than
  exported. No user has hit it; it exists so a typo cannot ask for a ten-thousand-
  bar clip.

---
---

# DONE

## Phase 1 - scale awareness [FEAT-01]

> *"Stream of notes is super low. There's no scale awareness."*

A bare number in mini-notation is a **scale degree**, not a MIDI pitch. Both paths
used to read `2` as MIDI pitch 2 - a D-2, below the bottom of a piano, which is
exactly the reported symptom.

- **The wrapper now forwards Live 12's global scale to the MIDI device too**
  (`wrapper/device.ts`: `setupScaleObservers()` lost its `if (!IS_SAMPLER) return`,
  and `onUiReady()` re-sends, because the observers fire before the page exists).
- **`src/lib/mini/scales.ts`** owns the intervals for 30 of Live's scales, with a
  fallback to Major for the ones it does not know (the UI says so, in red).
  Degree 0 is anchored on middle C, so a C-major song puts degree 0 on MIDI 60.
- **Strudel's own `.scale()` is deliberately NOT used.** It cannot be:
  `.scale("C4:harmonic minor")` mis-parses, because Strudel reads that argument as
  mini-notation and the space splits the name in two. It also disagrees with
  Ableton about the pentatonics. The seven-note modes, where tonal is
  authoritative, are pinned against Strudel's own output by a test.

## Phase 2 - loop expansion [FIX-01]

> *"If I click 'save to clip' I get 4 notes. I would expect this sequence to have been expanded."*

`<A B>` takes two cycles to come back around; To Clip rendered exactly one and
threw the rest away.

- **`src/lib/mini/cycles.ts`** computes a pattern's true loop length from the AST
  (LCM across sequences and stacks; an alternation of *m* items whose items each
  take *N* cycles takes *N*·*m*; `A*f` realigns after `N / gcd(N, f)`).
- **`patternCycles()` in the engine** measures the same thing empirically, by
  querying cycles and finding the shortest period they are consistent with. That is
  what To Clip actually uses, because it works for **full Strudel code too**, whose
  loop length no parser of ours could ever compute.
- **Found and fixed a real bug in `schedule.ts` on the way:** a nested alternation
  was handed the absolute cycle index, so `<<p q> y>` played `p y p y` and `q` never
  sounded at all. Strudel's `slowcat` advances the inner pattern once per *visit*;
  now so do we, and it plays `p y q y`.

## Phase 3 - negative numbers [FIX-02]

The tokenizer rejected `-` outright (`unexpected character "-"`), so a bare
relative sequence like `[-1 ~] -1` could not be written without hand-wrapping it in
`n("...")`. It now reads a leading `-` as part of the number, and negative degrees
resolve below the root (`-1` in C major is the B underneath middle C).

## Phase 4 - drum rack translation [FEAT-02]

- **`src/lib/mini/drums.ts`**: a word -> MIDI map, defaulting to the General MIDI
  layout a stock Live Drum Rack uses (`bd` 36, `sd` 38, `hh` 42, ...), with
  Strudel's own abbreviations so a pattern copied off strudel.cc hits the right pad.
- **A "Kit" panel in the UI** (it *replaces* the editor area rather than adding a
  row - Live's device view is a fixed ~169px and every row is spoken for). Edits
  persist to `localStorage`.
- **The tokenizer stopped splitting drum words.** `bd` used to tokenize as the note
  B followed by the note D; word tokens are now greedy over letters.
- A word only reaches the drum map if it is **not** a valid note name, so `e` is
  always the note E. The two-letter defaults never collide.

## Phase 5 - note transformations in To Clip [FEAT-03]

> *"You cannot export any pattern to MIDI if it relies on Strudel's native JavaScript functions."*

**To Clip now renders on the Strudel engine, not on the local mini parser.** The UI
sends `{t:"export", code, ctx, bars}` to the Web Worker that already runs Live Play;
the worker compiles the pattern, measures its loop length, and queries the whole
window at once (`exportNotes()` -> `queryWindow(0, cycles)`). Strudel patterns are
pure functions of time, so this is instant, needs no transport, and cannot disturb
a pattern that is currently playing.

- **Every Strudel transformation now exports**: `.transpose()`, `.scale()`,
  `.arp()`, `.jux()`, `.add()`, full JS chains. To Clip is **no longer disabled in
  code mode** - that grey button was the whole complaint.
- **The local parser was not extended to do this, and never should be.**
  Reimplementing Strudel's function library inside `src/lib/mini` was never going to
  work. It survives as the **note-count readout while you type** - instant,
  synchronous, bare-mini only - and the engine is authoritative for what lands in
  the clip.

## The mechanism underneath all five: one resolver

`src/lib/mini/resolve.ts` rewrites bare mini-notation so every token is an absolute
MIDI number, in place, leaving structure and spacing untouched:

```
"0 [2 ~] bd*2"   ->   "60 [64 ~] 36*2"      (C major, default kit)
```

Live Play and To Clip then compile the **same** string, which is what makes them
agree by construction rather than by two parsers being kept in step by hand. Scale
degrees, drum words, note names and the octave convention all resolve in exactly
one place (`notes.ts`), and a test asserts the two paths produce identical pitches
for degrees, negative degrees, note names, drum words, shifted octaves and other
keys.

## Phase 5.1 - the Live Scale toggle, and live-coding ergonomics

Fixes and refinements from the first real session with the device in Live.

- **Live Scale is now a toggle, not a law.** ON (the default): a bare number is a
  degree of Live's scale, resolved by us. OFF: it is a raw MIDI pitch - Strudel's
  own reading - and the pattern is free to set its own scale in code. Live's scale
  is *also* published into the pattern scope as **`liveScale`** ("C4:major")
  whichever way the toggle is set, so code can opt into **Strudel's** implementation
  deliberately: `n("0 2 4").scale(liveScale)`.
- **An amber line warns where the two implementations part company.** They are not
  interchangeable: Strudel's `.scale()` mis-reads any name containing a space
  (it parses its argument as mini-notation, so "harmonic minor" splits in two) and
  disagrees with Ableton on the pentatonics and blues scales. Rather than hide
  that, the UI names it - and `strudelAgrees()` records exactly where the two can
  be trusted to match (the seven-note modes, pinned by a test).
- **A change of scale reaches a pattern that is already playing.** The scale is
  baked into the code the worker compiled, so changing it means recompiling; the
  pattern used to keep playing in the key it was *started* in until the user
  stopped and started again. Same for Octave, Shift and the kit.
- **Ctrl+Enter re-evaluates**, and does it from where the cycle already is - the
  worker swaps the pattern object and leaves its clock alone, so nothing restarts.
- **The sounding step is highlighted in the editor**, the way strudel.cc does it.
  The worker posts a playhead position ~20 Hz (it has to: the free-run clock, when
  Live's transport is stopped, exists only in there), and the editor lights the
  source range of whatever is sounding - including every note of a chord, and the
  correct half of an `<a b>`.

### The `bd!4` machine gun

`!` was not a token the parser knew. It **dropped it silently** and then read the
`4` as a *note* - degree 4 of C major, MIDI 67. So `bd!4` was rewritten to
`36!67`, and Strudel dutifully fired the kick **67 times a cycle**. `bd*4` was fine
(`*` was a known token), and `bd bd bd bd` was fine (no `!` at all), which is
exactly the pattern of symptoms reported.

`!` now replicates properly: `a!3` takes three *steps* of the sequence (unlike
`a*3`, which subdivides one), a bare `a!` is two, and a spaced `a ! !` repeats the
previous step. That last form is why the tokenizer now records whether a token was
preceded by whitespace: it is the only thing distinguishing a modifier from a step.

> **The real lesson is the silent drop.** An unknown character was discarded, and
> the *next* token quietly changed meaning. Every unknown character is now a parse
> error the UI shows - but a stray one in a pattern that still parses can shift a
> neighbouring token's role, and no test will notice unless someone writes it.

## Phase 6 - Native Instrument Mode (`iiii`) - REMOVED

**History, kept so nobody re-proposes the same shape.** The plan called for an
"Instrument" device that would take Strudel patterns and generate audio directly,
routing into a `[poly~]` synth instead of emitting MIDI. What got built:
`ableton-amxd/voice.maxpat`, a hand-authored `poly~` synth driven by `voice <note>
<vel01> <durMs> ...` messages.

**Removed entirely.** Two independent problems:

1.  **It never made musical sense.** It reinvented a crude oscillator synth instead
    of using Strudel's real sound engine - `.s("bd")`-style sample references and
    most of the real transformation chain did nothing. It also copied the MIDI
    device's note editor wholesale, which makes no sense for something meant to be
    an audio-effects surface.
2.  **`voice.maxpat` was never verified** - it carried its own "SKELETON PATCH -
    not hand-verified" comment, and in testing it never produced audio.

Phase 7 is its replacement, and it is a different KIND of device - not a fix to
this one.
