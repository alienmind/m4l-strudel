# Strudel MIDI - Max for Live device

Converts [Strudel](https://strudel.cc) mini-notation ↔ MIDI clips on the track
the device is dropped on. React UI inside `jweb`, a hand-written recursive-descent
mini-notation parser in pure TypeScript, LiveAPI clip I/O in a `[js]` object.

This is the self-contained **Max for Live device**. Its sibling `tmp/mcp-strudel`
is an **MCP server** exposing the same conversion engine to Claude (so
`m4l-claude` can translate Strudel written in natural language and write it to
Ableton). Both share the mini-notation engine under `src/lib/mini`.

## Supported mini-notation

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

Octave convention defaults to **Strudel** (`c5` = MIDI 60); switch to Scientific
(`c4` = 60) or apply an octave shift in the UI. (Verify the Strudel default at
strudel.cc if in doubt - it's a single constant in `src/lib/mini/notes.ts`.)

## Build & test

```
pnpm install
pnpm test # vitest - parser, scheduler, euclid, round-trip (19 tests)
pnpm build # → dist/{strudel-ui.html, strudel.js, StrudelMidi.amxd}
pnpm dev # browser dev; use maxSimulate('notes', 4, 2, 60,0,1, 64,1,1)
```

## Engine layout (`src/lib/mini/`)

- `parser.ts` - tokenizer + recursive-descent parser → `ast.ts` node tree
- `euclid.ts` - Bjorklund algorithm
- `schedule.ts` - AST + cycle index → timed events (cycle-relative)
- `notes.ts` - note-name ↔ MIDI with octave convention
- `render.ts` - schedule + note conversion → MIDI note events in beats
- `unparse.ts` - MIDI notes → mini-notation (quantize to grid, stacks, rests)

## jweb ⇄ [js] protocol

- `[js]` → UI: `url <file://…>`; `notes <loopEndBeats> <n> <p s d> ...`
- UI → `[js]`:
 - `write_clip <lengthBeats> <n> <p s d v> ...` (To MIDI)
 - `read_notes` (From MIDI)

## Creating `ableton-amxd/StrudelMidi.amxd` (once, in Max)

1. Drag a **Max MIDI Effect** onto a MIDI track → **Edit**.
2. Keep `midiin → midiout` wired.
3. Add `live.thisdevice`, `js strudel.js`, `jweb @enablejavascript 1`.
4. Wire: `live.thisdevice` → `js` in0; `js` out0 → `jweb` in0;
 **`jweb` out0 → `js` in0**.
5. `jweb` Inspector → Initial URL `about:blank`; add to Presentation ~320×180.
6. Save as `ableton-amxd/StrudelMidi.amxd`; place `strudel.js` and
 `strudel-ui.html` next to it. **Never Freeze.**

Console should show `strudel.js loaded` and `strudel: sent url …`. To test:
drop the device on a MIDI track, type a pattern, **To MIDI** creates a clip in
the first empty slot; edit it in Live, then **From MIDI** reads it back.
