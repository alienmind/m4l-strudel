# Build Optimization Plan

The current build process is indeed cumbersome, taking around 30-40 seconds to complete because of how Max for Live (`m4l-jweb`) requires web assets to be packaged. 

Because each Max for Live device operates in isolation without a shared `dist` folder at runtime, each `.amxd` device must embed its own UI code as a single HTML payload. Additionally, every floating window (Help, Studio, etc.) requires its own HTML payload.
Currently, `scripts/build-ui.mjs` runs Vite sequentially for each device and window (about 25 times). In each run, Vite transforms the entire Strudel engine (1600+ modules), which is why you see all those "modules transformed" logs and the build takes a while.

## Proposed Options

> [!IMPORTANT]
> **Option 1: The Unified "Mega" Bundle (Recommended)**
> Instead of 25 separate builds, we run Vite **exactly once**. We build a single, unified `index.html` that contains the UI for *all* devices and windows. 
> - **How it works**: The app would look at a URL parameter (e.g., `?device=drums-midi&window=help`) to decide which view to render. `m4l-jweb` will then embed this single `index.html` into all 8 `.amxd` files.
> - **Pros**: Drastically reduces build time (from ~30s to ~5s). Much simpler build script.
> - **Cons**: The `.amxd` files will be slightly larger because each device will contain the code for the others. However, since the `.amxd` files are gzipped, the size difference will likely be only a few hundred kilobytes, which is perfectly acceptable for Max devices.

> [!NOTE]
> **Option 2: Pre-bundle the Strudel Engine**
> Keep the current "one build per device" architecture (as described in `vite.config.ts`), but pre-bundle the heavy Strudel engine.
> - **How it works**: We add a pre-build step that uses `esbuild` to compile `@strudel/*` into a single `strudel-core.js` file. The 25 Vite builds will then import this pre-built file instead of transforming 1600+ modules every time.
> - **Pros**: Preserves the strict separation of code per device (a MIDI device's bundle carries no sampler code). 
> - **Cons**: Still runs Vite 25 times, so the build might still take 10-15 seconds. Slightly more complex configuration.

> [!TIP]
> **Option 3: Multi-page Vite Build**
> We pass multiple virtual HTML files into a single Vite build run. 
> - **Pros**: Vite resolves the module graph once, maintaining separate bundles.
> - **Cons**: `vite-plugin-singlefile` does not always play nicely with multiple Rollup input files. We would likely have to write a custom Rollup plugin to inline each entry into its respective HTML file, making the build system more fragile.

## Open Questions

Which option would you like to proceed with? Option 1 provides the biggest speedup, while Option 2 strictly respects the architectural note in `vite.config.ts` about not shipping a sibling device's code.
