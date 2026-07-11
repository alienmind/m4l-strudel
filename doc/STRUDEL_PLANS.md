# m4l-strudel: Three-Device Split — Full Implementation Plan

## Context

`m4l-strudel` currently ships one `.amxd` MIDI device whose UI (React in `[jweb]`) uses a **hand-rolled mini-notation parser** (`src/lib/mini/*`) to convert Strudel text ↔ Ableton MIDI clips. The goal (per `doc/STRUDEL_PLANS.md`, feasibility-reviewed 2026-07-11 against the `strudel/` git submodule) is to drop the custom AST and run the **real `@strudel/core` engine headlessly** inside `[node.script]` (Node for Max), producing **three device variants** from one codebase:

1. **MIDI Sequencer** (`mmmm`) — Strudel code → live MIDI stream, transport-locked to Live, multi-channel via `.midichan()`. *Build first: lowest risk, highest value.*
2. **Sample Fetcher** (`aaaa` audio effect — corrected from the plans doc, see 0.5) — downloads Strudel's sample-map libraries to disk, BPM-synced preview, scale-aware filtering. *Second: fetching is easy; Ableton-injection ideas are gated prototypes.*
3. **Audio Instrument** (`iiii`) — Strudel patterns trigger native Max synthesis (`[poly~]`). *Last: largest surface, exploratory.*

**Hard constraints (verified against source — do not violate):**
- `[node.script]` has **no LiveAPI and no signal inlets**. All LOM work stays in the `[js]`-hosted `strudel-wrapper.js` (ES5). Node ↔ Max talk via Max messages only.
- The Node process **cannot see Max's frozen virtual filesystem** and there is **no `node_modules`** at runtime → the engine must be one esbuild-bundled file, extracted to disk if frozen resolution fails (the repo already has this extraction pattern for `strudel-ui.html` in `strudel-wrapper.js:103-143`).
- `evaluate()` (`strudel/packages/core/evaluate.mjs`) turns code → `Pattern` (once per edit); `pattern.queryArc(begin, end)` (`strudel/packages/core/pattern.mjs`) yields haps per time window (every tick). Reference loop: `strudel/packages/core/cyclist.mjs:60`.
- `$:` lines become `.p(id)` calls (transpiler), but `Pattern.prototype.p` only exists inside `repl()` (`strudel/packages/core/repl.mjs:352-383`) — we re-implement the collector (code below).
- Max messages split on commas/semicolons → **code text travels base64-encoded** between jweb/node.
- `'iiii'` = `1768515945` (0x69696969), `'mmmm'` = `1835887981`, `'aaaa'` = `1633771873`.

**Repo facts to reuse:**
- `scripts/build-amxd.mjs` — builds the `.amxd` container from raw JSON + embedded files; parameterize it (currently hardcodes `ableton-amxd/patcher.json`, `strudel-wrapper.js`, and takes only `<output.amxd>`).
- `scripts/postbuild.mjs` — orchestrates dist assembly + zip; extend for 3 devices.
- `strudel-wrapper.js` — keep as the single `[js]` glue for all 3 devices, mode-switched by `jsarguments[0]`; reuse its `extractPayloadIfNeeded`/`b64decode` (lines 103-168), clip I/O (lines 179-331).
- `src/lib/maxBridge.ts` — generic `bindInlet`/`outlet`; no structural change.
- Scale observers: copy from `c:/Users/jaime/src/m4l-chord-progression/chordprog-wrapper.js` (`setup()`/`onRoot`/`onScale`) + `src/hooks/useScaleFromLive.ts`.

---

## Phase 0 — Shared Foundation (build pipeline + headless engine)

### 0.1 New file layout

```
src/max/
  shared/
    engine.mjs          # headless strudel: evalScope boot, $ collector, compile, query, hap→event
    transport.mjs       # Live-beats → strudel-cycles mapping + lookahead window logic
  midi/main.mjs         # [node.script] entry for device 1
  sampler/main.mjs      # [node.script] entry for device 3 (built 2nd)
  audio/main.mjs        # [node.script] entry for device 2 (built 3rd)
ableton-amxd/
  patcher.json          # stays: the base template
  voice.maxpat          # NEW (audio device poly~ voice, Phase 3)
scripts/
  build-node-bundles.mjs  # esbuild → dist/node/strudel-node-{midi,sampler,audio}.cjs
  generate-patchers.mjs   # mutates base patcher.json → dist/patchers/{midi,sampler,audio}.json
  build-amxd.mjs          # parameterized (see 0.4)
  postbuild.mjs           # loops over 3 devices
```

### 0.2 Dependencies

Add to `devDependencies` in `package.json`: `"esbuild": "^0.24.0"` (already in `pnpm.onlyBuiltDependencies`). **No npm `@strudel/*` packages** — bundle straight from the submodule via esbuild aliases (guarantees version == submodule, `workspace:*` deps resolve).

### 0.3 `scripts/build-node-bundles.mjs` (complete)

```js
/**
 * Bundle each [node.script] entry into a single self-contained CJS file.
 * @strudel/* resolve into the git submodule; 'max-api' stays external
 * (Node for Max injects it at runtime).
 */
import { build } from "esbuild";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = (p) => path.join(root, "strudel", "packages", p);

const alias = {
  "@strudel/core": path.join(pkg("core"), "index.mjs"),
  "@strudel/mini": path.join(pkg("mini"), "index.mjs"),
  "@strudel/transpiler": path.join(pkg("transpiler"), "index.mjs"),
  "@strudel/tonal": path.join(pkg("tonal"), "index.mjs"),
};

mkdirSync(path.join(root, "dist", "node"), { recursive: true });

for (const device of ["midi", "sampler", "audio"]) {
  await build({
    entryPoints: [path.join(root, "src", "max", device, "main.mjs")],
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node16",            // lowest Node for Max ships; engine checks process.version at boot
    outfile: path.join(root, "dist", "node", `strudel-node-${device}.cjs`),
    alias,
    external: ["max-api"],
    logLevel: "info",
  });
}
```

> Note: `acorn` + `escodegen` (transpiler deps, pure JS) get bundled in — run `pnpm add -D acorn escodegen estree-walker` if esbuild can't resolve them from the submodule's own node_modules; alternatively point esbuild's `nodePaths` at `strudel/node_modules` after running `pnpm install` inside the submodule once. **Implementation order: try `nodePaths: [path.join(root,'strudel','node_modules')]` first** (keeps root package.json clean).

### 0.4 Parameterize `scripts/build-amxd.mjs`

Keep the container-format code (lines 62-135) untouched. Change the head to:

```js
// Usage: node scripts/build-amxd.mjs <patcher.json> <wrapper.js> <output.amxd> [extraFile ...]
//   extraFile: additional files embedded in the frozen device, e.g.
//     dist/node/strudel-node-midi.cjs  or  ableton-amxd/voice.maxpat
const [patcherPath, wrapperPath, outPath, ...extraPaths] = process.argv.slice(2);
```

- `patcherJson = readFileSync(patcherPath, "utf8")` / `wrapperJs = readFileSync(wrapperPath, "utf8")`.
- The `files` array keeps `{type:"JSON", name: basename(outPath)}` for the patcher and `{type:"TEXT", name: basename(wrapperPath)}` for the wrapper, then appends each extra:
  ```js
  for (const p of extraPaths) {
    const isJson = p.endsWith(".maxpat") || p.endsWith(".json");
    files.push({ type: isJson ? "JSON" : "TEXT", name: path.basename(p),
                 data: readFileSync(p), flag: 0 });
  }
  ```
- **Node-bundle payload**: in addition to freezing the `.cjs` as an extra file, append it to the wrapper as a second base64 payload (mirroring `uiPayloadJs`), so `[js]` can extract it if frozen resolution fails (see 0.6 decision gate):
  ```js
  function payloadJs(varPrefix, buf) { /* same as uiPayloadJs but with
     `${varPrefix}_BYTES` / `${varPrefix}_B64` and a `${varPrefix}_NAME` string */ }
  // wrapperData = wrapperJs + payloadJs("UI_PAYLOAD", uiHtml) + payloadJs("NODE_PAYLOAD", nodeBundle)
  ```
  Refactor the existing `uiPayloadJs` into this generic `payloadJs(varPrefix, name, buf)`.

### 0.5 `scripts/generate-patchers.mjs` (complete — the patcher mutator)

The base `ableton-amxd/patcher.json` is 120 lines with boxes `obj-midiin`, `obj-midiout`, `obj-1` (live.thisdevice), `obj-2` (`js strudel-wrapper.js`), `obj-jweb`. Mutation strategy: parse, deep-clone, splice boxes/lines, rewrite `project.amxdtype`, write `dist/patchers/<device>.json`.

```js
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(path.join(root, "ableton-amxd", "patcher.json"), "utf8"));
mkdirSync(path.join(root, "dist", "patchers"), { recursive: true });

// midi: 'mmmm' MIDI effect. audio: 'iiii' instrument (MIDI in → audio out).
// sampler: 'aaaa' AUDIO effect — corrects STRUDEL_PLANS.md, which said 'mmmm':
// a MIDI-effect device has NO audio output path, so the BPM-synced preview
// (sfplay~ → plugout~) would be silent. As an audio effect it sits anywhere in
// an audio chain and passes input through, like Splice's Bridge plugin.
const AMXD = { midi: 1835887981, sampler: 1633771873, audio: 1768515945 };

// --- box factory helpers -----------------------------------------------
let y = 300; // place generated objects below the existing ones
const box = (id, text, extra = {}) => ({
  box: { id, maxclass: "newobj", text, numinlets: 1, numoutlets: 1,
         outlettype: [""], patching_rect: [16, (y += 32), 220, 20], ...extra },
});
const line = (srcId, srcOut, dstId, dstIn) => ({
  patchline: { source: [srcId, srcOut], destination: [dstId, dstIn] },
});

// --- transport tick chain (shared by all 3 devices) ---------------------
// plugsync~ outlets are SIGNALS. We snapshot bar/beat/unit/tempo/playing at 10ms
// and pak them into: "tick <bar> <beat> <unit> <tempo> <playing>"
// !! VERIFY OUTLET INDICES against the plugsync~ reference in Max 9 and fix
// the OUT map below; this is the single most likely constant to be wrong.
const PLUGSYNC_OUT = { playing: 1, bar: 2, beat: 3, unit: 4, tempo: 6 };
function tickChain(boxes, lines, nodeId) {
  boxes.push(box("obj-sync", "plugsync~",
    { numoutlets: 9, outlettype: Array(9).fill("signal"), numinlets: 1 }));
  const order = ["bar", "beat", "unit", "tempo", "playing"];
  order.forEach((k, i) => {
    boxes.push(box(`obj-snap-${k}`, "snapshot~ 10",
      { numinlets: 2, numoutlets: 1, outlettype: ["float"] }));
    lines.push(line("obj-sync", PLUGSYNC_OUT[k], `obj-snap-${k}`, 0));
  });
  boxes.push(box("obj-pak", "pak 0. 0. 0. 0. 0.",
    { numinlets: 5, numoutlets: 1, outlettype: [""] }));
  order.forEach((k, i) => lines.push(line(`obj-snap-${k}`, 0, "obj-pak", i)));
  boxes.push(box("obj-ticktag", "prepend tick"));
  lines.push(line("obj-pak", 0, "obj-ticktag", 0));
  lines.push(line("obj-ticktag", 0, nodeId, 0));
}

// --- MIDI output chain: node → pipe → makenote → midiformat → midiout ---
// node emits: "midinote <pitch> <vel> <durMs> <chan> <delayMs>"
function midiOutChain(boxes, lines, nodeId) {
  boxes.push(box("obj-route", "route midinote flush",
    { numoutlets: 3, outlettype: ["", "", ""] }));
  boxes.push(box("obj-pipe", "pipe 0 0 0 0 0",           // 4 data inlets + delay
    { numinlets: 5, numoutlets: 4, outlettype: ["int","int","int","int"] }));
  boxes.push(box("obj-makenote", "makenote 100 250",
    { numinlets: 3, numoutlets: 2, outlettype: ["int","int"] }));
  boxes.push(box("obj-packnote", "pack 0 0",
    { numinlets: 2, numoutlets: 1, outlettype: [""] }));
  boxes.push(box("obj-fmt", "midiformat",
    { numinlets: 7, numoutlets: 1, outlettype: ["int"] }));
  lines.push(line(nodeId, 0, "obj-route", 0));
  lines.push(line("obj-route", 0, "obj-pipe", 0));       // midinote payload
  lines.push(line("obj-route", 1, "obj-makenote", 0));   // "flush" → makenote (note-offs)
  lines.push(line("obj-pipe", 0, "obj-makenote", 0));    // pitch
  lines.push(line("obj-pipe", 1, "obj-makenote", 1));    // velocity
  lines.push(line("obj-pipe", 2, "obj-makenote", 2));    // duration ms
  lines.push(line("obj-pipe", 3, "obj-fmt", 6));         // channel → midiformat channel inlet
  lines.push(line("obj-makenote", 0, "obj-packnote", 0));
  lines.push(line("obj-makenote", 1, "obj-packnote", 1));
  lines.push(line("obj-packnote", 0, "obj-fmt", 0));
  lines.push(line("obj-fmt", 0, "obj-midiout", 0));
}

function makeDevice(kind) {
  const p = structuredClone(base);
  const { boxes, lines } = p.patcher;
  p.patcher.project.amxdtype = AMXD[kind];

  // 1. every device: js gets a mode jsargument
  const js = boxes.find((b) => b.box.id === "obj-2").box;
  js.text = `js strudel-wrapper.js ${kind}`;

  // 2. every device: a node.script (autostart; watch off in production)
  const nodeId = "obj-node";
  boxes.push(box(nodeId, `node.script strudel-node-${kind}.cjs @autostart 1 @watch 0`,
    { numinlets: 1, numoutlets: 2, outlettype: ["", ""] }));
  tickChain(boxes, lines, nodeId);

  // 3. jweb → node (code/hush/etc. — node ignores messages meant for js)
  lines.push(line("obj-jweb", 0, nodeId, 0));
  // 4. js → node (scale updates, node_path handshake)
  //    js outlet 1 currently goes to print; repurpose outlet 1 → node
  lines.push(line("obj-2", 1, nodeId, 0));

  if (kind === "midi") {
    midiOutChain(boxes, lines, nodeId);
    // sever the direct midiin→midiout thru (node now owns the output);
    // keep midiin for future input-merge, or leave the thru — DECISION: keep thru,
    // Live merges streams; remove only if double-noting is observed.
  }
  if (kind === "sampler") {
    // Audio effect ('aaaa'): remove midiin/midiout, add plugin~ → plugout~ passthrough.
    for (const id of ["obj-midiin", "obj-midiout"]) {
      const i = boxes.findIndex((b) => b.box.id === id);
      if (i >= 0) boxes.splice(i, 1);
      for (let j = lines.length - 1; j >= 0; j--) {
        const pl = lines[j].patchline;
        if (pl.source[0] === id || pl.destination[0] === id) lines.splice(j, 1);
      }
    }
    boxes.push(box("obj-plugin", "plugin~",
      { numinlets: 1, numoutlets: 2, outlettype: ["signal", "signal"] }));
    // Preview player. Timing model: NODE does the quantization (setTimeout to the
    // next beat, see sampler/main.mjs "preview" handler) and emits a bare
    // "preview_go" at the right moment — 5-10ms jitter is fine for previewing.
    // Max side is therefore trivially simple:
    //   "preview_open <path>" → sfplay~ open   |  "preview_go" → 1  |  "preview_stop" → 0
    boxes.push(box("obj-sf", "sfplay~ 2",
      { numinlets: 1, numoutlets: 3, outlettype: ["signal", "signal", "bang"] }));
    boxes.push(box("obj-routes", "route preview_open preview_go preview_stop",
      { numoutlets: 4, outlettype: ["", "", "", ""] }));
    boxes.push(box("obj-openmsg", "prepend open"));
    boxes.push(box("obj-gomsg", "t 1"), box("obj-stopmsg", "t 0"));
    boxes.push(box("obj-plugout", "plugout~", { numinlets: 2, numoutlets: 0 }));
    lines.push(line(nodeId, 0, "obj-routes", 0));
    lines.push(line("obj-routes", 0, "obj-openmsg", 0));
    lines.push(line("obj-openmsg", 0, "obj-sf", 0));
    lines.push(line("obj-routes", 1, "obj-gomsg", 0));
    lines.push(line("obj-gomsg", 0, "obj-sf", 0));       // 1 = start playback
    lines.push(line("obj-routes", 2, "obj-stopmsg", 0));
    lines.push(line("obj-stopmsg", 0, "obj-sf", 0));     // 0 = stop
    // passthrough + preview mix (multiple signal cords into one inlet sum in MSP)
    lines.push(line("obj-plugin", 0, "obj-plugout", 0));
    lines.push(line("obj-plugin", 1, "obj-plugout", 1));
    lines.push(line("obj-sf", 0, "obj-plugout", 0));
    lines.push(line("obj-sf", 1, "obj-plugout", 1));
  }
  if (kind === "audio") {
    // node emits: "voice <note> <vel01> <durMs> <wave> <cutoff> <gain> <delayMs>"
    boxes.push(box("obj-routev", "route voice", { numoutlets: 2, outlettype: ["",""] }));
    boxes.push(box("obj-pipev", "pipe 0 0. 0 s 0. 0. 0",
      { numinlets: 7, numoutlets: 6 }));
    boxes.push(box("obj-notemsg", "prepend note"));
    boxes.push(box("obj-poly", "poly~ strudel-voice.maxpat 16 @steal 1",
      { numinlets: 1, numoutlets: 2, outlettype: ["signal","signal"] }));
    boxes.push(box("obj-plugout", "plugout~", { numinlets: 2, numoutlets: 0 }));
    // remove midiout (device is an instrument: midiin stays, audio goes out)
    const moIdx = boxes.findIndex((b) => b.box.id === "obj-midiout");
    boxes.splice(moIdx, 1);
    for (let i = lines.length - 1; i >= 0; i--)
      if (lines[i].patchline.destination[0] === "obj-midiout") lines.splice(i, 1);
    lines.push(line(nodeId, 0, "obj-routev", 0));
    lines.push(line("obj-routev", 0, "obj-pipev", 0));
    // pipev outlets (right-to-left) re-packed into a single "note ..." list:
    boxes.push(box("obj-pakv", "pak 0 0. 0 s 0. 0.", { numinlets: 6, numoutlets: 1 }));
    for (let i = 0; i < 6; i++) lines.push(line("obj-pipev", i, "obj-pakv", i));
    lines.push(line("obj-pakv", 0, "obj-notemsg", 0));
    lines.push(line("obj-notemsg", 0, "obj-poly", 0));
    lines.push(line("obj-poly", 0, "obj-plugout", 0));
    lines.push(line("obj-poly", 1, "obj-plugout", 1));
  }
  writeFileSync(path.join(root, "dist", "patchers", `${kind}.json`),
    JSON.stringify(p, null, "\t"));
  console.log(`generate-patchers: ${kind}.json (amxdtype ${AMXD[kind]})`);
}

for (const k of ["midi", "sampler", "audio"]) makeDevice(k);
```

> ⚠ The `obj-godel` line above contains deliberate pseudo-code (see its NOTE). The implementer should use the **node-setTimeout preview variant** and delete `obj-godel`/`obj-gomsg` wiring complexity: `route preview_open preview_stop` + `t 1`/`t 0` only.

### 0.6 `strudel-wrapper.js` additions (`[js]`, ES5!)

Mode comes from `jsarguments[0]` (`"midi"|"sampler"|"audio"`, default `"midi"`). Add:

```js
var MODE = (jsarguments.length > 0 ? String(jsarguments[0]) : "midi");

/** After ui_ready, tell the React app which mode to render. */
function ui_ready() {
    outlet(0, "mode", MODE);
    lastClipAvail = -1;
    if (MODE !== "audio") checkClipAvailable();
}

/**
 * Node bundle extraction — DECISION GATE:
 * Node for Max documents support for frozen devices (it unpacks scripts to a
 * cache dir). FIRST try shipping the .cjs only as a frozen extra file and see
 * if [node.script strudel-node-<mode>.cjs @autostart 1] boots (watch the Max
 * console for the node banner). If it does NOT resolve, enable this extraction
 * path (payload appended by build-amxd.mjs) and have node started explicitly:
 */
function extractNodeBundle() {
    if (typeof NODE_PAYLOAD_B64 === "undefined") return; // dev layout: file on disk
    var fp = this.patcher.filepath;
    var devFolder = fp && fp.length ? fp.replace(/\/[^\/]*$/, "") : null;
    if (!devFolder) return;
    var target = devFolder + "/" + NODE_PAYLOAD_NAME;
    extractPayload(target, NODE_PAYLOAD_B64, NODE_PAYLOAD_BYTES); // generalized helper
}
```

Refactor `extractPayloadIfNeeded` (lines 103-143) into `extractPayload(targetPath, b64chunks, byteCount)`; `resolveUiUrl` calls it with the `UI_PAYLOAD_*` globals. Call `extractNodeBundle()` from `loadbang()` **before** node autostarts (if timing races, set `@autostart 0` in the patcher and have `[js]` send `script start` to node via a new `[js]→[node.script]` patchline through `[message]`... simplest: `outlet(1, "node_start")` is NOT a node command — instead wire a `[t script start]`-style message box; if needed, generate in `generate-patchers.mjs`: `js outlet1 → [route node_start] → [message "script start"] → node.script`. Keep this in the back pocket; try `@autostart 1` first).

Scale observers (sampler device; copy from `m4l-chord-progression/chordprog-wrapper.js`):

```js
var rootObs = null, scaleObs = null, liveRoot = 0, liveScale = "Major";
function setupScaleObservers() {
    if (MODE !== "sampler") return;
    try {
        rootObs = new LiveAPI(onRoot, "live_set");  rootObs.property = "root_note";
        scaleObs = new LiveAPI(onScale, "live_set"); scaleObs.property = "scale_name";
    } catch (e) { post("strudel: scale observers unavailable (pre-Live-12?)\n"); }
}
function onRoot(a)  { if (a && a[0] == "root_note")  { liveRoot = a[1]; sendScale(); } }
function onScale(a) { if (a && a[0] == "scale_name") { liveScale = a.slice(1).join(" "); sendScale(); } }
function sendScale() {
    outlet(0, "scale", liveRoot, liveScale);   // → jweb (UI filter)
    outlet(1, "scale", liveRoot, liveScale);   // → node
}
```

Call `setupScaleObservers()` from `bang()`/`loadbang()`.

### 0.7 `src/max/shared/engine.mjs` (complete — the heart)

```js
/**
 * Headless Strudel engine for Node for Max.
 * - bootScope(): register @strudel/{core,mini,tonal} into globalThis (once).
 * - compile(code): code string -> Pattern ($:-aware, mirrors core/repl.mjs).
 * - queryWindow(pat, from, to, cps): onset haps in a cycle window.
 * - hapToNote(hap, cps): normalized MIDI-ish event or null.
 */
import { evalScope, evaluate, silence, stack, Pattern, isPattern, noteToMidi }
  from "@strudel/core";
import { transpiler } from "@strudel/transpiler";

let pPatterns = {};
let anonymousIndex = 0;

/** Mirrors repl.mjs injectPatternMethods (core/repl.mjs:352-383). */
export function installDollarCollector() {
  Pattern.prototype.p = function (id) {
    if (typeof id === "string" && (id.startsWith("_") || id.endsWith("_")))
      return silence;                      // x_ / _x mutes a line
    if (String(id).includes("$")) id = `${id}${anonymousIndex++}`;
    pPatterns[id] = this;
    return this;
  };
  Pattern.prototype.q = function () { return silence; };
  for (let i = 1; i < 10; ++i) {
    Object.defineProperty(Pattern.prototype, `d${i}`, {
      get() { return this.p(i); }, configurable: true });
    Object.defineProperty(Pattern.prototype, `p${i}`, {
      get() { return this.p(i); }, configurable: true });
    Pattern.prototype[`q${i}`] = silence;
  }
}

let booted = false;
export async function bootScope() {
  if (booted) return;
  await evalScope(
    import("@strudel/core"),
    import("@strudel/mini"),
    import("@strudel/tonal"),
  );
  installDollarCollector();
  booted = true;
}

export async function compile(code) {
  pPatterns = {};
  anonymousIndex = 0;
  const { pattern } = await evaluate(code, transpiler);
  const named = Object.values(pPatterns);
  const pat = named.length ? stack(...named) : pattern;   // repl.mjs:231-253 semantics
  if (!isPattern(pat)) throw new Error("Code did not evaluate to a pattern");
  return pat;
}

export function queryWindow(pat, fromCycle, toCycle, cps) {
  return pat
    .queryArc(fromCycle, toCycle, { _cps: cps })
    .filter((h) => h.hasOnset());
}

export function hapToNote(hap, cps) {
  const v = hap.value ?? {};
  let note = v.note ?? v.n;
  if (typeof note === "string") note = noteToMidi(note);
  if (typeof note !== "number" || Number.isNaN(note)) return null;
  const durCycles = hap.duration.valueOf();               // Fraction → number (cycles)
  return {
    pitch: Math.max(0, Math.min(127, Math.round(note))),
    velocity: Math.max(1, Math.min(127,
      Math.round((v.velocity ?? v.gain ?? 0.75) * 127))),
    durMs: Math.max(5, (durCycles / cps) * 1000),
    chan: Math.max(1, Math.min(16, Math.round(v.midichan ?? 1))),
    beginCycle: hap.whole.begin.valueOf(),
    value: v,                                             // raw params (audio device)
  };
}
```

### 0.8 `src/max/shared/transport.mjs` (complete)

```js
/**
 * Maps Live transport ticks to strudel cycle windows with lookahead.
 * Convention: 1 strudel cycle = 1 bar of 4 beats (cps = bpm/60/4).
 * tick() is fed ~every 10ms from [plugsync~]→[snapshot~ 10]→[pak].
 */
export class LiveTransport {
  constructor({ lookaheadMs = 120, onWindow, onStop }) {
    this.lookaheadMs = lookaheadMs;
    this.onWindow = onWindow;   // (fromCycle, toCycle, cps, bpm, nowBeats) => void
    this.onStop = onStop;
    this.lastEnd = null;        // cycle position already queried up to
    this.playing = false;
  }

  /** bar/beat 1-based, unit 0-479 ticks, per plugsync~. Assumes 4/4 (v1). */
  static beatsFrom(bar, beat, unit) {
    return (bar - 1) * 4 + (beat - 1) + unit / 480;
  }

  tick(bar, beat, unit, tempo, playing) {
    const isPlaying = playing >= 0.5;
    if (!isPlaying) {
      if (this.playing) { this.playing = false; this.lastEnd = null; this.onStop?.(); }
      return;
    }
    this.playing = true;
    const bpm = tempo;
    const cps = bpm / 60 / 4;
    const nowBeats = LiveTransport.beatsFrom(bar, beat, unit);
    const nowCycle = nowBeats / 4;
    const lookaheadCycles = (this.lookaheadMs / 1000) * cps;
    const to = nowCycle + lookaheadCycles;

    // First tick after start, or transport jumped (loop wrap / scrub):
    if (this.lastEnd === null || nowCycle < this.lastEnd - lookaheadCycles * 2
        || nowCycle > this.lastEnd + lookaheadCycles * 4) {
      this.lastEnd = nowCycle;
    }
    if (to <= this.lastEnd) return;       // window already covered
    const from = this.lastEnd;
    this.lastEnd = to;
    this.onWindow(from, to, cps, bpm, nowBeats);
  }

  /** ms from "now" until a cycle position, given current tempo/position. */
  delayMs(targetCycle, nowBeats, bpm) {
    const targetBeats = targetCycle * 4;
    return Math.max(0, ((targetBeats - nowBeats) * 60000) / bpm);
  }
}
```

### 0.9 `package.json` scripts

```json
"scripts": {
  "dev": "vite --host 127.0.0.1 --port 5175",
  "build": "tsc -b && vite build && node scripts/build-node-bundles.mjs && node scripts/generate-patchers.mjs && node scripts/postbuild.mjs",
  "build:node": "node scripts/build-node-bundles.mjs",
  "build:patchers": "node scripts/generate-patchers.mjs",
  "preview": "vite preview --host 127.0.0.1 --port 4175",
  "test": "vitest run",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\""
}
```

`scripts/postbuild.mjs`: replace the single `execFileSync` (lines 26-29) with a loop:

```js
const DEVICES = [
  { kind: "midi",    out: "alienmind-strudel-midi.amxd" },
  { kind: "sampler", out: "alienmind-strudel-sampler.amxd" },
  { kind: "audio",   out: "alienmind-strudel-audio.amxd",
    extra: [path.join(root, "ableton-amxd", "voice.maxpat")] },
];
for (const d of DEVICES) {
  execFileSync(process.execPath, [
    path.join(root, "scripts", "build-amxd.mjs"),
    path.join(root, "dist", "patchers", `${d.kind}.json`),
    path.join(root, "strudel-wrapper.js"),
    path.join(outDir, d.out),
    path.join(root, "dist", "node", `strudel-node-${d.kind}.cjs`),
    ...(d.extra ?? []),
  ], { stdio: "inherit" });
}
```

…and add the three `.amxd` names + the `.cjs` bundles to the zip list (lines 41-44).

---

## Phase 1 — Device 1: MIDI Sequencer (build this first)

### 1.1 `src/max/midi/main.mjs` (complete)

```js
import Max from "max-api";
import { bootScope, compile, queryWindow, hapToNote } from "../shared/engine.mjs";
import { LiveTransport } from "../shared/transport.mjs";

let pattern = null;
let running = false;   // user pressed Run in the UI

const transport = new LiveTransport({
  lookaheadMs: 120,
  onWindow(from, to, cps, bpm, nowBeats) {
    if (!pattern || !running) return;
    let haps;
    try { haps = queryWindow(pattern, from, to, cps); }
    catch (e) { Max.post(`query error: ${e.message}`); return; }
    for (const hap of haps) {
      const n = hapToNote(hap, cps);
      if (!n) continue;
      const delay = transport.delayMs(n.beginCycle, nowBeats, bpm);
      // → [route midinote] → [pipe pitch vel dur chan @delay] → makenote/midiformat
      Max.outlet("midinote", n.pitch, n.velocity, Math.round(n.durMs),
                 n.chan, Math.round(delay));
    }
  },
  onStop() { Max.outlet("flush"); },   // makenote releases hanging notes
});

Max.addHandler("tick", (bar, beat, unit, tempo, playing) =>
  transport.tick(bar, beat, unit, tempo, playing));

/** UI sends code base64-encoded (Max messages choke on commas/newlines). */
Max.addHandler("code", async (b64) => {
  try {
    const code = Buffer.from(String(b64), "base64").toString("utf8");
    pattern = await compile(code);
    running = true;
    Max.outlet("evalok");
  } catch (e) {
    Max.outlet("evalerr", Buffer.from(String(e.message)).toString("base64"));
  }
});

Max.addHandler("hush", () => { running = false; Max.outlet("flush"); });

// Ignore messages destined for [js] (same jweb outlet fans out to both):
for (const ignored of ["ui_ready", "write_clip", "read_notes"])
  Max.addHandler(ignored, () => {});

await bootScope();
Max.post(`strudel engine ready (node ${process.version})`);
Max.outlet("engine_ready");
```

### 1.2 UI changes (`src/App.tsx`, `src/hooks/useStrudel.ts`, new `src/hooks/useDeviceMode.ts`)

New hook:

```ts
// src/hooks/useDeviceMode.ts
import { useEffect, useState } from "react";
import { bindInlet } from "@/lib/maxBridge";

export type DeviceMode = "midi" | "audio" | "sampler";
export function useDeviceMode(): DeviceMode {
  const [mode, setMode] = useState<DeviceMode>("midi");
  useEffect(() => {
    bindInlet("mode", (m) => setMode(String(m) as DeviceMode));
  }, []);
  return mode;
}
```

`useStrudel.ts` additions (keep everything that exists — clip To/From stays useful):

```ts
const [live, setLive] = useState(false);
const [evalError, setEvalError] = useState<string | null>(null);

useEffect(() => {
  bindInlet("evalok", () => { setEvalError(null); setStatus("Pattern running"); });
  bindInlet("evalerr", (b64) => {
    setEvalError(atob(String(b64)));
    setStatus("Eval error");
  });
  bindInlet("engine_ready", () => setStatus("Strudel engine ready"));
}, []);

const run = useCallback(() => {
  // btoa handles ASCII; strudel code can contain unicode in strings:
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(text)));
  outlet("code", b64);
  setLive(true);
}, [text]);

const hush = useCallback(() => { outlet("hush"); setLive(false); }, []);
```

`App.tsx`: read `useDeviceMode()`; for `midi`/`audio` render the existing editor + two new buttons **Run** (`s.run`, primary, Play icon) and **Hush** (`s.hush`, shown while `live`), keeping To Clip/From Clip; header text becomes `Strudel MIDI` / `Strudel Audio` / `Strudel Samples` by mode. Show `evalError` in the existing error slot. For `sampler` render `<SampleCatalog />` (Phase 2). Placeholder text for live mode: `note("c3 e3 g3 b3").midichan(1)`.

Note: **live evaluation uses the real engine in node — the local `src/lib/mini` parser remains only for the clip To/From feature.** Do not try to unify them in this pass.

### 1.3 Verification (device 1)

1. **Headless engine test (no Max needed)** — new `src/max/__tests__/engine.test.mjs` run by vitest (alias `@strudel/*` → submodule in `vitest.config.ts` the same way as esbuild):
   ```js
   import { bootScope, compile, queryWindow, hapToNote } from "../shared/engine.mjs";
   test("4 onsets/cycle, midichan carried", async () => {
     await bootScope();
     const pat = await compile('$: note("c3 e3 g3 b3").midichan(2)\n$: note("c1*2")');
     const haps = queryWindow(pat, 0, 1, 0.5);
     expect(haps.length).toBe(6);
     const notes = haps.map((h) => hapToNote(h, 0.5));
     expect(notes.filter((n) => n.chan === 2).length).toBe(4);
   });
   ```
2. `pnpm build` → three `.amxd` in `dist/alienmind-strudel-m4l/`.
3. In Live: drop the MIDI device on a MIDI track before an instrument. Max console must show `strudel engine ready`. Type `note("c3 e3 g3 b3")`, press Run, start Live's transport → instrument plays quarter notes locked to the bar. Change tempo → follows. Stop transport → notes flush.
4. Multi-line: `$: note("c4 e4 g4").midichan(1)` + `$: note("c2*4").midichan(2)`, add a second track with MIDI-from filtering channel 2 → both streams present and separable.
5. **Decision gates to verify early** (cheapest first): (a) node.script boots from the frozen bundle — else enable extraction path (0.6); (b) plugsync~ outlet indices (fix `PLUGSYNC_OUT` map); (c) if timing is sloppy, raise `lookaheadMs` and confirm `[pipe]` receives sensible delays via a `[print]`.

---

## Phase 2 — Device 3: Sample Fetcher (build second)

### 2.1 `src/max/sampler/main.mjs` (complete)

```js
import Max from "max-api";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const CACHE = path.join(os.homedir(), "Music", "StrudelSamples");

/** Pseudo-URL resolution, ported from strudel/packages/superdough/sampler.mjs:213-257
 *  (and webaudio/supradough.mjs:52-102). Keep in sync manually; it is tiny. */
function githubPath(base, subpath = "") {
  let [, p] = base.split("github:");
  p = p.endsWith("/") ? p.slice(0, -1) : p;
  if (p.split("/").length === 2) p += "/main";
  return `https://raw.githubusercontent.com/${p}/${subpath}`;
}
async function fetchSampleMap(url) {
  if (url.startsWith("github:")) url = githubPath(url, "strudel.json");
  if (url.startsWith("shabda:"))
    url = `https://shabda.ndre.gr/${url.split("shabda:")[1]}.json?strudel=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} loading ${url}`);
  const json = await res.json();
  const base = json._base || url.split("/").slice(0, -1).join("/") + "/";
  return [json, base];
}

/** Normalize a strudel.json map: { name: [urls] } — mirrors processSampleMap
 *  (superdough/sampler.mjs:180-196): values are arrays OR {note: url(s)} objects. */
function flattenMap(json, base) {
  const out = {};
  for (const [key, value] of Object.entries(json)) {
    if (key.startsWith("_")) continue;
    if (Array.isArray(value)) out[key] = value.map((u) => base + u);
    else if (typeof value === "string") out[key] = [base + value];
    else { // pitched: { "c3": "piano/c3.wav", ... }
      out[key] = Object.values(value).flat().map((u) => base + u);
      out[`${key}__pitched`] = true;
    }
  }
  return out;
}

let currentMap = {};   // name → [absolute urls]
let mapName = "";

Max.addHandler("load_map", async (pseudoUrl) => {
  try {
    const [json, base] = await fetchSampleMap(String(pseudoUrl));
    currentMap = flattenMap(json, base);
    mapName = String(pseudoUrl).replace(/[^a-z0-9-]+/gi, "_");
    const names = Object.keys(currentMap).filter((k) => !k.endsWith("__pitched"));
    // catalog as JSON-in-base64 (arbitrary chars safe through Max):
    const catalog = names.map((n) => ({ name: n, count: currentMap[n].length,
      pitched: !!currentMap[`${n}__pitched`] }));
    Max.outlet("catalog", Buffer.from(JSON.stringify(catalog)).toString("base64"));
  } catch (e) { Max.outlet("fetcherr", Buffer.from(e.message).toString("base64")); }
});

async function localPath(name, n) {
  const urls = currentMap[name];
  if (!urls?.length) throw new Error(`unknown sound ${name}`);
  const url = urls[n % urls.length];
  const ext = path.extname(new URL(url).pathname) || ".wav";
  const file = path.join(CACHE, mapName, name, `${n % urls.length}${ext}`);
  try { await access(file); return file; }        // cached
  catch { /* download */ }
  await mkdir(path.dirname(file), { recursive: true });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} for ${url}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

Max.addHandler("download", async (name, n = 0) => {
  try {
    const file = await localPath(String(name), Number(n));
    Max.outlet("downloaded", Buffer.from(file).toString("base64"));
  } catch (e) { Max.outlet("fetcherr", Buffer.from(e.message).toString("base64")); }
});

Max.addHandler("download_all", async (name) => {
  const urls = currentMap[String(name)] ?? [];
  for (let i = 0; i < urls.length; i++) {
    try { await localPath(String(name), i);
          Max.outlet("progress", String(name), i + 1, urls.length); }
    catch (e) { Max.outlet("fetcherr", Buffer.from(e.message).toString("base64")); }
  }
});

// ---- BPM-synced preview -------------------------------------------------
// Track transport via the same tick chain; on "preview", open in sfplay~ and
// start at the next beat boundary using a node-side timer (jitter acceptable
// for previewing).
let beatState = { beats: 0, bpm: 120, playing: false, at: Date.now() };
Max.addHandler("tick", (bar, beat, unit, tempo, playing) => {
  const beats = (bar - 1) * 4 + (beat - 1) + unit / 480;
  beatState = { beats, bpm: tempo, playing: playing >= 0.5, at: Date.now() };
});

Max.addHandler("preview", async (name, n = 0) => {
  try {
    const file = await localPath(String(name), Number(n));
    Max.outlet("preview_open", file);            // sfplay~ open <path>
    let delay = 30;                              // transport stopped: play now-ish
    if (beatState.playing) {
      const elapsed = (Date.now() - beatState.at) / 1000;
      const nowBeats = beatState.beats + elapsed * (beatState.bpm / 60);
      const nextBeat = Math.ceil(nowBeats);
      delay = ((nextBeat - nowBeats) * 60000) / beatState.bpm;
    }
    setTimeout(() => Max.outlet("preview_go"), Math.max(10, delay));
  } catch (e) { Max.outlet("fetcherr", Buffer.from(e.message).toString("base64")); }
});
Max.addHandler("preview_stop", () => Max.outlet("preview_stop"));

Max.addHandler("open_folder", async () => {
  await mkdir(CACHE, { recursive: true });
  const { exec } = await import("node:child_process");
  const cmd = process.platform === "win32" ? `explorer "${CACHE}"`
            : process.platform === "darwin" ? `open "${CACHE}"` : `xdg-open "${CACHE}"`;
  exec(cmd);
});

// Scale context from [js] observers (root 0-11, name string) — forwarded to UI by js
// directly; node only needs it if implementing transpose-on-download later.
Max.addHandler("scale", () => {});
for (const ignored of ["ui_ready", "code", "hush"]) Max.addHandler(ignored, () => {});
Max.post("strudel sampler ready");
Max.outlet("engine_ready");
```

### 2.2 UI: `src/components/SampleCatalog.tsx` (new)

Rendered when `useDeviceMode() === "sampler"`. State + protocol:
- Text input for map URL with preset dropdown: `github:tidalcycles/dirt-samples`, `github:felixroos/dough-samples`, `shabda:<query>` (free text). "Load" → `outlet("load_map", url)`.
- `bindInlet("catalog", b64)` → `JSON.parse(atob(b64))` → list rows: name, sample count, pitched badge; per row: ◀ ▶ variation stepper (n), **Preview** → `outlet("preview", name, n)`, **Get** → `outlet("download", name, n)`, **Get all** → `outlet("download_all", name)`.
- `bindInlet("downloaded", b64)` → show the local path + "Open Folder" button → `outlet("open_folder")`; `bindInlet("progress", ...)` → per-row progress bar; `bindInlet("fetcherr", b64)` → status line.
- Scale filter: `bindInlet("scale", (root, name) => ...)` (adapt parser from `m4l-chord-progression/src/hooks/useScaleFromLive.ts`); v1 just displays "Live scale: C Major" as a badge and, for `pitched` sounds, is informational. (Transpose-on-preview is a later enhancement.)

**Ableton integration scope (per feasibility review):** the deliverable is the **Places-folder workflow** — samples land in `~/Music/StrudelSamples`, user adds it to Live's browser once, drags samples natively. LOM-inject-into-Simpler and drag-out-of-jweb are ⚠-flagged prototypes, explicitly **out of scope** for this phase.

### 2.3 Verification (device 2)

1. Headless: `node -e` harness (or vitest with a `max-api` stub module aliased in) calling `load_map('github:tidalcycles/dirt-samples')` → expect catalog entries incl. `bd`, `sd`; `download('bd', 0)` → file exists under `~/Music/StrudelSamples/`, non-zero size, plays in a media player.
2. In Live: load map, preview `bd` with transport running → onset lands on the next beat (audible check against a metronome); Get → Open Folder shows the file; drag into a Simpler manually.

---

## Phase 3 — Device 2: Audio Instrument (build last, exploratory)

**Scope v1 (deliberately narrow):** synth subset only — haps with `s` ∈ {`sine`,`sawtooth`,`square`,`triangle`} (superdough's basic waveforms), params `note`, `gain`, `cutoff`, `attack`, `release`. Samples via `polybuffer~` are v2. This is the honest counterpart of `strudel/packages/superdough/synth.mjs` at minimum viable size.

### 3.1 `src/max/audio/main.mjs` (complete)

```js
import Max from "max-api";
import { bootScope, compile, queryWindow, hapToNote } from "../shared/engine.mjs";
import { LiveTransport } from "../shared/transport.mjs";

let pattern = null, running = false;
const WAVES = new Set(["sine", "sawtooth", "square", "triangle"]);

const transport = new LiveTransport({
  lookaheadMs: 150,
  onWindow(from, to, cps, bpm, nowBeats) {
    if (!pattern || !running) return;
    for (const hap of queryWindow(pattern, from, to, cps)) {
      const n = hapToNote(hap, cps);
      if (!n) continue;
      const v = n.value;
      const wave = WAVES.has(v.s) ? v.s : "sawtooth";
      const delay = Math.round(transport.delayMs(n.beginCycle, nowBeats, bpm));
      // "voice <note> <vel01> <durMs> <wave> <cutoff> <gain> <delayMs>"
      Max.outlet("voice", n.pitch, (v.velocity ?? v.gain ?? 0.75),
        Math.round(n.durMs), wave, v.cutoff ?? 8000, v.gain ?? 0.8, delay);
    }
  },
  onStop() { Max.outlet("allnotesoff"); },
});

Max.addHandler("tick", (...a) => transport.tick(...a));
Max.addHandler("code", async (b64) => {
  try {
    pattern = await compile(Buffer.from(String(b64), "base64").toString("utf8"));
    running = true; Max.outlet("evalok");
  } catch (e) { Max.outlet("evalerr", Buffer.from(String(e.message)).toString("base64")); }
});
Max.addHandler("hush", () => { running = false; Max.outlet("allnotesoff"); });
for (const ig of ["ui_ready"]) Max.addHandler(ig, () => {});
await bootScope();
Max.outlet("engine_ready");
```

### 3.2 `ableton-amxd/voice.maxpat` (hand-author ONCE in Max, then commit)

This is the one artifact worth 15 minutes inside the Max editor rather than generating blind: a `poly~` voice receiving `note <midinote> <vel01> <durMs> <wave-symbol> <cutoff> <gain>`:

```
[in 1] → [unpack 0 0. 0 s 0. 0.]
  midinote → [mtof] → freq to all four oscillators: [cycle~] [saw~] [rect~] [tri~]
  wave symbol → [sel sine sawtooth square triangle] → [selector~ 4] input choice
  cutoff → [lores~] cutoff inlet   (post-selector)
  vel*gain → [*~ ] level
  durMs → envelope: [t b f] → attack via [line~] "0, 1 5" then "0 <release>" after durMs
          (use [function]-free minimal env: message [1. 5 0. $1] with $1=durMs → line~)
  → [out~ 1] [out~ 2]
  [thispoly~]: bang "mute 0/busy" on note start; after env done → "mute 1" + note-off busy release
```

Keep it small; verify voices steal correctly with `@steal 1`. (If hand-authoring is impossible in the executing environment, generate a minimal JSON skeleton from the box/line factory in `generate-patchers.mjs` — but flag it for in-Max verification; `.maxpat` JSON for signal objects is finicky.)

### 3.3 Patcher wiring

Already emitted by `generate-patchers.mjs` (Phase 0.5, `kind === "audio"`): `route voice` → 7-slot `pipe` (delay = last inlet) → `pak` → `prepend note` → `poly~ strudel-voice.maxpat 16 @steal 1` → `plugout~`. Add `[route allnotesoff]` → message `target 0, mute 1` if hung voices are observed (implementation detail; start without).

### 3.4 Verification (device 3)

1. Engine reuse means only the output path is new: unit-test `hapToNote(...).value.s` passthrough with `s("sawtooth").note("c3 e3")`.
2. In Live: instrument track, `note("c3 e3 g3 b3").s("sawtooth").cutoff(1200)`, Run + transport → hear synced saw arpeggio; `stack(...)` with two waves; hush stops sound.

---

## Execution order & pitfalls summary (for the implementing LLM)

| Step | Deliverable | Gate before continuing |
|---|---|---|
| 0.1-0.3 | esbuild bundles compile | `node dist/node/strudel-node-midi.cjs` errors ONLY with "Cannot find module 'max-api'" (= bundle OK) |
| 0.7-0.8 + 1.3.1 | engine unit tests green | vitest passes |
| 0.4-0.5, 0.9 | 3 `.amxd` files build | files open in Live without "corrupt" errors |
| 0.6 | wrapper mode + extraction | Max console shows mode + node banner |
| 1.x | MIDI device works E2E | checklist 1.3.3-4 |
| 2.x | Sampler works E2E | checklist 2.3 |
| 3.x | Audio v1 works E2E | checklist 3.4 |

**Known-unknowns to verify in Max (do not trust blindly):** `PLUGSYNC_OUT` outlet indices; node.script frozen-file resolution (fallback: extraction path 0.6); `pipe` list-spread across inlets incl. delay inlet (fallback: send delay to right inlet via `[t]` first); whether `midiin→midiout` thru causes double notes in the MIDI device (then remove the thru line in `generate-patchers.mjs`).

**Do not:** touch `src/lib/mini/*` (still powers clip To/From); pass raw code text through Max messages (always base64); import `@strudel/webaudio`/`superdough` into node bundles (browser-only: `AudioContext`); use ES6+ syntax in `strudel-wrapper.js` (`[js]` is ES5).
