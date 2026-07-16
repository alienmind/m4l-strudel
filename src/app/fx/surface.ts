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
import { defineSurface, dial, state, toggle } from "@m4l-jweb/surface";
import type { FxParam } from "@/lib/fx";

export default defineSurface({
	params: {
		/**
		 * THE VIEW SWITCH - the "two screens" toggle. On = the native knob panel
		 * (all dials, [jweb] hidden); off = the web UI ([jweb] full width, dials
		 * hidden). A native live.toggle so it stays visible in BOTH modes, which the
		 * switch back from the knob panel needs (the web UI is hidden there). Runtime
		 * reflow/resize of native objects does not work in a frozen M4L device - only
		 * hide/show does - so we layer the two views instead of packing one.
		 */
		knobs: toggle({ default: false, short: "Knobs" }),
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
		drive: dial({
			range: [1, 10],
			default: 1,
			unit: "x",
			short: "Drive",
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

	banks: [{ name: "FX", params: ["cutoff", "drive", "delay", "delaytime", "delayfeedback", "room", "gain"] }],

	/**
	 * THE TWO SCREENS. Every fx parameter is a NATIVE live.dial, plus the `knobs`
	 * view switch. The app layers them (useNativePanel): the web UI OR the native
	 * knob panel, never both, flipped by hiding/showing [jweb] and the dials. `knobs`
	 * is listed first so it lands top-left and stays reachable in the panel; it is
	 * kept visible in both modes as the switch back.
	 */
	layout: { native: { params: ["knobs", "cutoff", "drive", "delay", "delaytime", "delayfeedback", "room", "gain"], rows: 3, panel: true } },

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
	},
});
