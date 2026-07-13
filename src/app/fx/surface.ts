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
import { defineSurface, dial } from "@m4l-jweb/surface";

export default defineSurface({
	params: {
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
});
