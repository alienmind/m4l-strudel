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
pnpm build # → dist/m4l-strudel/{m4l-strudel.amxd, strudel-ui.html, wrapper.js}
           #   + dist/m4l-strudel.zip (release archive of that folder)
pnpm dev # browser dev; use maxSimulate('notes', 4, 2, 60,0,1, 64,1,1)
```

## Installing in Ableton

```
scripts\install-windows.ps1   # Windows
scripts/install-mac.sh        # macOS
scripts/install-linux.sh      # Linux (Live under Wine)
```

Each script reads the User Library location from Live's `Library.cfg`
(`%APPDATA%\Ableton\Live <ver>\Preferences` on Windows,
`~/Library/Preferences/Ableton/Live <ver>` on macOS - no registry or env vars),
falls back to Live's default location, and installs **only
`m4l-strudel.amxd`** into `User Library/Max For Live/m4l-strudel/`. The device
is fully self-contained (see *Self-contained .amxd* below) - drag it onto a
MIDI track from Live's browser and it unpacks its own UI.

## Self-contained .amxd (single-file distribution)

The `.amxd` is the **only file you need to distribute**:

1. `vite-plugin-singlefile` inlines all JS/CSS into one `strudel-ui.html`.
2. `build-amxd.mjs` appends it to `wrapper.js` as base64 chunks
   (`UI_PAYLOAD_B64` / `UI_PAYLOAD_BYTES`) before embedding the script in the
   amxd container.
3. On load, `wrapper.js` decodes the payload and writes `strudel-ui.html`
   next to the `.amxd`, then points `jweb` at that real file. Extraction is
   skipped when an identical-size copy exists; the written size is verified.

Two Max quirks force this design (simpler approaches fail): frozen
dependencies live in Max's **virtual filesystem** - `[js] File()` can open
them but they never exist on disk, so jweb/Chromium gets
`ERR_FILE_NOT_FOUND` for them - and **`File.writebytes` silently truncates
at 16384 bytes per call**, so the extractor writes 4096-byte slices.

## Engine layout (`src/lib/mini/`)

- `parser.ts` - tokenizer + recursive-descent parser → `ast.ts` node tree
- `euclid.ts` - Bjorklund algorithm
- `schedule.ts` - AST + cycle index → timed events (cycle-relative)
- `notes.ts` - note-name ↔ MIDI with octave convention
- `render.ts` - schedule + note conversion → MIDI note events in beats
- `unparse.ts` - MIDI notes → mini-notation (quantize to grid, stacks, rests)

## Clip I/O behaviour (To Clip / From Clip)

Everything works on **Live clips on the device's own track** - there is no
MIDI *file* import/export and no file picker (jweb hides real file paths from
web pages anyway).

- **To Clip** renders the pattern and creates a Session clip named "Strudel"
  in the **first empty clip slot** of the track the device sits on.
- **From Clip** reads notes back into mini-notation from, in order of
  preference: the **currently playing** clip on this track, else the **first
  clip** found on the track. It does not use Live's clip selection.
- The **From Clip button is disabled when the track has no clips**. The
  wrapper polls the track once a second and pushes `clip_available 0/1` to
  the UI, so the button enables itself as soon as a clip appears (e.g. right
  after To Clip).
- If a read is attempted and no clip is found, the wrapper replies
  `read_error` and the status line shows "No clip found on this track".

## jweb ⇄ [js] protocol

- `[js]` → UI:
 - `url <file://…>`
 - `notes <loopEndBeats> <n> <p s d> ...` (reply to `read_notes`)
 - `clip_available <0|1>` (polled once a second, sent on change)
 - `read_error <reason>` (`read_notes` found no clip)
- UI → `[js]`:
 - `write_clip <lengthBeats> <n> <p s d v> ...` (To Clip)
 - `read_notes` (From Clip)
 - `ui_ready` (page loaded - resend current `clip_available` state)

## How the `.amxd` is built (no manual Max step)

`scripts/build-amxd.mjs` wraps `ableton-amxd/patcher.json` (plus an embedded
copy of `wrapper.js`) in the amxd binary container at build time, so the device
patcher is versioned as plain JSON and the build is fully automated. The
patcher is a **Max MIDI Effect** wired as: `midiin → midiout`,
`live.thisdevice → js wrapper.js → jweb`, and `jweb → js` (the return path for
`write_clip` / `read_notes`), opening in Presentation with the jweb filling
the device view.

> **History / warning:** earlier revisions shipped
> `ableton-amxd/ableton-template.amxd`, a byte-patched copy of the LiveCam
> device (string-replacing `livecam.js` → `wrapper.js` in the binary). That is
> not a valid approach: the file was a *frozen* device still embedding
> LiveCam's old glue script and patcher, so jweb tried to load the
> nonexistent `livecam-ui.html` ("Your file couldn't be accessed"). Never
> binary-patch an .amxd; regenerate it from `patcher.json` instead. To tweak
> the patch interactively, open the built device in Live's Max editor, edit,
> and port the changes back into `patcher.json`.

Console should show `wrapper.js loaded` and `strudel: sent url …`. To test:
drop the device on a MIDI track, type a pattern, **To Clip** creates a clip in
the first empty slot; edit it in Live, then **From Clip** reads it back
(the button stays greyed out until the track has at least one clip).
