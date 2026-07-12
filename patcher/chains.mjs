/**
 * chains.mjs - the chains that are specific to THIS project.
 *
 * @m4l-jweb/build ships a canned vocabulary (midiin, midiout, passthrough) that
 * covers the common shapes. Anything device-specific belongs here, and importing
 * this file is all it takes: the build loads patcher/chains.mjs if it exists, and
 * registerChain() mutates the shared vocabulary before any device is generated.
 *
 * Two chains live here, both for reasons the library should not have to know:
 *
 *   poly     - a message-driven poly~ synth voice bank (the instrument device).
 *   sampler  - [node.script] + an sfplay~ preview (the sampler device).
 *
 * The sampler is the ONLY place in this project that uses node.script, and the
 * library deliberately does not support it: Node for Max is unstable inside Live
 * (silently ignoring `script start`, and at worst crashing the host), which is
 * why the Strudel engine itself runs in a Web Worker instead. The sampler pays
 * that cost because it genuinely needs the OS - HTTP fetch and a filesystem -
 * and a Web Worker has neither. Keeping it here keeps the risk where it is
 * understood.
 */
import { box, line, registerChain, removeBox } from "@m4l-jweb/build/chains";

/**
 * "poly" - the instrument device.
 *
 * The app emits `voice <note> <vel01> <durMs> <wave> <cutoff> <gain> <delayMs>`
 * and `allnotesoff`. Compute WHEN in the worker; let Max place the note.
 */
registerChain("poly", ({ boxes, lines, jwebId, unmatchedId }) => {
	// This chain owns jweb's output, so the template's direct jweb -> js cord is
	// replaced by the route's unmatched outlet.
	for (let i = lines.length - 1; i >= 0; i--) {
		const pl = lines[i].patchline;
		if (pl.source[0] === jwebId && pl.destination[0] === unmatchedId) lines.splice(i, 1);
	}

	// An instrument has MIDI in and audio out: midiout goes.
	removeBox(boxes, lines, "obj-midiout");

	boxes.push(box("obj-routev", "route voice allnotesoff", { numoutlets: 3, outlettype: ["", "", ""] }));
	// Same right-to-left unpack as the packaged midiout chain: the delay must
	// reach pipe's cold inlet before the note hits the hot one.
	boxes.push(
		box("obj-unpackv", "unpack 0 0. 0 s 0. 0. 0", {
			numinlets: 1,
			numoutlets: 7,
			outlettype: ["int", "float", "int", "", "float", "float", "int"],
		}),
	);
	boxes.push(box("obj-pipev", "pipe 0 0. 0 s 0. 0. 0", { numinlets: 7, numoutlets: 6 }));
	boxes.push(box("obj-pakv", "pak 0 0. 0 s 0. 0.", { numinlets: 6, numoutlets: 1 }));
	boxes.push(box("obj-notemsg", "prepend note"));
	// The filename must match the frozen extra file's basename - see the
	// manifest's extraFiles. poly~ is Max-native, so it CAN read it while frozen.
	boxes.push(
		box("obj-poly", "poly~ voice.maxpat 16 @steal 1", {
			numinlets: 1,
			numoutlets: 2,
			outlettype: ["signal", "signal"],
		}),
	);
	boxes.push(box("obj-plugout", "plugout~", { numinlets: 2, numoutlets: 0 }));
	boxes.push(box("obj-voiceprint", "print strudel-voice"));

	lines.push(line(jwebId, 0, "obj-routev", 0));
	lines.push(line("obj-routev", 0, "obj-unpackv", 0));
	lines.push(line("obj-routev", 0, "obj-voiceprint", 0));
	for (let i = 0; i < 7; i++) lines.push(line("obj-unpackv", i, "obj-pipev", i));
	for (let i = 0; i < 6; i++) lines.push(line("obj-pipev", i, "obj-pakv", i));
	lines.push(line("obj-pakv", 0, "obj-notemsg", 0));
	lines.push(line("obj-notemsg", 0, "obj-poly", 0));
	lines.push(line("obj-poly", 0, "obj-plugout", 0));
	lines.push(line("obj-poly", 1, "obj-plugout", 1));
	// allnotesoff has no consumer: poly~ voices release on their own envelopes.
	// Wire "target 0, mute 1" here if voices are ever observed hanging.
	lines.push(line("obj-routev", 2, unmatchedId, 0)); // ui_ready / write_clip / read_notes
});

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
