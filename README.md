# m4l-strudel - Strudel live coding inside Ableton Live

Three **Max for Live devices** that bring [Strudel](https://strudel.cc) - the
JavaScript port of TidalCycles' pattern language - natively into Ableton Live.
No browser tab, no virtual MIDI cables, no sync hacks: the real
`@strudel/core` engine runs headlessly inside each device, locked to Live's
transport.

## What's in the box

| Device | Type | What it does for you |
|---|---|---|
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect | Type a Strudel pattern, press **Run**, and it streams live MIDI into whatever instrument sits after it - tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Also converts patterns **to and from MIDI clips** on the track. |
| **Strudel Samples** (`alienmind-strudel-sampler.amxd`) | Audio effect | Browse Strudel's sample-map universe (dirt-samples, dough-samples, shabda, any `strudel.json` repo), **preview samples beat-synced** to your project tempo, and download them to `~/Music/StrudelSamples` for native drag-and-drop from Live's browser. |
| **Strudel Audio** (`alienmind-strudel-audio.amxd`) | Instrument | Strudel patterns drive a built-in polyphonic Max synth (`poly~`, basic waveforms + filter) - no external instrument needed. v1, exploratory. |

**New here? Start with the [user guide](doc/ABOUT.md)** - every control of
every device explained (Bars, Grid, Octave conventions, Shift, Run/Hush,
the sample catalog...), with screenshots and typical workflows.

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

## Install

Build (or unzip a release), then install the built devices into Ableton's
User Library:

```
pnpm install:device
```

This finds your Ableton User Library from Live's own config and copies all
three devices into `User Library/Max For Live/m4l-strudel/`. Each `.amxd` is
fully **self-contained** - the React UI and the bundled Strudel engine travel
inside the device file and unpack themselves on first load. Drag from Live's
browser onto a MIDI track (midi / audio devices) or an audio track (sampler)
and go.

## Build & test

```
pnpm install
git submodule update --init   # strudel/ - the engine is bundled from here
pnpm test    # vitest: mini-notation parser + headless engine tests
pnpm build   # → dist/m4l-strudel/alienmind-strudel-{midi,sampler,audio}.amxd
             #   + dist/m4l-strudel.zip (release archive incl. installers)
pnpm dev     # browser dev for the UI; use maxSimulate('mode','sampler') etc.
```

## Built on M4L-JWEB

This is a **[M4L-JWEB](https://github.com/alienmind/m4l-jweb)** device repo:
a web app in `src/app/`, a device manifest in `patcher/devices.mjs`, optional
`[js]` extensions in `wrapper/device.ts`. Everything else - the `.amxd`
container writer, the generated patchers, the `[js]` lifecycle, the ES5 gate
- comes from the published `@m4l-jweb/bridge` and `@m4l-jweb/build` packages.

If you were setting this repo up from scratch today, this is the path:

1. **Scaffold the repo.**
   ```bash
   pnpm dlx @m4l-jweb/build init m4l-strudel
   cd m4l-strudel && pnpm install
   ```
   This gives you a working one-device `hello-midi` build: `src/app/App.tsx`,
   `src/app/protocol.ts`, `patcher/devices.mjs`, all the vite/tsconfig
   plumbing - the exact shape this repo still has today.

2. **Pull in the real engine.** `git submodule add` the upstream Strudel repo
   at `strudel/`, and bundle `@strudel/core` + `mini` + `transpiler` + `tonal`
   from it via vite aliases (see `vite.config.ts` / `vitest.config.ts`).

3. **Grow `patcher/devices.mjs` to three devices.** One manifest entry per
   device (`alienmind-strudel-midi` as `type: "midi"`, `-audio` as
   `type: "instrument"`, `-sampler` as `type: "audio"` with `mode: "sampler"`),
   each declaring its `chains` (`midiout`, or the project's own `poly` /
   `sampler` chains registered via `patcher/chains.mjs`) and Push-visible
   `parameters`.

4. **Replace the scaffold's UI with the real one.** `src/app/App.tsx` becomes
   the pattern editor + sample browser; the engine itself runs in a Web
   Worker (`src/app/engine.worker.js`) instead of the scaffold's placeholder
   worker, so pattern evaluation never blocks the UI thread.

5. **Extend the wrapper.** `wrapper/device.ts` adds everything genuinely
   device-specific on top of `@m4l-jweb/wrapper`'s packaged lifecycle: mode
   resolution from `jsarguments`, Live 12 scale observers, clip-availability
   polling, and the sampler's `[node.script]` bootstrap - hooking into
   `onDeviceReady`/`onUiReady`/`onTick`/`onTempoChange`.

6. **Add the sampler's node host as an extra payload.** The manifest's
   `payloads`/`looseFiles` fields ship `strudel-node-sampler.cjs` alongside
   the `.amxd`, extracted by the packaged wrapper on load.

7. **Build.** `pnpm build` runs `m4l-jweb build` under the hood - `.amxd`
   containers generated entirely from Node scripts, no manual Max editing,
   on a machine that has never opened Max.

One codebase produces all three devices. Live's transport is fed in as
messages via `[plugsync~]`, the engine queries pattern events ahead of time,
and Max's `[pipe]`/`[makenote]` apply the precise timing.

**Full details:** [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) - the build
pipeline, the exact jweb/js/node message protocol, and what we do (and
deliberately don't) depend on from upstream strudel.cc. For the underlying
M4L-JWEB approach itself - the two escape hatches, the generated patchers,
the headless `.amxd` writer, `m4l-jweb init` - see
[m4l-jweb's README](https://github.com/alienmind/m4l-jweb#readme) and
[doc/ARCHITECTURE.md](https://github.com/alienmind/m4l-jweb/blob/main/doc/ARCHITECTURE.md)
in that repo.

## Supported mini-notation (clip converter)

The **To Clip / From Clip** feature uses a small built-in parser
(`src/lib/mini/`), independent of the live engine:

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

Octave convention defaults to **Strudel** (`c5` = MIDI 60); switch to
Scientific (`c4` = 60) or apply an octave shift in the UI. The **live Run
mode is not limited to this table** - it evaluates full Strudel code in the
real engine.

## Clip I/O behaviour (To Clip / From Clip)

- **To Clip** renders the pattern and creates a Session clip named "Strudel"
  in the **first empty clip slot** of the track the device sits on.
- **From Clip** reads notes back into mini-notation from, in order of
  preference: the **currently playing** clip on this track, else the **first
  clip** found. The button disables itself when the track has no clips
  (polled once a second).

## License

**AGPL-3.0-or-later**, matching [Strudel's own
license](https://strudel.cc/technical-manual/project-start/). This project
bundles the real `@strudel/core` engine (via the `strudel/` git submodule) and
runs it directly, which makes it a derivative work under Strudel's AGPL terms.
See [LICENSE](LICENSE) for the full text.
