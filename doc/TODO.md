# M4L-STRUDEL: the plan

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**This file is what is still ahead.** What has shipped is described where it
belongs: [README.md](../README.md) for what a device does, and
[ARCHITECTURE.md](ARCHITECTURE.md) for how and why it does it - including §5a,
the designs that were tried and rejected, so nobody proposes them again.

---

# Parked: waiting on `m4l-jweb`

These features are fundamentally gated by capabilities not yet present in the `m4l-jweb` framework. We must wait for them to be implemented upstream.

- **Strudel Audio Instrument (Phase 8)**: Producing a true Strudel INSTRUMENT that streams its own synthesized audio (e.g., from Strudel's WebAudio engine) directly into Max's MSP signal graph. Waiting on `FEAT-STRUDEL-002` (native C++ external shared-memory bridge).
- **Pattern-driven modulation (Phase 7.2)**: `.lpf(sine.range(200, 2000))` describes continuous modulation at 20 Hz, which steps audibly and fights automation lanes. Waiting on a Max-native `LFO` chain stage in `m4l-jweb` to support fast parameter modulation.
- **Device Persistence**: The drum map and the Audio FX text expression do not travel with the Live set. Per-device persistence needs the wrapper to own it. Waiting on `FEAT-STRUDEL-003` (`definePersistence`).
- **Sampler without `[node.script]`**: Using `[node.script]` to fetch samples can crash Live. Waiting on `m4l-jweb` Stage 3.1 (`fetch-to-disk` / `[maxurl]`).
- **`.room()`, `.delay()`, `.crush()`**: Waiting on a proper reverb/delay chain vocabulary natively in `m4l-jweb`. *(Note: This is not a hard block, we could self-host them in `chains.mjs` but upstreaming is preferred).*

---

# Active Backlog (Prioritized Easy to Hard)

## 1. Constants & Caveats (Trivial)
- **`MAX_CYCLES` is 64.** A pathologically nested pattern is truncated rather than exported. Nobody has hit it; it exists so a typo cannot ask for a ten-thousand-bar clip.
- **From Clip flattens structure.** It reads MIDI back as a flat grid of notes, so `<a b>` returns as its expanded note list. Inherent to reading MIDI - the structure is not in the clip - but now that To Clip exports the *whole* loop, a round trip produces a much longer flat pattern than it used to.

## 2. Themes (Easy)
- Add themes to this app - at the very least, dark, light and pastel.
  - **Concrete Implementation**: We can utilize CSS custom properties (variables) defined in our `index.css` or Tailwind config. 
  - Max/Live already provides Ableton's theme colors natively (which can be read by `m4l-jweb`). We can map Live's dynamically injected CSS variables (like `--live-bg-color`, `--live-text-color`) to our Tailwind tokens to automatically sync with the user's Ableton theme.
  - Alternatively, we can add a manual override drop-down in the `About` panel to toggle `document.documentElement.classList.add('theme-pastel')` etc.

## 3. Scale and Pitch matching in full Strudel code (Medium)
- **Full Strudel code does not see the Octave/Shift controls or the Live Scale toggle.** It is passed through untouched - correct, since it is real Strudel code and rewriting a user's JS would be worse - but it means `note("c5")` there is MIDI **72** (Strudel's note names are scientific), while `c5` in bare mini-notation is whatever the octave convention says. The UI warns in amber; it cannot fix it.

## 4. Playhead highlighting for full Strudel code (Medium)
- **The playhead highlight only works for bare mini-notation.** It is computed from our own AST, whose tokens carry source positions; full Strudel code has no link back to the characters the user typed. Strudel's own editor solves this with hap `context.locations` from the transpiler - wiring that up means mapping locations in the *rewritten* string back to the user's text, which is real work for a feature that mostly matters in the dialect that already has it.

## 5. CICD pipeline (Medium/Hard)
- Enough said - the amxd devices should come from the upstream CICD pipeline.
  - **Concrete Implementation**: Create a GitHub Actions workflow (`.github/workflows/build.yml`) that triggers on tag pushes or PRs to `main`.
  - The workflow should run `pnpm install`, then `pnpm build` (which compiles the JS and uses `m4l-jweb build` to generate the `.amxd` files).
  - Finally, use a release action (like `softprops/action-gh-release`) to attach the built `dist/m4l-strudel.zip` and the individual `.amxd` devices as artifacts to a GitHub Release.

---

# DONE: Refactor `ableton-midi` into two devices

The current `ableton-midi` device is attempting to serve two conflicting use cases:
1. Generating standard MIDI notes (e.g. `note("c3")`).
2. Mapping drum words and sample commands (e.g. `s("bd")`) to Drum Rack pads via a custom UI.

This makes the device overly complex and the UI cramped. The plan is to split it:
- **`ableton-midi`**: A pure MIDI generator. It will be stripped of the drum map logic and the "Kit" UI. It will solely output standard notes and scale degrees.
- **`ableton-midi-drums`**: A dedicated drum mapping device. It will do exactly one thing: map sound primitives (both bare mini-notation like `bd` and JavaScript `s("bd")`) to MIDI notes (e.g., C3/36) for Ableton Drum Racks. 

*Note: The extended mapping UI for `ableton-midi-drums` is pending framework support for popups (see `FEAT-STRUDEL-001` in `m4l-jweb`).*

---

# DONE: the effects rack

`.lpf()` and `.gain()` work. `.room()`, `.delay()`, `.crush()` and `.hpf()` are
*named* by the device and honestly refused ("no Max chain yet") rather than
silently doing nothing.

**Read the frozen-graph law first** ([ARCHITECTURE.md](ARCHITECTURE.md) §3c): the
DSP graph is written at build time and the line only chooses values. So this is
not "add effects to a chain" - it is **building the rack the device will always
have**, in a fixed order, with every stage able to be exactly neutral.

Three pieces, in order:

1. **The neutral-value rule.** The constraint the frozen graph forces, and the one
   we do not have yet. Every stage is always in the path, so every stage needs a
   setting at which it is *bit-identical* to a wire. `gain: 1.0` and
   `cutoff: 18 kHz` are naturally neutral; a reverb is **not** - it is wet-only and
   needs an explicit dry/wet where 0 is genuinely dry. Six effects without this is
   six colourations you cannot switch off. It wants to be a declared property of a
   chain, and a test.

2. **The reverb and delay chains.** `m4l-jweb`'s maintainers have checked Live's
   own install rather than trusting memory:
   - **`cverb~`** ships inside Live (`resources/externals/m4l/`) - a mono
     reverberator, signal in, reverb time in ms on inlet 1. Mono, so one per
     channel; wet-only, so it needs the dry/wet from (1).
   - **`tapin~` / `tapout~`** for delay, with feedback via `*~` - the standard Max
     delay line. `.delay()`, `.delaytime()`, `.delayfeedback()` map straight onto
     it.

3. **The canonical order.** Since it is frozen, it has to be chosen once:
   filter → drive → delay → reverb → gain. `.lpf(800).room(0.5)` and
   `.room(0.5).lpf(800)` will produce the same signal path, and the UI should say
   so rather than let a user believe otherwise.

**Which effects earn a permanent place** is the real question, since each one costs
DSP whether or not the line mentions it. `hpf`, `room`, `delay` and a drive are a
defensible rack. Convolution-based effects probably never qualify.

**Also: drop `strudelfx` for library stages.** `@m4l-jweb` 0.5.0 makes
`chains: ["lowpass", "gain"]` build a real series (it did not, which is why the
bespoke chain exists). Once we move to 0.5.0, the hand-wired chain should go.

# DONE: `s("bd sd")` should not be silence

The single most common idiom on strudel.cc produces **zero MIDI notes, no error,
no sound** - `hapToNote()` reads `note ?? n`, and an `s()` pattern has neither. The
device looks broken; it is being asked for a sound it cannot make.
[STRUDEL-SUPPORT.md](STRUDEL-SUPPORT.md) now says so loudly, but documentation is
the consolation prize here.

**The cheap fix, and it is nearly free:** when a hap has an `s` and no note, look
the sample name up in the **drum map** - which already exists, already maps
`bd`/`sd`/`hh` to Drum Rack pads, and is already user-editable. `s("bd sd")` then
plays a Drum Rack exactly as `bd sd` does, and a rhythm copied off strudel.cc works
unchanged. An `s()` name with no mapping stays silent, as it must.

This is a change to note *generation*, not to the UI, and it deserves its own
discussion: it makes the device honour a control it currently ignores, which is
either the obvious kindness or a lie about what `s()` means, depending on your
view. Worth deciding deliberately rather than drifting into.
