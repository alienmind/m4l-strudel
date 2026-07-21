/**
 * protocol.ts (sampler) - every selector that crosses this device's bridge.
 *
 * Almost nothing, and less than it used to be. The sampler's audio work happens
 * entirely in the page since 0.9.9: samples are fetched with `fetch()`, decoded with
 * `decodeAudioData`, and played through the `webaudio` chain's signal path. The
 * `buffer_load` / `voice_play` exchange with a Max-side [poly~] is gone, and with it
 * the samples folder - nothing is DOWNLOADED here any more. What still needs the
 * wrapper is `device_folder`: Export writes a WAV next to the device, and only Max
 * knows where that is.
 *
 * What else crosses the bridge is MIDI in:
 *
 *   onNote(pitch, velocity)         notein                        (midiin chain)
 *
 * The app calls that helper by name; it never types the selector.
 */
import { CHAIN_IN, CHAIN_OUT, DEVICE_IN } from "@m4l-jweb/bridge";

/** Device -> UI. */
export const IN = {
	...DEVICE_IN,
	...CHAIN_IN,
	/** wrapper -> UI: the ABSOLUTE path of the device's folder, as one symbol. Nothing is
	 *  downloaded here any more, but Export writes a WAV into it - so the user needs a
	 *  way to reach it. */
	device_folder: "device_folder",
} as const;

/** UI -> device. */
export const OUT = {
	...CHAIN_OUT,
	/** UI -> wrapper: page ready; send me the current state. */
	ui_ready: "ui_ready",
} as const;
