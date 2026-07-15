# PLAN: the master plan for the next generation of m4l-strudel

The strategic roadmap across BOTH repos, written against the actual source of each
(checked 2026-07-15): `m4l-jweb` (`packages/surface`, `packages/build`,
`packages/bridge`, `packages/wrapper`) and `m4l-strudel` (`src/app/*`, `src/lib/*`,
`patcher/devices.mjs`, `scripts/build-ui.mjs`).

How this file relates to the others: this is WHERE WE ARE GOING. The day-to-day
backlog stays in [TODO.md](TODO.md) (devices) and
[m4l-jweb's TODO.md](../../m4l-jweb/doc/TODO.md) (the library), both of which are
sequenced against this plan. What is decided and shipped ends up in the
ARCHITECTURE.md of the repo that owns it.

The plan has three parts, in dependency order:

| Part | What | Verdict | Gate |
|---|---|---|---|
| 1. Build-time native UI | `surface.ts` declares which parameters render as NATIVE Max dials; the compiler lays them out next to a narrower `[jweb]` | **Feasible now.** Small, low-risk compiler change. | None. |
| 2. Dynamic chains | A Strudel fx line populates REAL Ableton devices in the user's rack via the LOM, with signal-rate modulation | **Spike-gated.** Reconciliation and modulation are documented and sound; device INSERTION rests on a LOM surface that may not exist for M4L at all. | Spike R1 first. |
| 3. The m4l-strudel Rack | ONE thing in the user library: a rack preset with every required device pre-added, each with its proper type, sharing one codebase | **Feasible.** The earlier "one super-device with a mode toggle" shape is impossible (device types are build-time); the rack is the shape that works. | Instrument slot gated on Phase 8 + instance-scoped buffers. |

---

## Part 1: Build-time declarative native UI

### The idea

`surface.ts` already declares every Live parameter once, and the compiler already
generates the `live.dial` objects and their wiring in both directions. Today those
dials are invisible and React redraws every control in HTML. The idea: let the
declaration also say WHICH parameters should be visible as native Max objects, and
have the compiler lay them out in the device view, side by side with a `[jweb]`
shifted right. React is freed from rendering those controls; `useParam()` remains
available when app logic wants the value.

### Why it is cheap

The generated dials are invisible today only because they carry no `presentation`
attribute - Live shows the presentation view, and only boxes with `presentation: 1`
appear in it. So the whole feature is a presentation OVERLAY on codegen that already
exists: two extra keys per box, plus a shift of `obj-jweb`'s `presentation_rect`.
**No wiring changes at all** - the fan-out contract (`paramObject` / `paramValue`),
the `set_<id>` route and `useParam()` are untouched. A native dial is the same
parameter with the same graph, now visible.

Two facts that shape the API:

- There is no `patcher.mjs`; the `[jweb]` box comes from
  `packages/build/templates/base.json` (id `obj-jweb`,
  `presentation_rect: [0, 0, 420, 169]`) and is mutated from `applySurface()`,
  which already receives `jwebId`.
- **A single vertical column does not fit.** The device view is a fixed ~169 px
  tall; a `live.dial` is 44x48 at a 56 px pitch, so only 3 fit vertically and the
  fx device declares 7 parameters. The primitive is therefore a GRID that fills
  rows top-to-bottom and overflows into new columns - column-major, so the reading
  order stays stable when a parameter is added.

### 1a. `m4l-jweb/packages/surface/src/index.ts` - extend the declaration

```ts
/** Which parameters render as NATIVE Max objects in the device view. */
export interface NativeLayout<K extends string = string> {
  /** In display order: fills rows top-to-bottom, then the next column. */
  params: readonly K[];
  /** Max rows per column. Default 3 (what 169 px holds at 56 px pitch). */
  rows?: number;
}

export interface SurfaceDef<P, S, W> {
  params: P;
  banks?: readonly Bank<Extract<keyof P, string>>[];
  windows?: W;
  state?: S;
  layout?: { native?: NativeLayout<Extract<keyof P, string>> };
}
```

Validation in `defineSurface()`, next to the existing bank checks (throwing fails
`pnpm build`, which is the enforcement everything else here uses):

```ts
for (const id of def.layout?.native?.params ?? []) {
  if (!def.params[id]) throw new Error(`surface: layout.native names "${id}", which is not a declared parameter`);
}
const rows = def.layout?.native?.rows ?? 3;
if (rows < 1 || rows > 3) throw new Error(`surface: layout.native.rows must be 1..3 - the device view is 169 px tall`);
```

Also export a tiny predicate for app code (optional but it keeps App.tsx honest):

```ts
export const isNative = (surface: Surface, id: string): boolean =>
  !!surface.layout?.native?.params.includes(id as never);
```

`defineSurface()` returns `{ ...def, ids }` already, so `layout` survives into the
compiled surface and into `loadSurface()` with no further plumbing.

### 1b. `m4l-jweb/packages/build/src/surface.mjs` - the layout math and the jweb shift

Constants and slot computation (pure function, unit-testable):

```js
// The device view Live gives an M4L device. Height is fixed; width is whatever
// the presentation content needs.
const DEVICE_H = 169;
const MARGIN = 8;
// Per-kind native sizes, from Max's own defaults (live.dial includes its label).
const NATIVE_SIZE = { dial: [44, 48], toggle: [44, 15], menu: [100, 15] };
const PITCH_Y = 56;

/** id -> presentation_rect for every native param, plus the zone's total width. */
export function computeNativeSlots(surface) {
  const native = surface.layout?.native;
  if (!native || native.params.length === 0) return { slots: new Map(), width: 0 };
  const rows = native.rows ?? 3;
  const slots = new Map();
  let col = 0, row = 0, colW = 0, x = MARGIN;
  for (const id of native.params) {
    const [w, h] = NATIVE_SIZE[surface.params[id].kind];
    if (row >= rows) { row = 0; col += 1; x += colW + MARGIN; colW = 0; }
    slots.set(id, [x, MARGIN + row * PITCH_Y, w, h]);
    colW = Math.max(colW, w);
    row += 1;
  }
  return { slots, width: x + colW + MARGIN };
}
```

In `applySurface()`, the dial loop gains three keys and nothing else changes:

```js
const { slots, width: nativeW } = computeNativeSlots(surface);
for (const id of surface.ids) {
  const spec = surface.params[id];
  const rect = slots.get(id);
  boxes.push({
    box: {
      id: paramObject(id),
      maxclass: MAXCLASS[spec.kind],
      // ... existing keys unchanged ...
      patching_rect: rect ?? [x, 300, 44, 48],
      ...(rect ? { presentation: 1, presentation_rect: rect, varname: `param-${id}` } : {}),
      saved_attribute_attributes: { valueof: parameterAttrs(id, spec) },
    },
  });
  // read/write wiring: UNCHANGED. A native dial is the same parameter with the
  // same fan-out; the app may still read it with useParam() or write it.
}

// Shift [jweb] right to make room. Width is preserved: the device gets wider,
// the web view does not get narrower (React layouts were built for 420 px).
if (nativeW > 0) {
  const jweb = boxes.find((b) => b.box.id === ctx.jwebId).box;
  const [, py, pw, ph] = jweb.presentation_rect ?? [0, 0, 420, DEVICE_H];
  jweb.presentation_rect = [nativeW, py, pw, ph];
}
```

Notes for the implementer:

- `varname` must not collide with the state dicts' varnames (`obj-state-<id>`);
  the `param-` prefix above avoids it.
- Do NOT touch the patching_rect fan-out or `claimAppMessages` ordering. The whole
  point is that presentation is a display overlay on the same graph.
- `live.dial` renders its `parameter_shortname` as the label; no separate comment
  boxes are needed.

### 1c. Tests (`m4l-jweb/packages/build/tests/`)

Extend the existing surface codegen test with one fixture surface carrying
`layout.native`:

- every listed param's box has `presentation: 1` and a rect inside
  `[0, 0, zoneWidth, 169]`;
- no two presentation rects overlap;
- params NOT listed have no `presentation` key;
- `obj-jweb`'s presentation x equals the zone width, and its width is unchanged;
- a surface with no `layout` produces byte-identical output to today (regression
  guard: this feature must be invisible until asked for).

### 1d. `m4l-strudel` adoption (the fx device)

1. `src/app/fx/surface.ts`: add

   ```ts
   layout: { native: { params: ["cutoff", "drive", "delay", "delaytime", "delayfeedback", "room", "gain"], rows: 3 } },
   ```

   Seven params at 3 rows = 3 columns of dials, roughly 160 px of native zone.
2. `src/app/fx/App.tsx`: delete the per-stage slider rendering (the `shown` /
   `AddEffectPanel` machinery can stay or go - see the judgment call below). The
   text line, the draft/commit model and `useStateSync(surface, "named")` stay
   exactly as they are: the parameters remain the truth and the line remains a view
   of them, now alongside native dials instead of HTML ones.
3. Judgment call to make at implementation time: with all seven dials permanently
   visible natively, the `named` state slot loses its display role (it existed to
   decide which HTML sliders to show) but KEEPS its round-trip role (which stages
   the line prints). Keep the slot; delete only the slider UI.
4. Version note: this is a minor-version framework feature. Bump `@m4l-jweb/*` in
   `m4l-strudel/package.json` when it ships (currently `^0.6.5`).

### Risks, honestly stated

- **Rigid layout**: true. All native stages are always visible. For fx this is
  arguably a feature (the rack is frozen anyway).
- **OS scaling**: not a real risk. Max patcher coordinates are logical points; Live
  scales the whole device view uniformly.
- **The one real unknown**: whether Live recomputes device width from presentation
  content on an .amxd built with a wider rect (it should - the template's own rect
  is what sets today's width). Verify in Live with a 2-param hello device before
  building the whole grid; that is a 30-minute check.

---

## Part 2: Dynamic chains (populating native racks via the LOM)

### The idea

Write no DSP at all for the effects Live already has a device for. A control device
sits in the user's Audio Effect Rack; when the user writes `.lpf(800).gain(1.2)`,
a reconciler (a virtual DOM for devices) instantiates Ableton's own Auto Filter and
Utility next to itself via the Live Object Model, orders them as written, maps the
values, and modulates continuously-patterned parameters at signal rate with
`live.remote~`. The user gets Ableton's DSP, presets, undo and third-party plugins
instead of our ports.

### Feasibility: the load-bearing claim is UNVERIFIED and may be false

The idea stands on `live_app browser` + `load_item` being callable from a Max
`LiveAPI` object. The documented M4L LOM (Live 11/12) exposes `Application` with
`view` and a handful of functions; the Browser (`Live.Browser`, `load_item`,
`audio_effects`, hotswap targets) is documented for CONTROL SURFACE Python scripts.
Whether any of it is reachable through `new LiveAPI("live_app browser")` from `[js]`
is exactly the undocumented seam. **Spike R1 - specified in m4l-jweb's TODO.md,
item 2B - must run before any reconciler code.** It is an afternoon and it is
falsifiable.

What IS documented and safe to build on, checked against the LOM reference:

- `this_device canonical_parent` - a `Chain` when the device sits in a rack; the
  path shape tells you the context (contains `chains N`). Context detection is real.
- `Chain.delete_device(index)` and `Track.delete_device(index)` - removal is real.
- `Song.move_device(device, target, position)` (Live 11+) - reordering is real.
- `live.remote~` - ships inside Live (`resources/externals/m4l/`), controls any
  Live parameter by id at signal rate without writing automation. The modulation
  half is real and independently valuable.

So: everything EXCEPT instantiation is documented. Instantiation is the spike.

**If the spike fails**, the fallback keeps most of the value: the device does not
CREATE devices, it ADOPTS them - the user drops an Auto Filter into the rack once,
and the reconciler binds `.lpf()` to it (parameter mapping plus `remote`
modulation, both documented). Diff feedback in the UI: "add an Auto Filter to this
rack to enable .lpf()".

### Design constraints learned from the code

1. **No second `[js]`.** The architecture has exactly one `[js]` (the wrapper) and
   a message-stream claiming discipline built around it. The reconciler is a
   `wrapper/device.ts` extension (TypeScript, compiled to ES5 into the same
   wrapper.js, hooked at `onDeviceReady()`), which is the documented extension seam.
2. **LOM ids are not stable across set reloads**, so a `state()` slot holding raw
   ids as "the devices we own" corrupts on reopen. Persist `{ name, position }`
   pairs and re-identify on `bang()` by walking the chain's devices; treat a
   mismatch as "not ours".
3. **The state-default bug bites here.** `applyPersistence()` seeds the `[dict]`
   with nothing, so a fresh instance's slot arrives as `{}` and overwrites the
   declared default (open bug in m4l-jweb's TODO, scheduled to ride the Part 1
   release). "Empty means own nothing" happens to be the correct semantic for the
   reconciler; do not rely on that accident for any other slot.
4. **The AST does not need a new transport.** The fx line is already parsed
   app-side (`src/lib/fx.ts`, the Proxy recorder); the reconciler needs the ordered
   effect list, which is `FxResult.used` plus values. Send it base64-encoded (Max
   splits on commas) as one selector.

### 2a. Protocol (`m4l-strudel/src/app/shared/protocol.ts` + fx protocol)

```
UI  -> wrapper: sync_rack <base64 {stages:[{call,param,value}...]}>   (on commit)
wrapper -> UI:  rack_state <base64 {owned:[...], missing:[...], error?}> (after reconcile)
```

### 2b. `m4l-strudel/wrapper/device.ts` - the reconciler

ES5 rules apply: write modern TS, but no Promises, no Map, and remember `[js]` host
functions do not take `.apply`.

```ts
// Strudel call -> Live browser item name. The dictionary is data, not code.
var DEVICE_MAP: Record<string, { item: string; param: string }> = {
  lpf:  { item: "Auto Filter", param: "Frequency" },
  hpf:  { item: "Auto Filter", param: "Frequency" },
  gain: { item: "Utility",     param: "Gain" },
  room: { item: "Reverb",      param: "Dry/Wet" },
  crush:{ item: "Redux",       param: "Bit Depth" },
};

function rackChain(): LiveAPI | null {
  var parent = new LiveAPI("this_device canonical_parent");
  // Inside a rack the path reads ".. chains N"; on a plain track it is a Track.
  return parent.unquotedpath.indexOf(" chains ") >= 0 ? parent : null;
}

function sync_rack(b64: string): void {
  var chain = rackChain();
  if (!chain) { replyRack({ error: "not in a rack" }); return; }
  var want = JSON.parse(decodeB64(b64)).stages; // [{call, value}...]
  var owned = readOwned();                      // from the state dict, {name, position}[]
  // Diff: walk want vs owned in order. create via browser load_item (Spike R1
  // settles the steering), delete via chain.call("delete_device", i) ONLY for
  // entries re-identified as ours, reorder via live_set move_device.
  // Then set parameters: find device.parameters by name, api.set("value", v).
  // Persist the new owned list back to the state dict and replyRack(...).
}
```

The diff rules, stated once so every implementation matches:

- Only ever delete or move a device that re-identifies as owned (name AND recorded
  position match). Anything else in the chain is the user's; skip over it.
- Idempotent: running `sync_rack` twice with the same input is a no-op.
- Values are set through the LOM `DeviceParameter.value` in the parameter's real
  range - the map above must carry per-param value transforms (read `min`/`max` off
  the parameter and interpolate, never hardcode).

### 2c. Modulation - the `remote` chain (`m4l-jweb`, its TODO item 3)

`.lpf(sine.range(200, 2000))` is a signal, not 20 Hz of parameter writes. A
`remote` chain in `packages/build/src/chains.mjs`, one `live.remote~` per declared
slot (`remotes: <n>` in the manifest):

```
[jweb] -> route remote_bind remote_val        (claimed in series, claimAppMessages)
  remote_bind <slot> <lomId>  -> [prepend id] -> [live.remote~]   (bind by LOM id)
  remote_val  <slot> <v>      -> [line~ 20]   -> live.remote~ left inlet
```

The app streams values on the transport tick with a ~20 ms `[line~]` ramp smoothing
between them - signal-rate at the Max end even though the bridge is control-rate,
which removes the audible stepping and keeps automation lanes clean (`live.remote~`
suppresses automation writing by design). The wrapper resolves the target
parameter's LOM id and sends the bind.

**This chain is useful with or without instantiation**: it can modulate ANY Live
parameter, including ones on devices the user placed by hand - a bigger feature
than an LFO on our own filter. It unblocks Phase 7.2 on its own.

### What stays true from the original idea

Per-hap topology change is impossible (device insertion mid-note is not a thing);
topology is per-commit, values are per-hap via `remote`. The two-way reconciliation
complexity is real; the "only touch what you own" rule above is the whole defense.

---

## Part 3: The m4l-strudel Rack

### The idea, reframed

The original wish was a single "super-device": one thing to drag from the library,
covering sequencing, sound and effects, with a mode toggle. That exact shape is
impossible: a device's container type (`mmmm` MIDI effect / `aaaa` audio effect /
instrument) is stamped into the .amxd at build time (`composePatcher()` /
`AMXD_TYPES`) and Live enforces placement by type. A MIDI effect can never process
track audio; an audio effect has no MIDI out. No runtime toggle crosses that line.

**What we deliver instead is a RACK**: an Ableton Instrument Rack preset with all
required individual devices PRE-ADDED, each one with its proper type, wired in
series the way Live already composes device types:

```
  [ m4l-strudel Rack (.adg) ]
    1. Strudel Sequencer   (MIDI effect)   the pattern engine, notes out,
                                           the Full Studio window
    2. Strudel Instrument  (instrument)    the sound - see the gate below;
                                           until it exists, a native Ableton
                                           instrument (Drum Rack / Simpler)
                                           sits in this slot
    3. Strudel FX          (audio effect)  the fx line; Translate mode when
                                           Spike R1 passes
```

The rack IS the super-device, and it is better than the toggle would have been:

- **Single library entry.** The user drags one .adg. That was the whole point.
- **Hand-composable.** Every device also works standalone; the user can remove the
  fx device, swap the instrument for Operator, or add their own effects between
  ours. A monolith could never allow that.
- **Right types by construction.** Each device satisfies Live's placement rules
  instead of fighting them; the Translate toggle no longer needs to exist as a
  mode switch between impossibilities - it is just a feature of the FX device.
- **Rack macros for free.** The 16 macro knobs can be mapped to the most useful
  parameters across all three devices at preset-save time, no code.

### One codebase underneath

The devices share one React application (`src/app/unified/`), shipped into multiple
containers via the manifest's existing `ui:` sharing; the wrapper already tells the
page its `mode` (jsarguments), so one bundle adapts with no per-device build
branches.

```
m4l-strudel/
  patcher/devices.mjs           entries per container sharing ui: "unified".
                                KEEP THE SHIPPED DEVICE NAMES - renaming an
                                installed device breaks user sets AND the preset.
  presets/
    m4l-strudel Rack.adg        hand-saved in Live, committed. See below.
  src/app/unified/
    surface.ts                  transportParams + fx params + state { code, named }
                                + windows { studio: window({ title: "Strudel
                                Studio", width: 1200, height: 800,
                                entry: "StudioWindow" }) }
    App.tsx                     reads `mode`: sequencing UI (midi mode) or the fx
                                line (audio mode). Translate toggle rendered only
                                when mode is audio AND the wrapper reported
                                in_rack (a one-line probe at ui_ready).
    StudioWindow.tsx            editor-only; useStateSync(surface, "code"); no
                                engine (see the window rule below).
  wrapper/device.ts             the in_rack probe; the Part 2 reconciler.
```

Migration note: merging the midi and fx surfaces means every parameter of both
lives on every container. That is fine for Live (unused params sit at default) but
mind the Push bank budget (8 per bank) and keep the banks per-mode.

### Delivery mechanics for the .adg

- The `.adg` format is undocumented (gzipped XML). **Hand-compose the rack in Live
  once, save it as a rack preset, commit it under `presets/`.** Build-time
  generation is explicitly out of scope; if it is ever wanted it is its own spike.
- The preset references its .amxd devices by User Library path - which is exactly
  where the installers already put the devices. The framework ask (m4l-jweb TODO
  item 8, small): `packageDevices()` copies `presets/*.adg` into the dist folder
  and zip, and the install scripts copy them into the User Library in the same
  step as the devices, so the two cannot skew.
- Re-save the preset whenever a device's parameter surface changes shape; never
  rename shipped devices.

### The instrument slot: name the gate honestly

Two prerequisites, both already tracked:

1. **Strudel-native sound** (m4l-strudel Phase 8): the standing decision is Route B
   first - `OfflineAudioContext` renders cycle N+1 of the deterministic pattern
   with the real superdough (bit-identical sound), a new `saveToFile()` wrapper
   primitive writes the WAV, `[buffer~]` + `[play~]` locked to `current_song_time`
   plays it double-buffered. Cost: one cycle of edit latency; random or stateful
   patterns must fall back with a visible notice. Route A (superdough's common
   voices as `[poly~]` patches over the `instrument` chain) is the long-term
   product.
2. **Instance-scoped buffer names** (m4l-jweb TODO item 1): buffer names are global
   to Max and fixed at build time, so two instances corrupt each other's samples.
   The Rack makes multi-instance the NORMAL case; this must land first.

Until both land, the rack ships with a native Ableton instrument in the slot -
honest, useful today, and the user can already swap it.

### The Full Studio window: feasible today, one rule

The windows infrastructure is shipped and verified in Live (the drum-rack editor
uses all of it). The rule that settles the design: **a window is an editor, not an
engine.** A window's `[jweb]` is a separate Chromium context that receives NO
transport ticks - `tick`/`tempo` go to outlet 0, the device view - and audio from a
window cannot reach the track anyway (`[jweb]` has no signal outlets; measured).

So:

- The ENGINE (the worker, the scheduler, the note stream) stays in the DEVICE view,
  which already receives `tick` at 20 Hz and already enforces Live's transport and
  scale (`useStrudelEngine`, `NoteContext`).
- The WINDOW binds the code through a shared `state()` slot (`useStateSync`),
  exactly like the drum map. A commit in the window broadcasts to the device view,
  which re-evaluates. Global quantization is therefore enforced for free, because
  the only thing that ever schedules notes is the device-view engine that is
  already quantized.
- Do not intercept or replace the window's AudioContext; the window must not make
  sound at all.

### Cross-device coordination: scoped honestly

In v1 the rack's devices are independent: the pattern is typed in the Sequencer,
the fx line in the FX device. A single expression spanning both
(`note("c3 e3").lpf(800)` split automatically across the rack) needs a cross-device
channel - Max `[send]`/`[receive]` are global and collide across tracks; LOM
observation of a sibling device is plausible but unproven. That is a real
enhancement, listed as open, and NOT part of the rack's v1. Do not let it block the
preset.

---

## Recommended order of work

Dependencies, not preferences:

1. **Part 1** (native layout) - self-contained, no spikes, immediately pays down
   fx App complexity. Framework change + fx adoption in one release train, with
   the state-default seeding fix riding along.
2. **Spike R1** (browser/load_item) - one afternoon, decides Part 2's shape. The
   spike spec lives in m4l-jweb's TODO item 2B.
3. **The `remote` chain** (modulation) - documented, valuable regardless of R1's
   outcome, and it unblocks Phase 7.2.
4. **Part 2 reconciler** - only if R1 passes; else the "adopt, don't create"
   fallback.
5. **Part 3** - the unified app merge and the Studio window need none of the above
   and can start any time; the Translate toggle lands with step 4; the rack preset
   is assembled and committed as soon as the containers exist (with a native
   instrument in slot 2); the Strudel instrument replaces it after Phase 8 Route B
   plus instance-scoped buffers.

Upstream items this plan depends on (all filed in m4l-jweb's TODO):

- item 7: `layout.native` codegen (Part 1) - NEXT UP there.
- item 2B / Spike R1: instantiation (Part 2).
- item 3: the `remote` chain (Parts 2 and 3).
- item 8: installers copy `presets/` (Part 3's .adg delivery).
- item 1: instance-scoped buffer names (Part 3's instrument slot).
- the state-default seeding bug (Parts 2 and 3).
