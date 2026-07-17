/**
 * surface.ts (sampler-browser) - no Live parameters, and no reference window.
 *
 * The browser has nothing to automate: picking a map and auditioning a sample are
 * choices, not performance controls, and Live only automates numbers. Kept as an empty
 * declaration for the same reason as midi/surface.ts - a consistent shape across every
 * device.
 *
 * NO `?` WINDOW, deliberately. The other three devices take Strudel as input, so "which
 * features are supported" is a real question you can be stuck on mid-pattern. This one
 * takes no Strudel at all - it is a catalog, a download and an audition - so a Strudel
 * reference here answered a question nobody was asking, which is worse than no help: it
 * implies you can type something into a device that has no box to type it into.
 */
import { defineSurface } from "@m4l-jweb/surface";

export default defineSurface({
	params: {},
});
