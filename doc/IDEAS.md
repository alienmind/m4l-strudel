# IDEAS: Build-Time Declarative UI for the Native Side

This document explores a fundamental pivot for the `m4l-jweb` framework: extending its declarative power to construct both sides of the UI fence natively at build time, rather than relying on React to proxy or orchestrate native components.

## The Core Concept

Currently, `m4l-jweb` uses the `Surface` contract (`surface.ts`) purely as a **data contract**. It declares parameters so the compiler can generate hidden `live.dial` objects, which act merely as "glue" between the DSP, Live's automation/Push, and the React web view. React takes on the full burden of recreating the visible UI (HTML knobs, sliders) and syncing state with those hidden Max objects.

**The Idea:** We extend the declarative power of the `Surface` contract to dictate **presentation**, not just data. We explicitly declare which components should be visibly rendered natively in Max, and the compiler physically lays them out in the patcher.

This creates a strict, side-by-side division of labor:
- **The Native Zone (Left):** Max `live.*` objects, laid out directly by the `m4l-jweb` build step based on `surface.ts`.
- **The Web Zone (Right):** The `[jweb]` Chromium view, running React.

If a knob is declared native, **React is freed from the burden of rendering it**. There are no proxy components, no layout syncing, and no dynamic coordinate messages over the bridge. However, the underlying bridge connection remains intact: React can still optionally "listen" to the native knob's state (e.g., via `useParam`) if it needs that value for some other component or logic. The key difference is that subscribing to the parameter is now an explicit choice for logic, rather than an implicit requirement just to draw the UI.

---

## How It Works Technically (The Build Step)

This shifts the UI layout problem from runtime orchestration to **build-time compilation**.

1. **The Expanded Surface Contract:** `surface.ts` is updated to include layout instructions for the native side. 
   ```ts
   export default defineSurface({
     parameters: {
       cutoff: { type: "float", min: 40, max: 18000 },
       drive: { type: "float", min: 1, max: 10 }
     },
     layout: {
       // Instruct the compiler to physically place these on the left side
       nativeColumn: ["cutoff", "drive"]
     }
   });
   ```

2. **Patcher Generation:** During `pnpm build`, the `@m4l-jweb/build` compiler reads this layout block. 
   - Instead of placing the generated `live.dial` objects out of bounds and hidden, it assigns them a `presentation_rect`.
   - It spaces them out mathematically into a vertical or horizontal column.
   - It includes them in the patcher's Presentation view.

3. **The Split Window:** The compiler also adjusts the `presentation_rect` of the `[jweb]` object itself. If a native column is declared, `[jweb]` is sized down (e.g., leaving the first 100 pixels for the native controls) and shifted to the right, sitting side-by-side with the native knobs.

---

## What Needs to Be Done in `m4l-jweb` (The Framework)

To achieve this, the `m4l-jweb` compiler becomes a rudimentary layout engine for Max.

### 1. The Surface Definition (`@m4l-jweb/surface`)
- Extend the `defineSurface()` schema to accept a `layout` object. 
- Provide simple primitives like `nativeColumn`, `nativeRow`, or `nativeGrid` that accept arrays of parameter IDs.

### 2. The Surface Compiler (`packages/build/src/surface.mjs`)
- When generating the JSON for the Max patcher, the compiler must parse the `layout` object.
- **Math/Coordinates:** It calculates the absolute `x` and `y` positions for each `live.*` object listed in the layout block, applying standard Ableton margins and padding.
- **Presentation Mode:** It injects `"varname"` and `"presentation": 1` into the box definitions, along with the computed `"presentation_rect": [x, y, w, h]`.
- **Jweb Resizing:** It calculates the remaining device width and updates the base `[jweb]` patcher box to fit the right-hand side.

### 3. The React Library (`@m4l-jweb/surface/react`)
- **No Changes Required:** React doesn't need to change. If a React component wants to read the `cutoff` parameter using `useParam('cutoff')` (e.g., to draw a visual spectrum analyzer), it still can. But it is no longer *obligated* to render the knob itself.

---

## What Needs to Be Done in `m4l-strudel` (The Consumer)

The devices in `m4l-strudel` can leverage this to drastically simplify their React codebases.

### Example: The Audio FX Device (`src/app/fx/`)
Currently, the `fx` device has a complex React app that manually mimics native dials, observes the Strudel code (`.lpf(800)`), and conditionally renders HTML sliders.

With the new framework feature:
1. **Declare Native Layout:** We update `src/app/fx/surface.ts` to explicitly declare `cutoff`, `drive`, `delay`, `room`, and `gain` in the `nativeColumn` layout.
2. **Simplify React:** We delete the HTML dial components. The `App.tsx` file is reduced to nothing but the text input editor for the Strudel effects line. 
3. **The Result:** When you load the FX device, you see a row of native Ableton knobs on the left (always visible, because the DSP graph is frozen anyway), and a Strudel code editor on the right. 

---

## Pros, Cons & Risks Assessment

### Pros
- **True Ableton Native:** Native components look perfect, obey Live's color themes, map natively to Push, and feel tactile in a way web UI rarely achieves.
- **Massive React Simplification:** We remove the need to reinvent the wheel. Standard parameters (dry/wet, filter cutoff) don't need bespoke React UI components or rapid state synchronization.
- **Zero Runtime Overhead:** Because the layout is established at build time, there is no CPU overhead spent sending layout coordinates over the bridge or animating Max boxes dynamically. It’s as fast and stable as a traditional M4L device.
- **Separation of Concerns:** `m4l-jweb` becomes a hybrid framework. You use Max for what it's best at (standard parameter knobs) and web technology for what it's best at (complex text editors, dynamic visualizers, drag-and-drop lists).

### Cons & Risks
- **Rigid UI:** Once compiled, the native layout is frozen. Unlike React, you cannot dynamically insert a new native knob or easily animate the layout without complex `[js]` scripting. For the FX device, this means all knobs (even unused ones) are permanently visible on the left.
- **Layout Engine Maintenance:** Generating Max patcher JSON is tedious. Building a robust layout engine in Node.js that perfectly aligns Max boxes, labels, and margins across different OS scaling environments is difficult.
- **Fixed Real Estate:** If a device uses native controls, the `[jweb]` view is permanently truncated.

## Conclusion

This approach elegantly extends the declarative power of the `m4l-jweb` framework "to both sides of the fence". It shifts the burden of standard UI generation away from React and into the build compiler, resulting in devices that look more native, perform better, and are significantly easier to maintain.

---

# IDEA 2: Dynamic Chains (Populating Native Ableton Racks)

This idea - which requires deep changes in the `m4l-jweb` framework - reimagines the Strudel FX plugin not as an audio processor, but as a **macro compiler** that dynamically populates a native Ableton Audio Effect Rack.

## The Core Concept

Currently, the device's DSP graph is frozen at build time (e.g., `chains: ["lowpass", "drive", "gain"]`). This means the signal path is rigid and the same regardless of what the user types.

The "Dynamic Chains" concept flips this: **we write no DSP at all for these effects.** 
Instead, a `strudel-rack-control` plugin is added to a native Ableton Audio Effect Rack. When a user writes a Strudel expression like `.lpf(800).gain(1.2)`, the control plugin acts as a Reconciler (like a Virtual DOM for devices) and uses the Live Object Model (LOM) to:
1. Dynamically **instantiate** Ableton's own native devices (e.g., an Auto Filter and a Utility) directly into the rack chain next to the control plugin.
2. **Order** them exactly as written in the expression.
3. **Map and modulate** the parameters.

## How It Works Technically

1. **Instantiation via LOM (`load_item`):** The Max patch leverages the `live_app` browser's `load_item` LOM call to physically place Ableton devices into the rack at runtime. 
2. **Name-to-Device Dictionary:** The system maintains a mapping table translating Strudel effects to their native equivalents (e.g., `.lpf()` -> Auto Filter, `.room()` -> Reverb, `.crush()` -> Redux).
3. **The Reconciler (Virtual DOM):** On every expression evaluation, the plugin diffs the current rack state with the new expression. It creates new devices, deletes removed ones, but **strictly respects user-modified devices** (we only overwrite what we originally created).
4. **Modulation via `live.remote~`:** For per-hap modulation—like `.lpf(sine.range(200, 2000))`—the expression's shape dictates the device chain (Auto Filter), while the continuously changing values are mapped to the device's parameters using `live.remote~` at signal rate, avoiding automation lane clutter.

## Pros, Cons & Risks Assessment

### Pros
- **True Ableton Sound Quality:** Audio is processed by Ableton's highly optimized, native DSP (including third-party VSTs) rather than bespoke Max abstractions.
- **Maximum Flexibility:** The rack's DSP graph is genuinely dynamic, only consuming CPU for the exact effects requested.
- **Visual Transparency & Familiarity:** Users see the actual devices populating their rack, granting access to familiar native UIs, undo history, presets, and standard Live routing.

### Cons & Risks
- **LOM Constraints:** The exact LOM calls for inserting devices (`load_item`) and reordering them are undocumented and must be rigorously spiked. Populating a chain mid-playback may cause audio clicks or dropouts.
- **Loss of Per-Hap Device Variation:** While parameters can be modulated continuously, inserting/deleting devices per individual note hap is impossible in Live. The device topology must remain static while the sequence runs.
- **State Management Complexity:** Keeping the Strudel text expression perfectly synchronized with a physical chain of Live devices (which the user might tweak manually) requires a robust two-way reconciliation engine.

---

# IDEA 3: The Unified "m4l-strudel" Super-Device

## The Core Concept

Instead of maintaining separate, specialized devices for MIDI generation (`strudel-midi`) and FX processing (`strudel-fx`) or the rack-control approach (`strudel-rack-control`), we consolidate them into a single, generic "m4l-strudel" super-device. 

This single device takes a complete Strudel expression (containing both sequence generation and effects chaining, e.g., `note("c3 e3 g3").lpf(800).gain(1.2)`) and routes its execution dynamically based on a simple UI toggle: **"Translate"**.

## How It Works

1. **"Translate" Mode (Checked):** 
   When checked (and assuming the device is placed inside a Rack), the device acts as the Macro Compiler described in IDEA 2. It evaluates the effects portion of the Strudel code and leverages the Live Object Model (LOM) to dynamically instantiate and manage native Ableton components (like Auto Filter and Utility) next to itself in the rack. The sequence portion continues to output standard MIDI notes.

2. **"Native Instrument" Mode (Unchecked):** 
   When unchecked, the device acts as a fully self-contained Strudel instrument. It does not manipulate the Ableton rack. Instead, it relies on Strudel's own internal audio engine. The complete expression—both note generation and effects—is processed internally, and the device outputs the final rendered audio stream directly to the track. *(Note: This assumes the "Strudel native instrument" from the TODO list is successfully implemented, which remains the most challenging hurdle).*

3. **"Full Studio" Window Popup:**
   An expansion option allows opening a floating window containing the complete, full-sized Strudel UI. This enables standard Strudel live-coding in a much larger editor. While the UI breaks out into a popup, the sequences are still captured and output cleanly through Ableton's audio engine. Furthermore, even in this full-language mode, the output remains subjected to Live's global quantization and global scale (the technical approach for enforcing Ableton's global scale on unconstrained Strudel code will be refined as part of this feature).

## Pros & Cons

### Pros
- **Single Source of Truth:** Users only need to drag one generic device onto their tracks, simplifying the user library.
- **Workflow Flexibility:** Users can seamlessly toggle between using Strudel's built-in digital effects (for quick sketching or authentic Strudel tone) and breaking them out into high-quality native Ableton devices for professional mixing and routing.
- **Unified UX:** The React interface only needs to be built and maintained once, providing a consistent text-entry experience regardless of how the DSP is ultimately handled.

### Cons & Risks
- **The "Native Instrument" Prerequisite:** This design heavily relies on successfully implementing the Strudel Audio Instrument (Phase 8), which requires complex WebAudio-to-Max bridging or offline rendering.
- **Context Awareness:** The device needs to know its context (e.g., whether it is inside a Rack vs standalone on a MIDI track) to properly enable/disable the "Translate" toggle and prevent LOM errors when attempting to instantiate devices.
- **Acoustic Discrepancies:** The React view needs to clearly communicate to the user *why* a sequence might suddenly sound different when toggled (e.g., Strudel's internal `.lpf()` vs Ableton's native Auto Filter will inherently color the sound differently).

---

# Implementation Blueprint

This section outlines the precise code-level changes required across both the `m4l-jweb` (framework) and `m4l-strudel` (consumer) repositories to implement the three ideas above.

## Part 1: Build-Time Declarative UI (`m4l-jweb`)

**Goal:** Allow devices to declare native Max UI layouts (e.g., a column of native dials) at build time, shrinking the React `[jweb]` window to make room.

### `packages/surface/src/index.ts`
- **Extend `SurfaceDef`**: Add an optional `layout` object so developers can declare spatial constraints natively.
  ```typescript
  export interface SurfaceDef<...> {
    params: P;
    layout?: {
      nativeColumn?: Extract<keyof P, string>[];
    };
    // ...
  }
  ```
- **Validation**: In `defineSurface()`, add validation to ensure any ID listed in `layout.nativeColumn` actually exists in `def.params`.

### `packages/build/src/surface.mjs`
- **Modify `applySurface(ctx)`**: Overhaul the dial generator. Currently, it loops through `surface.ids` and plots dials at a hardcoded `x = 480` out of bounds.
- **Math Engine**: Introduce layout coordinates. If `surface.layout.nativeColumn` exists:
  - Loop through those specific IDs.
  - Set `patching_rect: [16, y, 44, 48]` and increment `y` by `56` for each dial.
  - Inject `"presentation": 1` and `"varname": id` into the generated `live.dial` / `live.toggle` dictionary.
  - Set `"presentation_rect": [16, y, 44, 48]`.

### `packages/build/src/patcher.mjs` (or `chains.mjs`)
- **Adjust the `[jweb]` bounding box**: If `surface.layout` is present, the framework must deduct width from the left side of the presentation view.
  - Example: `presentation_rect: [100, 0, deviceWidth - 100, 169]` (leaving a 100px column on the left for the native dials, while the React app occupies the remaining space).

## Part 2: Dynamic Chains (`m4l-strudel` & `m4l-jweb`)

**Goal:** Parse Strudel FX chains and dynamically instantiate/remove native Ableton devices via the Live Object Model (LOM).

### `m4l-strudel/src/app/unified/surface.ts`
- **Declare State**: Define a `StateSpec` to act as the Reconciler's memory (e.g., `state({ default: { ownedDevices: [] } })`). This ensures the device remembers what it created and avoids deleting devices the user manually added.

### `m4l-strudel/src/max/rack-reconciler.js`
- **The Reconciler Script**: Create a dedicated `[js]` script in Max that observes the Strudel AST transmitted over the bridge.
- **Device Dictionary**: Implement a mapping table mapping Strudel methods to Live native devices (e.g., `"lpf" -> "Auto Filter"`, `"gain" -> "Utility"`).
- **LOM Instantiation**: Instantiate `new LiveAPI("live_app browser")` and call `load_item(path_to_device)`. 
- **The Diff Engine**: Compare the incoming AST array (e.g., `["Auto Filter", "Utility"]`) against the `ownedDevices` state array. Issue `delete_device` calls for removals and `load_item` calls for additions, executing these against the `canonical_parent` (the Rack).

### `m4l-jweb` (Modulation Support)
- **Signal-Rate Modulation**: Create a `live.remote~` abstraction in Max (or expose it in the build compiler) so the Strudel engine can wire `[phasor~]` outputs into the parameters of the newly instantiated Live devices at signal rate, avoiding automation lane pollution.

## Part 3: The Unified "m4l-strudel" Super-Device

**Goal:** A single device that handles MIDI generation, rack manipulation (Translate mode), or full native instrument execution, plus a Full Studio popup.

### `m4l-strudel/src/app/unified/`
- **Merge Codebases**: Create a new React application directory that consolidates the logic of the `fx` and `midi` devices.
- **Update `surface.ts`**:
  - Add `toggle({ short: "Transl", default: false })` for the macro-compiler routing mode.
  - Add `window({ title: "Full Studio", width: 1200, height: 800, entry: "Window" })` to declare the popup environment.
- **Update `App.tsx`**:
  - Present the standard minimal UI text editor.
  - Read `useParam('translate')`.
  - **Translate ON**: Extract the FX AST and send it across the bridge (`useBridge().send("sync_rack", ast)`) to the Max Reconciler. Output MIDI notes via the existing `scheduler`.
  - **Translate OFF**: Feed the full AST into the internal WebAudio synth (`superdough`) or Phase 8 offline render engine.
- **Create `Window.tsx`**:
  - Mount a full Monaco editor instance alongside the standard Strudel multi-instrument environment.
  - Implement a mechanism to enforce Ableton's global quantization (via transport sync) on the unconstrained Strudel engine running in the popup.

## Open Questions & Spikes Required
- **LOM `load_item` mechanics:** The exact arguments and behavior of `live_app browser load_item` are undocumented. We must spike this in `m4l-strudel` first. Specifically: how do we target a specific index location in an Audio Effect Rack?
- **Global Quantization in Full Studio:** In the "Full Studio" popup (Idea 3), standard `strudel.cc` code relies on its own internal scheduler. Do we intercept its clock via the existing `sync` bridge, or replace its `AudioContext` timeline entirely?
