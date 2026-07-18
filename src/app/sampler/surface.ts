/**
 * surface.ts (sampler) - the transport parameter, and the pattern the CODE screen plays.
 *
 * The Sampler is now a two-screen device: a CODE screen that runs a Strudel `s(...)`
 * pattern through the shared engine, and a KIT screen (the pad grid) that builds it. The
 * engine needs the same two things the MIDI devices give it - a `play` parameter and a
 * `code` state slot - so they are declared here.
 *
 * The two screens are BOTH web UI, flipped by an in-app button, so there is no native
 * panel and no `layout.native` here (unlike the MIDI device's transport panel). `play` is
 * a real, macro-mappable Live parameter all the same, so a Rack macro can start the kit.
 *
 * NO `?` window: a pad grid needs no Strudel reference. The pad NAMES (the `s()` tokens)
 * are held as UI state for now, not a state slot - kit persistence is unchanged from the
 * MIDI-only version.
 */
import { defineSurface } from "@m4l-jweb/surface";
import { transportParams, codeSlot } from "../shared/surface";

/** What a fresh Sampler opens with: a two-layer drum line naming the default pads. */
export const INITIAL_TEXT = 's("bd sd, hh*8")';

export default defineSurface({
	params: transportParams,

	/** The pattern the CODE screen runs, saved with the set. */
	state: {
		code: codeSlot(INITIAL_TEXT),
	},
});
