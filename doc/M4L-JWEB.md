# M4L-JWEB: build Ableton Live devices like a web developer

*Max for Live is the most powerful extension point Ableton ever shipped, and
the least approachable one if you come from modern software engineering.
M4L-JWEB ([github.com/alienmind/m4l-jweb](https://github.com/alienmind/m4l-jweb))
is a scaffold and a set of patterns that let you build, test and ship `.amxd`
devices from an ordinary TypeScript repo, with CI and no Max editor in the
loop.*

---

## How Max for Live development normally works

Ableton Live has no public plugin SDK for its device area. What it has is
**Max for Live (M4L)**: an embedding of Cycling '74's Max, a visual
programming environment with four decades of history. A device is a Max
*patcher* - a graph of boxes connected by patch cords - wrapped in a binary
`.amxd` container and hosted in Live's device chain.

The canonical workflow looks like this:

1. Open Live, drop a Max device on a track, click its Edit button. The Max
   editor opens.
2. Drag objects onto the canvas: `midiin`, `midiout`, `live.dial`,
   `[js]` scripts, MSP signal objects. Draw cords between them. Position
   everything by pixel.
3. For anything algorithmic, write ES5 JavaScript inside the `[js]` object,
   which also carries **LiveAPI** - the only scriptable access to Live's
   object model (tracks, clips, scenes, transport, scale).
4. Save. "Freeze" the device so its file dependencies travel inside the
   `.amxd`. Distribute that file.

This workflow has real strengths: it is direct, live-editable, and the Max
object library is enormous. Thousands of excellent devices are built this
way. But if your background is software engineering, you will notice what is
missing:

- **No components, no CSS, no state management.** The UI toolkit is Max's
  own, positioned visually, styled sparsely.
- **No modern language.** The `[js]` object runs an ES5-era interpreter:
  no modules, no `let`/`const`, no promises, no npm.
- **No build, no diff, no CI.** The patcher is both source and artifact.
  Version control sees JSON blobs full of pixel coordinates. Producing a
  distributable requires a human clicking inside a licensed Max editor.
- **A virtual filesystem quirk.** Frozen dependencies live inside the
  device where only Max-native objects can read them; an embedded browser
  or external process cannot open the files you shipped with your own
  device.

None of this is a criticism of Max - it was designed for musicians patching
live, and it excels at that. It just means a web developer's entire toolbox
sits unused.

## The idea

M4L-JWEB starts from one observation: Max ships two escape hatches, and
together they cover almost everything a device needs.

- **`[jweb]`** is a full Chromium browser view embedded in the device. It
  runs anything the web runs: React, canvas, WebAssembly, Web Workers.
- **`[js]`** is old, but it holds LiveAPI, and it always runs - even inside
  a frozen device.

So the architecture splits a device into three layers, each written as
ordinary text in an ordinary repo:

```
        your repo (TypeScript, JSON, scripts - all reviewable)
  ┌────────────────────────────────────────────────────┐
  │  UI + logic:  web app (+ optional Web Worker)      │
  │  Live glue:   wrapper script for [js] (LiveAPI)    │
  │  Structure:   patcher template + device manifest   │
  └───────────────────┬────────────────────────────────┘
                      │  one build command (no Max, CI-friendly)
                      ▼
              installable .amxd file(s)
```

Five patterns make it work.

**1. The UI is a web app.** One page, bundled into a single self-contained
html file (every script, style and asset inlined). jweb exposes a two-call
bridge to the page: `window.max.bindInlet(name, handler)` to receive Max
messages, `window.max.outlet(...)` to send them. That is the entire API
surface between your app and the device. Outside Max, a dev shim simulates
the bridge so you develop in a normal browser with hot reload.

**2. Heavy logic runs in a Web Worker.** Sequencers, analyzers, anything
that must not fight the UI thread. Dedicated workers are also exempt from
the timer throttling Chromium applies to hidden pages - relevant, because
your device's view is often not visible. Design message-driven (Live pushes
time in, you push events out) and you barely depend on timers at all.

**3. The `[js]` glue stays thin - and you write it in TypeScript.** One
file owns everything that needs LiveAPI: reading and writing clips,
observing properties, polling transport. It compiles with `tsc` targeting
ES5, and the build refuses to package it if the output does not parse as
ES5 (one stray modern token kills the whole script at load, with a
one-line error and no stack). The constraints that remain are runtime, not
syntax: no `setTimeout` (use Max's `Task`), no `console` (use `post()`),
no module system (bundle to one file), and a handful of LiveAPI lifecycle
rules covered below.

**4. Patchers are generated, not drawn.** A patcher is just JSON: `boxes`
(objects, e.g. `"route noteevent stop"`) and `lines` (cords, e.g. source
box/outlet to destination box/inlet). M4L-JWEB keeps a minimal hand-made
template and generates each device variant from a declarative manifest -
device type, chains, routing - via `box()`/`line()` helpers. Patch cords
become code review.

**5. The `.amxd` container is written headless.** The container format is
undocumented but simple, reverse-engineered from devices saved by Max 8/9:
a header carrying the device-type tag, a chunk with the patcher JSON and
each embedded dependency, and a directory of name/size/offset entries.
About 150 lines of Buffer code write it byte-for-byte. This is the piece
that removes Max from the loop entirely: `pnpm build` on a CI runner emits
installable devices.

One supporting trick holds it together: **self-extracting payloads**.
Because Chromium cannot read Max's frozen virtual filesystem, the build
appends the UI html to the wrapper script as base64. On first load the
wrapper - which always runs - writes the real file next to the `.amxd`,
stamps it with the build id, and points jweb at a cache-busted `file://`
URL. Stale or mixed installs become structurally impossible: the UI and the
wrapper each display their build stamp and complain on mismatch.

## Talking to Live: the protocol

Everything between the layers crosses as **Max messages**: a selector word
followed by arguments (`noteevent 60 96 480 1 35`). Three habits keep this
sane:

1. **Selectors are your routing table.** `[route sel1 sel2]` dispatches by
   first word; unmatched messages fall out of the last outlet toward the
   next consumer. One jweb outlet can feed an output chain and the LiveAPI
   glue at once.
2. **Base64 anything structured.** Max splits messages on commas and
   semicolons; encode code, JSON and paths.
3. **Handshake, never assume order.** The page loads asynchronously. Have
   the UI announce `ui_ready`; have the wrapper reply with current state
   (mode, parameters, tempo). Anything that boots late gets the same
   treatment.

### Reading from Live (events in)

| You want | The M4L-JWEB way |
|---|---|
| Transport position and play state | Poll `live_set is_playing` + `current_song_time` from the wrapper on a 50 ms `Task`; emit `tick <playing> <beats>`. Prefer LiveAPI polling over `plugsync~` signal chains: MIDI-effect devices do not reliably run a DSP graph, and LiveAPI works in every device type. |
| Tempo | A LiveAPI property observer on `live_set tempo` (the signal-domain alternative reports samples-per-beat, not BPM). |
| Any observable property (scale, track name, selected scene...) | `new LiveAPI(callback, "live_set")` + `.property = "..."`; the callback fires on attach and on every change. Forward to the UI as a message. |
| Things with no observer | Poll with a `Task` and push a message only on change. |
| Device lifecycle | `live.thisdevice` fires a bang when the device is fully loaded. Do all LiveAPI bootstrapping there - see the pitfalls below for why not `loadbang`. |

### Acting on Live (events out)

| You want | The M4L-JWEB way |
|---|---|
| Emit live MIDI | Message chain in the patcher: `route` -> `unpack` -> `pipe` (per-note delay for precise timing) -> `makenote` (automatic note-offs) -> `midiformat` -> `midiout`. Compute *when* in your app; let Max place it precisely. |
| Create or read MIDI clips | LiveAPI from the wrapper: `clip_slots`, `create_clip`, `add_new_notes`, `get_notes_extended`. |
| Synthesize sound | Instrument device: message-driven `poly~` voices. Audio effect: `plugin~` -> your DSP -> `plugout~`. |
| Schedule against the grid | Send events ahead of time with a delay computed from the tick stream; a lookahead window absorbs jitter, `pipe` applies precision. Add a free-running fallback clock in the worker so your device also works with the transport stopped. |

### The three device types

| Type | Container tag | Sits on | I/O |
|---|---|---|---|
| MIDI effect | `mmmm` | MIDI track, before the instrument | MIDI in -> MIDI out |
| Instrument | `iiii` | MIDI track, as the instrument | MIDI in -> audio out |
| Audio effect | `aaaa` | any audio position | audio in -> audio out |

In M4L-JWEB the type is one field in the device manifest; the same UI and
wrapper can ship as all three variants.

## What about Push?

A question every device author hits: "will my UI show on Push?" The honest
answer: **no custom UI reaches Push - not yours, not anyone's.** Push's
display renders the device's **parameters**, organized in banks of eight,
for native devices and M4L devices alike.

So Push support is not about the UI technology at all; jweb changes
nothing here. It is about exposing your musically meaningful controls as
real Live parameters:

- Add `live.dial` / `live.toggle` / `live.menu` objects with
  `parameter_enable` on; give them short names and sensible ranges.
- Wire them into the same message protocol your UI uses (a parameter
  change is just another inlet message to your app; a UI change can set
  the parameter so the two stay in sync).
- Group them into banks with the device's parameter info so Push pages
  read like a performance surface: pattern slot, density, octave,
  run/stop.

The resulting split is actually good design: the jweb UI is your deep
editor on the laptop screen; the parameter bank is the performance surface
on Push, automatable and MIDI-mappable for free. The scaffold's manifest
reserves a `parameters` section that generates the objects and their
patcher wiring.

## Pitfalls you only hit once

Collected from the field; each of these costs an evening the first time:

- **LiveAPI objects created during `loadbang` are dead.** They construct
  without error and observe nothing. Create observers from
  `live.thisdevice`'s bang; keep `loadbang` for file work. Guard code like
  `if (obs) return` turns this bug permanent - recreate unconditionally.
- **Live embeds a copy of the device in the set.** Reinstalling the
  `.amxd` does not update instances already on tracks; delete and re-drag.
  Build stamps in both the wrapper and the UI make staleness visible.
- **The device view height is fixed** (about 169 px). Budget every row of
  your UI; the bottom of an overgrown layout silently clips.
- **`route` strips the selector.** A bare selector emerges as a `bang`;
  re-materialize the word with a message box if the consumer needs it.
- **`File.writebytes` truncates silently** around 16 KB per call; write in
  4 KB slices and verify the byte count.
- **Prefer LiveAPI to MSP for transport** in MIDI devices (no reliable DSP
  graph), and never trust an object's outlet order from memory - check the
  reference page and log the raw values first.
- **Avoid `[node.script]` unless you need the OS** (filesystem, child
  processes). It adds a process manager and a boot handshake, and its
  failure modes in Live range from silently ignoring `script start` to
  crashing the host. A Web Worker inside jweb covers pure computation with
  none of that.
- **ES5 is a build gate, not a style preference.** Parse the wrapper with
  `acorn` at `ecmaVersion: 5` in CI and refuse to package on failure.

## Getting started

```
git clone https://github.com/alienmind/m4l-jweb my-device
cd my-device && pnpm install
pnpm dev      # browser dev with the Max bridge simulated
pnpm build    # emits dist/<name>/<device>.amxd + release zip
scripts/install-windows.ps1   # or install-mac.sh
```

You edit two places: `src/app/` (the web app - UI, optional worker, and
`protocol.ts`, the typed list of selectors that is the single source of
truth for both sides) and `patcher/devices.mjs` (the manifest: name, type,
chains, parameters). The wrapper, the patcher generator, the container
writer and the installers are infrastructure you should rarely touch.

The repo doubles as an agent-friendly codebase: because every artifact is
text and every invariant is enforced by the build (ES5 gate, container
round-trip test, protocol lint), an LLM can implement a device end to end
and verify its own work. A `CLAUDE.md` in the template spells out the
guardrails.

---

## Addendum: carving this into the m4l-jweb library

The scaffold described above currently lives inside a working device
project. The extraction plan, in implementable order:

### Packages

1. **`@m4l-jweb/bridge`** (browser, ~100 lines, zero deps): typed
   `bindInlet`/`outlet`, the `ui_ready` handshake, base64 helpers, the
   `maxSimulate` dev shim.
2. **`@m4l-jweb/wrapper`** (TypeScript compiled to ES5): payload
   extraction with build-stamp sidecars, LiveAPI helpers (clip I/O,
   property observers, transport poll, tempo observer), the `anything()`
   guard, the bang/loadbang lifecycle skeleton. Distributed as a template
   the build concatenates - `[js]` has no module system.
3. **`@m4l-jweb/build`** (Node CLI): the binary `.amxd` writer, the
   patcher `box()`/`line()` DSL plus canned chains (MIDI out, poly~ bank,
   plugin~ passthrough), payload embedding, build stamps, the ES5 gate,
   installer templates.

### Target repo layout

```
m4l-jweb/
  src/app/            # the ONLY folder a device author edits
    App.tsx
    protocol.ts       # selector names + payload types
    worker.ts?        # optional compute worker (inlined automatically)
  wrapper/wrapper.ts  # compiled to ES5, gated by acorn
  patcher/
    base.json         # minimal jweb+js template
    devices.mjs       # declarative manifest (see below)
  scripts/            # build-amxd, generate-patchers, postbuild, installers
  examples/transposer # hello-world: one-knob MIDI transposer, ~50 lines
  CLAUDE.md           # agent guardrails
  doc/M4L-JWEB.md     # this article
```

### The manifest

```js
export default [
  {
    name: "my-device-midi",
    type: "midi",                    // midi | audio | instrument
    chains: ["tick", "midiout"],     // canned chain vocabulary
    parameters: [                    // Push-visible, automatable
      { id: "density", object: "live.dial", range: [0, 1] },
      { id: "running", object: "live.toggle" },
    ],
    unmatchedTo: "js",
  },
];
```

### CI invariants (all exist in the source project today)

1. `pnpm build` produces every `.amxd` with no Max installed.
2. The wrapper parses at `ecmaVersion: 5` or the build fails.
3. The built container round-trips: a test parses the `.amxd` and asserts
   the patcher JSON and payload sizes.
4. Every selector in `protocol.ts` appears in a route or handler on the
   patcher/wrapper side.
5. No `[node.script]` in the default template.

### Migration order

1. Extract the container writer unchanged; parameterize payload names.
2. Port the wrapper to TypeScript (`target: "ES5"`), splitting core
   (extraction, lifecycle, guard) from LiveAPI helpers.
3. Reduce the patcher generator to the manifest reader + chain vocabulary.
4. Ship the transposer example; port a real device onto the template as
   the proof.
