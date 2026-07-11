# M4L-JWEB: web-stack Max for Live devices, built headless

*How this project builds Ableton devices with React, TypeScript and a CI
pipeline, without ever opening the Max editor - and how you can use the same
architecture for your own ideas.*

---

## 1. What a Max for Live device actually is

Ableton Live does not have a public plugin SDK for its device area. What it
has is **Max for Live (M4L)**: a licensed embedding of Cycling '74's Max, a
40-year-old visual programming environment. An `.amxd` device is a Max
*patcher* (a graph of boxes and patch cords) wrapped in a binary container,
running inside Live with a few Live-specific objects available:

| Object | Role |
|---|---|
| `live.thisdevice` | fires a bang when the device finishes loading |
| `[js]` | an ES5 JavaScript interpreter with **LiveAPI** - the only scriptable access to Live's object model (tracks, clips, scenes, scale, transport...) |
| `[jweb]` | an embedded **Chromium** browser view |
| `[node.script]` | a Node.js process manager (Node for Max) |
| `plugsync~`, `plugin~`, `plugout~`, `midiin`, `midiout` | the device's connection to Live's transport, audio and MIDI streams |

Three device types exist, distinguished by a fourcc in the container and by
what Live lets them touch:

| Type | fourcc | Sits on | I/O |
|---|---|---|---|
| MIDI effect | `mmmm` | MIDI track, before the instrument | MIDI in -> MIDI out |
| Instrument | `iiii` | MIDI track, as the instrument | MIDI in -> audio out |
| Audio effect | `aaaa` | any audio position | audio in -> audio out |

The intended workflow is: open Live, open the Max editor, drag boxes, draw
cords, save, "freeze" the device (embed its file dependencies), distribute
the `.amxd`. Every step is manual and GUI-bound.

## 2. The problem

If you are a full-stack web developer, everything about that workflow fights
you:

- **The UI toolkit is Max's.** Sliders and dials from the 1990s, positioned
  by pixel coordinates in a visual editor. No components, no CSS, no state
  management, no hot reload.
- **The logic language is ES5** in `[js]` - no modules, no `let`, no
  promises, no npm.
- **There is no build step.** The patcher is the source *and* the artifact.
  Code review means staring at JSON diffs of box coordinates; CI means
  nothing, because producing an `.amxd` requires a human clicking "freeze"
  inside a licensed copy of Max.
- **Dependencies are frozen into a virtual filesystem** that only Max-native
  objects can read. A Chromium view or a Node process inside your own device
  cannot open the files you shipped with it.

M4L-JWEB is the set of patterns this project uses to route around all four.

## 3. The architecture

```
        source repo (all text, all reviewable)
  ┌──────────────────────────────────────────────────┐
  │ React/TS UI + engine Web Worker  (src/)          │
  │ ES5 LiveAPI glue                 (wrapper.js)    │
  │ base patcher template            (patcher.json)  │
  │ build scripts                    (scripts/*.mjs) │
  └───────────────┬──────────────────────────────────┘
                  │  pnpm build (no Max, no Live, CI-able)
                  ▼
  vite ── single-file UI html (JS/CSS/worker inlined)
  generate-patchers ── patcher JSON per device variant
  build-amxd ── binary .amxd container, written from scratch
                  │
                  ▼
        .amxd  =  patcher + wrapper.js (+ payloads) frozen inside
```

The five load-bearing ideas:

**1. The UI is a web app in `[jweb]`.** One React (or anything) app,
compiled by vite into a single `strudel-ui.html` with every asset inlined
(`vite-plugin-singlefile`). jweb exposes a tiny bridge to the page:
`window.max.bindInlet(name, fn)` to receive Max messages and
`window.max.outlet(...)` to send them. That is the entire API surface
between your web code and the patcher.

**2. Real logic can run in a Web Worker.** jweb is full Chromium: workers,
`fetch`, WebAssembly, WebAudio (for UI-side purposes) all work. This project
runs the actual Strudel pattern engine in a dedicated worker inlined into
the html. Workers are exempt from the timer throttling Chromium applies to
hidden pages, and if you design message-driven (Max pushes time in, you push
events out), you never depend on Chromium timers at all. We tried
`[node.script]` for this first; it failed to start silently and then crashed
Live - treat Node for Max as a last resort, not a default.

**3. `[js]` is glue, nothing more.** One ES5 file owns everything that needs
LiveAPI: creating clips, reading notes, observing Live properties. It stays
small and dumb; anything smart lives in the web app where you have a real
language and real tests.

**4. Patchers are generated, not drawn.** A `.maxpat`/patcher is just JSON:
`boxes` (objects with a `text` like `"route midinote flush"` and inlet/outlet
counts) and `lines` (source id/outlet -> destination id/inlet). A ~120 line
hand-written base template plus a Node script that clones and mutates it
produces every device variant. Patch cords become code review-able lines
like `line("obj-route", 0, "obj-pipe", 0)`.

**5. The `.amxd` container is written headless.** The container format is
undocumented but simple, and was reverse-engineered from devices saved by
Max 8/9: an `ampf` header carrying the device-type fourcc, a `ptch` chunk
with an `mx@c` frozen-file region (patcher JSON first, then each dependency),
and a `dlst` directory of name/size/offset entries. `scripts/build-amxd.mjs`
emits it byte-for-byte with ~150 lines of Buffer code. This is the piece
that makes CI builds possible: no Max, no Live, no freeze button.

Plus one trick that holds it together: **self-extracting payloads**. Frozen
dependencies live in Max's virtual filesystem, which Chromium cannot read -
jweb would 404 on your own UI. So the build appends the UI html to
wrapper.js as base64 chunks; at first load, the ES5 glue (which *does* run,
always) decodes them and writes a real file next to the `.amxd`, then points
jweb at a `file://` URL. Two Max quirks to respect: `File.writebytes`
silently truncates around 16 KB per call (write 4 KB slices), and the
extraction should be skipped when an identical-size file already exists.

### Is this new?

The ingredients are not: people have put web UIs in jweb, everyone doing
serious M4L work uses `[js]` + LiveAPI, and patcher JSON is officially just
JSON. The parts we have not seen documented anywhere else are the headless
binary `.amxd` writer and the self-extracting payload pattern that makes a
single-file web-app device actually load from the frozen container. Whether
that constitutes invention or just an uncommon combination, the practical
effect is the same: a normal web repo that emits installable Ableton
devices from a script. We call the combination **M4L-JWEB** in this
project's docs.

## 4. The protocol: talking to Ableton

Everything crosses object boundaries as **Max messages**: a selector word
followed by arguments (`midinote 60 96 480 1 35`). Three rules of thumb:

1. **Design selectors like routes.** The patcher uses `[route sel1 sel2]`
   to dispatch by first word; unmatched messages fall out of the last outlet,
   which you point at the next consumer. This is how one jweb outlet can
   feed a MIDI chain *and* the LiveAPI glue.
2. **Base64 anything with commas or newlines.** Max splits messages on `,`
   and `;`. Code, JSON, file paths with exotic characters - encode them.
3. **Handshake, never assume order.** The page loads asynchronously; have
   the UI send `ui_ready` and the glue reply with current state (mode,
   availability flags). Same for anything that boots late.

### Getting data in (subscribing to Live)

| You want | The M4L-JWEB way |
|---|---|
| Transport time (play position, tempo, playing) | `[plugsync~]` outputs signals; `[snapshot~ 10]` samples them every 10 ms; `[pak]` + `[prepend tick]` turn them into `tick <playing> <songBeats>` messages into jweb (tempo in BPM comes from a LiveAPI observer - plugsync~ only reports samples-per-beat). Your app now has a 100 Hz clock owned by Live. |
| A Live property (global scale, track name, ...) | In `[js]`: `var o = new LiveAPI(callback, "live_set"); o.property = "root_note";` - the callback fires on every change; forward it to jweb as a message. |
| Things with no observer (e.g. "does this track have a clip?") | Poll from `[js]` with a `Task` (this project polls 1x/s) and push a message only on change. |
| Device lifecycle | `live.thisdevice` bang -> `[js] bang()`. Do all bootstrapping from there; `loadbang()` is unreliable inside Live. |

### Getting data out (acting on Live)

| You want | The M4L-JWEB way |
|---|---|
| Send live MIDI notes | Message chain: `route` -> `pipe` (applies your per-note delay for precise timing) -> `makenote` (note-offs) -> `midiformat` -> `midiout`. Compute *when* in your app, let Max place it sample-accurately. |
| Write/read MIDI clips | LiveAPI in `[js]`: `clip_slots`, `create_clip`, `add_new_notes`, `get_notes_extended`. |
| Make sound directly | Instrument device: message-driven `poly~` voices. Audio effect: `plugin~` -> your DSP -> `plugout~`. |
| Trigger transport-synced events | Send scheduled messages with a delay computed from the tick stream; jitter tolerance comes from a lookahead window, precision from `[pipe]`. |

## 5. What this opens up for plugin authors

- **Any web technology inside a Live device**: React, Svelte, canvas/WebGL
  visualizations, WASM ports of DSP or analysis code, full npm ecosystem at
  build time.
- **Real engineering workflow**: unit tests against the same modules that
  ship (this repo tests its pattern engine headlessly in vitest), typed
  protocols, code review of logic instead of box coordinates, versioned
  patchers, reproducible release zips built in CI.
- **Single-file distribution**: the `.amxd` is the product. No "put these 5
  files in your Max search path" README pain.
- **N device variants from one codebase**: this repo ships a MIDI effect, an
  audio effect and an instrument from one template and one UI, differing
  only in generated patcher wiring and a fourcc.
- **LLM-friendly development**: because every artifact is text (TS, JSON,
  Node scripts), an AI agent can build, modify and review complete devices -
  this entire project was implemented that way.

## 6. HOWTO: build your own device from this scaffold

Say you want a "chord memory" MIDI device with a web UI.

1. **Clone the skeleton.** Copy this repo; delete the Strudel-specific parts
   (`src/max/`, `src/workers/`, `src/lib/mini/`, the `strudel/` submodule).
   Keep: `scripts/` (all of it), `ableton-amxd/patcher.json`,
   `strudel-wrapper.js` (rename it; strip the app-specific handlers),
   `src/lib/maxBridge.ts`, the vite config.
2. **Name your glue.** The wrapper filename must be unique across every
   device installed in Live (Max resolves `[js]` scripts by basename,
   globally). `mydevice-wrapper.js`, not `wrapper.js`.
3. **Build the UI** like any web app. Talk to Max only through
   `bindInlet`/`outlet` from `maxBridge.ts`. Outside Max the bridge exposes
   `maxSimulate(...)` in the console so you can develop in a normal browser
   with `pnpm dev`.
4. **Describe your patcher** in `generate-patchers.mjs`: pick the device
   type (`amxdtype`), splice in your output chain with the `box()`/`line()`
   helpers. Start minimal: jweb + js + midiin/midiout is a working device.
5. **Wire the protocol.** Define your selectors, add `[route ...]` dispatch,
   keep the `ui_ready` handshake, base64 anything structured.
6. **Build and install**: `pnpm build` emits `dist/<name>/<device>.amxd` and
   a release zip; the `scripts/install-*.{ps1,sh}` installers locate the
   user's Ableton User Library from Live's own `Library.cfg` and copy the
   files in.
7. **Verify in Live** with the console: the generated `[loadbang] ->
   [print]` probe proves your generated boxes instantiated; add `[print]`
   taps while developing (they are one generated line each).

Gotchas that will bite you exactly once:

- `[js]` is ES5. No `const`, no arrow functions, no template literals.
- `route` strips the selector; a bare selector comes out as a `bang`. If the
  consumer needs the word itself, re-materialize it with a message box.
- jweb cannot read frozen files; always go through the payload extraction.
- Live's Max console swallows nothing, but only shows a device's messages
  after you open it (device title bar -> rightmost button); print early,
  print often.
- Avoid `[node.script]` unless you need the OS (filesystem, child
  processes). It adds a process manager, a boot handshake, and - in our
  field testing - silent failures and one full Live crash.

## 7. Should this become a library?

Yes, with scope discipline. The pieces that are genuinely reusable and
stable enough to extract:

1. **`@m4l-jweb/bridge`** (browser): typed `bindInlet`/`outlet`, the
   `ui_ready` handshake, base64 helpers, `maxSimulate` dev shim. ~100 lines,
   zero dependencies, immediately useful.
2. **`@m4l-jweb/wrapper`** (ES5 fragments): payload extraction, the
   clip read/write helpers, property observers, the `anything()` guard.
   Distributed as copy-in templates rather than a runtime dependency -
   `[js]` has no module system, so "library" here means generated/concatenated
   source.
3. **`@m4l-jweb/build`** (Node CLI): `build-amxd` (the container writer),
   the patcher `box()`/`line()` DSL, payload embedding, installer templates.
   This is the crown jewel; it is application-agnostic already.

The UI framework, the engine, and the specific patcher chains should *not*
be in the library; they are the part that differs per device. A first
extraction that only ships (1) and (3) plus a documented wrapper template
would cover 90% of the value.

---

## Addendum: project template specification (for a future scaffold repo)

Intent: carve this repo into `m4l-jweb-template`, a starting point where a
developer (or an LLM agent) replaces one folder and ships a device. Written
so an implementation session can execute it directly.

### Target layout

```
m4l-jweb-template/
  src/
    app/                  # THE ONLY FOLDER A DEVICE AUTHOR EDITS
      App.tsx             # device UI root
      protocol.ts         # selector names + payload types, single source of truth
      worker.ts?          # optional compute worker (inlined automatically)
    bridge/maxBridge.ts   # typed window.max bridge + maxSimulate dev shim
  wrapper/
    core.js               # ES5: payload extraction, handshake, anything() guard
    liveapi.js            # ES5: clip I/O + observer helpers (copy what you need)
  patcher/
    base.json             # minimal jweb+js template (no midiin/midiout)
    devices.mjs           # declarative device list, see below
  scripts/                # unchanged from this repo, parameterized:
    build-amxd.mjs        # binary container writer (application-agnostic)
    generate-patchers.mjs # reads patcher/devices.mjs
    postbuild.mjs         # dist assembly + zip + per-OS installers
    install-*.{ps1,sh}
  doc/M4L-JWEB.md         # this article
  CLAUDE.md               # agent instructions, see below
```

### The declarative device list

`patcher/devices.mjs` is the template's core abstraction - everything a
variant needs, in data:

```js
export default [
  {
    name: "mydevice-midi",       // output: <name>.amxd
    type: "midi",                // midi | audio | instrument -> fourcc
    wrapperMode: "midi",         // jsarguments[0] for the shared wrapper
    chains: [
      "tick -> jweb",            // canned chain: plugsync tick feed
      "jweb: route midinote flush -> makenote -> midiout", // canned MIDI out
    ],
    unmatchedTo: "js",           // where route leftovers go
  },
];
```

`generate-patchers.mjs` expands canned chain names into box/line sets (the
tick chain, MIDI out chain, plugin~ passthrough and poly~ bank from this
repo become the initial vocabulary). Anything not expressible declaratively
drops down to the `box()`/`line()` helpers in a per-device `custom(p)` hook.

### Scaffold invariants (enforce in CI)

1. `pnpm build` must produce every `.amxd` with no Max installed.
2. Every selector used in `src/app/protocol.ts` must appear in a route or
   handler on the patcher/wrapper side (a lint script can check this).
3. Wrapper stays ES5-parseable (run it through an ES5 parser in CI).
4. The `.amxd` round-trips: a test parses the built container and asserts
   the patcher JSON and payload sizes (this repo already has the parser).
5. No `[node.script]` in the default template.

### CLAUDE.md contents (make it LLM-friendly)

- One paragraph: "you are editing src/app/ and patcher/devices.mjs; scripts/
  and wrapper/core.js are infrastructure - do not modify without being asked."
- The message protocol conventions (selectors, base64, ui_ready).
- The verification loop: `pnpm test`, `pnpm build`, then the in-Live
  checklist (console probes, what a healthy boot log looks like).
- The gotcha list from section 6 verbatim.
- Pointers: container format -> scripts/build-amxd.mjs header comment;
  patcher JSON shape -> patcher/base.json.

### Migration path from this repo

1. Extract `build-amxd.mjs` unchanged; parameterize the payload name list.
2. Split `strudel-wrapper.js` into `core.js` (extraction, handshake,
   anything) and `liveapi.js` (clips, observers); the Strudel repo then
   consumes the template pieces plus its own mode logic.
3. Reduce `generate-patchers.mjs` to the vocabulary + `devices.mjs` reader;
   port this repo's three devices onto it as the proof.
4. Ship an `examples/` device: a one-knob MIDI transposer with a React UI,
   ~50 lines of app code, as the hello-world.
