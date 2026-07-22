/**
 * surface.ts (midi) - the MIDI device's Live parameters.
 *
 * Just the transport toggle. Live's scale is not a parameter of this device - it
 * belongs to the SET, and is read through a LiveAPI observer (see wrapper/device.ts).
 */
import { button, defineSurface, window } from "@m4l-jweb/surface";
import { codeSlot, helpQuerySlot, transportParams } from "../shared/surface";

/**
 * The pattern this device opens with - its own idiom, not a shared one.
 *
 * It lives HERE, and useStrudel.ts imports it, rather than the other way round: the
 * BUILD loads surface.ts (loadSurface) outside vite, in a plain node context, so
 * anything surface.ts imports is dragged in with it. Importing it from useStrudel.ts
 * pulled the engine - and its `?worker&inline` import - into the build, which esbuild
 * cannot resolve. A surface must stay reachable with no app runtime behind it.
 */
export const INITIAL_TEXT = "<c3 c3 <c3 c#3>>*16";

export default defineSurface({
	params: {
		...transportParams,
		/**
		 * THE VIEW SWITCH - a native `live.text` button pinned top-right (over the web UI's
		 * own reveal button), the way the FX device's `knobs` switch works. On = the native
		 * transport panel (where the macro-mappable Play/Stop lives), off = the web editor.
		 * The panel exists ONLY so the transport parameter has somewhere visible to be
		 * clicked when mapping a Rack macro; the pattern editor stays the default view.
		 */
		transport: button({ default: false, label: "Back", short: "Back" }),
	},

	/**
	 * The native transport panel: just the Play/Stop parameter, revealed behind the
	 * `transport` switch. `panel: true` layers it over the (full-width) web UI and the app
	 * flips between them (useNativePanel); one row, since it holds a single control.
	 */
	layout: {
		native: {
			params: ["play"],
			rows: 1,
			panel: true,
			switch: "transport",
		},
	},

	/** The pattern, saved with the set and shared with the Studio window. */
	state: {
		code: codeSlot(INITIAL_TEXT),
		/** What the caret is on, so the floating help can follow the typing. */
		helpQuery: helpQuerySlot(),
	},

	windows: {
		/** The reference, one `?` away. Tall and narrow: it is a list you scroll. */
		help: window({ title: "Strudel Reference", width: 420, height: 620, entry: "Help", alwaysOnTop: true }),
		/** strudel.cc itself, in a floating window (About > Advanced). The bundled page just
		 *  navigates to the site - a plain browser tab's worth of the web playground. */
		strudel: window({ title: "strudel.cc", width: 1100, height: 760, entry: "StrudelSite" }),
	},
});
