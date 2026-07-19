# m4l-strudel - A Hybrid Live Coding Experiment

![Devices overview - Strudel MIDI, Drums MIDI, Drums Sampler, Audio FX and the sample browser](doc/screenshot-all-devices.png)

This started as a fun experiment: *How cool is Strudel! Can I connect it to Ableton and control it from the Push to create the ultimate hybrid workflow?*

The result is a set of **Max for Live devices** that bring [Strudel](https://strudel.cc) - the JavaScript port of TidalCycles' pattern language - natively into Ableton Live. No browser tab, no virtual MIDI cables, no sync hacks: the real `@strudel/core` engine runs headlessly inside each device, locked to Live's transport, and fully mappable to Ableton Push for hands-on control!

> **New here? Start with the [user guide](doc/ABOUT.md)** - every control of every device explained.
> 
> **Note:** The pattern language is fully supported, but Strudel's *sound engine* is not. For a full list of what is supported and how it differs from the web version, see [doc/STRUDEL-SUPPORT.md](doc/STRUDEL-SUPPORT.md).

> ⚠️ **Highly Experimental Limitation:** This is not ready for real music production, just a fun experiment. Sound can be choppy and timing is unreliable. The main instrument (Superdough) has a lag of 1 pattern before producing any changes, does not accept real time changes on any knobs (they all have a loop delay), and is not yet MIDI aware.

## What this project does

- **Generative sequencing in one line.** `note("c3 e3 g3 b3").sometimesBy(.3, x=>x.fast(2))` is a whole evolving part. Euclidean rhythms, polymeter, per-cycle alternation - things that are tedious to click into a piano roll are one expression in Strudel.
- **The ultimate hybrid workflow.** By exposing Strudel's engine states directly to Live, you can map them to your **Ableton Push** or external MIDI controllers. Start and stop complex algorithmic sequences with physical hardware!
- **A dedicated drum machine.** The new **Strudel Drums MIDI** device brings Strudel's generative drum language (`bd`, `sd`, `hh`) straight to your Ableton Drum Racks. It features a visual **Kit** mapper that natively persists in your Live set, letting you easily route algorithmic sequences to any custom kit!

![Strudel Drums MIDI Kit Mapping](doc/screenshot-midi-drums-mapping.png)

- **A code-driven drum sampler.** The **Strudel Drums Sampler** plays samples itself: write `s("bd sd, hh*8")`, pick a drum-machine **bank**, and it fetches and plays that machine's sounds - sixteen voices, driven by code (or by MIDI notes in front of it).

![Strudel Drums Sampler - write s(), pick a bank, it plays the machine](doc/screenshot-drums-sampler.png)

- **It's really Live-native.** Patterns start on the bar, follow tempo automation, stop when you stop the transport, and notes land on the track the device sits on. Everything renders inside the device UI.
- **From sketch to clip.** The MIDI device can freeze any pattern into a regular MIDI clip (and read clips back into mini-notation), so generative sketches become ordinary arrangeable material. It also doubles as a two-way translator for *understanding* Strudel: freeze a pattern you cannot quite read into a clip and **see** it in the piano roll, or drop a clip you already know and read its mini-notation - each side explains the other.
- **Room to type, help that follows you.** A **Full Studio** floating window (from **About > Advanced**) is a big editor over the same pattern as the device view (one pattern, one scheduler), and every Strudel-taking device has a `?` opening a pinned reference of exactly what THESE devices support - per device, offline, with an honest works / not-yet status on every entry, narrowing to whatever your caret is on.
- **A sample library browser with taste.** The community sample maps behind strudel.cc (hundreds of drum machines, folk instruments, found sound) become browsable, beat-synced-previewable, and downloadable straight into your User Library workflow.

## What's in the box

The main monolithic deliverable is one instrument called **Strudel Superdough** (`alienmind-strudel-superdough`) that understands the full Strudel language (with some exceptions, see [STRUDEL-SUPPORT.md](doc/STRUDEL-SUPPORT.md)) and is capable of sequencing notes, producing sounds and effects natively using the superdough engine, in sync with Ableton's transport clock. **Caveat:** It is highly experimental, not yet MIDI aware, has a lag of 1 pattern before producing any changes, and does not accept real-time changes on knobs (they apply on the next loop).

We deliver a set of experimental devices (MIDI control, instrument, audio effect) and **two exemplary racks**:
- **AlienMind Strudel Bass Rack.adg** - A Strudel MIDI instrument that understands mini notation + stock Ableton bass plugin + Audio FX plugin that translates Strudel audio expressions to native Ableton effects.
- **AlienMind Strudel Superdough Rack.adg** - A full rack with 3 Strudel instruments (MIDI control, superdough engine, hybrid sfx unit) that showcase the full chain. It's highly experimental; MIDI notes are not processed by superdough.

We also deliver **additional utility instruments** that showcase different capabilities, and are just some tools in the toolset for any curious and adventurous producer:

| Device | Type | What it does for you |
|---|---|---|
| **Strudel Superdough** (`alienmind-strudel-superdough.amxd`) | Instrument | **ALL of Strudel as the track's audio.** The main monolithic instrument described above. Renders offline with the real superdough engine into a loop that plays locked to Live's transport. Edits fade in at the next loop boundary; random patterns render one realization per loop with a visible notice. |
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect | Allows you to sequence notes and pass it to any instrument. It also allows you to translate Strudel patterns to the piano roll and vice versa. It streams live MIDI tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Scale-aware (follows Live 12's key). |
| **Strudel Drums MIDI** (`alienmind-strudel-drums-midi.amxd`) | MIDI effect | Allows you to map drum patterns that would normally sound as sounds into MIDI notes that can be sequenced to a drum rack. A dedicated mapping UI routes drum words (`bd`, `sd`, `hh`) to specific Drum Rack pads, and the map travels with your set. |
| **Strudel Drums Sampler** (`alienmind-strudel-drums-sampler.amxd`) | Instrument | Allows you to actually play sounds from the hundreds of Strudel drum machines available in the standard sound packs. It's a polyphonic instrument and accepts MIDI in. Write `s("bd sd, hh*8")`, and a bank picks which machine plays. Sounds auto-download in the background. |
| **Strudel Audio FX** (`alienmind-strudel-fx.amxd`) | Audio effect | Write **one line** of Strudel's effect vocabulary - `.lpf(800).hpf(120).crush(8).gain(1.2)` - and it applies to whatever audio is already on the track. Nine stages, each a real Live parameter: automatable, MIDI-mappable, native dials. Patterns modulate too (`.lpf(sine.range(200, 2000))`). |
| **Strudel Samples** (`alienmind-strudel-sample-browser.amxd`) | Audio effect | Allows you to explore the collections of community samples, and play them in sync with your beat. Auditioning downloads the file next to the device; drag it out into a Simpler, a Drum Rack or a track. |

![The shipped Instrument Racks: sequencer -> instrument -> effects](doc/strudel-rack.png)

## Quick Examples

If you are eager to jump in, here are a few valid patterns you can drop straight into the respective devices to get started immediately:

**Strudel MIDI**
```js
<c1 c1 <c2 c#2>>*16
```

**Strudel Drums MIDI**
```js
s("bd hh sd hh")
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

Each `.amxd` is fully **self-contained** - its own React UI bundle (the Strudel engine only travels inside the devices that run patterns: the two MIDI devices and the Drums Sampler) unpacks itself on first load. Drag from Live's browser onto a MIDI track (Strudel MIDI, Drums MIDI, Drums Sampler) or an audio track (Strudel Samples, Audio FX) and go. Nothing ships loose beside the devices, and nothing runs a Node process.

*(For developers building from source, you can use `pnpm install:device` to automatically copy the compiled devices to your local Ableton User Library).*

## Build & test

```bash
pnpm install
git submodule update --init   # strudel/ - the engine is bundled from here
pnpm test          # vitest: mini-notation parser + headless engine tests
pnpm build         # → dist/m4l-strudel/alienmind-strudel-{midi,sample-browser,fx}.amxd
                    #   + dist/m4l-strudel.zip (release archive incl. installers)
pnpm dev:midi       # browser dev for the MIDI device, mocked Live beside it
pnpm dev:drums-midi # browser dev for the Drums MIDI device
pnpm dev:sample-browser # browser dev for the sample browser
pnpm dev:fx         # browser dev for the Audio FX device
pnpm dev:superdough # browser dev for the Superdough render device
```

For full details on building these devices with the underlying framework from scratch, read [doc/M4L-JWEB-GUIDE.md](doc/M4L-JWEB-GUIDE.md). Detailed architecture diagrams and concepts are found in [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md).

## License

**AGPL-3.0-or-later**, matching [Strudel's own license](https://strudel.cc/technical-manual/project-start/). This project bundles the real `@strudel/core` engine (via the `strudel/` git submodule) and runs it directly, which makes it a derivative work under Strudel's AGPL terms. See [LICENSE](LICENSE) for the full text.
