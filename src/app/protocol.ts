/**
 * protocol.ts - every selector that crosses the UI <-> device bridge.
 *
 * The single source of truth for BOTH sides: the app binds/emits these names,
 * and the Max side (wrapper/device.ts, plus the routes in patcher/chains.mjs)
 * handles them. A selector that exists on one side only is a message falling on
 * the floor, and it produces no error at runtime - so keep them here, and let
 * the protocol lint check them.
 *
 * A Max message is a selector word followed by arguments: `tick 1 12.5`.
 */

/** Device -> UI. */
export const IN = {
	/** wrapper -> UI: which device this is (midi | sampler | audio). */
	mode: "mode",
	/** wrapper -> UI: build stamp, for the stale-install check. */
	build: "build",
	/** wrapper -> UI: transport. args: `<playing 0|1> <beats>`. */
	tick: "tick",
	/** wrapper -> UI: Live tempo in BPM. */
	tempo: "tempo",
	/** wrapper -> UI: is there a clip on this track to read? args: `<0|1>`. */
	clip_available: "clip_available",
	/** wrapper -> UI: clip contents. args: `<loopEnd> <n> <pitch start dur>...`. */
	notes: "notes",
	/** wrapper -> UI: From Clip failed. args: `<reason>`. */
	read_error: "read_error",
	/** wrapper -> UI: Live 12 global scale. args: `<rootNote> <scaleName>`. */
	scale: "scale",

	/* --- sampler only: replies from the node host --- */
	/** node -> UI: the sample catalog, base64 JSON. */
	catalog: "catalog",
	/** node -> UI: a sample finished downloading. */
	downloaded: "downloaded",
	/** node -> UI: download progress. */
	progress: "progress",
	/** node -> UI: fetch failed. */
	fetcherr: "fetcherr",
	/** node -> UI: the node engine booted. */
	engine_ready: "engine_ready",
} as const;

/** UI -> device. */
export const OUT = {
	/** UI -> wrapper: page ready; send me the current state. */
	ui_ready: "ui_ready",

	/* --- midi device: the engine's note stream --- */
	/** UI -> midiout chain: `<pitch> <vel> <durMs> <chan> <delayMs>`. */
	midinote: "midinote",
	/** UI -> midiout chain: release hanging notes. */
	flush: "flush",

	/* --- audio device: the poly~ voice bank --- */
	/** UI -> poly chain: `<note> <vel01> <durMs> <wave> <cutoff> <gain> <delayMs>`. */
	voice: "voice",
	/** UI -> poly chain: panic. */
	allnotesoff: "allnotesoff",

	/* --- clip I/O (midi + audio) --- */
	/** UI -> wrapper: `<lengthBeats> <n> <pitch start dur vel>...`. */
	write_clip: "write_clip",
	/** UI -> wrapper: read this track's clip back as notes. */
	read_notes: "read_notes",

	/* --- sampler only: requests to the node host --- */
	/** UI -> node: fetch the sample catalog. */
	load_map: "load_map",
	/** UI -> node: audition a sample, quantized to the next beat. */
	preview: "preview",
	/** UI -> node: stop the audition. */
	preview_stop: "preview_stop",
	/** UI -> node: download a sample pack. */
	download: "download",
} as const;

export type DeviceMode = "midi" | "audio" | "sampler";
