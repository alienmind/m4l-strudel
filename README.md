# m4l-strudel - A Hybrid Live Coding Experiment

![Devices Overview](doc/screenshot-devices-1.png)

This started as a fun experiment: *How cool is Strudel! Can I connect it to Ableton and control it from the Push to create the ultimate hybrid workflow?*

The result is a set of **Max for Live devices** that bring [Strudel](https://strudel.cc) - the
JavaScript port of TidalCycles' pattern language - natively into Ableton Live.
No browser tab, no virtual MIDI cables, no sync hacks: the real
`@strudel/core` engine runs headlessly inside each device, locked to Live's
transport, and fully mappable to Ableton Push for hands-on control!

## Why a producer would care

- **Generative sequencing in one line.** `note("c3 e3 g3 b3").sometimesBy(.3, x=>x.fast(2))`
  is a whole evolving part. Euclidean rhythms, polymeter, per-cycle
  alternation - things that are tedious to click into a piano roll are one
  expression in Strudel.
- **The ultimate hybrid workflow.** By exposing Strudel's engine states (like the `play` parameter) directly to Live, you can map them to your **Ableton Push** or external MIDI controllers. Start and stop complex algorithmic sequences with physical hardware!
- **A dedicated drum machine.** The new **Strudel MIDI Drums** device brings Strudel's generative drum language (`bd`, `sd`, `hh`) straight to your Ableton Drum Racks. It features a visual **Kit** mapper that natively persists in your Live set, letting you easily route algorithmic sequences to any custom kit!

![Strudel MIDI Drums Kit Mapping](doc/screenshot-midi-drums-mapping.png)

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

## What's in the box

All four devices are ready to use.

| Device | Type | What it does for you |
|---|---|---|
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect | Type a Strudel pattern, press **Run**, and it streams live MIDI into whatever instrument sits after it - tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Scale-aware (it follows Live 12's key). Converts patterns **to and from MIDI clips** on the track. |
| **Strudel MIDI Drums** (`alienmind-strudel-midi-drums.amxd`) | MIDI effect | The exact same engine as Strudel MIDI, but purpose-built for driving Drum Racks. A dedicated mapping UI routes drum words (`bd`, `sd`, `hh`) to specific Drum Rack pads, and **the map travels with your set**. |
| **Strudel Audio FX** (`alienmind-strudel-fx.amxd`) | Audio effect | Write **one line** of Strudel's effect vocabulary - `.lpf(800).gain(1.2)` - and it applies to whatever audio is already on the track. The values become real Live parameters: automatable, MIDI-mappable, and visible on Push. |
| **Strudel Samples** (`alienmind-strudel-sampler-browser.amxd`) | Audio effect | Browse Strudel's sample-map universe (dirt-samples, dough-samples, shabda, any `strudel.json` repo) and **audition samples through the track** - beat-synced to your project's launch quantization, looped in time, and heard through the track's own fader and effects. Auditioning downloads the file next to the device; drag it out into a Simpler, a Drum Rack or a track. |

**New here? Start with the [user guide](doc/ABOUT.md)** - every control of
every device explained (Bars, Grid, Octave conventions, Shift, Run/Hush,
the sample catalog...), with screenshots and typical workflows.

> ### Read this before you paste a pattern from strudel.cc
>
> **The pattern language is fully supported. Strudel's *sound engine* is not** -
> and cannot be, inside a Max for Live device. The practical consequence:
>
> ```js
> s("bd sd bd sd")   // silence. no notes, no error.
> ```
>
> `s()` / `sound()` names a **sample** for Strudel's own audio engine, which does
> not exist here (audio made in the device's browser view has no path into Live's
> signal chain). A pattern with no *note* in it produces no MIDI, and the device
> looks broken when it is simply being asked for a sound it cannot make. Write
> `bd sd bd sd` instead - drum words map to Drum Rack pads.
>
> Likewise `.room()`, `.lpf()`, `.pan()` and friends attached to a *note* pattern
> are silently dropped: there is no synth in a MIDI effect to hear them. Put the
> reverb on the track, the Ableton way round.
>
> **[doc/STRUDEL-SUPPORT.md](doc/STRUDEL-SUPPORT.md) is the full map** - what
> works, what is ignored, what is refused, and why.

## Patterns that work today

Every line below is verified against the real engine in this repo's tests.

**Bare mini-notation** - type it straight in, no quotes, no `note(...)`:

```
0 2 4 <7 6>            scale degrees of Live's key; <> alternates per cycle
0 [2 ~] -1 <4 [5 6]>   negative degrees, rests, nesting
[0,2,4] ~ [3,5,7] ~    chords
bd sd bd sd            drum words -> Drum Rack pads
bd(3,8) ~ sd ~         euclidean rhythm: 3 kicks spread over 8 steps
bd!3 sd                replication: three kicks, then a snare
[bd hh]*2 sd hh        subdivision
c5 [e5 g5]*2 ~ <a5 b5> absolute note names, if you prefer them
{0 2 4, 7 9}%4         polymeter
```

**Full Strudel code** - anything the language can do, and all of it exports to a
clip too:

```js
note("c3 e3 g3").fast(2)
n("0 2 4 6").scale(liveScale)                       // liveScale = Live's own key
note("c3 [e3 g3]").jux(x => x.rev())                // stereo-split via .midichan
note("c3 e3 g3 b3").sometimesBy(.3, x => x.fast(2)) // a part that evolves
note("c3(3,8)").off(1/8, x => x.add(note(7)))       // an echo a fifth up
n("<[0,2,4] [3,5,7]>").scale(liveScale).slow(2)     // a two-bar chord progression
$: note("c2*4")                                     // several parts at once
$: note("<e4 g4>").midichan(2)
```

**Audio FX** - one line, applied to the audio already on the track:

```js
.lpf(800)              // one-pole lowpass at 800 Hz
.lpf(2000).gain(1.2)   // ... and a little push
.cutoff(440)           // `cutoff` and `lpf` are the same control
```

`.room()`, `.delay()` and `.crush()` are recognised but have no Max chain behind
them yet - the device tells you so rather than pretending they worked. A modulated
value (`.lpf(sine.range(200,2000))`) is refused for the same reason: see
[doc/TODO.md](doc/TODO.md).

## Download

You can download the pre-built `.amxd` devices ready for Ableton Live from:
- **[Download Latest Release](https://github.com/alienmind/m4l-strudel/releases/latest)**
- **[Gumroad](https://alienmindzzz.gumroad.com/l/m4l-strudel)** (might be outdated)

## Install

Once downloaded, simply extract the ZIP file and copy the `.amxd` devices into your Ableton **User Library** (e.g. `User Library/Max For Live/m4l-strudel/`).

Each `.amxd` is fully **self-contained** - its own React UI bundle (the Strudel engine only travels inside the MIDI devices, the only ones that need it) unpacks itself on first load. Drag from Live's browser onto a MIDI track (midi, midi-drums) or an audio track (sampler-browser, fx) and go. Nothing ships loose beside the devices, and nothing runs a Node process.

*(For developers building from source, you can use `pnpm install:device` to automatically copy the compiled devices to your local Ableton User Library).*

## Build & test

```
pnpm install
git submodule update --init   # strudel/ - the engine is bundled from here
pnpm test          # vitest: mini-notation parser + headless engine tests
pnpm build         # → dist/m4l-strudel/alienmind-strudel-{midi,sampler-browser,fx}.amxd
                    #   + dist/m4l-strudel.zip (release archive incl. installers)
pnpm dev:midi       # browser dev for the MIDI device, mocked Live beside it
pnpm dev:midi-drums # browser dev for the MIDI Drums device
pnpm dev:sampler-browser # browser dev for the sample browser
pnpm dev:fx         # browser dev for the Audio FX device
```

## Built on M4L-JWEB

This is a **[M4L-JWEB](https://github.com/alienmind/m4l-jweb)** device repo, on
the 0.5.0 shape: one `src/app/<device>/` folder per device (`App.tsx`,
`protocol.ts`, `surface.ts`), each building into its own `.amxd` with its own UI
bundle - a device ships what it is, not what its sibling is. `patcher/devices.mjs`
is the manifest; `wrapper/device.ts` holds the shared `[js]` extensions. A
device's Live parameters are declared **once**, in its `surface.ts`, and the build
generates the `live.*` objects, their wiring and their message selectors from that
one declaration. Everything else - the `.amxd` container writer, the generated
patchers, the `[js]` lifecycle, the ES5 gate, the per-device build plumbing
(`scripts/dev.mjs`, `scripts/build-ui.mjs`) - comes from the published
`@m4l-jweb/bridge`, `@m4l-jweb/surface` and `@m4l-jweb/build` packages.

If you were setting this repo up from scratch today, this is the path:

1. **Scaffold the repo.**
   ```bash
   pnpm dlx @m4l-jweb/build init m4l-strudel
   cd m4l-strudel && pnpm install
   ```
   This gives you a working one-device `hello-midi` build: `src/app/midi/`
   (`App.tsx`, `protocol.ts`, `surface.ts`), `patcher/devices.mjs`, all the
   vite/tsconfig plumbing - the exact shape this repo still has today.

2. **Pull in the real engine.** `git submodule add` the upstream Strudel repo
   at `strudel/`, and bundle `@strudel/core` + `mini` + `transpiler` + `tonal`
   from it via vite aliases (see `vite.config.ts` / `vitest.config.ts`).

3. **Grow `patcher/devices.mjs` to four devices.** One manifest entry per
   device (the two MIDI devices as `type: "midi"`; `-sampler-browser` and `-fx`
   as `type: "audio"`, the browser with `mode: "sampler-browser"`), each with a
   `ui` field naming its `src/app/` folder and its `chains` - the packaged
   `midiout`, `samples` and `download`, or one of this project's own
   (`strudel-delay`, `strudel-room`) registered via `patcher/chains.mjs`.
   Push-visible parameters are NOT declared here: they live in each device's
   `surface.ts`.

4. **Add a folder per device.** `src/app/midi/App.tsx` becomes the pattern
   editor, `src/app/sampler-browser/App.tsx` the sample browser - each with its
   own `protocol.ts` (spreading `DEVICE_IN`/`CHAIN_OUT` from `@m4l-jweb/bridge`
   rather than retyping them) and `surface.ts`. The engine itself runs in a Web
   Worker (`src/app/shared/engine.worker.js`, MIDI-only - the browser never
   needed it), so pattern evaluation never blocks the UI thread.

5. **Extend the wrapper.** `wrapper/device.ts` adds everything genuinely
   device-specific on top of `@m4l-jweb/wrapper`'s packaged lifecycle: mode
   resolution from `jsarguments`, Live 12 scale observers and clip-availability
   polling - hooking into `onDeviceReady`/`onUiReady`. One wrapper file for
   the whole repo, shared by every device's `[js]` glue.

6. **Declare what must survive the set.** A `state` slot in `surface.ts` (the
   drums device's map, the FX device's line) compiles to a `[dict]` + `[pattr]`
   Live saves with the SET, bound two-way with `useStateSync()`. Live parameters
   carry numbers; a slot carries the things a number cannot be.

7. **Build.** `pnpm build` runs `scripts/build-ui.mjs` (one Vite build per
   device, `dist/ui/<device>/index.html`) then `m4l-jweb build` - `.amxd`
   containers generated entirely from Node scripts, no manual Max editing, on
   a machine that has never opened Max.

Three devices, three independent UI bundles, one wrapper. Live's transport is fed
in as messages via `[plugsync~]`, the engine queries pattern events ahead of
time, and Max's `[pipe]`/`[makenote]` apply the precise timing.

**Full details:** [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) - the build
pipeline, the exact jweb/js/node message protocol, and what we do (and
deliberately don't) depend on from upstream strudel.cc. For the underlying
M4L-JWEB approach itself, the generated patchers,
the headless `.amxd` writer, `m4l-jweb init` - see
[m4l-jweb's README](https://github.com/alienmind/m4l-jweb#readme) and
[doc/ARCHITECTURE.md](https://github.com/alienmind/m4l-jweb/blob/main/doc/ARCHITECTURE.md)
in that repo.

## Bare mini-notation

The editor takes two dialects. This is the shorthand one - no quotes, no
`note(...)`. (The other is full Strudel code, which the real engine evaluates;
both **play** and both **export to a clip**.)

| Feature | Example | Meaning |
|---|---|---|
| Sequence | `c5 e5 g5` | equal division of one cycle |
| Subdivision | `[e5 g5]` | nested equal division |
| Rest | `~` | silence |
| Repeat / speed | `[e5 g5]*2` | play the group twice **inside its slot** |
| Replication | `bd!3` | three **steps**, not a faster one |
| Elongation | `c5@3 e5` | c5 takes 3x the weight |
| Alternation | `<a5 b5>` | one element per cycle |
| Stack (chord) | `[c5,e5,g5]` | parallel notes |
| Polymeter | `{c5 e5, g5 b5 d6}%4` | 4 steps/cycle per layer |
| Euclid | `c5(3,8)` | 3 pulses over 8 steps (Bjorklund) |
| Scale degree | `0 2 4 -1` | degrees of **Live's own key** (see below) |
| Drum word | `bd sd hh` | Drum Rack pads (`bd`=36, `sd`=38, `hh`=42...) |
| Note name | `c5 eb4 f#2` | absolute pitch |

**Numbers are scale degrees, not MIDI pitches.** With **Live Scale** on (the
default), `0` is the root of the song's key, `2` is the second degree up, `-1` is
the note below the root - so a pattern transposes with the track. Turn it off and
a number is a raw MIDI pitch, which is Strudel's own reading. Either way, Live's
key is available to code as `liveScale`: `n("0 2 4").scale(liveScale)`.

**Drum words** map to Drum Rack pads and are editable in the **Kit** panel. A word
only reaches the kit if it is not a valid note name, so `e` is always the note E.

**Octave convention** defaults to Strudel (`c5` = MIDI 60); switch to Scientific
(`c4` = 60) or apply an octave shift in the UI. Note that *full Strudel code* uses
Strudel's own scientific naming, where `c5` is MIDI 72 - the UI warns about this.

**Ctrl+Enter** re-evaluates without restarting the cycle, and the step that is
sounding is highlighted as it plays.

## Clip I/O behaviour (To Clip / From Clip)

- **To Clip** renders the pattern **on the Strudel engine** - so every
  transformation exports, including `.transpose()`, `.arp()`, `.jux()` and full JS
  chains - and creates a Session clip named "Strudel" in the **first empty clip
  slot** of the track. It measures the pattern's true loop length, so `<a b>`
  writes both cycles rather than being truncated at the first.
- **From Clip** reads notes back into mini-notation from, in order of
  preference: the **currently playing** clip on this track, else the **first
  clip** found. The button disables itself when the track has no clips
  (polled once a second). It reads MIDI, so structure (`<>`, `*`) comes back
  flattened into the notes it produced.

## License

**AGPL-3.0-or-later**, matching [Strudel's own
license](https://strudel.cc/technical-manual/project-start/). This project
bundles the real `@strudel/core` engine (via the `strudel/` git submodule) and
runs it directly, which makes it a derivative work under Strudel's AGPL terms.
See [LICENSE](LICENSE) for the full text.
