# m4l-strudel - A Hybrid Live Coding Experiment

![Devices overview - Strudel MIDI, Drums MIDI, Drums Sampler, Audio FX and the sample browser](doc/screenshot-all-devices.png)

This started as a fun experiment: *How cool is Strudel! Can I connect it to Ableton and control it from the Push to create the ultimate hybrid workflow?*

The result is a set of **Max for Live devices** that bring [Strudel](https://strudel.cc) - the JavaScript port of TidalCycles' pattern language - natively into Ableton Live. No browser tab, no virtual MIDI cables, no sync hacks: the real `@strudel/core` engine runs headlessly inside each device, locked to Live's transport, and fully mappable to Ableton Push for hands-on control!

> **New here? Start with the [user guide](doc/ABOUT.md)** - every control of every device explained.
> 
> **Note:** The pattern language is fully supported, but Strudel's *sound engine* is not. For a full list of what is supported and how it differs from the web version, see [doc/STRUDEL-SUPPORT.md](doc/STRUDEL-SUPPORT.md).

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

All six devices are ready to use.

| Device | Type | What it does for you |
|---|---|---|
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect | Type a Strudel pattern, press **Run**, and it streams live MIDI into whatever instrument sits after it - tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Scale-aware (it follows Live 12's key). Converts patterns **to and from MIDI clips** on the track (in a Rack too). A **macro-mappable Play/Stop** parameter (reveal it under **About > Advanced > Controls**) lets a Rack macro or a Push button start and stop the sequencer. |
| **Strudel Drums MIDI** (`alienmind-strudel-drums-midi.amxd`) | MIDI effect | The exact same engine as Strudel MIDI, but purpose-built for driving Drum Racks. A dedicated mapping UI routes drum words (`bd`, `sd`, `hh`) to specific Drum Rack pads, and **the map travels with your set**. |
| **Strudel Audio FX** (`alienmind-strudel-fx.amxd`) | Audio effect | Write **one line** of Strudel's effect vocabulary - `.lpf(800).hpf(120).crush(8).gain(1.2)` - and it applies to whatever audio is already on the track. Nine stages (filter, hpf, drive, crush, delay, reverb, gain), each a real Live parameter: automatable, MIDI-mappable, native dials in the device view, and two named Push banks (Tone / Space). **Patterns modulate too**: `.lpf(sine.range(200, 2000))` sweeps the cutoff once per bar through `live.remote~` - continuous modulation, no automation written, and the dial comes back the moment the line stops asking. |
| **Strudel Drums Sampler** (`alienmind-strudel-drums-sampler.amxd`) | Instrument | A polyphonic, **code-driven** sampler over drum-machine **banks**. Write `s("bd sd, hh*8")` (or a bare `bd sd, hh!6`); a bank (a tidal-drum-machine, strudel's `bank()` prefix) picks which machine's `bd`/`sd`/`hh` play, and samples auto-download in the background from the same repos the browser uses. Sixteen voices; overlapping sounds ring out independently, and two instances keep separate samples. **MIDI notes drive it too** (Drum Rack layout), so a sequencer in front plays the same bank. |
| **Strudel Superdough** (`alienmind-strudel-superdough.amxd`) | Instrument | **ALL of Strudel as the track's audio.** Write anything strudel.cc plays - multi-line `$:`, samples, synths, orbits, superdough's real effects - and the device renders it **offline with the real superdough engine** into a loop that plays through the track's fader, sends and recording, locked to Live's transport. Edits fade in at the next loop boundary; random patterns render one realization per loop with a visible notice. It is superdough itself, not a port - what you hear is what the site plays. |
| **Strudel Samples** (`alienmind-strudel-sample-browser.amxd`) | Audio effect | Browse Strudel's sample-map universe (dirt-samples, dough-samples, shabda, any `strudel.json` repo) and **audition samples through the track** - beat-synced to your project's launch quantization, looped in time, and heard through the track's own fader and effects. Auditioning downloads the file next to the device; drag it out into a Simpler, a Drum Rack or a track. |

**Ships with an Instrument Rack preset** (`presets/AlienMind Strudel Rack.adg`): Strudel MIDI -> a native Ableton instrument -> Strudel Audio FX, wired and ready to drop from Live's browser.

![The shipped Instrument Rack: sequencer -> instrument -> effects](doc/strudel-rack.png)

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
