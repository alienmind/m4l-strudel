/**
 * build-ui.mjs - bundle one self-contained UI per device.
 *
 * Emits dist/ui/<device>/index.html, which `m4l-jweb build` then embeds into the
 * matching .amxd as a base64 payload.
 *
 * Sequential, not parallel: vite reads DEVICE from the environment, and two
 * concurrent builds would race on it.
 */
import { build } from "vite";
import { uiDirs } from "./devices.mjs";

for (const dir of uiDirs) {
	process.env.DEVICE = dir;
	console.log(`\nm4l-jweb: bundling UI for ${dir}`);
	await build();
}

console.log(`\nm4l-jweb: ${uiDirs.length} UI bundle(s) -> dist/ui/`);
