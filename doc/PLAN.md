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
| 1. Native UI | `surface.ts` declares which parameters render as NATIVE Max dials | **DELIVERED (0.7.0), verified in Live.** Landed as a two-screen panel (web UI ⇄ native knobs), not the side-by-side shape first imagined - see Part 1 below and ARCHITECTURE.md. | Done. |
| 2. Dynamic chains | A Strudel fx line populates REAL Ableton devices in the user's rack via the LOM, with signal-rate modulation | **Spike-gated.** Reconciliation and modulation are documented and sound; device INSERTION rests on a LOM surface that may not exist for M4L at all. | Spike R1 first. |
| 3. The m4l-strudel Rack | ONE thing in the user library: a rack preset with every required device pre-added, each with its proper type, sharing one codebase | **Feasible.** The earlier "one super-device with a mode toggle" shape is impossible (device types are build-time); the rack is the shape that works. | Instrument slot gated on Phase 8 + instance-scoped buffers. |

---

## Part 1: Native UI  <- DELIVERED (0.7.0), verified in Live

`surface.ts` declares which parameters render as NATIVE `live.*` objects; the compiler
lays them out and the app controls them. What landed differs from the side-by-side shape
first sketched here, because of one thing measured in Live:

- **A frozen M4L device can hide/show native objects at runtime (`obj.hidden`) but
  CANNOT reposition or resize them (`presentation_rect` is stored, never redrawn).** So
  the fx device is not a narrow web view beside always-visible dials; it is TWO SCREENS -
  the web UI (the Strudel line, full width) OR a native knob panel (all dials, `[jweb]`
  hidden), flipped by a "Back" button. Only hide/show is used.

The declaration (`layout.native` with `panel`/`switch`), the `button` kind, the codegen
and the `useNativePanel` flip live in `m4l-jweb`; the fx adoption is `src/app/fx/`. **The
full design and the Live findings are in ARCHITECTURE.md** (this repo's fx section and
`m4l-jweb`'s native-layout section). What is left for the library - Push banks, the
`state()` default seed - is in the two TODO.md files.

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

1. ~~**Part 1** (native layout)~~ - **DONE (0.7.0), verified in Live**, as the
   two-screen fx panel. See Part 1 above and ARCHITECTURE.md.
2. **Spike R1** (browser/load_item) - one afternoon, decides Part 2's shape. The
   spike spec lives in m4l-jweb's TODO item 1.
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

- ~~`layout.native` codegen (Part 1)~~ - **shipped**.
- item 1 / Spike R1: instantiation (Part 2).
- item 2: the `remote` chain (Parts 2 and 3).
- item 5: installers copy `presets/` (Part 3's .adg delivery).
- row 11: instance-scoped buffer names (Part 3's instrument slot).
- item 3: the state-default seeding bug (Parts 2 and 3).
