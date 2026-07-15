/**
 * chains.mjs - the chains that are specific to THIS project.
 *
 * @m4l-jweb/build ships a canned vocabulary (midiin, midiout, passthrough, gain,
 * lowpass, drive, download, samples) that covers the common shapes. Anything
 * device-specific belongs here, and importing this file is all it takes: the build
 * loads patcher/chains.mjs if it exists, and registerChain() mutates the shared
 * vocabulary before any device is generated.
 *
 * Two chains live here, both for the FX device: "strudel-delay" and "strudel-room",
 * which are Strudel's .delay() and .room(). They are local because the library's
 * vocabulary has no reverb or delay yet, and upstreaming them is gated behind a
 * question about whether .room() should populate a REAL Ableton Reverb instead -
 * see doc/TODO.md.
 *
 * WHAT USED TO BE HERE is the point of the current release: a
 * "strudel-sample-browser" chain built around [node.script], because in m4l-jweb
 * 0.5.0 nothing else in the stack could reach the network or the disk. It is gone.
 * The catalog is now a fetch() in the app ([jweb] is Chromium and always had one),
 * the download is the library's `download` chain ([maxurl] writes the file), and the
 * preview is its `samples` chain ([buffer~] -> [groove~], summed into the track).
 * Node for Max is unstable inside Live - from silently ignoring `script start` to
 * crashing the host, which is why the Strudel engine runs in a Web Worker - and the
 * library forbids it outright. This project was the last thing still using it.
 *
 * There used to be a "poly" chain too: a hand-rolled poly~ oscillator synth for an
 * "Audio" instrument device. It was removed - see doc/TODO.md for why and what
 * replaces it. The synth patch it depended on (ableton-amxd/voice.maxpat) is gone.
 */
import { box, line, registerChain } from "@m4l-jweb/build/chains";

registerChain("strudel-delay", (ctx) => {
	const { boxes, lines } = ctx;

	for (const ch of [0, 1]) {
		const [srcId, srcOut] = ctx.audioIn(ch);
		const side = "lr"[ch];
		const tapin = `obj-tapin-${side}`;
		const tapout = `obj-tapout-${side}`;
		const fbGain = `obj-fb-${side}`;
		const dryGain = `obj-dly-dry-${side}`;
		const wetGain = `obj-dly-wet-${side}`;
		const mix = `obj-dly-mix-${side}`;
		const inv = `obj-dly-inv-${side}`;
		
		boxes.push(box(tapin, "tapin~ 2000", { numinlets: 1, numoutlets: 1, outlettype: ["tapconnect"] }));
		boxes.push(box(tapout, "tapout~ 0", { numinlets: 1, numoutlets: 1, outlettype: ["signal"] }));
		boxes.push(box(fbGain, "*~ 0.", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		
		// DSP path
		lines.push(line(srcId, srcOut, tapin, 0));
		lines.push(line(tapin, 0, tapout, 0));
		lines.push(line(tapout, 0, fbGain, 0));
		lines.push(line(fbGain, 0, tapin, 0)); // Feedback loop
		
		// Parameter bindings
		fanParamInto(ctx, "delaytime", tapout, 0);
		fanParamInto(ctx, "delayfeedback", fbGain, 1);
		
		// Dry/Wet Mix
		boxes.push(box(dryGain, "*~ 1.", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		boxes.push(box(wetGain, "*~ 0.", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		boxes.push(box(mix, "+~", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		boxes.push(box(inv, "!- 1.", { numinlets: 2, numoutlets: 1, outlettype: ["float"] })); // 1 - mix
		
		lines.push(line(srcId, srcOut, dryGain, 0));
		lines.push(line(tapout, 0, wetGain, 0));
		lines.push(line(dryGain, 0, mix, 0));
		lines.push(line(wetGain, 0, mix, 1));
		
		fanParamInto(ctx, "delay", wetGain, 1);
		fanParamInto(ctx, "delay", inv, 0);
		lines.push(line(inv, 0, dryGain, 1)); // Inverted mix drives dry gain
		
		ctx.setAudioOut(ch, mix, 0);
	}
});

registerChain("strudel-room", (ctx) => {
	const { boxes, lines } = ctx;

	for (const ch of [0, 1]) {
		const [srcId, srcOut] = ctx.audioIn(ch);
		const side = "lr"[ch];
		const verb = `obj-verb-${side}`;
		const dryGain = `obj-verb-dry-${side}`;
		const wetGain = `obj-verb-wet-${side}`;
		const mix = `obj-verb-mix-${side}`;
		const inv = `obj-verb-inv-${side}`;
		
		// cverb~ defaults to a decent room sound; we send it signal on inlet 0.
		// It has one outlet (mono reverb per channel).
		boxes.push(box(verb, "cverb~", { numinlets: 2, numoutlets: 2, outlettype: ["signal", "signal"] }));
		
		lines.push(line(srcId, srcOut, verb, 0));
		
		// Dry/Wet Mix
		boxes.push(box(dryGain, "*~ 1.", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		boxes.push(box(wetGain, "*~ 0.", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		boxes.push(box(mix, "+~", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		boxes.push(box(inv, "!- 1.", { numinlets: 2, numoutlets: 1, outlettype: ["float"] }));
		
		lines.push(line(srcId, srcOut, dryGain, 0));
		lines.push(line(verb, 0, wetGain, 0));
		lines.push(line(dryGain, 0, mix, 0));
		lines.push(line(wetGain, 0, mix, 1));
		
		fanParamInto(ctx, "room", wetGain, 1);
		fanParamInto(ctx, "room", inv, 0);
		lines.push(line(inv, 0, dryGain, 1));
		
		ctx.setAudioOut(ch, mix, 0);
	}
});

/**
 * Wire a parameter into the thing it controls, from BOTH of its sources:
 *
 *   the OBJECT's outlet - a knob turn, an automation lane, a Push encoder.
 *   the ROUTE's outlet  - the value the app wrote.
 *
 * The second is not redundant, and leaving it out is a bug that has already
 * shipped once in this stack. The app's write reaches the live.* object as
 * `set <value>`, which updates it WITHOUT producing outlet output - so the object
 * never passes the app's value on, and the DSP sits where it was while the UI's
 * control appears to do nothing.
 *
 * @m4l-jweb has this helper internally and STILL does not export it as of 0.6.0
 * (checked: chains.mjs declares it, the package does not re-export it), so the copy
 * stays - it is four lines, and duplicating them is cheaper than being unable to
 * build a device-specific chain that touches a parameter. Delete it the day the
 * library exports its own. The boxes named here are created LATER, by the build's
 * applySurface() - a patchline may name a box that appears further down the array,
 * because a patcher is a graph, not a script.
 */
function fanParamInto(ctx, paramId, dstId, dstInlet) {
	if (!ctx.surface?.params?.[paramId]) {
		throw new Error(`the FX chains need a parameter "${paramId}" in src/app/fx/surface.ts`);
	}
	const [objId, objOut] = ctx.paramObject(paramId);
	const [routeId, routeOut] = ctx.paramValue(paramId);
	ctx.lines.push(line(objId, objOut, dstId, dstInlet));
	ctx.lines.push(line(routeId, routeOut, dstId, dstInlet));
}
