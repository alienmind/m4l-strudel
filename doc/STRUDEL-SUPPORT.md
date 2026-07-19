# What Strudel does, and what these devices do with it

Strudel is a language for making **sound**. This project brings Strudel to Ableton Live through two distinct paradigms: the monolithic **Superdough** device, and the **Micro Devices** (MIDI, FX, Sampler).

The level of support depends entirely on which device you are using.

---

## 1. Strudel Superdough (The Monolithic Instrument)

The **Strudel Superdough** device (`alienmind-strudel-superdough`) uses Strudel's real audio engine to render audio directly into your Ableton track.

### Supported: Almost Everything

Because it uses the real `@strudel/superdough` engine under the hood, **everything you can do on strudel.cc is supported.**
- **Full Synthesis:** `s("sawtooth")`, `s("supersaw")`, `s("triangle")` - all oscillators work.
- **Samples:** `s("bd sd")`, `s("gabba")` - sample fetching and playback works.
- **Audio Effects:** `.room()`, `.lpf()`, `.crush()`, `.delay()` - all pattern-attached audio effects work exactly as they do on the web.
- **Multi-line:** `$:`, `stack()`, orbits, etc.

### Limitations & Exceptions

Because Live does not allow the embedded browser's real-time `AudioContext` to output audio into the track (see *Why not just run Strudel's audio engine in real-time?* below), this device renders the audio **offline** and loops it. This introduces specific constraints:

- **1-Pattern Lag:** When you change the code, it renders the new pattern in the background and crossfades to it at the *next loop boundary*. Your changes are not instant.
- **No Real-Time Knob Tweaking:** Knobs and sliders (`s1`..`s8`) also suffer from the same 1-loop delay. Turning a knob triggers a re-render for the next cycle; it does not smoothly sweep a filter in real time.
- **Not Yet MIDI Aware:** The superdough engine in this device does not currently process inbound MIDI notes from Ableton.
- **Randomness is Locked per Loop:** If you use `irand` or `choose`, the offline renderer generates one realization of that randomness per loop. The exact same random values will repeat every cycle until you edit the code.

---

## 2. The Micro Devices (MIDI, FX, Sampler)

The micro devices (`Strudel MIDI`, `Strudel Drums MIDI`, `Strudel Audio FX`, `Strudel Drums Sampler`) do not use the superdough synthesis engine. Instead, they translate Strudel code into native Ableton MIDI or Max DSP.

For these devices, the *pattern language* is 100% supported, but the *sound engine* is **not**.

### A. Strudel MIDI

If the pattern produces notes, this device plays them and can freeze them into a clip.

**Supported: everything that makes notes**

| | |
|---|---|
| **Mini-notation** | sequences, `[]` subdivision, `~` rests, `*` speed, `!` replication, `@` elongation, `<>` alternation, `,` stacks, `{}%` polymeter, `()` euclid |
| **Note transforms** | `.transpose()`, `.scale()`, `.add()`, `.sub()`, `.arp()`, `.off()`, `.rev()`, `.jux()`, `.fast()`, `.slow()`, `.struct()`, `.superimpose()`, `.sometimesBy()`, `.degradeBy()`, `.chunk()`, ... |
| **Chords / voicings** | `.chord()`, `.voicing()`, `.rootNotes()` |
| **Randomness** | `.sometimes*`, `.rarely`, `.often`, `irand`, `choose`, ... |
| **Multiple parts** | `$:` lines, stacked and played together |
| **Signals** | `sine`, `saw`, `perlin`, ... wherever they feed a *note* value |

All of it also **exports to a MIDI clip**, because To Clip runs the engine rather than a parser of ours.

**The trap that catches everyone**

```js
s("bd sd bd sd")     // on a MIDI device: silence. no notes, no error.
sound("bd*4")        // same.
```

A pattern built with `s()` / `sound()` names a **sample**, not a note. On the **MIDI devices**, there is no sample engine. A pattern with no notes produces **no MIDI**, and the device sits there looking broken.

**On the MIDI devices, write notes instead:**
```js
note("36 38 36 38")  // The same thing, as code
bd sd bd sd          // Bare mini-notation maps drum words to Drum Rack pads
```

**The three controls that reach MIDI:**
| Strudel | Becomes |
|---|---|
| `note` / `n` | the MIDI pitch |
| `.gain()` / `.velocity()` | MIDI velocity (`gain(0.5)` -> velocity 64) |
| `.midichan(n)` | the MIDI channel |

**Silently ignored (they are sound-engine controls):**
`.s()`, `.bank()`, `.room()`, `.lpf()`, `.hpf()`, `.delay()`, `.crush()`, `.pan()`, `.speed()`, `.attack()`, `.release()`, `.vowel()`, `.coarse()`, `.shape()`, `.dist()`...
These do not error. The pattern plays; the property is dropped because there is no synthesiser here. `note("c3").room(0.5)` is just `note("c3")`. If you want reverb, put a native Ableton reverb plugin after the device!

### B. Strudel Audio FX

One line of Strudel's effect vocabulary, applied to the audio already on the track. 

**The Frozen-Graph Law:**
The DSP graph is written when the device is built. **Your line only chooses values.** 
- `.lpf(800).gain(1.2)` and `.gain(1.2).lpf(800)` produce the *same* signal path, because there is only one fixed internal path (e.g., lowpass → drive → delay → room → gain).
- **Supported:** `.lpf(hz)` / `.cutoff(hz)`, `.hpf(hz)` / `.hcutoff(hz)`, `.drive(x)`, `.crush(bits)`, `.delay(x)`, `.delaytime(ms)`, `.delayfeedback(x)`, `.room(x)`, `.gain(x)`. Values are in real units and modulate in real time!
- **Refused:** `.pan()`, `.distort()`, `.reverb()`, `.shape()`, `.coarse()`, `.vowel()`, `.phaser()`. These are recognised as real Strudel effects but have no Max chain behind them yet. The device will tell you it's refused. Modulated values like `.lpf(sine)` are also supported, but complex modulations might be refused if unsupported by the bridge.

### C. Strudel Drums Sampler

The one micro device where `s()` is not a footgun but the whole point. It plays samples itself from a **drum-machine bank**.

**Supported: `s()` and `bank()`**

| Feature | Example | What happens |
|---|---|---|
| **Sample names** | `s("bd sd, hh*8")` | Each name plays a drum sound from the selected bank; commas layer (polyphony). Bare `bd sd, hh!6` works too. |
| **Bank** | `s("bd").bank("AkaiLinn")` | Picks the drum machine (strudel's `bank()` prefix). Overrides the bank dropdown, per-hap. |
| **Everything structural** | `s("bd(3,8)")`, `s("[bd hh]*2")`, `s("<bd cp>")` | Full mini-notation and code - it is the same `@strudel/core`, just routed to samples instead of MIDI. |
| **MIDI notes in** | (a sequencer in front) | Notes map to drum sounds by the Drum Rack layout (36 = `bd` ...) and play the bank. |

**Not Supported:**
Audio effects like `.lpf()` or `.room()` do not apply here. Use an FX device after it on the track.

---

## 3. Why not just run Strudel's audio engine in real-time?

The engine runs inside `[jweb]`, which is an embedded Chromium view, and Chromium has a perfectly good `AudioContext`. It is the obvious idea and it does not work: **Chromium's audio graph and Live's signal chain do not touch.** 

Sound produced in the device's browser view goes directly to your system output device, outside Ableton entirely - not down the track, not through your effects, not into your render.

That is why this project takes two paths:
1. **Superdough** renders the audio *offline* to a hidden WAV file, loads it into a Max `[buffer~]`, and plays it back through the track.
2. **Micro Devices** avoid audio generation entirely, instead translating Strudel math into native MIDI notes or Max DSP parameters that Live understands in real-time.
