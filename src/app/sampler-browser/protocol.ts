/**
 * protocol.ts (sampler-browser) - every selector that crosses this device's bridge.
 *
 * There is almost nothing left to declare, and that is the whole story of this
 * release. This device used to own a private protocol - `catalog`, `downloaded`,
 * `progress`, `fetcherr`, `engine_ready`, `preview` - because it talked to a
 * [node.script] process of its own that did the fetching, the downloading and the
 * previewing, and every reply came back base64-encoded through it.
 *
 * All three jobs are library chains now, and their selectors belong to
 * @m4l-jweb/bridge: CHAIN_OUT/CHAIN_IN carry `fetch_to_file` / `fetch_done` /
 * `fetch_progress` (the `download` chain) and `buffer_load` / `buffer_play` /
 * `buffer_ready` (the `samples` chain). The app never types those names - it calls
 * fetchToFile(), loadSample() and playSample(), which do.
 *
 * What is left is genuinely this device's own: Live's global scale, which the
 * browser shows so a pitched sample map can be read in the key of the set.
 */
import { CHAIN_IN, CHAIN_OUT, DEVICE_IN } from "@m4l-jweb/bridge";

/** Device -> UI. */
export const IN = {
	...DEVICE_IN,
	...CHAIN_IN,
	/**
	 * wrapper -> UI: Live's global clip-trigger quantization, as an ENUM INDEX
	 * (4 = 1 Bar, 0 = None). A preview launches on the grid the user already chose
	 * in the transport bar. See quantBeats() in lib/samples.ts - the index is not a
	 * duration, and reading it as one makes the shortest setting the longest wait.
	 */
	quantization: "quantization",
	/**
	 * wrapper -> UI: the ABSOLUTE path of the device's folder, as one symbol.
	 *
	 * The downloads themselves are relative to it - that is what Max resolves, and
	 * what survives the spaces in "Ableton Library". This is for the USER: it is what
	 * a `file://` link needs to be draggable into a Simpler or findable in Places.
	 */
	device_folder: "device_folder",
} as const;

/** There is no `scale` here any more. Live's scale reached this device, was shown in
 *  the corner, and did NOTHING - a preview plays the file untransposed, at rate 1.0.
 *  A badge that implies the set's key affects what you are hearing, when it does not,
 *  is worse than no badge. It belongs to the MIDI device, where degrees are real. */

/** UI -> device. */
export const OUT = {
	...CHAIN_OUT,
	/** UI -> wrapper: page ready; send me the current state. */
	ui_ready: "ui_ready",
	/** UI -> wrapper: reveal the samples folder in Finder/Explorer. The page cannot
	 *  open an OS file manager; the wrapper asks the Max application to. */
	reveal_folder: "reveal_folder",
} as const;
