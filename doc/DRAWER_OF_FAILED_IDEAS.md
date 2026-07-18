# The drawer of failed ideas

Things we tried and that do not work - kept so nobody spends a second afternoon
rediscovering the same wall. Ideas that WORKED are not here; they live in
[README.md](../README.md) and [ARCHITECTURE.md](ARCHITECTURE.md) (native `live.*`
controls and Push banks, the macro-mappable transport, clip I/O that reaches the track
even inside a Rack, the shipped Instrument Rack preset).

---

## Translate / Adopt mode - `.lpf()` drives the user's own Auto Filter

**Verdict: abandoned. It does not work, and it was not worth making work.**

This descends from an old grand plan: make these devices a "dumb controller" that
TRANSLATES Strudel's language onto Ableton's own native controls, and lets Live do the
sound, instead of reimplementing effects. Parts of that plan landed - native dials,
native transport, documented above. This part never will.

The idea (R4-d in the old plan): a device-wide "Translate" toggle so that instead of the
FX device's OWN built-in filter, `.lpf(800)` would bind and drive a **sibling** Auto
Filter the user placed in the rack - the "dumb controller translating to native devices"
plan taken to its logical end.

It was built end to end - an upstream `get_sibling_param` LOM walk in the wrapper, a
`resolveSiblingParam` bridge call returning the foreign parameter's id and range, a
reconciler (`useAdopt`) that bound/streamed/released like the pattern-modulation path,
value-scaling through the foreign `min`/`max`, and a UI toggle with per-stage status -
then **removed**, because the idea itself is wrong:

- **The device already HAS a cutoff filter.** Binding `.lpf()` to a *second*, external
  filter to do the same job is nonsensical - it is not translating a capability the
  device lacks, it is duplicating one it has.
- **Live already does this natively.** Anything the user would want to macro-map or
  automate on their own Auto Filter, they can map in Ableton directly. The device added
  nothing but a confusing indirection.
- And in practice it did not even bind reliably (sibling resolution across rack/track
  nesting and class-name matching was fragile).

The lesson that survives: the "translate onto native controls" plan is right ONLY where
the device would otherwise reimplement something Live does better - and it already paid
off there (native `live.dial` parameters, Push banks, the macro-mappable transport, all
shipped). Reaching out to CONTROL other devices' parameters is a bridge too far: it has
no user value the native mapping does not already give, and it fights Live's own model.

## The "super-device" and the single unified app - superseded, not built

**Verdict: dropped. The Rack made both unnecessary.**

Two shapes from the same old plan, neither built because the shipped design is better:

- **One "super-device" with a mode toggle** (sequencer + instrument + fx in a single
  draggable device, flipped by a runtime switch). Impossible AND unwanted: a device's
  container type (`mmmm` MIDI / `aaaa` audio / instrument) is stamped into the `.amxd`
  at build time and Live enforces placement by it - no runtime toggle crosses that line.
- **Merging every device into one `src/app/unified/` app** shipped into several
  containers by `mode`. This was the plan's route to the super-device feel with one
  codebase.

What shipped instead - the **Instrument Rack preset** (separate, properly-typed devices
pre-wired, one library entry) - delivers the single-thing-to-drag goal AND stays
hand-composable (swap the instrument, remove the fx, add your own). So the unified merge
bought nothing over the devices as they are, and was dropped. The devices stay separate,
sharing code only where it already pays (`src/app/shared/`, `ui:` reuse), not forced into
one bundle.

## Drag a sample from the browser directly into a Live clip (DownloadURL)

**Verdict: abandoned. `[jweb]`'s embedded Chromium (CEF) strips the `DownloadURL` payload, making it impossible.**

We attempted to use the `DownloadURL` Chromium drag type so that dragging a sample browser row onto Live's audio lane would prompt Chromium to download the file to `%TEMP%` and pass it to Live as a native `CF_HDROP` file drag. We tested passing the remote `https://` URL in the payload, but the file handoff did not occur. The drop target in Live (and even notepad.exe) only received the raw text payload, proving that the CEF runtime inside Max 8 strips the `DownloadURL` data entirely.

Without native file drop support from the webview, there is no scripted way to create an audio clip from a file path in Ableton Live (LOM only supports `ClipSlot.create_clip` for MIDI). The shipping answer remains the **"Show folder"** button, which reveals the downloaded file in the OS file manager so the user can drag it into Live from there.

---

# Moved out of ARCHITECTURE.md

The rest of this file was moved out of [ARCHITECTURE.md](ARCHITECTURE.md) so that doc stays
about what the system IS. These are the closed questions: dead ends measured impossible,
deliberate ceilings chosen on purpose, the standing "Verified in Live" re-check list, and
the past decisions we moved away from.

## Not possible - measured, so nobody re-opens it

- **The LOM cannot create an audio clip from a file on disk.** `ClipSlot.create_clip`
  is MIDI-only (it takes a length, makes an empty MIDI clip); there is no LOM call
  that points a clip slot at a WAV. It is a drag-and-drop operation in the
  application, not an API. The sample browser therefore goes as far as the API
  allows: the file is on disk at a known path, the row is a drag source, and
  reveal-in-folder is the answer (the drag-into-Live spike was tried and failed - CEF
  strips the `DownloadURL` payload; see [DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md)).
- **Live's Browser is unreachable from `[js]`** (the R2 spike, 2026-07-17).
  `new LiveAPI("live_app browser")` resolves to id 0 -
  `jsliveapi: component 'browser' is not an object`. The Browser (`load_item`,
  hotswap) is exposed to control-surface Python scripts only, so a device can never
  INSTANTIATE another device. (This was one leg of the "Translate mode" idea, whose
  other leg - a device CONTROLLING a sibling it did not create - was built and then
  abandoned as pointless; see doc/DRAWER_OF_FAILED_IDEAS.md.)

## Deliberate limitations - decided, not open work

Possible to build, chosen against on purpose. Recorded here so they are not
re-opened as backlog.

- **Scale/pitch in full Strudel code is not matched** (TODO item 4, closed 0.9.0).
  Full JS code does not see the Octave/Shift controls or the Live Scale toggle; it is
  passed through untouched, so `note("c5")` there is scientific MIDI 72 while `c5` in
  bare mini-notation follows the octave convention. Rewriting a user's JS would be
  worse than the mismatch, so the UI warns in amber and does not fix it (Studio window
  banner `StudioWindow.tsx`; MIDI device-view line `useStrudel.ts`; dialect detection
  `isBareMini()` in `strudelCode.ts`). Not a bug - the honest ceiling.
- **Playhead highlighting for full Strudel code is deferred** (TODO item 5, deferred
  0.9.0). The playhead highlights bare mini-notation only, from our own AST whose
  tokens carry source positions (`src/lib/mini/playhead.ts`, painted in
  `PatternEditor.tsx`). Full code would need CodeMirror in `PatternEditor` plus
  forwarding hap `context.locations` through the worker postMessage boundary (the
  worker discards them today, `engine.worker.js`) and wiring the vendored
  `highlightMiniLocations`. That is a large change to the editor every device shares,
  for a feature that only matters in the dialect that already lacks it. Deliberately
  deferred, not open work.

## Verified in Live - claims worth re-checking

Each of these was confirmed by hand, and each could quietly stop being true. What to
re-check, and when:

- **Instance-scoped buffers** (if buffer naming in m4l-jweb's `chains.mjs` changes):
  two copies of Strudel Samples on two tracks, different samples - each must keep its
  own sound. `---` scopes per device; `#0` was tried first and never expands in an
  `.amxd`.
- **Chain neutrality** (if the fx chains change): `.hpf(0)` and `.crush(24)` must be
  SILENT - bit-for-bit the dry signal, A/B'd against bypass. `.lpf(18000)`, `.gain(1)`,
  `.delay(0)`, `.room(0)` likewise.
- **Modulation** (if useModulation, the `remote` chain, or the surface ranges
  change): `.lpf(sine.range(200, 2000))` + play must sweep Cutoff between the actual
  200 Hz and 2 kHz once per bar, with the automation lane EMPTY; replacing the line
  with `.lpf(800)` must give the dial back; save/close/reopen must restore the line
  and resume the sweep on play.
- **Editor persistence** (if state slots or the engine's restore path change): an
  empty editor is a VALUE - select-all-and-cut, save, reopen must come back empty,
  not restore the default. Multi-space runs in a pattern must survive verbatim.
- **One scheduler** (if the Studio window changes): however many views are open,
  exactly ONE stream of notes. The device view alone receives `tick`.
- **Sampler polyphony and scope** (if the `instrument` chain or the name->slot allocator
  changes): run a pattern layering several sounds - each rings out on its own voice, none
  stolen mid-tail; two Sampler instances in one set keep separate samples (`---`
  device-scoped buffers). Confirmed 0.9.0 - the bank-based rewrite plays the selected
  machine, `.bank()` overrides per-hap, auto-download works, and a MIDI sequencer drives it.
- **Clip I/O from inside a Rack** (if `ownTrack()` or the clip paths change): a MIDI device
  inside an Instrument Rack reads and writes clips on the Rack's track, same as on a bare
  track, with no 1/s `jsliveapi` error. Confirmed 0.9.0.
- **Macro-map the native Play/Stop** (if the transport param or the native panel change): a
  Rack macro / Push button mapped to the transport starts and stops the sequencer, web
  Run/Stop stays in sync. The panel is reached from About > Advanced > Controls. Confirmed 0.9.0.
- **About > Advanced (Controls + Full Studio)** (if `AboutPanel` or the window entries
  change): the panel scrolls so the Advanced buttons are reachable in the 169px view;
  **Controls** reveals the native panel and its Back returns; **Full Studio** opens the
  child editor window that edits the same `code` slot as the device view (one scheduler,
  the device view). On MIDI, Drums MIDI, Drums Sampler. Confirmed 0.9.0.
- **Sampler samples folder** (if the wrapper's `HAS_SAMPLES_FOLDER` gate or `deviceFolder()`
  change): the `drums-sampler` mode resolves, so the device receives `device_folder` and the
  **Show folder** button enables after a download. NOTE: the reveal ACTION itself
  (`launchbrowser` in `reveal_folder`) does not open the OS file manager here on any device -
  an open 1.0.0 item (TODO), not a regression.
- **Push banks** (if the fx surface `banks` change): on a Push, the FX encoders page as
  **Tone** and **Space**, named - not "Bank 1"/"Bank 2". Confirmed 0.9.0.
- **State-default seeding** (if the surface state slots or m4l-jweb's seeding change): a
  fresh Strudel MIDI shows the demo pattern, a fresh FX device is not blank; a saved
  pattern restores over the default. Confirmed 0.9.0.
- **Engine boot / timing / preview / persistence** - the four gates in §6 above.

## Appendix: Past Architectural Decisions

The following architectural designs were moved away from. They are documented here to preserve context on why the system is built the way it is today.

### The end of `[node.script]`
Early versions of the MIDI engine and the Sample browser ran on Node for Max (`[node.script]`). In field testing, Node for Max proved unstable when embedded inside Live, leading to silent non-starts and hard crashes on device load. Everything previously running in Node has been migrated: the engine now runs in a Web Worker inside Chromium, and network operations use native `fetch` or `[maxurl]`. `[node.script]` is completely banned.

### Two Parsers
Initially, there was a local parser for the UI preview and the live engine for execution. This caused drift where the two understood tokens differently. We now use a single resolver (`src/lib/mini/resolve.ts`) that transforms mini-notation into absolute MIDI pitches, ensuring that both preview and execution paths always read the exact same data. We also moved "To Clip" export purely into the engine worker so it supports all advanced Strudel transformations directly.

### The "Instrument" Device
An earlier device attempted to act as an instrument by driving a `[poly~]` synth, but it ended up reinventing a crude oscillator without utilizing Strudel's real audio capabilities. This was removed entirely in favor of the Audio FX device which processes track audio natively.

### Normalized (0-1) Parameters
A previous design mapped all audio parameters to a 0-1 range and applied scaling secretly inside the Max patch. This broke Live automation lanes and Push controllers, which displayed meaningless 0-1 values instead of real units (e.g. Hz). All parameters are now declared in their real units.

### The `ui:` merge that must not happen (the "unified app")
Sharing one `ui:` folder between the midi and fx devices was specified and then rejected on mechanism: the build loads ONE SURFACE per UI folder and generates a `live.*` object for every param in it, for every device using it - so the MIDI device would ship nine audio dials that drive nothing, and the FX device a Play toggle that does nothing, all visible in automation lanes and on Push. The stated intent ("share CODE across container types while each device keeps its identity") is what `src/app/shared/` already does. Revisit only if the library ever separates a device's surface from its UI folder.

### `#0` buffer scoping
The first attempt at instance-scoped buffer names used `#0`, documented for abstractions. An `.amxd` device patcher does not count as one: the token stayed literal everywhere, writer and reader agreed on one global name, and the collision survived silently. Replaced by Live's `---` device-scoped prefix (verified). The wrapper-minted-id route was ruled out earlier still: a `[buffer~]` takes its name from its creation argument and has no documented runtime rename, so a name minted after load cannot reach a box frozen at build time.
