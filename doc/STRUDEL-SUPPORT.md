# What Strudel does, and what these devices do with it

Strudel is a language for making **sound**. These are Max for Live devices, and
they make sound Ableton's way - MIDI into an instrument, DSP in the signal chain.
The two overlap heavily, and where they do not, this page says so plainly rather
than letting you find out by wondering why nothing happened.

**The short version.** The *pattern language* is 100% supported: the real
`@strudel/core` runs inside the device, so anything that produces notes works,
including every transformation, and all of it exports to a MIDI clip. What is
**not** supported is Strudel's *sound engine* - `.s("bd")`, sample playback,
and the audio effects attached to a pattern. Those are Ableton's job here, and
you reach them through an instrument on the track or the Audio FX device.

---

## The one that catches everyone

```js
s("bd sd bd sd")     // silence. no notes, no error.
sound("bd*4")        // same.
```

A pattern built with `s()` / `sound()` names a **sample**, not a note. On
strudel.cc, Strudel's own audio engine (superdough) loads that sample and plays
it. Inside a Max for Live device there is no such engine - and there cannot be
one, because audio generated in the device's embedded browser view has no path
into Live's signal chain (see [ARCHITECTURE.md](ARCHITECTURE.md) §4).

So a pattern with no note in it produces **no MIDI**, and the device sits there
looking broken. It is not broken; it is being asked for a sound it cannot make.

**What to write instead**, for a drum pattern into a Drum Rack:

```
bd sd bd sd          bare mini-notation - drum words map to Drum Rack pads
```

```js
note("36 38 36 38")  the same thing, as code
```

The **Kit** panel maps the words (`bd` = 36, `sd` = 38, `hh` = 42 ...) and you
can edit it to match any rack. Copying a rhythm off strudel.cc means keeping the
*structure* - `bd(3,8)`, `bd!3 sd`, `[bd hh]*2` - and dropping the `s()`.

---

## Strudel MIDI

The pattern language, in full. The engine is the real one, so if it produces
notes, this device plays them and can freeze them into a clip.

### Supported: everything that makes notes

| | |
|---|---|
| **Mini-notation** | sequences, `[]` subdivision, `~` rests, `*` speed, `!` replication, `@` elongation, `<>` alternation, `,` stacks, `{}%` polymeter, `()` euclid |
| **Note transforms** | `.transpose()`, `.scale()`, `.add()`, `.sub()`, `.arp()`, `.off()`, `.rev()`, `.jux()`, `.fast()`, `.slow()`, `.struct()`, `.superimpose()`, `.sometimesBy()`, `.degradeBy()`, `.chunk()`, ... |
| **Chords / voicings** | `.chord()`, `.voicing()`, `.rootNotes()` |
| **Randomness** | `.sometimes*`, `.rarely`, `.often`, `irand`, `choose`, ... |
| **Multiple parts** | `$:` lines, stacked and played together |
| **Signals** | `sine`, `saw`, `perlin`, ... wherever they feed a *note* value |

All of it also **exports to a MIDI clip**, because To Clip runs the engine rather
than a parser of ours.

### The three controls that reach MIDI

A Strudel pattern carries a bag of properties per event. Exactly three of them
mean anything to a MIDI device:

| Strudel | Becomes |
|---|---|
| `note` / `n` | the MIDI pitch |
| `.gain()` / `.velocity()` | MIDI velocity (`gain(0.5)` -> velocity 64) |
| `.midichan(n)` | the MIDI channel |

### Silently ignored (they are sound-engine controls)

`.s()` / `.sound()`, `.bank()`, `.room()`, `.lpf()`, `.hpf()`, `.delay()`,
`.crush()`, `.pan()`, `.speed()`, `.begin()`, `.end()`, `.attack()`,
`.release()`, `.vowel()`, `.coarse()`, `.shape()`, `.dist()`, ...

These do not error. The pattern plays; the property is dropped, because there is
no synthesiser here to hear it. `note("c3").room(0.5)` is just `note("c3")`.

> **If you want reverb on it**, put it on the track: an instrument after this
> device, then Live's own reverb - or the Audio FX device, once `.room()` exists
> there. That is the Ableton way round, and it is the whole point of a MIDI
> effect.

---

## Strudel Audio FX

One line of Strudel's effect vocabulary, applied to the audio already on the
track. But it obeys a hard law, and the law explains every limit below.

### The frozen-graph law

**The DSP graph is written when the device is built. Your line only chooses
values.**

A Max patcher is generated at build time and frozen inside the `.amxd`. Nothing
can add a reverb to it at runtime - not the app, not `[js]`. So every effect the
device will ever apply **already exists in the graph**, always running, and the
line you type sets each one's amount, including the amount that means *off*.

Two consequences, and neither is a bug:

1. **An effect that is not in the graph cannot be conjured.** `.room()` is
   recognised and honestly refused ("no Max chain yet") rather than ignored.
2. **The order is fixed too.** `.lpf(800).gain(1.2)` and `.gain(1.2).lpf(800)`
   produce the *same* signal path, because there is only one path. The device
   declares a canonical order (e.g. lowpass → drive → delay → room → gain) and your line 
   chooses amounts within it. 
   
   **This is an imperfect implementation.** As documented in `m4l-jweb`'s [LISTENING.md](https://github.com/alienmind/m4l-jweb/blob/main/doc/LISTENING.md), the order of effects drastically changes the audio result. A chain processing `gain -> drive` sounds quiet and clean because the level is cut before the distortion. A chain processing `drive -> gain` sounds loud and dirty because the distortion happens first. In Strudel on the web, you can sequence effects in any order to achieve both results. In a Max device, the order is locked at build time, so this shortcoming is an inescapable reality of the frozen graph.

### Supported today

| | |
|---|---|
| `.lpf(hz)` / `.cutoff(hz)` | one-pole lowpass, 40 Hz - 18 kHz |
| `.drive(x)` | distortion drive, 1x - 10x |
| `.delay(x)` | delay mix, 0-1 |
| `.delaytime(ms)` | delay time, 1-2000 ms |
| `.delayfeedback(x)` | delay feedback loop gain, 0-1 |
| `.room(x)` | reverb wet mix, 0-1 |
| `.gain(x)` | output level, 1 = unity |

Values are in **real units** - `.lpf(800)` is 800 Hz, `.delaytime(250)` is 250 ms - and become real Live
parameters: automatable, MIDI-mappable, visible on Push.

### Refused, and told to your face

- **`.crush()`, `.hpf()`, `.pan()`, `.distort()`** -
  recognised as real Strudel effects with no Max chain behind them yet. The
  device says so; it does not pretend.
- **Modulated values** - `.lpf(sine.range(200, 2000))` describes continuous
  modulation, which needs a different machine than "type a number" (see
  [TODO.md](TODO.md)). Refused rather than silently applying a wrong constant.

---

## Strudel Samples

Downloads Strudel's sample maps so Ableton can use them **as audio files**, in
its own browser and its own Drum Racks. It does not play patterns.

**Experimental** - see the README.

---

## Why not just run Strudel's audio engine?

The engine runs inside `[jweb]`, which is a Chromium view, and Chromium has a
perfectly good `AudioContext`. It is the obvious idea and it does not work:
**Chromium's audio graph and Live's signal chain do not touch.** Sound produced
in the device's browser view goes to your system output device, outside Ableton
entirely - not down the track, not through your effects, not into your render.

That is why sound here is native: MIDI into an instrument, or real Max DSP
objects in the signal path. It is a genuine constraint of the platform, not a
shortcut we took.
