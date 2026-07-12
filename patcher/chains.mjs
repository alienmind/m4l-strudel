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
registerChain("sampler", ({ boxes, lines, jwebId, unmatchedId }) => {
	// An audio effect has no MIDI ports at all.
	removeBox(boxes, lines, "obj-midiin");
	removeBox(boxes, lines, "obj-midiout");

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

	// Preview player + passthrough.
	boxes.push(box("obj-plugin", "plugin~", { numinlets: 1, numoutlets: 2, outlettype: ["signal", "signal"] }));
	boxes.push(box("obj-sf", "sfplay~ 2", { numinlets: 1, numoutlets: 3, outlettype: ["signal", "signal", "bang"] }));
	boxes.push(
		box("obj-routes", "route preview_open preview_go preview_stop", {
			numoutlets: 4,
			outlettype: ["", "", "", ""],
		}),
	);
	boxes.push(box("obj-openmsg", "prepend open"));
	boxes.push(box("obj-gomsg", "t 1"), box("obj-stopmsg", "t 0"));
	boxes.push(box("obj-plugout", "plugout~", { numinlets: 2, numoutlets: 0 }));

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
	lines.push(line("obj-plugin", 0, "obj-plugout", 0));
	lines.push(line("obj-plugin", 1, "obj-plugout", 1));
	lines.push(line("obj-sf", 0, "obj-plugout", 0));
	lines.push(line("obj-sf", 1, "obj-plugout", 1));
});
