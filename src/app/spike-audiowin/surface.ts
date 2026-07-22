/**
 * surface.ts (spike-audiowin) - SCRATCH DEVICE, not shipped.
 *
 * It exists to answer ONE question, the one the whole local-strudel.cc item hangs
 * on (doc/TODO.md item 1, spike 1): does a page inside a WINDOW reach the track's
 * audio, and does it keep playing when the window is closed?
 *
 * So the device is the smallest thing that can ask it: no parameters, no state, one
 * window declared `audio: true` whose page holds a 220 Hz oscillator and nothing
 * else. If the tone is on the track meter with the window shut, the Studio can own
 * the engine. If it is not, the item falls back to the editor-only shape.
 *
 * Delete this folder, and its entry in patcher/devices.mjs, once the finding is
 * recorded in doc/TODO.md.
 */
import { defineSurface, window } from "@m4l-jweb/surface";

export default defineSurface({
	params: {},
	state: {},
	windows: {
		tone: window({ title: "Spike Tone", width: 420, height: 240, entry: "Tone", audio: true }),
	},
});
