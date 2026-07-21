/**
 * protocol.ts (midi) - every selector that crosses this device's bridge.
 *
 * The single source of truth for BOTH sides: the app binds/emits these names,
 * and the Max side (wrapper/device.ts, plus the packaged chains from
 * @m4l-jweb/build) handles them. A selector that exists on one side only is a message falling on
 * the floor, and it produces no error at runtime - so keep them here.
 *
 * DEVICE_IN and CHAIN_OUT are spread in, not retyped: those names belong to
 * @m4l-jweb/bridge (the wrapper's own state, and the packaged `midiout` chain's
 * `midinote`/`flush`). Only the clip-I/O and scale-awareness selectors below are
 * genuinely this device's own - CHAIN_IN (`notein`) is deliberately NOT spread
 * in, because this device generates notes, it does not receive them.
 */
import { CHAIN_OUT, DEVICE_IN } from "@m4l-jweb/bridge";

/** Device -> UI. */
export const IN = {
	...DEVICE_IN,
	/** wrapper -> UI: is there a clip on this track to read? args: `<0|1>`. */
	clip_available: "clip_available",
	/** wrapper -> UI: clip contents. args: `<loopEnd> <n> <pitch start dur>...`. */
	notes: "notes",
	/** wrapper -> UI: From Clip failed. args: `<reason>` - `no_clip` (track has none),
	 *  `no_selection`, or `no_track` (STRUCTURAL: no reachable track - clip I/O impossible
	 *  here, e.g. the device is somewhere a track cannot be resolved from). */
	read_error: "read_error",
	/** wrapper -> UI: To Clip failed. args: `<reason>` - `no_track` (structural, as above),
	 *  `no_slot` (track full), or `add_failed`. `no_track` disables clip I/O in the UI. */
	write_error: "write_error",
	/** wrapper -> UI: Live 12 global scale. args: `<rootNote> <scaleName>`. */
	scale: "scale",
	/** wrapper -> UI: should this device be sequencing right now? args: `<0|1>`.
	 *  Derived from the track's playing clip, or from `live_set is_playing` on a track
	 *  with no clips (wrapper/device.ts, TODO item 0). The page writes it into the Play
	 *  parameter, so automation and macros keep the last word. */
	transport_play: "transport_play",
} as const;

/** UI -> device. */
export const OUT = {
	...CHAIN_OUT,
	/** UI -> wrapper: page ready; send me the current state. */
	ui_ready: "ui_ready",
	/** UI -> wrapper: `<lengthBeats> <n> <pitch start dur vel>...`. */
	write_clip: "write_clip",
	/** UI -> wrapper: read this track's clip back as notes. */
	read_notes: "read_notes",
} as const;
