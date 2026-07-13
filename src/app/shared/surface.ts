/**
 * surface.ts (shared) - the device's Live parameters, declared as code.
 *
 * The MIDI and Drums devices declare a 'play' toggle to automate their transport.
 */
import { defineSurface, toggle } from "@m4l-jweb/surface";

export default defineSurface({
	params: {
		play: toggle({ default: false, short: "Play" }),
	},
});
