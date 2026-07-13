/**
 * chains.mjs - the chains that are specific to THIS project.
 *
 * @m4l-jweb/build ships a canned vocabulary (midiin, midiout, passthrough,
 * gain, lowpass) that covers the common shapes. Anything device-specific
 * belongs here, and importing this file is all it takes: the build loads
 * patcher/chains.mjs if it exists, and registerChain() mutates the shared
 * vocabulary before any device is generated.
 *
 * One chain lives here today:
 *
 *   sampler  - [node.script] + an sfplay~ preview (the Samples device).
 *
 * This is the ONLY place in this project that uses node.script, and the
 * library deliberately does not support it: Node for Max is unstable inside Live
 * (silently ignoring `script start`, and at worst crashing the host), which is
 * why the Strudel engine itself runs in a Web Worker instead. The sampler pays
 * that cost because it genuinely needs the OS - HTTP fetch and a filesystem -
 * and a Web Worker has neither. Keeping it here keeps the risk where it is
 * understood.
 *
 * There used to be a second chain, "poly": a hand-rolled poly~ oscillator
 * synth for an "Audio" instrument device. It was removed - see doc/TODO.md for
 * why and what replaces it. The synth patch it depended on
 * (ableton-amxd/voice.maxpat) is gone too.
 */
import { box, line, registerChain, removeBox } from "@m4l-jweb/build/chains";

/**
 * "sampler" - the sample-fetcher device (an audio effect).
 *
 * node.script does the work jweb cannot: HTTP fetch and filesystem. It also does
 * the preview QUANTIZATION (setTimeout to the next beat, see
 * src/max/sampler/main.mjs) and emits a bare `preview_go` at the right moment -
 * 5-10 ms of jitter is fine for auditioning. So the Max side stays trivial:
 *
 *   preview_open <path>  -> sfplay~ open
 *   preview_go           -> 1
 *   preview_stop         -> 0
 */
registerChain("sampler", (ctx) => {
	const { boxes, lines, jwebId, unmatchedId } = ctx;

	// @autostart 0: [js] owns the start sequence (see wrapper/device.ts), so the
	// script is only started once the payload is known to be extracted.
	// @watch 0: no filesystem watching inside a shipped device.
	const nodeId = "obj-node";
	boxes.push(
		box(nodeId, "node.script strudel-node-sampler.cjs @autostart 0 @watch 0", {
			numinlets: 1,
			numoutlets: 2,
			outlettype: ["", ""],
		}),
	);
	// node.script's RIGHT outlet is lifecycle/status. Keep it in the Max console:
	// it is the only way to tell "the script never started" from "the message
	// never arrived".
	boxes.push(box("obj-nodeprint", "print n4m"));
	lines.push(line(nodeId, 1, "obj-nodeprint", 0));

	// jweb -> node (load_map / preview / download). node ignores what is not its.
	lines.push(line(jwebId, 0, nodeId, 0));
	// js -> node (ticks, tempo, scale, and the "script start" bootstrap).
	lines.push(line(unmatchedId, 1, nodeId, 0));

	boxes.push(box("obj-openmsg", "prepend open"));
	boxes.push(box("obj-gomsg", "t 1"), box("obj-stopmsg", "t 0"));

	lines.push(line(nodeId, 0, "obj-routes", 0));
	lines.push(line("obj-routes", 0, "obj-openmsg", 0));
	lines.push(line("obj-openmsg", 0, "obj-sf", 0));
	lines.push(line("obj-routes", 1, "obj-gomsg", 0));
	lines.push(line("obj-gomsg", 0, "obj-sf", 0)); // 1 = start playback
	lines.push(line("obj-routes", 2, "obj-stopmsg", 0));
	lines.push(line("obj-stopmsg", 0, "obj-sf", 0)); // 0 = stop
	// Unmatched node replies (catalog / downloaded / progress / fetcherr /
	// engine_ready) go on to the UI.
	lines.push(line("obj-routes", 3, jwebId, 0));

	// Passthrough + preview mix. Multiple signal cords into one inlet SUM in MSP.
	for (const ch of [0, 1]) {
		const [srcId, srcOut] = ctx.audioIn(ch);
		const mixId = `obj-mix-${ch}`;
		boxes.push(box(mixId, "+~", { numinlets: 2, numoutlets: 1, outlettype: ["signal"] }));
		lines.push(line(srcId, srcOut, mixId, 0));
		lines.push(line("obj-sf", ch, mixId, 1));
		ctx.setAudioOut(ch, mixId, 0);
	}
});

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
 * @m4l-jweb has this helper internally but does not export it; it is four lines,
 * and duplicating them is cheaper than being unable to build a device-specific
 * chain that touches a parameter. The boxes named here are created LATER, by the
 * build's applySurface() - a patchline may name a box that appears further down
 * the array, because a patcher is a graph, not a script.
 */
function fanParamInto(ctx, paramId, dstId, dstInlet) {
	if (!ctx.surface?.params?.[paramId]) {
		throw new Error(`chain "strudelfx" needs a parameter "${paramId}" in src/app/fx/surface.ts`);
	}
	const [objId, objOut] = ctx.paramObject(paramId);
	const [routeId, routeOut] = ctx.paramValue(paramId);
	ctx.lines.push(line(objId, objOut, dstId, dstInlet));
	ctx.lines.push(line(routeId, routeOut, dstId, dstInlet));
}
