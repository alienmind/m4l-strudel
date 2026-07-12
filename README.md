# m4l-strudel - Strudel live coding inside Ableton Live

**Max for Live devices** that bring [Strudel](https://strudel.cc) - the
JavaScript port of TidalCycles' pattern language - natively into Ableton Live.
No browser tab, no virtual MIDI cables, no sync hacks: the real
`@strudel/core` engine runs headlessly inside each device, locked to Live's
transport.

## What's in the box

**Strudel MIDI is the one that's ready to use.** Samples is **experimental**
in this release - shipped so you can see where this is going, not for real
sessions yet. A third device, a real Strudel audio-effects chain, is planned;
see [doc/TODO.md](doc/TODO.md).

| Device | Type | What it does for you |
|---|---|---|
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect | Type a Strudel pattern, press **Run**, and it streams live MIDI into whatever instrument sits after it - tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Also converts patterns **to and from MIDI clips** on the track. |
| **Strudel Samples** (`alienmind-strudel-sampler.amxd`) | Audio effect | Browse Strudel's sample-map universe (dirt-samples, dough-samples, shabda, any `strudel.json` repo), **preview samples beat-synced** to your project tempo, and download them to `~/Music/StrudelSamples` for native drag-and-drop from Live's browser. **Experimental - not recommended for real sessions yet.** |

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

This finds your Ableton User Library from Live's own config and copies both
devices into `User Library/Max For Live/m4l-strudel/`. Each `.amxd` is fully
**self-contained** - its own React UI bundle (the Strudel engine only travels
inside the MIDI device, which is the only one that needs it) unpacks itself on
first load. Drag from Live's browser onto a MIDI track (midi) or an audio
track (sampler) and go.

## Build & test

```
pnpm install
git submodule update --init   # strudel/ - the engine is bundled from here
pnpm test          # vitest: mini-notation parser + headless engine tests
pnpm build         # → dist/m4l-strudel/alienmind-strudel-{midi,sampler}.amxd
                    #   + dist/m4l-strudel.zip (release archive incl. installers)
pnpm dev:midi       # browser dev for the MIDI device, mocked Live beside it
pnpm dev:sampler    # browser dev for the Samples device
```

## Built on M4L-JWEB

This is a **[M4L-JWEB](https://github.com/alienmind/m4l-jweb)** device repo,
on the 0.2.0 multi-device shape: one `src/app/<device>/` folder per device
(`App.tsx`, `protocol.ts`, `surface.ts`), each building into its own `.amxd`
with its own UI bundle - a device ships what it is, not what its sibling is.
`patcher/devices.mjs` is the manifest; `wrapper/device.ts` holds the shared
`[js]` extensions. Everything else - the `.amxd` container writer, the
generated patchers, the `[js]` lifecycle, the ES5 gate, the per-device build
plumbing (`scripts/dev.mjs`, `scripts/build-ui.mjs`) - comes from the
published `@m4l-jweb/bridge`, `@m4l-jweb/surface` and `@m4l-jweb/build`
packages.

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

3. **Grow `patcher/devices.mjs` to two devices** (a third, a real audio-effects
   device, is planned - see [doc/TODO.md](doc/TODO.md)). One manifest entry
   per device (`alienmind-strudel-midi` as `type: "midi"`, `-sampler` as
   `type: "audio"` with `mode: "sampler"`), each with a `ui` field naming its
   `src/app/` folder, its `chains` (`midiout`, or the project's own `sampler`
   chain registered via `patcher/chains.mjs`), and Push-visible `parameters`.

4. **Add a folder per device.** `src/app/midi/App.tsx` becomes the pattern
   editor, `src/app/sampler/App.tsx` the sample browser - each with its own
   `protocol.ts` (spreading `DEVICE_IN`/`CHAIN_OUT` from `@m4l-jweb/bridge`
   rather than retyping them) and `surface.ts`. The engine itself runs in a Web
   Worker (`src/app/midi/engine.worker.js`, MIDI-only - the sampler never
   needed it), so pattern evaluation never blocks the UI thread.

5. **Extend the wrapper.** `wrapper/device.ts` adds everything genuinely
   device-specific on top of `@m4l-jweb/wrapper`'s packaged lifecycle: mode
   resolution from `jsarguments`, Live 12 scale observers, clip-availability
   polling, and the sampler's `[node.script]` bootstrap - hooking into
   `onDeviceReady`/`onUiReady`/`onTick`/`onTempoChange`. One wrapper file for
   the whole repo, shared by every device's `[js]` glue.

6. **Add the sampler's node host as an extra payload.** The manifest's
   `payloads`/`looseFiles` fields ship `strudel-node-sampler.cjs` alongside
   the `.amxd`, extracted by the packaged wrapper on load.

7. **Build.** `pnpm build` runs `scripts/build-ui.mjs` (one Vite build per
   device, `dist/ui/<device>/index.html`) then `m4l-jweb build` - `.amxd`
   containers generated entirely from Node scripts, no manual Max editing, on
   a machine that has never opened Max.

Two devices, two independent UI bundles, one wrapper. Live's transport is fed
in as messages via `[plugsync~]`, the engine queries pattern events ahead of
time, and Max's `[pipe]`/`[makenote]` apply the precise timing.

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
