/**
 * protocol.ts (fx) - every selector that crosses this device's bridge.
 *
 * Short, and it stays short: the PARAMETERS ARE NOT HERE. `cutoff`, `gain` and
 * their `set_<id>` counterparts are generated from src/app/fx/surface.ts - the
 * live.* objects, the wiring in both directions, and the selectors, all from one
 * declaration (@m4l-jweb 0.4.0). The app reaches them through
 * `useParam(surface, "cutoff")`, typed, and never retypes a selector name.
 *
 * An audio effect has no MIDI ports at all, so the chain contract (CHAIN_IN /
 * CHAIN_OUT) is deliberately NOT spread in: a `midinote` sent from this device
 * would match nothing, reach the wrapper, and be swallowed in silence.
 */
import { DEVICE_IN } from "@m4l-jweb/bridge";

/** Device -> UI. */
export const IN = {
	...DEVICE_IN,
} as const;

/** UI -> device. */
export const OUT = {
	/** UI -> wrapper: page ready; send me the current state. */
	ui_ready: "ui_ready",
} as const;
