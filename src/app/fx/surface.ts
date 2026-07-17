/**
 * surface.ts (fx) - the Audio FX device's Live parameters.
 *
 * These are REAL Live parameters: automatable, MIDI-mappable, and the only thing
 * Push can see. The text line in the device window writes them (`.lpf(800)` sets
 * Cutoff to 800 Hz); so does the automation lane, and so does a Push encoder.
 * They are one control with several faces.
 *
 * IN REAL UNITS, DELIBERATELY. The obvious shortcut is a normalised 0-1 dial with
 * the frequency curve hidden in the Max chain - and it lies to everything that
 * reads the parameter: the automation lane shows 0.6, Push shows "1", and the app
 * has to know the chain's private mapping to display Hz. Declare the range the
 * parameter actually has and `exponent` bends the KNOB's travel without touching
 * the value, so every readout is honest and the DSP takes the number directly.
 */
import { button, defineSurface, dial, state, window } from "@m4l-jweb/surface";
import type { FxParam } from "@/lib/fx";
import { helpQuerySlot } from "../shared/surface";

export default defineSurface({
	params: {
		/**
		 * THE VIEW SWITCH - the "two screens" control, shown only in the knob panel
		 * (the web UI has its own button). A labelled `button` (live.text) reading
		 * "Back", because a bare toggle is a mute orange square that says nothing;
		 * clicking it returns to the Strudel chain editor. On = the native knob panel
		 * ([jweb] hidden); off = the web UI. Runtime reflow/resize of native objects
		 * does not work in a frozen M4L device - only hide/show does - so we layer the
		 * two views instead of packing one.
		 */
		knobs: button({ default: false, label: "Back", short: "Back" }),
		cutoff: dial({
			// The audible band. 18 kHz is "off" for a one-pole: above it there is
			// nothing left to take away.
			range: [40, 18000],
			// Wide open. NOT cosmetic: the bottom of this range is a 40 Hz lowpass,
			// i.e. a device that swallows the signal the moment it loads.
			default: 18000,
			unit: "Hz",
			// Hearing is logarithmic. A linear sweep spends almost all its travel in
			// the top octave, where nothing seems to happen, and races through the
			// bottom, where everything does.
			exponent: 4,
			format: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${Math.round(v)} Hz`),
			short: "Cutoff",
		}),
		hpfreq: dial({
			// From 0, which is the neutral the chain guarantees: the hpf is `dry minus
			// a one-pole lowpass`, and at 0 Hz that lowpass passes nothing, so the
			// stage is a wire. A range starting at 40 (the lowpass's floor) would have
			// no such setting - the device would always be taking the bottom away.
			range: [0, 8000],
			default: 0,
			unit: "Hz",
			// Same reason as `cutoff`: hearing is logarithmic. The interesting travel is
			// in the bottom couple of hundred Hz, where a linear knob would race past.
			exponent: 4,
			format: (v) => (v < 1 ? "off" : v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${Math.round(v)} Hz`),
			short: "HP Freq",
		}),
		drive: dial({
			range: [1, 10],
			default: 1,
			unit: "x",
			short: "Drive",
		}),
		crush: dial({
			// BITS, and the top of the range is "off" - degrade~ at full depth passes
			// its input through. Strudel's own scale calls 16 "minimum crush", but 16
			// still quantises; a stage that is always in the path needs a true wire, so
			// the range runs to 24 and rests there. Down at 1-4 bits it is the noisy
			// crunch the effect is for.
			range: [1, 24],
			default: 24,
			unit: "bit",
			format: (v) => (v >= 24 ? "off" : `${Math.round(v)} bit`),
			short: "Crush",
		}),
		delay: dial({
			range: [0, 1],
			default: 0,
			format: (v) => `${Math.round(v * 100)}%`,
			short: "Delay",
		}),
		delaytime: dial({
			range: [1, 2000],
			default: 250,
			unit: "ms",
			format: (v) => `${Math.round(v)} ms`,
			short: "Dly Time",
		}),
		delayfeedback: dial({
			range: [0, 1],
			default: 0,
			format: (v) => `${Math.round(v * 100)}%`,
			short: "Feedback",
		}),
		room: dial({
			range: [0, 1],
			default: 0,
			format: (v) => `${Math.round(v * 100)}%`,
			short: "Room",
		}),
		gain: dial({
			// A linear multiplier, as in Strudel: .gain(1) is unity, .gain(2) is +6 dB.
			// Not dB, because the number the user types in the line is this number.
			range: [0, 2],
			default: 1,
			format: (v) => `${v.toFixed(2)}x`,
			short: "Gain",
		}),
	},

	/**
	 * TWO BANKS, because Push shows EIGHT encoders per page and the rack is now nine
	 * stages - a ninth parameter in a bank is not an error Max reports, it is one that
	 * never appears (the library throws at build time rather than let that ship).
	 *
	 * Split where the rack itself splits rather than at the eighth name: the stages
	 * that shape TONE, then the ones that put it in a SPACE and set its level. A page
	 * turn then lands on a group that means something.
	 */
	banks: [
		{ name: "Tone", params: ["cutoff", "hpfreq", "drive", "crush"] },
		{ name: "Space", params: ["delay", "delaytime", "delayfeedback", "room", "gain"] },
	],

	/**
	 * THE TWO SCREENS. The seven fx dials are the native grid; `knobs` is the view
	 * SWITCH (pinned top-right, over the web UI's own "Knobs" button, so it stays in
	 * one place across both views). The app layers them (useNativePanel): the web UI
	 * OR the native knob panel, never both. `rows: 2` lays the dials out in two rows
	 * across the wide panel - nine dials cannot be two columns in a 169 px-tall view
	 * (only three rows fit), so two rows is the clean use of the space.
	 *
	 * The grid fills DOWN then steps right, so this reads as five columns of two, in
	 * the rack's own signal order. Live recomputes the device width from the
	 * presentation rects, so adding hpf and crush widened the panel rather than
	 * overflowing it.
	 */
	layout: {
		native: {
			params: ["cutoff", "hpfreq", "drive", "crush", "delay", "delaytime", "delayfeedback", "room", "gain"],
			rows: 2,
			panel: true,
			switch: "knobs",
		},
	},

	/**
	 * WHICH STAGES THE USER NAMED - the line, in the only form worth saving.
	 *
	 * The VALUES need nothing here: they are Live parameters, and Live has been saving
	 * them all along. What it could not save is the difference between a stage the user
	 * asked for and a stage that happens to sit at its neutral value - `.gain(1)` typed
	 * on purpose, versus a gain nobody has ever touched. That distinction is the whole
	 * of the FX line's UI (see App.tsx: the parameters are the truth, the line is a view
	 * of them), and reopening the set used to lose it: every stage left at neutral
	 * vanished from the screen, and the line the user wrote came back shorter than they
	 * typed it.
	 *
	 * So the SHAPE of the line persists, and the parameters keep carrying its numbers.
	 * There is no second copy of a value anywhere, which is what keeps a knob, an
	 * automation lane and this slot from disagreeing.
	 */
	state: {
		named: state<FxParam[]>({ default: [] }),
		/**
		 * THE MODULATED STAGES' SOURCE TEXT, param -> expression - `{ cutoff:
		 * "sine.range(200, 2000)" }`. The one part of a patterned stage nothing else can
		 * reconstruct: a Pattern cannot say what it was written as, and the PARAMETER
		 * holds only whatever value the modulation last passed through. Without this
		 * slot, reopening the set would print the line from the parameters and quietly
		 * rewrite `.lpf(sine.range(200, 2000))` into `.lpf(1372)`.
		 */
		sources: state<Partial<Record<FxParam, string>>>({ default: {} }),
		/** What the caret is on, so the floating help can follow the typing. */
		helpQuery: helpQuerySlot(),
	},

	/** The reference, one `?` away. Tall and narrow: it is a list you scroll. */
	windows: {
		help: window({ title: "Strudel Reference", width: 420, height: 620, entry: "Help", alwaysOnTop: true }),
	},
});
