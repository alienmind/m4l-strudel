/**
 * surface.ts (midi) - the device's Live parameters, declared as code.
 *
 * This device has none today: it is driven entirely by the typed pattern and
 * the Run/Hush/To Clip/From Clip buttons, not by knobs. Kept as an empty
 * declaration (rather than omitted) so the shape matches every other device in
 * the M4L-JWEB ecosystem, and so adding a real parameter later (e.g. a
 * "density" dial automating .sometimesBy()) is a one-line addition here.
 *
 * STATUS: this declaration is typechecked and validated, but the codegen that
 * turns it into live.* objects is not built yet (m4l-jweb's doc/TODO.md, Stage
 * 2). There is nothing in patcher/devices.mjs's `parameters` to keep in step
 * with, because there is nothing to declare.
 */
import { defineSurface, toggle } from "@m4l-jweb/surface";

export default defineSurface({
	params: {
		play: toggle({ default: false, short: "Play" }),
	},
});
