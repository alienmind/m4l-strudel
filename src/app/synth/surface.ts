/**
 * surface.ts (synth) - the MIDI-driven superdough voice.
 *
 * The smallest of the instruments: no transport, no pattern, no engine worker. What it
 * declares is a SOUND, and Live's MIDI plays it - so there is no `play` parameter here
 * (there is nothing to start; the notes are the trigger) and no clip I/O.
 *
 * What it does share with the Superdough device is the eight native slider dials: the
 * sound spec can hold `slider()` calls, and each one lands on a real, automatable,
 * Push-reachable Live parameter. That is the whole reason this device is worth having
 * over playing a pattern: the sound is under the fingers, and the notes come from
 * wherever the musician already plays them.
 */
import { button, defineSurface, dial, window } from "@m4l-jweb/surface";
import { codeSlot, helpQuerySlot } from "../shared/surface";

/** One of the eight normalized dials - the Superdough device's convention, unchanged:
 *  a dial's travel is stamped at build time, so the range in the code is applied in the
 *  page (see shared/useSliderKnobs.ts). */
const sliderDial = (n: number) => dial({ range: [0, 1] as [number, number], default: 0, short: `S${n}` });

/**
 * THE SOUND SPEC a fresh device opens with - a superdough VALUE, not a pattern.
 *
 * The bare oscillator, nothing else. It is network-free (so the very first key press
 * makes a sound with no sample maps loaded) and, more to the point, it is the smallest
 * true example of what this box wants: one sound, to hang things off. Opening with a
 * filter and a slider already attached teaches the shape backwards.
 */
export const INITIAL_TEXT = `s("sawtooth")`;

export default defineSurface({
	params: {
		/** The view switch onto the native knob panel - the Superdough device's mechanism.
		 *  No `play` to keep company here: a synth plays when a note arrives. */
		transport: button({ default: false, label: "Back", short: "Back" }),
		s1: sliderDial(1),
		s2: sliderDial(2),
		s3: sliderDial(3),
		s4: sliderDial(4),
		s5: sliderDial(5),
		s6: sliderDial(6),
		s7: sliderDial(7),
		s8: sliderDial(8),
	},

	layout: {
		native: {
			params: ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
			// All eight in one row. The synth has no Play - its notes are the trigger -
			// so there is no lead row here.
			rows: [8],
			panel: true,
			switch: "transport",
		},
	},

	state: {
		/** The sound spec, saved with the set and shared with the Studio window. */
		code: codeSlot(INITIAL_TEXT),
		/** What the caret is on, so the floating help can follow the typing. */
		helpQuery: helpQuerySlot(),
	},

	windows: {
		help: window({ title: "Strudel Reference", width: 420, height: 620, entry: "Help", alwaysOnTop: true }),
		studio: window({
			title: "Strudel Studio",
			width: 720,
			height: 560,
			entry: "StudioWindow",
			alwaysOnTop: true,
		}),
	},
});
