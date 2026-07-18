/**
 * protocol.ts (sampler) - every selector that crosses this device's bridge.
 *
 * Like the sample browser, this device owns almost no protocol of its own: the
 * three jobs it does are library chains, and their selectors belong to
 * @m4l-jweb/bridge.
 *
 *   loadSample(slot, path)          buffer_load  / buffer_ready   (instrument chain)
 *   playVoice({slot, rate, ...})    voice_play                    (instrument chain)
 *   onNote(pitch, velocity)         notein                        (midiin chain)
 *   fetchToFile(url, path)          fetch_to_file / fetch_done    (download chain)
 *
 * The app calls those helpers by name; it never types the selectors. What is left
 * here is genuinely this device's own: the folder path (so a picked sample can be
 * revealed on disk) and the reveal request.
 */
import { CHAIN_IN, CHAIN_OUT, DEVICE_IN } from "@m4l-jweb/bridge";

/** Device -> UI. */
export const IN = {
	...DEVICE_IN,
	...CHAIN_IN,
	/**
	 * wrapper -> UI: the ABSOLUTE path of the device's folder, as one symbol. Picked
	 * samples are downloaded relative to it; this is what "Show folder" needs, and what
	 * a `file://` reveal resolves against past the spaces in "Ableton Library".
	 */
	device_folder: "device_folder",
} as const;

/** UI -> device. */
export const OUT = {
	...CHAIN_OUT,
	/** UI -> wrapper: page ready; send me the current state. */
	ui_ready: "ui_ready",
	/** UI -> wrapper: reveal the samples folder in Finder/Explorer. The page cannot
	 *  open an OS file manager; the wrapper asks the Max application to. */
	reveal_folder: "reveal_folder",
} as const;
