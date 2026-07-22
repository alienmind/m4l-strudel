/**
 * surface.ts (sampler) - the transport parameter, the pattern, and the selected bank.
 *
 * The Sampler is a two-screen, CODE-DRIVEN device: a CODE screen runs a Strudel `s(...)`
 * pattern through the shared engine, and a BROWSE screen picks the drum-machine bank (or
 * a free-form sample map) whose sounds the pattern names. The engine needs the same two
 * things the MIDI devices give it - a `play` parameter and a `code` state slot - plus the
 * selected `bank`, saved so a set reopens on the machine it was built with.
 *
 * Both screens are web UI, flipped by an in-app button, so there is no native panel here
 * (unlike the MIDI device's transport panel). `play` is still a real, macro-mappable Live
 * parameter, so a Rack macro can start the pattern.
 *
 * NO `?` window: a sample browser needs no Strudel reference.
 */
import { defineSurface, state, window } from "@m4l-jweb/surface";
import { transportParams, codeSlot, helpQuerySlot } from "../shared/surface";

/** What a fresh Sampler opens with: a two-layer drum line naming the default sounds,
 *  played from the default bank below. */
export const INITIAL_TEXT = 's("bd sd, hh*8")';

/** The bank a fresh Sampler selects - a widely-known machine that is all WAV. */
export const INITIAL_BANK = "RolandTR909";

export default defineSurface({
	params: transportParams,

	state: {
		/** The pattern the CODE screen runs, saved with the set. */
		code: codeSlot(INITIAL_TEXT),
		/** The selected drum-machine bank (the `bank()` prefix), saved with the set so the
		 *  pattern reopens against the same machine. A pattern's own `.bank()` overrides it. */
		bank: state<string>({ default: INITIAL_BANK }),
		/** What the caret is on, so the floating help can follow the typing. */
		helpQuery: helpQuerySlot(),
	},

	windows: {
		/** The `?` reference - what the Sampler understands of Strudel. */
		help: window({ title: "Strudel Reference", width: 420, height: 620, entry: "Help", alwaysOnTop: true }),
		/** strudel.cc itself, in a floating window (About > Advanced). The bundled page just
		 *  navigates to the site - a plain browser tab's worth of the web playground. */
		strudel: window({ title: "strudel.cc", width: 1100, height: 760, entry: "StrudelSite" }),
	},
});
