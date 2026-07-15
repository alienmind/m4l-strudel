# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**This file is what is still ahead.** What has shipped is described where it
belongs: [README.md](../README.md) for what a device does, and
[ARCHITECTURE.md](ARCHITECTURE.md) for how and why it does it - including §5a,
the designs that were tried and rejected, so nobody proposes them again.

---

# Still waiting on `m4l-jweb`

*(The 0.6.0 migration that used to head this file has shipped - see the DONE section at
the bottom. Two of its four items came back with an upstream gap attached, and those are
the first two entries here.)*

- **A floating window that can talk back** - the window API shipped in 0.6.0, and it is
  **one-way**. The build compiles a declared window into a subpatcher holding its own
  `[jweb]`, and the wrapper reaches it by name (`messnamed`) to hand it its URL - but
  **the window's `[jweb]` outlet is wired to nothing**. The page renders; it cannot send
  a message to Max. So it is a display surface, and every use we have for it is an
  *editor*: the drum map, the sample browser. A sample browser that cannot request a
  catalog is a picture of a sample browser. Upstream's own `hello-window` is static
  text, which is the tell. **What is needed:** a route from the window's `[jweb]` back
  into `[js]`, and a way for a window's page to reach its device's state. Until then the
  drum map and the browser stay in the device view, cramped but real.
- **A mono sample previews in ONE EAR** - reported from Live, and it is the common case,
  not a corner: most of tidal-drum-machines is mono. The library's `samples` chain builds
  `groove~ <buf> 2`, whose two outlets are hard-wired to L and R; a mono buffer fills the
  first, the second emits silence. It **cannot** be fixed here - the channel count is not
  known until `[info~]` reports it, and patching around a chain's internal wiring from the
  app is precisely what chains exist to prevent. The app already receives the number it
  would need (`loadSample()` resolves with `channels`), so the fold belongs in the chain.
  **Filed upstream** ([m4l-jweb TODO](../../m4l-jweb/doc/TODO.md), item 0b).
- **`fanParamInto()`, exported** - `patcher/chains.mjs` still carries its own copy. It
  was meant to go in this release, and it cannot: 0.6.0 *has* the helper (`chains.mjs`
  declares it, with the `set`-silences-the-outlet fix) but **does not export it**. Four
  lines, duplicated, with a comment saying why. Delete ours the day the library exports
  its own.
- **`.room()`, `.delay()`, `.hpf()`, `.crush()` as library chains** - the **rack**
  (`m4l-jweb` item 2). Note the warning attached to it upstream: if a Max device can
  create **real Ableton devices** next to itself, then `.room()` should populate a real
  Reverb in the user's rack - their DSP, their automation, their presets - and the whole
  neutrality contract *ceases to exist* rather than getting solved. **A spike decides
  this.** Our `strudel-room`/`strudel-delay` are the fallback either way, so nothing here
  is blocked; only the upstreaming is.
- **Pattern-driven modulation (Phase 7.2)** - `.lpf(sine.range(200, 2000))` is a *signal*,
  not a parameter: as 20 Hz of parameter writes it steps audibly and fights the automation
  lane. Waiting on the **modulation seam** (`m4l-jweb` item 3). `live.remote~` may make
  this modulate *Ableton's own* devices, which is a bigger feature than an LFO on our
  filter.
- **A polyphonic Strudel sampler** (not just a preview) - waiting on the **`instrument`
  chain** (`m4l-jweb` item 1, and their NEXT UP). **And it carries an open question that
  is ours to care about:** buffer names upstream are global to Max and generated per
  DEVICE, not per instance, so two copies of a drum device on two tracks would name their
  buffers alike. Harmless for one preview. **Not harmless for a drum rack** - which is
  exactly what we would build on it. Raise it before we depend on it.
- **Strudel Audio Instrument (Phase 8)** - Strudel's own WebAudio synthesis reaching the
  track. `FEAT-STRUDEL-002`. **Do not wait for the C++ external**: see
  [../../m4l-jweb/doc/ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md), which argues a
  native bridge is the *least* promising of four routes, and that offline rendering to
  disk - now that fetch-to-disk and `[buffer~]` both work - gets there without one.

---

# Not possible: "download straight into a clip slot"

A natural request, and worth writing down so nobody re-opens it: **the Live Object Model
cannot create an audio clip from a file on disk.** `ClipSlot.create_clip` exists and is
**MIDI-only** (it takes a length, and makes an empty MIDI clip); there is no LOM call
that points a clip slot at a WAV. Ableton simply does not expose it - it is a
drag-and-drop operation in the application, not an API.

So the browser goes as far as the API allows: the sample is on disk, and **the whole row
is a drag source** once it has been auditioned (the wrapper sends the device's absolute
folder at `ui_ready`; the app puts the file on the drag). Drag it into a Simpler, a Drum
Rack or a track.

**But whether that drag lands is an open spike, not a shipped promise** -
[SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md). Two unknowns: whether `[jweb]`'s embedded
Chromium emits an OS drag at all, and if so which payload format Live's audio lane reads.
The user's "intercept what Splice drops" idea is folded into that plan, with the caveat
that a drag between two native windows is not observable from Max - what *is* observable is
the aftermath, via `Clip.file_path`, which the spike uses as its oracle. The honest
fallback, if the drag cannot leave the view, is a reveal-in-folder button; the file is
already on disk at a known path either way.

---

# Active Backlog (Prioritized Easy to Hard)

## 1. Scale and Pitch matching in full Strudel code (Medium)
- **Full Strudel code does not see the Octave/Shift controls or the Live Scale toggle.** It is passed through untouched - correct, since it is real Strudel code and rewriting a user's JS would be worse - but it means `note("c5")` there is MIDI **72** (Strudel's note names are scientific), while `c5` in bare mini-notation is whatever the octave convention says. The UI warns in amber; it cannot fix it.

## 2. Playhead highlighting for full Strudel code (Medium)
- **The playhead highlight only works for bare mini-notation.** It is computed from our own AST, whose tokens carry source positions; full Strudel code has no link back to the characters the user typed. Strudel's own editor solves this with hap `context.locations` from the transpiler - wiring that up means mapping locations in the *rewritten* string back to the user's text, which is real work for a feature that mostly matters in the dialect that already has it.

---

# DONE: the move to `m4l-jweb` 0.6.0, and the death of `[node.script]`

**The headline of this release was a DELETION.** The sample browser ran a Node process
(`src/max/sampler-browser/main.mjs`, 153 lines) because in 0.5.0 nothing else in the
stack could reach the network or the disk. It was the last `[node.script]` in either
repo, and the library forbids it outright - its failure modes in Live ran from silently
ignoring `script start` to crashing the host.

All three of its jobs had first-class answers by 0.6.0, and it took the whole apparatus
with it: the `payloads`/`looseFiles` manifest entries, `scripts/build-node-bundles.mjs`,
the `.cjs` artifact, the `engine_ready` handshake, and the base64 hop every reply
travelled through.

| The node process did... | ...and now |
|---|---|
| `fetch()` the catalog | **`fetch()` in the app** - `[jweb]` *is* Chromium. It lives in `src/lib/samples.ts`, and is under test for the first time: inside Node for Max it could not be |
| `fetch()` + `writeFile()` each sample | **`fetchToFile()`**, the `download` chain - `[maxurl]` writes it, and the bytes never cross the bridge |
| `sfplay~` + a `setTimeout` for BPM sync | **the `samples` chain** - `[buffer~]` -> `[groove~]`, **summed into the track**. The beat maths moved into the app, where `tick` and `tempo` already were |

**The preview is the point, and it is not a nicety.** `[jweb]` has no `~` outlets: audio
a page plays goes to the OS output device, past the track, the fader and the monitor cue.
Downloading before previewing is not a detour to optimise away - it is the only path to
audio Live can hear. See [ARCHITECTURE.md](ARCHITECTURE.md) §3d for the whole path.

**State that survives the SET.** The drums device's **drum map** and the FX device's
**line** are `state()` slots now, bound with `useStateSync()`, compiled to a `[dict]` +
`[pattr]` with `parameter_enable` - which is the one thing that makes Live save a value
with the set rather than with a patcher it never saves. The drum map used to live in the
page's localStorage: one map per machine, shared by every copy of the device, left behind
when the set travelled. It is now per instance, and it goes with the music.

*What did NOT ship: the floating windows, and dropping our `fanParamInto()`. Both hit
upstream gaps - see the top of this file.*

# DONE: Refactor `ableton-midi` into two devices

The old `ableton-midi` served two conflicting use cases - generating standard MIDI notes,
and mapping drum words to Drum Rack pads - which made it complex and its UI cramped. Split
into `ableton-midi` (a pure MIDI generator) and `ableton-midi-drums` (drum mapping only).

*The drum map now travels with the Live set (see the 0.6.0 section below). The cramped
mapping UI is still cramped: it was to get a floating window of its own, and that is the
one thing 0.6.0 could not give it - a window cannot send a message back to Max, so it
cannot host an editor. See the top of this file.*

---

# DONE: the effects rack

`.lpf()`, `.gain()`, `.delay()` and `.room()` work (the last two via our own
`strudel-delay` / `strudel-room` chains). `.crush()` and `.hpf()` are *named* by the
device and honestly refused ("no Max chain yet") rather than silently doing nothing.

**The frozen-graph law** ([ARCHITECTURE.md](ARCHITECTURE.md) §3c) is why: the DSP graph is
written at build time and the line only chooses values, so every stage is always in the
path and every stage needs a setting at which it is *bit-identical* to a wire. `gain: 1.0`
and `cutoff: 18 kHz` are naturally neutral; a reverb is **not** - `cverb~` is wet-only and
needs an explicit dry/wet where 0 is genuinely dry. The canonical order is frozen:
filter → drive → delay → reverb → gain, so `.lpf(800).room(0.5)` and `.room(0.5).lpf(800)`
produce the same signal path and the UI says so.

**`strudelfx` is gone**: `chains: [...]` builds a real series upstream since 0.5.0, so the
hand-wired chain that existed to work around that is not needed.

# DONE: `s("bd sd")` should not be silence

The most common idiom on strudel.cc produced **zero MIDI notes, no error, no sound**:
`hapToNote()` read `note ?? n`, and an `s()` pattern has neither. Now, when a hap has an
`s` and no note, the sample name is looked up in the **drum map** - which already maps
`bd`/`sd`/`hh` to Drum Rack pads and is already user-editable. A rhythm copied off
strudel.cc works unchanged; an `s()` name with no mapping stays silent, as it must.

---

# DONE: Themes

Live's dynamically injected CSS variables (`--live-bg-color`, `--live-text-color`, ...)
are mapped to Tailwind tokens in `index.css`, so the devices follow the user's Ableton
theme natively.

---

# DONE: Constants & Caveats

- **`MAX_CYCLES` is 64.** A pathologically nested pattern is truncated rather than exported. Nobody has hit it; it exists so a typo cannot ask for a ten-thousand-bar clip.
- **From Clip flattens structure.** It reads MIDI back as a flat grid of notes, so `<a b>` returns as its expanded note list. Inherent to reading MIDI - the structure is not in the clip - but now that To Clip exports the *whole* loop, a round trip produces a much longer flat pattern than it used to.

---

# DONE: CICD pipeline

The `.amxd` devices come from the pipeline: a GitHub Actions workflow runs `pnpm install`
and `pnpm build` (which compiles the JS and uses `m4l-jweb build` to generate the
devices), and a release action attaches `dist/m4l-strudel.zip` and the individual `.amxd`
files to a GitHub Release.
