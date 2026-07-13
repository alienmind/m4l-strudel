/**
 * protocol.ts (strudel-sample-browser) - every selector that crosses this device's bridge.
 *
 * This device hosts a [node.script] on its outlet 1 to do the fetching work
 * that jweb cannot (it has no fetch API that writes to Max's virtual
 * filesystem).
 *
 * [js] fans out to it, so jweb's one outlet reaches both. The node process
 * registers handlers only for what it needs and ignores the rest
 * (see patcher/chains.mjs's `strudel-sample-browser` chain and src/max/sampler-browser/main.mjs), not
 * from the packaged wrapper - this device's own protocol, genuinely.
 */
import { DEVICE_IN } from "@m4l-jweb/bridge";

/** Device -> UI. */
export const IN = {
	...DEVICE_IN,
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
	/** wrapper -> UI: Live 12 global scale. args: `<rootNote> <scaleName>`. Informational only for now. */
	scale: "scale",
} as const;

/** UI -> device. */
export const OUT = {
	/** UI -> wrapper: page ready; send me the current state. */
	ui_ready: "ui_ready",
	/** UI -> node: fetch the sample catalog. */
	load_map: "load_map",
	/** UI -> node: audition a sample, quantized to the next beat. */
	preview: "preview",
	/** UI -> node: stop the audition. */
	preview_stop: "preview_stop",
	/** UI -> node: download a sample pack. */
	download: "download",
	/** UI -> node: download every variation of a sample. */
	download_all: "download_all",
	/** UI -> node: open the local samples folder in Explorer/Finder. */
	open_folder: "open_folder",
} as const;
