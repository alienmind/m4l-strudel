/**
 * surface.ts (sampler) - the device's Live parameters, declared as code.
 *
 * Empty: this device has no automatable controls (it is a browser/downloader,
 * not a performance surface). Kept as an empty declaration for the same reason
 * as midi/surface.ts - a consistent shape across every device.
 */
import { defineSurface } from "@m4l-jweb/surface";

export default defineSurface({
	params: {},
});
