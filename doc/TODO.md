This is a reporting with a number of behaviours that are perceived to be incorrect or misunderstood. Some of these might be bugs, some others might be feature requests

# Fixes for Strudel Max for Live Notes and Expansion

## Explanation of Current Behavior

### [FEAT-01] 1. "Stream of notes is super low. There's no scale awareness."
When you type bare mini-notation like `<[[2 ~] [2 ~] 2 3] [[3 ~] [3 ~] 3 3]>@4`, it gets processed in two different ways depending on whether it is playing live or saving to a clip:

*   **Live Play (Strudel Engine):** The UI checks if the text is bare mini-notation. Since it is, it wraps it using `asStrudelCode` into `note("...")`. In Strudel, the `note` function expects absolute pitch values (like "c5"). When it receives numbers like `2` or `3`, it treats them as exact MIDI pitches (e.g., MIDI note 2, which is D-2). If you want numbers to be treated as scale degrees (relative to a root and scale), they need to be wrapped in the `n("...")` function instead.
*   **Save to Clip (Clip Converter):** The bare mini-notation is parsed by a custom parser (`src/lib/mini/notes.ts`). In `noteToMidi`, any plain number is explicitly converted to `parseInt(t, 10) + octaveOffset * 12`. Again, a `2` becomes MIDI pitch `2`. There is currently no scale-awareness implemented in the custom clip converter because it doesn't receive or apply the Live 12 global scale.

### [FIX-01] 2. "If I click on 'save to clip' I get a sequence of notes under E-2... If I load back from midi clip... '4 notes'. I would expect this sequence to have been expanded"
The `<A B>` syntax in mini-notation means "alternate between A and B on each successive cycle." Thus, `<A B>` takes 2 full cycles to loop.

Currently, when you click "To Clip", the `renderPattern` function (in `src/lib/mini/render.ts`) defaults to rendering exactly `1` cycle (`cycles ?? 1`). It completely ignores any `alt` elements that would expand the loop over multiple cycles. Because only the first cycle is exported to MIDI, only the first half of your sequence (`[2 ~] [2 ~] 2 3`) makes it to the Ableton clip.

When you use "From Clip", the plugin reads the raw MIDI notes back from the clip and converts them back into a flat mini-notation string (`d0@2 ~ ~ ...`). Because the Ableton clip only contained the truncated one-cycle version of your sequence, the plugin only "sees" 4 notes, and the structural information (the `<>` brackets) is lost forever.

## Implementation Plan

### [FEAT-01] Phase 1: Enable Scale Awareness

1.  **Forward Live 12 Scale to All Modes:**
    *   In `wrapper/device.ts`, the function `setupScaleObservers()` currently has an early exit `if (!IS_SAMPLER) return;`.
    *   **Action:** Remove this guard so that the MIDI device mode also observes Live 12's `root_note` and `scale_name` (the Sampler already does). The wrapper will then send `scale <root> <name>` to the UI.

2.  **Bind Scale in the UI (`src/app/midi/useStrudel.ts`):**
    *   **Action:** In `useStrudel.ts`, add state variables for `rootNote` (number) and `scaleName` (string).
    *   Bind the `scale` inlet using `bindInlet("scale", (root, name) => { ... })` to update the state.
    *   Pass the `rootNote` and `scaleName` down into `renderPattern` (for To Clip functionality).

3.  **Fix Live Play Scale Degrees (`strudelCode.ts`):**
    *   **Action:** Modify `asStrudelCode` to wrap bare mini-notation in `n("...")` instead of `note("...")`.
    *   *Note:* Strudel's `n()` function natively resolves numbers into scale degrees based on the current scale. By changing this wrapper, Live Play will immediately become scale-aware.

4.  **Fix Clip Converter Scale Degrees (`notes.ts`):**
    *   **Action:** In `src/lib/mini/notes.ts`, update `noteToMidi` to accept `rootNote` and `scaleName`.
    *   Add a simple lookup table for Live 12 scale intervals (e.g., Major = `[0, 2, 4, 5, 7, 9, 11]`, Minor = `[0, 2, 3, 5, 7, 8, 10]`, etc.).
    *   When parsing a plain number (`/^-?\d+$/`), treat it as a scale degree. Map the degree to a semitone offset using the scale intervals, add it to the `rootNote`, and compute the final MIDI pitch.

### [FIX-01] Phase 2: Ultimate Consequence Loop Expansion (Cycle LCM)

1.  **Compute AST Cycle Length (`render.ts` or `ast.ts`):**
    *   **Action:** Create a recursive function `astCycleLength(node)` that calculates how many cycles are required for a pattern to fully loop back to its starting state.
    *   **Logic:**
        *   `rest` / `note`: `1` cycle.
        *   `seq` / `stack`: LCM (Least Common Multiple) of the cycle lengths of all children.
        *   `alt` (`<A B C>`): `lcm(...items.map(item => astCycleLength(item) * items.length))`. Since each item gets one cycle and then waits for the others, an item that takes `N` cycles inside an `alt` of size `M` will take `N * M` cycles to loop fully.
        *   `repeat` (`A*f`): `N / gcd(N, f)` where `N` is `astCycleLength(node)`.
        *   `poly` (`{A, B}%s`): Cycle length depends on the LCM of the array lengths of the layers, divided by the steps advanced per cycle.

2.  **Apply Cycle Expansion in `useStrudel.ts`:**
    *   **Action:** When "To Clip" is pressed in `useStrudel.ts`, parse the AST first.
    *   Compute `const totalCycles = astCycleLength(ast);`.
    *   Pass `cycles: totalCycles` in the options to `renderPattern`.
    *   This ensures the generated MIDI clip contains the fully expanded loop (e.g., 2 cycles, 4 cycles, or 64 notes if highly nested) so nothing is truncated.

### [FIX-02] Phase 3: Fix Negative Numbers in Bare Mini-Notation

1.  **The Bug:** The custom tokenizer (`src/lib/mini/parser.ts`) used for "To Clip" currently does not recognize the minus sign `-` as the start of a number. It throws an `unexpected character "-"` error, even though the internal `noteToMidi` function supports parsing negative numbers. This prevents users from writing bare relative sequences with negative numbers (like `[-1 ~] -1`) without wrapping them in `n("...")`.
2.  **Action:** Update the `tokenize` function in `parser.ts` to correctly identify and consume negative numbers (e.g., `if (ch === "-" && /[0-9]/.test(src[i+1]) || /[0-9]/.test(ch)) { ... }`).

### [FEAT-02] Phase 4: Drum Rack Translation Mode

1.  **Drum Mapping UI:**
    *   **Action:** Add a new "Drum Map" settings panel or screen to the React UI. This screen will allow the user to define a dictionary mapping arbitrary strings (like `bd`, `sd`, `hh`) to specific MIDI notes (e.g., `C1` / 36, `D1` / 38).
    *   This map should be stored in the React state and optionally persisted so it remembers your kit configuration.

2.  **Drum Rack Translator:**
    *   **Action:** Update the bare mini parser and the clip converter to be aware of this map. If a token isn't a standard note (like `bd`), it checks the Drum Map. If found, it outputs the mapped MIDI note.
    *   To support live play evaluation, we can inject a Strudel function (or use a global `drumMap`) so that when the Strudel engine plays `sound("bd")` (or `n("bd")`), the Max bridge translates the outgoing `bd` string into the correct MIDI note before sending the `midinote` message to Ableton's Drum Rack.

### [FEAT-03] Phase 5: Full Support for Note Transformations in "To Clip"

1.  **Assessment of Available Note Transformations:**
    Strudel core contains dozens of functions to manipulate a stream of MIDI notes, independent of audio synthesis. The most relevant ones for sequencing include:
    *   **Pitch & Scales:** `.transpose(n)`, `.scaleTranspose(n)`, `.scale("name")`, `.octave(n)`
    *   **Chords & Voicings:** `.voicing()`, `.rootNotes()`, `.chord()`, `addVoicings()`
    *   **Math & Mapping:** `.add()`, `.sub()`, `.mult()`, `.div()`
    *   **Pattern Generation:** `.arp()`, `.struct()`, `.jux()`, `.superimpose()`

2.  **Gap Analysis (Live Play vs "To Clip"):**
    *   **Live Play (Strudel Engine):** *Fully Supported.* Because Live Play evaluates the actual JavaScript using the Strudel Web Worker, 100% of these note transformations are natively supported out of the box. You can run `.transpose(2).scale('C:minor')` and it works flawlessly.
    *   **"To Clip" Converter:** *Completely Unsupported.* The "To Clip" logic uses a custom parser (`src/lib/mini`) that only understands "bare mini-notation" strings (e.g. `[A B] * 2`). It literally cannot parse JavaScript method chaining. If you add `.transpose(2)`, the "To Clip" button becomes greyed out/disabled. Thus, there is a massive gap: you cannot export *any* pattern to MIDI if it relies on Strudel's native JavaScript functions.

3.  **Implementation Plan for the Clip Converter Gap:**
    *   *Do not reinvent the wheel:* Attempting to recreate `.scale()`, `.transpose()`, `.arp()`, and all other Strudel functions inside the custom `src/lib/mini` parser would be an impossible task.
    *   **Action:** Rewrite the "To Clip" mechanism to leverage the existing Web Worker. Instead of manually parsing the text locally in React, the UI should send a new message (e.g., `{ t: "export_clip", cycles: totalCycles }`) to the worker. 
    *   **"Accelerated" / Instant Export:** Strudel patterns are purely functional and stateless. The worker does not need to wait for Ableton's transport or run in real-time. By calling `queryWindow(pattern, 0, totalCycles, cps)`, the worker instantly computes the entire sequence of events for the requested cycle window at full speed.
    *   **No Interference / No Extra Threads needed:** Because `queryWindow` is a stateless evaluation, querying cycles `0` through `4` for a clip export will not mutate or disrupt the ongoing pattern playback (which simply queries the same pattern object for tiny real-time chunks as Ableton ticks). A single worker thread is perfectly sufficient.
    *   The worker returns an array of fully-baked MIDI notes to React, which then forwards them to Ableton. This instantly closes the gap, adding 100% support for every Strudel note transformation to the "To Clip" exporter.

### [FEAT-04] Phase 6, attempt 1: Native Instrument Mode (`iiii`) - REMOVED

**History, kept so nobody re-proposes the same shape.** The original plan
(from the abandoned `STRUDEL_PLANS.md`) called for an "Instrument" device
variant that would take Strudel patterns (`note("c3 e3").s("sawtooth")`) and
generate audio directly, by routing messages into a `[poly~]` synthesizer
instead of emitting MIDI notes. What got built: `ableton-amxd/voice.maxpat`,
a hand-authored `[poly~]` synth (`cycle~`/`saw~`/`rect~`/`tri~` selected via
message, a basic envelope via `line~`), driven by `voice <note> <vel01>
<durMs> <wave> <cutoff> <gain> <delayMs>` messages (`patcher/chains.mjs`'s
`"poly"` chain, mode `"instrument"`, device `alienmind-strudel-instrument`).

**Removed entirely** (`voice.maxpat`, the `"poly"` chain, the `"instrument"`
manifest entry and mode). Two independent problems, not one:

1.  **It never made musical sense.** It reinvented a crude oscillator synth
    instead of using Strudel's real sound engine - `.s("bd")`-style sample
    references and most of the real transformation chain (`.room()`, real
    envelopes, etc.) did nothing. It also copied the MIDI device's note-editor
    UI wholesale (Bars/Grid/Octave/Shift, To Clip/From Clip), which makes no
    sense for something that is supposed to be an audio-effects surface, not
    a pattern sequencer.
2.  **`voice.maxpat` was also unverified** - it carried its own comment
    flagging it as a "SKELETON PATCH - not hand-verified in the Max editor",
    and in testing it never actually produced audio.

See Phase 7 for the actual direction - and note it is a different KIND of
device, not a fix to this one.

### [FEAT-05] Phase 7: Strudel Audio FX - a real audio effects chain, not an instrument

**The reframe.** The third device should never have been an instrument. Strudel
already has a real vocabulary of audio-effect primitives (`.lpf()`, `.hpf()`,
`.room()`, `.gain()`, `.delay()`, `.crush()`, `.pan()`, ...) - the thing this
device should do is let you write **one line** describing an effects chain and
apply it to whatever audio is already coming into the track, the way a
producer reaches for Auto Filter or a reverb send. Not a synth, not a note
editor, not a sample player: an **audio effect** (`type: "audio"`, same
container tag as the Sampler), sitting anywhere in an audio chain.

**What it is not.** No pattern editor, no Bars/Grid/Octave/Shift, no To
Clip/From Clip - none of the MIDI device's UI has any business here. The UI
this device wants is closer to the `hello-audio` example in `m4l-jweb` (a
compact readout of the *live* effect parameters) than to anything in this
repo today.

**Design sketch:**

1.  **Parse the one-line expression with Strudel's own machinery, not a new
    parser.** `.lpf(800).room(0.3).gain(1.2)` is just JavaScript method
    chaining - the same `@strudel/transpiler` this repo already depends on for
    Live Play can evaluate it. Walk the resulting pattern (or, for the common
    case of constant arguments, just the AST) to pull out `{ effect: "lpf",
    args: [800] }` pairs. Reuse `src/lib/strudelCode.ts`'s existing
    parse/compile path rather than inventing a second one, the same lesson
    Phase 5 already learned about the mini-notation parser.
2.  **Drive real Max DSP chains with the parsed values**, using
    `writableParams()`'s `set_<id>` pattern (`packages/build/src/chains.mjs`
    in `m4l-jweb`, already proven by the `lowpass`/`gain` chains there) -
    `lpf`/`hpf` map onto `onepole~`/`svf~`, `gain` onto `*~`, `room` needs a
    reverb object the chain vocabulary does not have yet (Stage 3.4 in
    `m4l-jweb`'s `doc/TODO.md`: "`plugin~ -> DSP -> plugout~`... the obvious
    gaps"). Growing that vocabulary in `m4l-jweb` (not duplicating it here)
    benefits every device that wants an audible effect, not just this one.
3.  **Static values are the honest v1.** The user edits the line, the app
    parses it once, and writes each value with `set_<param>` - exactly like
    `hello-audio`'s Cutoff slider, just driven by text instead of a drag.
4.  **Pattern-driven modulation is the interesting v2, and it is not free.**
    Strudel expressions like `.lpf(sine.range(200,2000))` describe continuous
    modulation, which means re-querying the pattern on every transport tick
    and writing new `set_<param>` values at 20 Hz - the same tick-driven
    machinery the MIDI device already has (`src/app/midi/useStrudel.ts`'s
    tick handler), repurposed to drive continuous parameters instead of
    discrete notes. Do v1 first; only build this once static values work and
    are worth automating.
5.  **Depends on `m4l-jweb`'s Surface (Stage 2 there) for a clean parameter
    set** - once it lands, the effect's live parameters (cutoff, room size,
    gain) should be a `surface.ts` declaration like every other device's,
    Push-visible and automatable, instead of hand-wired `writableParams()`
    calls. Not blocking: v1 can ship with the manifest's `parameters` field
    the way `hello-audio` does today.

**Open questions, not yet answered:**

- Which Strudel effect primitives get a real Max-native mapping first, and
  which never will (some, like heavily convolution-based effects, may have no
  reasonable `plugin~`-chain equivalent at all)?
- Does one text line stay the whole interface, or does it need per-effect
  sliders once more than two or three effects are chained?
- How much of "the DSL is just JS method chaining" survives contact with
  users who are not already Strudel users - is `.lpf(800)` legible without
  strudel.cc's own docs open?
