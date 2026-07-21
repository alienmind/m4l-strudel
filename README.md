# m4l-strudel - A Hybrid Live Coding Experiment

![Devices overview - Strudel MIDI, Drums MIDI, Drums Sampler, Audio FX and the sample browser](doc/screenshot-all-devices.png)

This started as a fun experiment: *How cool is Strudel! Can I connect it to Ableton and control it from the Push to create the ultimate hybrid workflow?*

The result is a set of **Max for Live devices** that bring [Strudel](https://strudel.cc) - the JavaScript port of TidalCycles' pattern language - natively into Ableton Live. No browser tab, no virtual MIDI cables, no sync hacks: the real `@strudel/core` engine runs headlessly inside each device, locked to Live's transport, and fully mappable to Ableton Push for hands-on control!

> **New here? Start with the [user guide](doc/ABOUT.md)** - every control of every device explained.
> 
> **Note:** The pattern language is fully supported, but Strudel's *sound engine* is not. For a full list of what is supported and how it differs from the web version, see [doc/STRUDEL-SUPPORT.md](doc/STRUDEL-SUPPORT.md).

> ⚠️ **Highly Experimental Limitation:** This is not ready for real music production, just a fun experiment. Sound can be choppy and timing is unreliable. The main instrument (**Strudel**) plays the real superdough engine live in the device, so edits and knob turns are audible immediately - but performance is not ideal and can be easily go out of sync with the track.

## What this project does

- **Generative sequencing in one line.** `note("c3 e3 g3 b3").sometimesBy(.3, x=>x.fast(2))` is a whole evolving part. Euclidean rhythms, polymeter, per-cycle alternation - things that are tedious to click into a piano roll are one expression in Strudel.
- **The ultimate hybrid workflow.** By exposing Strudel's engine states directly to Live, you can map them to your **Ableton Push** or external MIDI controllers. Start and stop complex algorithmic sequences with physical hardware!
- **A dedicated drum machine.** The new **Strudel Drums MIDI** device brings Strudel's generative drum language (`bd`, `sd`, `hh`) straight to your Ableton Drum Racks. It features a visual **Kit** mapper that natively persists in your Live set, letting you easily route algorithmic sequences to any custom kit!

![Strudel Drums MIDI Kit Mapping](doc/screenshot-midi-drums-mapping.png)

- **A code-driven drum sampler.** The **Strudel Drums Sampler** plays samples itself: write `s("bd sd, hh*8")`, pick a drum-machine **bank**, and it fetches and plays that machine's sounds - sixteen voices, driven by code (or by MIDI notes in front of it).

![Strudel Drums Sampler - write s(), pick a bank, it plays the machine](doc/screenshot-drums-sampler.png)

- **It's really Live-native.** Launch a clip on the device's track and the pattern starts; stop it and the pattern stops. On a track with no clips, Live's own Play does the same. Patterns start on the bar, follow tempo automation, and notes land on the track the device sits on. Everything renders inside the device UI.
- **From sketch to clip.** The MIDI device can freeze any pattern into a regular MIDI clip (and read clips back into mini-notation), so generative sketches become ordinary arrangeable material. It also doubles as a two-way translator for *understanding* Strudel: freeze a pattern you cannot quite read into a clip and **see** it in the piano roll, or drop a clip you already know and read its mini-notation - each side explains the other.
- **Room to type, help that follows you.** A **Full Studio** floating window (from **About > Advanced**) is a big editor over the same pattern as the device view (one pattern, one scheduler), and every Strudel-taking device has a `?` opening a pinned reference of exactly what THESE devices support - per device, offline, with an honest works / not-yet status on every entry, narrowing to whatever your caret is on.
- **A synth you play with your hands.** The **Strudel Synth** takes a SOUND rather than a pattern - `s("sawtooth").lpf(800).room(.3)` - and every MIDI note the track sends plays it. Your clip, your keyboard or another Strudel device in front is the trigger, and any `slider()` in the sound lands on a native knob, so the timbre automates and reaches Push.
- **It keeps its sounds when the network goes.** Every sample and sample map any device fetches is cached in the device page, so a set reopened offline still plays the sounds it played before. Synths never needed the network at all.
- **A sample library browser with taste.** The community sample maps behind strudel.cc (hundreds of drum machines, folk instruments, found sound) become browsable, beat-synced-previewable, and downloadable straight into your User Library workflow.

## What's in the box

![The Strudel device - a full Strudel expression playing as the track's audio](doc/screenshot-strudel.png)

The main deliverable is one mini instrument **Strudel** (`alienmind-strudel`) that understands the full Strudel language (with some exceptions, see [STRUDEL-SUPPORT.md](doc/STRUDEL-SUPPORT.md)) and sequences notes, sounds and effects natively with the superdough engine, in sync with Ableton's transport clock.

We also deliver **additional utility instruments** that showcase different capabilities, and are just some tools in the toolset for any curious and adventurous producer:

| Device | Type | What it does for you |
|---|---|---|
| **Strudel** (`alienmind-strudel.amxd`) | Instrument | **ALL of Strudel as the track's audio.** The main instrument described above. The real superdough engine runs live in the device and jweb~ carries its output into the track, so an edit or a knob turn is audible immediately and a random pattern is simply random. Export bounces the pattern to a WAV next to the device. |
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect | Allows you to sequence notes and pass it to any instrument. It also allows you to translate Strudel patterns to the piano roll and vice versa. It streams live MIDI tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Scale-aware (follows Live 12's key). |
| **Strudel Drums MIDI** (`alienmind-strudel-drums-midi.amxd`) | MIDI effect | Allows you to map drum patterns that would normally sound as sounds into MIDI notes that can be sequenced to a drum rack. A dedicated mapping UI routes drum words (`bd`, `sd`, `hh`) to specific Drum Rack pads, and the map travels with your set. |
| **Strudel Synth** (`alienmind-strudel-synth.amxd`) | Instrument | **One superdough sound, played by your MIDI.** Type a sound rather than a pattern - `s("sawtooth").lpf(800).room(.3)` - and every note the track sends plays it. No transport and no Play button: your clip, your keyboard or another Strudel device in front is the trigger. Any `slider()` in the sound lands on a native knob (S1..S8), so the timbre automates and reaches Push. |
| **Strudel Drums Sampler** (`alienmind-strudel-drums-sampler.amxd`) | Instrument | Allows you to actually play sounds from the hundreds of Strudel drum machines available in the standard sound packs. It's a polyphonic instrument and accepts MIDI in. Write `s("bd sd, hh*8")`, and a bank picks which machine plays. Sounds auto-download in the background. |
| **Strudel Audio FX** (`alienmind-strudel-fx.amxd`) | Audio effect | Write **one line** of Strudel's effect vocabulary - `.lpf(800).hpf(120).crush(8).gain(1.2)` - and it applies to whatever audio is already on the track. Nine stages, each a real Live parameter: automatable, MIDI-mappable, native dials. Patterns modulate too (`.lpf(sine.range(200, 2000))`). |
| **Strudel Samples** (`alienmind-strudel-sample-browser.amxd`) | Instrument | Allows you to explore the collections of community samples, and play them in sync with your beat. Auditioning downloads the file next to the device; drag it out into a Simpler, a Drum Rack or a track. |


## Quick Examples

If you are eager to jump in, here are a few valid patterns you can drop straight into the respective devices to get started immediately:

**Strudel MIDI**
```js
<c3 c3 <c3 c#3>>*16
```

**Strudel Drums MIDI**
```js
s("bd hh sd hh")
```

**Strudel** (the main device - anything strudel.cc plays)
```js
note("<c3 eb3 g3 bb3>*4").s("sawtooth").lpf(600).room(.3)
```

**Strudel Synth** (a sound, not a pattern - the notes come from Live)
```js
s("sawtooth").lpf(800).room(.3)
```

**Strudel Audio FX**
```js
.lpf(800).gain(1.2)
```

## Download

You can download the pre-built `.amxd` devices ready for Ableton Live from:
- **[Download Latest Release](https://github.com/alienmind/m4l-strudel/releases/latest)**
- **[Gumroad](https://alienmindzzz.gumroad.com/l/m4l-strudel)** (might be outdated)

## Install

Once downloaded, simply extract the ZIP file and copy the `.amxd` devices into your Ableton **User Library** (e.g. `User Library/Max For Live/m4l-strudel/`).

Each `.amxd` is fully **self-contained** - its own React UI bundle, with the Strudel engine inside every device that reads Strudel code (everything except the sample browser) - and unpacks itself on first load. Drag from Live's browser onto a MIDI track - the instruments (Strudel, Strudel Synth, Drums Sampler, Strudel Samples) fill its instrument slot and the MIDI effects (Strudel MIDI, Drums MIDI) go in front of one - or drop Strudel Audio FX, the only audio effect here, on any track carrying sound. Nothing ships loose beside the devices, and nothing runs a Node process.

*(For developers building from source, you can use `pnpm install:device` to automatically copy the compiled devices to your local Ableton User Library).*

## Build & test

```bash
pnpm install
git submodule update --init   # strudel/ - the engine is bundled from here
pnpm test          # vitest: mini-notation parser + headless engine tests
pnpm build         # → dist/m4l-strudel/alienmind-strudel.amxd + the six -<name>.amxd
                    #   + dist/m4l-strudel.zip (release archive incl. installers)
pnpm dev:midi       # browser dev for the MIDI device, mocked Live beside it
pnpm dev:drums-midi # browser dev for the Drums MIDI device
pnpm dev:sample-browser # browser dev for the sample browser
pnpm dev:fx         # browser dev for the Audio FX device
pnpm dev:strudel    # browser dev for the main Strudel device
pnpm dev:synth      # browser dev for the Synth device
```

For full details on building these devices with the underlying framework from scratch, read [doc/M4L-JWEB-GUIDE.md](doc/M4L-JWEB-GUIDE.md). Detailed architecture diagrams and concepts are found in [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md).

## License

**AGPL-3.0-or-later**, matching [Strudel's own license](https://strudel.cc/technical-manual/project-start/). This project bundles the real `@strudel/core` engine (via the `strudel/` git submodule) and runs it directly, which makes it a derivative work under Strudel's AGPL terms. See [LICENSE](LICENSE) for the full text.
