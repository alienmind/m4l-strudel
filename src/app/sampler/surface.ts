/**
 * surface.ts (sampler) - no Live parameters, no reference window.
 *
 * A drum rack's performance surface is its PADS, and a pad is struck by MIDI, not
 * turned like a knob - Live only automates numbers, and there are none here to
 * automate. The eight sample assignments are a patch, not a performance control;
 * they persist as the device's state, not as parameters.
 *
 * NO `?` WINDOW: like the sample browser, this device takes no Strudel input, so a
 * Strudel reference would answer a question nobody typing here is asking. Kept as an
 * empty declaration for a consistent shape across every device.
 */
import { defineSurface } from "@m4l-jweb/surface";

export default defineSurface({
	params: {},
});
