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
	/** wrapper -> UI: From Clip failed. args: `<reason>`. */
	read_error: "read_error",
	/** wrapper -> UI: Live 12 global scale. args: `<rootNote> <scaleName>`. */
	scale: "scale",
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
