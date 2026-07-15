/**
 * surface.ts (shared) - the parameters both MIDI devices declare.
 *
 * The PARAMS, not a Surface. Each device builds its own Surface from these, because
 * a device's own surface.ts is what the build reads to generate its live.* objects,
 * and the drums device now declares something the MIDI device does not: its drum map,
 * as state that travels with the Live set.
 *
 * DO NOT go back to sharing one Surface OBJECT between them. It compiles, and it
 * works - right up until the two devices' surfaces diverge, at which point a bundle
 * holds two Surfaces both declaring `play`, each with a store of its own, and the
 * bridge keeps exactly ONE handler per selector: the second `bindInlet("play")`
 * silently replaces the first, and a Play toggle stops following Live with no error
 * anywhere. One Surface per device, built from these.
 */
import { toggle } from "@m4l-jweb/surface";

/** The transport toggle: automatable, so a pattern can be run from an arrangement. */
export const transportParams = {
	play: toggle({ default: false, short: "Play" }),
};
