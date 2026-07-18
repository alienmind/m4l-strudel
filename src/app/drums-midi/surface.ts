/**
 * surface.ts (midi-drums) - the drums device's Live parameters, and its STATE.
 *
 * The drum map is the thing this device is FOR - which word plays which pad - and
 * until now it lived in the page's localStorage. That survived a reload of the device
 * and nothing else: it did not travel with the Live set, it was not per-instance (two
 * copies of the device on two tracks shared one map, and the last one to save won),
 * and it did not follow the set to another machine.
 *
 * `state` is the fix, and it is a DECLARATION, not an API call: the build compiles it
 * into a [dict] with a [pattr] bound to it, marked as a Live parameter of blob type -
 * which is the one thing that makes Live save it with the SET. `useStateSync()` is
 * the two-way binding, typed from the `default` below with nothing to cast.
 *
 * It is deliberately NOT a parameter: Live never looks inside it, it cannot be
 * automated, and it has no business on Push. A map of eleven words to eleven pads is
 * not a number.
 */
import { defineSurface, state, window } from "@m4l-jweb/surface";
import { DEFAULT_DRUM_MAP } from "@/lib/mini/drums";
import { codeSlot, helpQuerySlot, transportParams } from "../shared/surface";

/** The pattern this device opens with. It lives here, not in useStrudel.ts, because the
 *  BUILD loads surface.ts outside vite - see midi/surface.ts for the full reason. */
export const INITIAL_TEXT = 's("bd hh sd hh")';

export default defineSurface({
	params: transportParams,
	state: {
		drumMap: state({ default: DEFAULT_DRUM_MAP }),
		/** The pattern, saved with the set and shared with the Studio window. */
		code: codeSlot(INITIAL_TEXT),
		/** What the caret is on, so the floating help can follow the typing. */
		helpQuery: helpQuerySlot(),
	},
	/**
	 * The drum map is what this device is FOR, and the device view is a fixed
	 * ~169 px - the in-view DrumRack shows a 16-pad window and a scroll stripe, but
	 * only one octave-and-a-third at a time. `editor` is an OPTIONAL bigger view of
	 * the SAME map: the same DrumRack given the whole C1..C6 range at once. It reads
	 * and writes the `drumMap` state slot via useStateSync, so edits in the window
	 * and edits in the mini rack are the same data and stay in sync live (the library
	 * broadcasts each write to every view). The mini rack is not replaced - the window
	 * is a second, roomier way to reach the same thing.
	 */
	windows: {
		editor: window({ title: "Strudel Drum Map", width: 480, height: 560, entry: "Window" }),
		/** The reference, one `?` away. Tall and narrow: it is a list you scroll. */
		help: window({ title: "Strudel Reference", width: 420, height: 620, entry: "Help", alwaysOnTop: true }),
		/** Room to write. An EDITOR only - the device view's engine still schedules
		 *  everything, because it is the only thing that receives `tick`. See
		 *  midi/surface.ts for the full reasoning. */
		studio: window({ title: "Strudel Studio", width: 720, height: 560, entry: "StudioWindow", alwaysOnTop: true }),
	},
});
