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
