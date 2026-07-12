---
title: "m4l-strudel"
---

# m4l-strudel

**Max for Live devices** that bring [Strudel](https://strudel.cc) - the
JavaScript port of TidalCycles' pattern language - natively into Ableton
Live. No browser tab, no virtual MIDI cables, no sync hacks: the real
`@strudel/core` engine runs headlessly inside the MIDI device, locked to
Live's transport.

[Get it on Gumroad](https://alienmindzzz.gumroad.com/l/m4l-strudel)

---

**Strudel MIDI is the one that's ready to use.** Samples is **experimental**
in this release - not for real sessions yet, a fix is planned for an upcoming
release. A third device, a real Strudel audio-effects chain, is planned too;
see [doc/TODO.md](TODO.md).

## What's in the box

| Device | Type, drop it on | What it does for you |
|---|---|---|
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect, a **MIDI track**, before an instrument | Type a Strudel pattern, press **Run**, and it streams live MIDI into whatever instrument sits after it - tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Also converts patterns **to and from MIDI clips** on the track. |
| **Strudel Samples** (`alienmind-strudel-sampler.amxd`) | Audio effect, any **audio track** (audio passes through) | Browse Strudel's sample-map universe (dirt-samples, dough-samples, shabda, any `strudel.json` repo), **preview samples beat-synced** to your project tempo, and download them to `~/Music/StrudelSamples` for native drag-and-drop from Live's browser. **Experimental - not recommended for real sessions yet.** |

Press **Run** and patterns play immediately on a free-running clock at the
project tempo; start **Live's transport** and they lock to the playhead,
start on the bar, and follow tempo changes.

## Why a producer would care

- **Generative sequencing in one line.** `note("c3 e3 g3 b3").sometimesBy(.3, x=>x.fast(2))`
  is a whole evolving part. Euclidean rhythms, polymeter, per-cycle
  alternation - things that are tedious to click into a piano roll are one
  expression in Strudel.
- **It's really Live-native.** Patterns start on the bar, follow tempo
  automation, stop when you stop the transport, and notes land on the track
  the device sits on. Everything renders inside the device UI.
- **From sketch to clip.** The MIDI device can freeze any pattern into a
  regular MIDI clip (and read clips back into mini-notation), so generative
  sketches become ordinary arrangeable material.
- **A sample library browser with taste.** The community sample maps behind
  strudel.cc (hundreds of drum machines, folk instruments, found sound)
  become browsable, beat-synced-previewable, and downloadable straight into
  your User Library workflow.

---

## Strudel MIDI (`alienmind-strudel-midi.amxd`)

![Strudel MIDI device](screenshot-midi.png)

Two workflows in one device:

- **Live mode (Run / Hush)** - evaluate real Strudel code and stream the
  result as live MIDI into whatever instrument sits after the device.
- **Clip mode (To Clip / From Clip)** - convert mini-notation to a regular
  MIDI clip on this track, and read clips back into mini-notation.

### The editor

Type your pattern in the big text box. For **Run** you can use full Strudel
code - `note("c3 e3 g3 b3").midichan(2)`, multiple `$:` lines, `stack(...)`,
`.fast()`, `.euclid()`, anything the Strudel engine evaluates. Bare
mini-notation like `c5 [e5 g5]*2` also works: Run wraps it in `note("...")`
for you. For **To Clip** the converter understands mini-notation (see the
table below).

The **`N notes` counter** (top right) shows how many notes the *clip
converter* currently parses out of your pattern - a quick validity check. A
red outline plus a message under the editor means a parse or eval error.

### Controls

| Control | What it does |
|---|---|
| **Bars** (1-8) | How many bars **To Clip** renders into the clip. One bar = one Strudel cycle, so patterns that change per cycle - like `<a5 b5>` (alternation) - need Bars >= 2 to capture all their variants in the clip. Does not affect live Run mode, which just keeps cycling. |
| **Grid** (8/16/32) | The quantization grid **From Clip** snaps to when turning clip notes back into mini-notation: 16 means each bar is read in 16th-note steps. Finer grid = more faithful to loose timing, but busier notation. Only affects From Clip. |
| **Octave** | Note-name convention. **Strudel (c5=60)** matches strudel.cc, where `c5` is middle C (MIDI 60). **Scientific (c4=60)** matches most DAWs/theory texts, where middle C is `c4`. Pick whichever matches how you think; it changes how names map to pitches in both directions. |
| **Shift** (-4...+4) | Transposes by whole octaves on top of the convention - e.g. Shift `-1` makes every written note sound an octave lower. Applies to clip conversion in both directions. |
| **▶ Run** | Sends the code to the embedded Strudel engine. Status shows *Pattern running*; notes start flowing when Live's transport plays. Press Run again anytime to hot-swap the pattern - the new one takes over on the next scheduling window. |
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
| Elongation | `c5@3 e5` | c5 takes 3x the weight |
| Alternation | `<a5 b5>` | one element per cycle |
| Stack (chord) | `[c5,e5,g5]` | parallel notes |
| Polymeter | `{c5 e5, g5 b5 d6}%4` | 4 steps/cycle per layer |
| Euclid | `c5(3,8)` | 3 pulses over 8 steps (Bjorklund) |
| Raw MIDI | `60 64 67` | note numbers |

Live **Run** mode is not limited to this table - it evaluates full Strudel.

---

## Strudel Samples (`alienmind-strudel-sampler.amxd`)

![Strudel Samples device](screenshot-sampler.png)

A browser/downloader for the community sample maps behind strudel.cc. It is
an **audio effect**: put it anywhere on an audio track; incoming audio passes
through untouched and previews are mixed in.

| Control | What it does |
|---|---|
| **Map dropdown** | Presets: `dirt-samples` (the TidalCycles classics) and `dough-samples` (Strudel's defaults). Pick *Custom...* to type your own. |
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

## A third device is planned: Strudel Audio FX

Not built yet. The direction ("Strudel Instrument", a hand-rolled `poly~`
oscillator synth) shipped in an earlier release and was removed - it never
made musical sense, replicating the MIDI device's note-editor UI instead of
being an actual audio effect, and its voice patch never reliably produced
sound. The real plan is a genuine **audio effect**: one line of Strudel
effects-chain syntax (`.lpf(800).room(0.3).gain(1.2)`) applied to whatever
audio is already on the track, mapped onto real Max DSP objects - not a
synth, not a note editor. See [doc/TODO.md](TODO.md) for the design.

---

## Troubleshooting

- **Updated the device but nothing changed** → Live embeds a copy of the
  device in your set when you drag it in; reinstalling the `.amxd` does NOT
  update instances already on tracks. Delete the device from the track and
  re-drag it from the browser. The header shows the UI version (e.g.
  `v0.2.0`) and the Max console prints the build stamp - compare them after
  updating.
- **Run does nothing** → check the status line says *Strudel engine ready*
  and remember: no sound until **Live's transport is playing**. The Max
  console (device Edit button) logs every boot step (`strudel: ...`).
- **Red outline** → the message under the editor names the parse/eval error.
- **From Clip greyed out** → the track has no clips yet; To Clip makes one.
- **Sampler shows nothing after Load** → check the status line for a fetch
  error (the maps come from the network).
- **Live crashes with Strudel Samples loaded** → known issue, it hosts
  `[node.script]` for downloads and that is the one unstable piece in this
  project. Remove it if it happens repeatedly.

More depth: [README](../README.md) (includes how this project relates to the
[m4l-jweb](https://github.com/alienmind/m4l-jweb) library it's built on) and
[Architecture](ARCHITECTURE.md) (build pipeline, message protocol,
upstream-Strudel policy).
