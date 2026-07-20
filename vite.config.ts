import { defineConfig, type UserConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
// Turns superdough's `./worklets.mjs?audioworklet` import into a base64 data: URL, so
// the DSP worklets survive the single-file jweb bundle and load into an
// OfflineAudioContext (superdough render path). No-op for imports without ?audioworklet.
import bundleAudioWorklet from "./strudel/packages/vite-plugin-bundle-audioworklet/vite-plugin-bundle-audioworklet.js";
import pkg from "./package.json";
import { devices, uiDir } from "./scripts/devices.mjs";

const strudelPkg = (p: string) => fileURLToPath(new URL(`./strudel/packages/${p}`, import.meta.url));

/**
 * ONE BUILD PER DEVICE.
 *
 * This repo ships two devices (MIDI, Samples), each `.amxd` embeds its OWN UI
 * bundle, and a device should ship what it is - not its sibling's code. So the
 * app to bundle is chosen here, by DEVICE, and src/main.tsx imports it through
 * the `@device` alias. There is no `mode === "..."` branch anywhere in the app.
 *
 * DEVICE is set by scripts/dev.mjs and scripts/build-ui.mjs (which read the
 * device list from patcher/devices.mjs). It is an env var rather than vite's
 * `--mode` deliberately: `--mode` also flips `import.meta.env.DEV`, and a build
 * with DEV=true would ship the dev harness inside the device.
 *
 * A FACTORY, not a plain object: scripts/build-ui.mjs sets DEVICE and calls
 * vite's build() once per device in the same process; a top-level `const DEVICE
 * = process.env.DEVICE` would be evaluated once, when the module was first
 * loaded, and every device after the first would be built from the first one's
 * sources.
 */
export default defineConfig(() => {
	const DEVICE = process.env.DEVICE ?? uiDir(devices[0]);

	// A device can declare floating WINDOWS, each a separate page bundled from the
	// same device folder. build-ui.mjs sets WINDOW_ENTRY (the component name from
	// surface.ts, e.g. "Window") so `@device/App` resolves to that file instead of
	// App.tsx - and main.tsx, which imports `@device/App`, renders the window's
	// page with no branch of its own. Absent WINDOW_ENTRY this is the device view.
	const WINDOW_ENTRY = process.env.WINDOW_ENTRY;

	const config: UserConfig = {
		base: "./",
		plugins: [react(), tailwindcss(), bundleAudioWorklet(), viteSingleFile()],
		resolve: {
			alias: [
				{ find: "@device/App", replacement: fileURLToPath(new URL(`./src/app/${DEVICE}/${WINDOW_ENTRY ?? "App"}`, import.meta.url)) },
				{ find: "@device", replacement: fileURLToPath(new URL(`./src/app/${DEVICE}`, import.meta.url)) },
				{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
				// @strudel/* resolve into the git submodule (same aliases as
				// vitest.config.ts) - the engine worker bundles the real engine.
				{ find: "@strudel/core/fraction.mjs", replacement: strudelPkg("core/fraction.mjs") },
				{ find: "@strudel/core", replacement: strudelPkg("core/index.mjs") },
				{ find: "@strudel/mini", replacement: strudelPkg("mini/index.mjs") },
				{ find: "@strudel/transpiler", replacement: strudelPkg("transpiler/index.mjs") },
				{ find: "@strudel/tonal", replacement: strudelPkg("tonal/index.mjs") },
				{ find: "@strudel/webaudio", replacement: strudelPkg("webaudio/index.mjs") },
				{ find: "@strudel/draw", replacement: strudelPkg("draw/draw.mjs") },
				{ find: "supradough", replacement: strudelPkg("supradough/index.mjs") },
				// superdough: the REAL synths/samples/effects, rendered offline into WAV
				// (see doc SUPERDOUGH Rendering). The renderer imports both the barrel
				// ("superdough") and a subpath ("superdough/superdoughoutput.mjs"), so match
				// each precisely - a plain-string prefix alias would rewrite the subpath to
				// .../index.mjs/superdoughoutput.mjs.
				{ find: /^superdough$/, replacement: strudelPkg("superdough/index.mjs") },
				{ find: /^superdough\/(.*)$/, replacement: strudelPkg("superdough/$1") },
			],
		},
		define: {
			__APP_VERSION__: JSON.stringify(pkg.version),
			__DEVICE__: JSON.stringify(DEVICE),
		},
		// The engine worker contains dynamic imports (evalScope). They must be
		// bundled into the single inlined chunk: a ?worker&inline blob URL cannot
		// resolve relative chunk imports at runtime.
		worker: {
			format: "es",
			rollupOptions: {
				output: {
					inlineDynamicImports: true,
				},
			},
		},
		build: {
			// dist/ui/<device>/index.html - one per device, picked up by `m4l-jweb build`.
			// A WINDOW build lands in the same folder and must NOT empty it, or it would
			// wipe the device view built just before it (build-ui.mjs renames around this).
			outDir: `dist/ui/${DEVICE}`,
			emptyOutDir: !process.env.WINDOW,
		},
	};
	return config;
});
