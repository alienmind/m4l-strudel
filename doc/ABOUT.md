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
| **Strudel MIDI Drums** (`alienmind-strudel-midi-drums.amxd`) | MIDI effect, a **MIDI track**, before a Drum Rack | The same generative power as Strudel MIDI, but focused purely on drums. It provides a visual **Kit** mapper to route drum words (`bd`, `sd`, `hh`) directly to specific Drum Rack pads. |
| **Strudel Audio FX** (`alienmind-strudel-fx.amxd`) | Audio effect, any **audio track** | Type a single line of Strudel's DSP effect vocabulary (e.g., `.lpf(800).gain(1.2)`) and it generates a real Max signal chain on the track. Effects become native, automatable Live parameters. |
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

- **Live mode (Run / Stop)** - evaluate real Strudel code and stream the
  result as live MIDI into whatever instrument sits after the device.
- **Clip mode (Clip)** - convert mini-notation to a regular MIDI clip on this
  track, and read clips back into mini-notation via a dedicated popup.

![Clip Export and Import](screenshot-midi-export-import.png)

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
| **■ Stop** | Stops the running pattern and releases any held notes (Run reappears). Stopping Live's transport also silences everything. |
| **Clip** | Opens the secondary Clip export/import panel. |
| **Save to Clip** | Found in the Clip panel. Renders the pattern (using Bars/Octave/Shift) into a new Session clip named "Strudel" in the **first empty clip slot** of this track. |
| **Load from Clip** | Found in the Clip panel. Reads the **currently playing** clip on this track (or the first clip, if none is playing) back into mini-notation, quantized to Grid. Greyed out while the track has no clips. |

The **status line** at the bottom reports everything: engine ready, pattern
running, eval errors, notes written/read.

### Typical flow

1. Drop the device on a MIDI track, put an instrument after it.
2. Wait for *Strudel engine ready* in the status line.
3. Type `note("c3 e3 g3 b3")`, press **Run**, start Live's transport.
4. Iterate live: edit the code, press Run again. Route lines to different
   instruments with `.midichan(n)` + separate tracks monitoring this one.
5. Happy with a part? Open the **Clip** panel, set **Bars**, press **Save to Clip**, and arrange the clip
   like any other MIDI. Or edit the clip in the piano roll and pull it back
   with **Load from Clip**.

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

## Strudel MIDI Drums (`alienmind-strudel-midi-drums.amxd`)

![Strudel MIDI Drums device](screenshot-midi-drums.png)

This device runs the exact same engine as Strudel MIDI, but is purpose-built for driving Drum Racks. Instead of writing absolute pitches or scale degrees, you write standard Strudel drum words (`bd`, `sd`, `hh`) which are automatically translated into Drum Rack pad triggers.

### Visual Kit Mapping

![Strudel MIDI Drums Kit Mapping](screenshot-midi-drums-mapping.png)

Clicking the **Kit** button opens a dedicated visual mapper. This lets you route Strudel's vocabulary directly to your Ableton Drum Rack. For example, if you have a kick on pad C1, you simply assign `bd` to `36`. 

- **Custom words**: You can type any non-note text string (e.g. `clap2`) and assign it to a pad.
- **Persistence**: These mappings are stored natively, meaning your kit setup saves and loads automatically with your Ableton Live set.

---

## Strudel Samples (`alienmind-strudel-sampler.amxd`)

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

## Strudel Audio FX (`alienmind-strudel-fx.amxd`)

![Strudel Audio FX device](screenshot-fx.png)

A genuine **audio effect** that brings Strudel's chainable DSP vocabulary to any audio track.

Type a chain of Strudel effects, such as `.lpf(800).room(0.3).gain(1.2)`, and hit Enter. The device instantly generates a visual layout of sliders for each active parameter in your expression. 

- **Dynamic UI**: Only the effects you write are shown in the UI. The sliders map directly to real Live parameters, meaning they are fully automatable, map to external MIDI controllers, and display natively on Push.
- **Add Effect Menu**: Clicking the `(+)` button opens a secondary overlay that lists all available DSP effects, letting you easily append new stages (like `drive`, `delay`, or `room`) to your chain without writing them manually.

*Note: The effect chain order is canonical and frozen at build time (e.g. filter → drive → delay → reverb → gain) to keep the Max DSP graph stable. Writing `.room(0.5).lpf(800)` produces the same signal path as `.lpf(800).room(0.5)`.*

---

## Troubleshooting

- **Updated the device but nothing changed** → Live embeds a copy of the
  device in your set when you drag it in; reinstalling the `.amxd` does NOT
  update instances already on tracks. Delete the device from the track and
  re-drag it from the browser. The device's footer shows the UI version, and
  the Max console prints the build stamp - compare them after updating.
- **Run does nothing** → check the status line says *Strudel engine ready*
  and remember: no sound until **Live's transport is playing**. The Max
  console (device Edit button) logs every boot step (`strudel: ...`).
- **Red outline** → the message under the editor names the parse/eval error.
- **Load from Clip greyed out** → the track has no clips yet; Save to Clip makes one.
- **Sampler shows nothing after Load** → check the status line for a fetch
  error (the maps come from the network).
- **Live crashes with Strudel Samples loaded** → known issue, it hosts
  `[node.script]` for downloads and that is the one unstable piece in this
  project. Remove it if it happens repeatedly.

More depth: [README](../README.md) (includes how this project relates to the
[m4l-jweb](https://github.com/alienmind/m4l-jweb) library it's built on) and
[Architecture](ARCHITECTURE.md) (build pipeline, message protocol,
upstream-Strudel policy).
