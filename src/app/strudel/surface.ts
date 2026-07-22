/**
 * surface.ts (strudel) - the main device's Live parameters.
 *
 * The MIDI device's surface minus what does not apply: no scale (nothing here is a
 * MIDI pitch) and no clip I/O (the output is the track's audio, not notes). What
 * remains is the transport pair - the macro-mappable Play/Stop and the native panel
 * that makes it clickable - plus the code slot and the three windows.
 */
import { button, defineSurface, dial, window } from "@m4l-jweb/surface";
import { codeSlot, helpQuerySlot, transportParams } from "../shared/surface";

/**
 * THE SLIDER KNOBS. strudel.cc renders `slider(0.571, 0, 1)` as an inline widget; here
 * the same role falls to eight native dials - slider N in the code (source order) maps
 * to knob N. NORMALIZED 0..1 deliberately: a slider's range is declared by the CODE and
 * changes per pattern, while a live.dial's range is stamped at build time - so the dial
 * carries the travel and the app denormalizes into the slider's own min..max on each
 * re-render. Automatable, macro-mappable, on Push - a knob turn re-renders the pattern
 * with the new value (one render of latency, the honest cost of pre-rendered audio).
 */
const sliderDial = (n: number) =>
	dial({ range: [0, 1] as [number, number], default: 0, short: `S${n}` });

/**
 * The pattern this device opens with. Full Strudel, synth-only on purpose: it renders
 * with no network (samples need their map fetched first), so the very first Run makes
 * sound anywhere. Deterministic, so it lands in loop mode.
 */
export const INITIAL_TEXT = `note("<c3 eb3 g3 bb3>*4").s("sawtooth").lpf(600).room(.3)`;

export default defineSurface({
	params: {
		...transportParams,
		/**
		 * THE VIEW SWITCH - same mechanism as the MIDI device: a native `live.text` button
		 * that flips between the web editor and the native transport panel where the
		 * macro-mappable Play/Stop lives.
		 */
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

	/**
	 * The native panel behind the view switch: the macro-mappable Play/Stop plus the
	 * eight slider knobs - the FX device's knob-panel mechanism, two rows.
	 */
	layout: {
		native: {
			params: ["play", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"],
			// Play alone on the first row, then the eight dials in two rows of four.
			// Column-major (`rows: 2`) put Play in the same column as S1 and marched
			// the rest across in pairs, which is why the panel looked scattered.
			rows: [1, 4, 4],
			panel: true,
			switch: "transport",
		},
	},

	/** The pattern, saved with the set and shared with the Studio window. */
	state: {
		code: codeSlot(INITIAL_TEXT),
		/**
		 * The device view's scratchpad - EMPTY by default, and empty is its normal
		 * state. It is not where the music is written (that is `code`, in the Studio):
		 * it is where a `scope()` or a control snippet goes, and it runs on the device
		 * page's own engine so it can draw and sound in its own right.
		 */
		miniCode: codeSlot(""),
		/** What the caret is on, so the floating help can follow the typing. */
		helpQuery: helpQuerySlot(),
	},

	windows: {
		/** The reference, one `?` away. This device runs ALL of Strudel, so it lists everything. */
		help: window({ title: "Strudel Reference", width: 420, height: 620, entry: "Help", alwaysOnTop: true }),
		/** The Full Studio - room to write. An editor, not an engine (see midi/surface.ts). */
		studio: window({ title: "Strudel Studio", width: 720, height: 560, entry: "StudioWindow", alwaysOnTop: true }),
		/** strudel.cc itself, in a floating window (About > Advanced). */
		strudel: window({ title: "strudel.cc", width: 1100, height: 760, entry: "StrudelSite" }),
		/**
		 * The REAL local strudel.cc, and the device's SOUND (doc/TODO.md item 1).
		 *
		 * `site:` is the whole app built offline by scripts/build-repl.mjs - its own
		 * editor, its own scheduler, its own superdough, its own visualisers - and
		 * `audio: true` makes the page a `[jweb~]` whose output IS the track. It runs
		 * whether or not the window is open (spike 1, verified in Live).
		 *
		 * It stands NEXT TO the hand-rolled `studio` for now, deliberately: the old
		 * editor and the online redirect are only deleted once this one has parity.
		 */
		repl: window({
			title: "Strudel Studio",
			width: 1100,
			height: 760,
			audio: true,
			site: "dist/repl-site",
			// This is a window you WORK in while the set plays, so the default -
			// falling behind Live the moment Live is clicked - is wrong for it.
			alwaysOnTop: true,
		}),
	},
});
