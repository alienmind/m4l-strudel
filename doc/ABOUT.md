---
title: "m4l-strudel"
---

# m4l-strudel

Bridge between the [Strudel](https://strudel.cc) live coding environment and
Ableton Live via Max for Live — three devices: a **MIDI sequencer**, a
**sample fetcher**, and a **synth instrument**.

[Get it on Gumroad](https://alienmindzzz.gumroad.com/l/m4l-strudel)

---

## Overview

| Device | Ableton device type | Drop it on |
|---|---|---|
| `m4l-strudel-midi.amxd` | MIDI effect | a **MIDI track**, before an instrument |
| `m4l-strudel-sampler.amxd` | Audio effect | any **audio track** (audio passes through) |
| `m4l-strudel-audio.amxd` | Instrument | a **MIDI track**, as the instrument |

All three run the real Strudel engine inside the device, locked to Live's
transport. Nothing plays until **Live's transport is running** — patterns are
scheduled against the playhead, start on the bar, and follow tempo changes.

---

## Strudel MIDI (`m4l-strudel-midi.amxd`)

![Strudel MIDI device](screenshot-midi.png)

Two workflows in one device:

- **Live mode (Run / Hush)** — evaluate real Strudel code and stream the
  result as live MIDI into whatever instrument sits after the device.
- **Clip mode (To Clip / From Clip)** — convert mini-notation to a regular
  MIDI clip on this track, and read clips back into mini-notation.

### The editor

Type your pattern in the big text box. For **Run** you can use full Strudel
code — `note("c3 e3 g3 b3").midichan(2)`, multiple `$:` lines, `stack(...)`,
`.fast()`, `.euclid()`, anything the Strudel engine evaluates. For **To
Clip** the converter understands mini-notation (see the table below).

The **`N notes` counter** (top right) shows how many notes the *clip
converter* currently parses out of your pattern — a quick validity check. A
red outline plus a message under the editor means a parse or eval error.

### Controls

| Control | What it does |
|---|---|
| **Bars** (1–8) | How many bars **To Clip** renders into the clip. One bar = one Strudel cycle, so patterns that change per cycle — like `<a5 b5>` (alternation) — need Bars ≥ 2 to capture all their variants in the clip. Does not affect live Run mode, which just keeps cycling. |
| **Grid** (8/16/32) | The quantization grid **From Clip** snaps to when turning clip notes back into mini-notation: 16 means each bar is read in 16th-note steps. Finer grid = more faithful to loose timing, but busier notation. Only affects From Clip. |
| **Octave** | Note-name convention. **Strudel (c5=60)** matches strudel.cc, where `c5` is middle C (MIDI 60). **Scientific (c4=60)** matches most DAWs/theory texts, where middle C is `c4`. Pick whichever matches how you think; it changes how names map to pitches in both directions. |
| **Shift** (−4…+4) | Transposes by whole octaves on top of the convention — e.g. Shift `-1` makes every written note sound an octave lower. Applies to clip conversion in both directions. |
| **▶ Run** | Sends the code to the embedded Strudel engine. Status shows *Pattern running*; notes start flowing when Live's transport plays. Press Run again anytime to hot-swap the pattern — the new one takes over on the next scheduling window. |
| **■ Hush** | Stops the running pattern and releases any held notes (Run reappears). Stopping Live's transport also silences everything. |
| **To Clip** | Renders the pattern (using Bars/Octave/Shift) into a new Session clip named "Strudel" in the **first empty clip slot** of this track. |
| **From Clip** | Reads the **currently playing** clip on this track (or the first clip, if none is playing) back into mini-notation, quantized to Grid. Greyed out while the track has no clips. |

The **status line** at the bottom reports everything: engine ready, pattern
running, eval errors, notes written/read.

### Typical flow

1. Drop the device on a MIDI track, put an instrument after it.
2. Wait for *Strudel engine ready* in the status line.
3. Type `note("c3 e3 g3 b3")`, press **Run**, start Live's transport.
4. Iterate live: edit the code, press Run again. Route lines to different
   instruments with `.midichan(n)` + separate tracks monitoring this one.
5. Happy with a part? Set **Bars**, press **To Clip**, and arrange the clip
   like any other MIDI. Or edit the clip in the piano roll and pull it back
   with **From Clip**.

### Mini-notation reference (clip converter)

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

Live **Run** mode is not limited to this table — it evaluates full Strudel.

---

## Strudel Samples (`m4l-strudel-sampler.amxd`)

![Strudel Samples device](screenshot-sampler.png)

A browser/downloader for the community sample maps behind strudel.cc. It is
an **audio effect**: put it anywhere on an audio track; incoming audio passes
through untouched and previews are mixed in.

| Control | What it does |
|---|---|
| **Map dropdown** | Presets: `dirt-samples` (the TidalCycles classics) and `dough-samples` (Strudel's defaults). Pick *Custom…* to type your own. |
| **URL field** | Any source Strudel understands: `github:user/repo` (a repo with a `strudel.json`), a direct URL, or `shabda:query` for generated maps. |
| **Load** | Fetches the map and lists every sound with its variation count. A *pitched* badge marks multisampled instruments (per-note files). |
| **◀ n/N ▶** | Steps through a sound's variations (like `bd:3` in Strudel). |
| **▶ (row)** | Preview the selected variation. With the transport running, playback is **quantized to the next beat** so you can audition against your groove; press **■** to stop. |
| **⬇** | Download this variation to `~/Music/StrudelSamples/<map>/<sound>/`. |
| **all** | Download every variation of the sound (shows `done/total` progress). |
| **Folder** | Opens the local samples folder in Explorer/Finder. |
| **Live scale badge** | On Live 12, shows the set's global root & scale (informational for now). |

**Flow:** Load a map → preview until something fits → download → add
`~/Music/StrudelSamples` to Live's browser as a **Place** (once) → drag
samples into Simpler/Drum Racks natively.

---

## Strudel Audio (`m4l-strudel-audio.amxd`)

![Strudel Audio device](screenshot-audio.png)

Same editor, Run/Hush and clip controls as the MIDI device, but the pattern
drives a **built-in 16-voice polyphonic synth** — no external instrument
needed. v1 understands the basic Strudel synth params:

- `.s("sine" | "sawtooth" | "square" | "triangle")` — waveform (default sawtooth)
- `.cutoff(hz)` — low-pass filter cutoff
- `.gain(0..1)` — level (also used as velocity when `.velocity()` is absent)

Example: `note("c3 e3 g3 b3").s("square").cutoff(1200)` — press **Run**,
start the transport, and it plays by itself.

---

## Troubleshooting

- **Run does nothing** → check the status line says *Strudel engine ready*
  and remember: no sound until **Live's transport is playing**. The Max
  console (device Edit button) logs every boot step (`strudel: …`).
- **Red outline** → the message under the editor names the parse/eval error.
- **From Clip greyed out** → the track has no clips yet; To Clip makes one.
- **Sampler shows nothing after Load** → check the status line for a fetch
  error (the maps come from the network).

More depth: [README](../README.md) ·
[Architecture](ARCHITECTURE.md) (build pipeline, message protocol,
upstream-Strudel policy).
