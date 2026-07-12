/**
 * Types for scripts/devices.mjs, so vite.config.ts can import the manifest and
 * still typecheck. The manifest itself stays plain .mjs - it is read by the Node
 * build, which has no TypeScript in the loop.
 */

/** One entry in patcher/devices.mjs. */
export interface DeviceManifestEntry {
	name: string;
	type: "midi" | "audio" | "instrument";
	/** The wrapper's object-box argument. Defaults to `type`. */
	mode?: string;
	/** The folder under src/app/ holding this device's UI. Defaults to `name`. */
	ui?: string;
	chains?: string[];
	parameters?: { id: string; object: string; range?: [number, number]; default?: number }[];
	unmatchedTo?: string;
	payloads?: string[];
	looseFiles?: string[];
	extraFiles?: string[];
}

export declare const root: string;
export declare const devices: DeviceManifestEntry[];
export declare const uiDirs: string[];
export declare function uiDir(d: DeviceManifestEntry): string;
export declare function resolveDevice(arg?: string): string;
