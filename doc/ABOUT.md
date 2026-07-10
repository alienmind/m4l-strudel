---
title: "m4l-strudel"
---

# m4l-strudel

Bridge between Strudel live coding environment and Ableton Live via Max 4 Live.

[Get it on Gumroad](https://alienmindzzz.gumroad.com/l/m4l-strudel) | [Download .amxd directly](/m4l-strudel/dist/alienmind-strudel-m4l.amxd)

---

## Overview

> **Note for Ableton users**: This is a Max for Live **MIDI device**. It acts as a MIDI effect and must be placed on a MIDI track.

![Strudel Plugin](/m4l-strudel.png)

M4L Strudel creates a seamless bridge between the Strudel live coding environment and Ableton Live. This integration brings the power of algorithmic pattern generation directly into your DAW, allowing you to control Live instruments using code.

# Strudel MIDI - Max for Live device

Converts [Strudel](https://strudel.cc) mini-notation ↔ MIDI clips on the track
the device is dropped on.



## Supported mini-notation

| Feature | Example | Meaning |
|---|---|---|
| Sequence | `c5 e5 g5` | equal division of one cycle |
| Subdivision | `[e5 g5]` | nested equal division |
| Rest | `~` | silence |
| Repeat / speed | `[e5 g5]*2` | repeat the group twice in its slot |
| Elongation | `c5@3 e5` | c5 takes 3× the weight |
| Alternation | `<a5 b5>` | one element per cycle |
| Stack (chord) | `[c5,e5,g5]` | parallel notes |
| Polymeter | `{c5 e5, g5 b5 d6}%4` | 4 steps/cycle per layer |
| Euclid | `c5(3,8)` | 3 pulses over 8 steps (Bjorklund) |
| Raw MIDI | `60 64 67` | note numbers |

Octave convention defaults to **Strudel** (`c5` = MIDI 60); switch to Scientific
(`c4` = 60) or apply an octave shift in the UI. (Verify the Strudel default at
strudel.cc if in doubt - it's a single constant in `src/lib/mini/notes.ts`.)


... (Read more on GitHub)
