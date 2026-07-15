/**
 * surface.ts (midi) - the MIDI device's Live parameters.
 *
 * Just the transport toggle. Live's scale is not a parameter of this device - it
 * belongs to the SET, and is read through a LiveAPI observer (see wrapper/device.ts).
 */
import { defineSurface } from "@m4l-jweb/surface";
import { transportParams } from "../shared/surface";

export default defineSurface({
	params: transportParams,
});
