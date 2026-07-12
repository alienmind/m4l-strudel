/**
 * devices.mjs - read the manifest, and map each device to its UI folder.
 *
 * The manifest (patcher/devices.mjs) is the single list of what this repo builds.
 * The UI folder is `src/app/<ui ?? name>/`, so two devices CAN share one app by
 * both setting the same `ui` - but they do not share by default, which is the
 * point of the split.
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export const devices = (await import(pathToFileURL(path.join(root, "patcher/devices.mjs")).href)).default;

/** The folder under src/app/ holding a device's UI. */
export const uiDir = (d) => d.ui ?? d.name;

/** Every distinct UI that has to be built (two devices may share one). */
export const uiDirs = [...new Set(devices.map(uiDir))];

/** Validate a device name from the command line, with a useful error. */
export function resolveDevice(arg) {
	const name = arg ?? devices[0]?.name;
	const known = devices.map((d) => d.name);
	if (!known.includes(name)) {
		throw new Error(`unknown device "${name}" - patcher/devices.mjs declares: ${known.join(", ")}`);
	}
	const dir = uiDir(devices.find((d) => d.name === name));
	if (!existsSync(path.join(root, "src/app", dir))) {
		throw new Error(`device "${name}" has no UI at src/app/${dir}/`);
	}
	return dir;
}
