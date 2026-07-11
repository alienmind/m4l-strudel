# m4l-strudel — Strudel live coding inside Ableton Live

Three **Max for Live devices** that bring [Strudel](https://strudel.cc) — the
JavaScript port of TidalCycles' pattern language — natively into Ableton Live.
No browser tab, no virtual MIDI cables, no sync hacks: the real
`@strudel/core` engine runs headlessly inside each device, locked to Live's
transport.

## What's in the box

| Device | Type | What it does for you |
|---|---|---|
| **Strudel MIDI** (`alienmind-strudel-midi.amxd`) | MIDI effect | Type a Strudel pattern, press **Run**, and it streams live MIDI into whatever instrument sits after it — tempo-locked to Live, following tempo changes, multi-channel via `.midichan()`. Also converts patterns **to and from MIDI clips** on the track. |
| **Strudel Samples** (`alienmind-strudel-sampler.amxd`) | Audio effect | Browse Strudel's sample-map universe (dirt-samples, dough-samples, shabda, any `strudel.json` repo), **preview samples beat-synced** to your project tempo, and download them to `~/Music/StrudelSamples` for native drag-and-drop from Live's browser. |
| **Strudel Audio** (`alienmind-strudel-audio.amxd`) | Instrument | Strudel patterns drive a built-in polyphonic Max synth (`poly~`, basic waveforms + filter) — no external instrument needed. v1, exploratory. |

## Why a producer would care

- **Generative sequencing in one line.** `note("c3 e3 g3 b3").sometimesBy(.3, x=>x.fast(2))`
  is a whole evolving part. Euclidean rhythms, polymeter, per-cycle
  alternation — things that are tedious to click into a piano roll are one
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

Build (or unzip a release), then run the installer for your OS — it locates
your Ableton User Library from Live's own config and copies all three
devices into `User Library/Max For Live/m4l-strudel/`:

```
scripts\install-windows.ps1   # Windows
scripts/install-mac.sh        # macOS
scripts/install-linux.sh      # Linux (Live under Wine)
```

Each `.amxd` is fully **self-contained** — the React UI and the bundled
Strudel engine travel inside the device file and unpack themselves on first
load. Drag from Live's browser onto a MIDI track (midi / audio devices) or an
audio track (sampler) and go.

## Build & test

```
pnpm install
git submodule update --init   # strudel/ - the engine is bundled from here
pnpm test    # vitest: mini-notation parser + headless engine tests
pnpm build   # → dist/m4l-strudel/alienmind-strudel-{midi,sampler,audio}.amxd
             #   + dist/m4l-strudel.zip (release archive incl. installers)
pnpm dev     # browser dev for the UI; use maxSimulate('mode','sampler') etc.
```

## How it works (short version)

One codebase produces all three devices. The real Strudel engine
(`@strudel/core` + mini + tonal, bundled by esbuild from the `strudel/` git
submodule) runs in `[node.script]` (Node for Max); Live's transport is fed in
via `[plugsync~]`, and the engine queries pattern events ahead of time and
schedules them sample-accurately through Max's `[pipe]`/`[makenote]`. The UI
is a single React app in `[jweb]` that mode-switches per device; LiveAPI work
(clips, Live 12 scale awareness) lives in an ES5 `[js]` glue script. The
`.amxd` containers themselves are generated **entirely from Node scripts** —
no manual Max editing in the build loop.

**Full details:** [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) — the build
pipeline, the amxd container writer, the exact jweb/js/node message protocol,
and what we do (and deliberately don't) depend on from upstream strudel.cc.

## Supported mini-notation (clip converter)

The **To Clip / From Clip** feature uses a small built-in parser
(`src/lib/mini/`), independent of the live engine:

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

Octave convention defaults to **Strudel** (`c5` = MIDI 60); switch to
Scientific (`c4` = 60) or apply an octave shift in the UI. The **live Run
mode is not limited to this table** — it evaluates full Strudel code in the
real engine.

## Clip I/O behaviour (To Clip / From Clip)

- **To Clip** renders the pattern and creates a Session clip named "Strudel"
  in the **first empty clip slot** of the track the device sits on.
- **From Clip** reads notes back into mini-notation from, in order of
  preference: the **currently playing** clip on this track, else the **first
  clip** found. The button disables itself when the track has no clips
  (polled once a second).

## Related

The sibling project `tmp/mcp-strudel` is an **MCP server** exposing the same
mini-notation converter to Claude, so patterns can be written in natural
language and pushed into Ableton. Both share `src/lib/mini`.
