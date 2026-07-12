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
    *   **Action:** Remove this guard so that the MIDI and Audio device modes also observe Live 12's `root_note` and `scale_name`. The wrapper will then send `scale <root> <name>` to the UI.

2.  **Bind Scale in the UI (`useStrudel.ts`):**
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

### [FEAT-04] Phase 6: Native Audio Instrument Mode (`iiii`)

1.  **Context (from abandoned `STRUDEL_PLANS.md`):**
    *   The original architectural plan called for an "Audio Instrument" device variant (`iiii`) that would take Strudel patterns (like `note("c3 e3").s("sawtooth")`) and generate audio directly from the device by routing Max messages into a `[poly~]` synthesizer, rather than just emitting MIDI notes.
    *   Because the current Strudel engine runs in a Web Worker (inside `jweb`), it cannot route WebAudio directly into Ableton's signal path.

2.  **Implementation Plan:**
    *   **Max/MSP Voice:** Hand-author a minimal `strudel-voice.maxpat` for `[poly~]` with a basic synth (e.g. cycle~, saw~, rect~, tri~ selected via message) and a simple ADSR envelope.
    *   **Message Bridge:** Add an "Audio Mode" toggle to the UI. When enabled, the Web Worker maps events (like `s("sawtooth")`) into explicit voice messages (e.g., `voice <note> <vel> <durMs> <wave> <cutoff> <gain>`).
    *   **Routing:** The JS bridge passes these `voice` messages from `jweb` out to the Max patch, which distributes them to the `[poly~]` object to generate native Ableton audio. This achieves a basic, minimal equivalent of `superdough` synthesis natively within Max for Live.
