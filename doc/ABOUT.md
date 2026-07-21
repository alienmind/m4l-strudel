---
title: "m4l-strudel"
---

# m4l-strudel

**Max for Live devices** that bring [Strudel](https://strudel.cc) - the JavaScript port of TidalCycles' pattern language - natively into Ableton Live. 

Bring generative sequencing, euclidean rhythms, and algorithmic composition directly into your Ableton Session.

[Download Latest Release](https://github.com/alienmind/m4l-strudel/releases/latest) | [Get it on Gumroad](https://alienmindzzz.gumroad.com/l/m4l-strudel) (might be outdated)

---

## What's in the box

![All Devices](screenshot-all-devices.png)

### The Monolithic Instrument: Strudel Superdough

The primary deliverable is **Strudel Superdough** (`alienmind-strudel-superdough`). This instrument understands the full Strudel language and uses the real `@strudel/superdough` engine to natively produce sounds (synths, oscillators, samples) and effects, perfectly in sync with Ableton's transport clock.

> ⚠️ **Experimental Limitations:** Superdough renders its audio offline in the background to bypass browser audio limitations. As a result:
> - **1-Pattern Lag:** Code edits and knob turns take effect on the *next loop boundary*.
> - **No Real-Time Tweaking:** It cannot smoothly sweep a filter live.
> - **No MIDI In:** It does not currently accept incoming MIDI notes.

### The Micro Devices

We also deliver a set of specialized, lightweight devices that translate Strudel math into real-time native Ableton MIDI or Max DSP (without the Superdough audio engine):

| Device | Type, drop it on | What it does for you |
|---|---|---|
| **Strudel MIDI** | MIDI effect, **MIDI track** | Type a Strudel pattern, press **Run**, and it streams live MIDI into whatever instrument sits after it. Also converts patterns **to and from MIDI clips**. |
| **Strudel Drums MIDI** | MIDI effect, **MIDI track** | The same generative power as Strudel MIDI, focused on drums. Visual **Kit** mapper routes drum words (`bd`, `sd`) directly to Drum Rack pads. |
| **Strudel Drums Sampler** | Instrument, **MIDI track** | A code-driven drum sampler. Write `s("bd sd, hh*8")`, pick a drum machine **bank**, and it plays that machine's sounds. |
| **Strudel Audio FX** | Audio effect, **audio track** | Type a single line of Strudel's DSP effect vocabulary (e.g., `.lpf(800).gain(1.2)`) and it generates a real Max signal chain on the track. |
| **Strudel Samples** | Audio effect, **audio track** | Browse Strudel's sample-map universe. Audition samples beat-synced to your project and drag them straight into a Drum Rack. |

### Exemplary Racks

To get you started instantly, we ship two ready-to-use Instrument Racks:
- **AlienMind Strudel Bass Rack.adg** - Strudel MIDI into a stock Ableton bass plugin, followed by Strudel Audio FX.
- **AlienMind Strudel Superdough Rack.adg** - The full experimental suite in one rack.

![The shipped Instrument Rack: Strudel MIDI -> instrument -> Strudel Audio FX](strudel-rack.png)

---

## Why a producer would care

- **Generative sequencing in one line.** `note("c3 e3 g3 b3").sometimesBy(.3, x=>x.fast(2))` is a whole evolving part. Euclidean rhythms, polymeter, per-cycle alternation - things that are tedious to click into a piano roll are one expression in Strudel.
- **It's really Live-native.** Patterns start on the bar, follow tempo automation, stop when you stop the transport, and notes land on the track the device sits on. 
- **From sketch to clip.** The MIDI device can freeze any pattern into a regular MIDI clip (and read clips back into mini-notation), so generative sketches become ordinary arrangeable material.
- **A sample library browser with taste.** The community sample maps behind strudel.cc (hundreds of drum machines, folk instruments, found sound) become browsable, beat-synced-previewable, and downloadable straight into your User Library workflow.

---

## Device Guide

### Strudel Superdough
Type any Strudel pattern - whether it's synthesizers like `s("sawtooth")`, samples like `s("bd")`, or complex effect chains. Press **Run** and start Live's transport. The pattern plays live, as real track audio: it goes through the fader, the sends and the meters like any other instrument, and you can resample or record it.

**One limitation worth knowing: Freeze does not work on this device.** Live's Freeze renders a track offline and faster than real time, and the device's sound comes from a live browser engine that cannot run in that offline pass - so a frozen track goes silent. This is a property of how Live freezes, not something the device can work around. Two things do work, and either gives you the same result:

- **Export** (the download icon) renders the pattern to a `.wav` next to the device. Use **Copy folder path** (the clipboard icon) to get the folder, paste it into Explorer/Finder, and drag the file onto an audio track.
- **Resample** the track onto an audio track while it plays, the normal Live way.

### Strudel MIDI (`alienmind-strudel-midi.amxd`)

![Strudel MIDI device](screenshot-midi.png)

Two workflows in one device:
- **Live mode (Run / Stop)** - evaluate real Strudel code and stream the result as live MIDI into whatever instrument sits after the device.
- **Clip mode (Clip)** - convert mini-notation to a regular MIDI clip on this track, and read clips back into mini-notation.

![Clip export and import - a pattern frozen to a MIDI clip, and read back](screenshot-midi-export-import.png)

The editor features a **Full Studio** floating window, a native **Play/Stop** panel for macro-mapping, and a comprehensive **Help (?)** reference tailored to exactly what the device supports.

![The About screen and the Full Studio window](screenshot-about-and-studio.png)
![The Strudel reference window](strudel-help.png)

### Strudel Drums MIDI (`alienmind-strudel-drums-midi.amxd`)

![Strudel Drums MIDI device](screenshot-midi-drums.png)

Built for driving Drum Racks. Instead of writing absolute pitches, write Strudel drum words (`bd`, `sd`, `hh`). 

Clicking the **Kit** button opens a dedicated visual mapper to route Strudel's vocabulary directly to your Ableton Drum Rack pads (e.g. assigning `bd` to note `36`). These mappings are stored natively and save with your Live set.

![Strudel Drums MIDI Kit Mapping](screenshot-midi-drums-mapping.png)

### Strudel Drums Sampler (`alienmind-strudel-drums-sampler.amxd`)

![Strudel Drums Sampler - the CODE screen](screenshot-drums-sampler.png)

A self-contained instrument that fetches and plays samples from **drum-machine banks** driven by Strudel code. 

1. **Pick a bank** from the dropdown (e.g. RolandTR909, AkaiLinn).
2. **Write a pattern**: `s("bd sd, hh*8")`.
3. Samples **download automatically** in the background the first time a sound is named.

You can also browse the selected bank's sounds via the **Sounds** screen and audition them directly through the track.

![Strudel Drums Sampler - the SOUNDS screen, a bank's sounds to audition](screenshot-drums-sampler-2.png)

### Strudel Audio FX (`alienmind-strudel-fx.amxd`)

![Strudel Audio FX - the effect line and its native dials](screenshot-fx.png)

Brings Strudel's chainable DSP vocabulary to any audio track. Type a chain of Strudel effects, such as `.lpf(800).room(0.3).gain(1.2)`, and hit Enter. The parameters appear as **native Live dials** beside the text.

- **Native, not HTML**: the dials are real Live parameters - automatable, MIDI-mappable, and paged on Push.
- **Add Effect Menu**: clicking `(+)` opens an overlay to quickly append new DSP stages.

![Strudel Audio FX - the Add Effect menu](screenshot-fx-2.png)

### Strudel Sample Browser (`alienmind-strudel-sample-browser.amxd`)

A browser for the community sample maps behind strudel.cc. Drop it on any audio track.
- Browse curated community sample maps (dough-samples, Dirt-Samples, clean-breaks).
- Audition samples beat-synced to your project's launch quantization.
- Drag the auditioned row straight into a Simpler, a Drum Rack, or an audio track.

---

## Troubleshooting

- **Updated the device but nothing changed** → Live embeds a copy of the device in your set when you drag it in. Delete the device from the track and re-drag it from the browser to update.
- **Run does nothing** → Check the status line says *Strudel engine ready* and remember: no sound until **Live's transport is playing**.
- **Red outline** → The message under the editor names the parse/eval error.
- **Load from Clip greyed out** → The track has no clips yet; Save to Clip makes one.
- **The sample list is empty after picking a map** → Check the status line for a fetch error (the maps come from the network).