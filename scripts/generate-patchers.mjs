/**
 * generate-patchers.mjs - mutate the base ableton-amxd/patcher.json into the
 * three device variants (midi/sampler/audio), writing dist/patchers/<kind>.json.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = JSON.parse(readFileSync(path.join(root, "ableton-amxd", "patcher.json"), "utf8"));
mkdirSync(path.join(root, "dist", "patchers"), { recursive: true });

// midi: 'mmmm' MIDI effect. audio: 'iiii' instrument (MIDI in → audio out).
// sampler: 'aaaa' AUDIO effect - a MIDI-effect device has NO audio output
// path, so the BPM-synced preview (sfplay~ → plugout~) would be silent. As an
// audio effect it sits anywhere in an audio chain and passes input through,
// like Splice's Bridge plugin.
const AMXD = { midi: 1835887981, sampler: 1633771873, audio: 1768515945 };

// --- box factory helpers -----------------------------------------------
let y = 300; // place generated objects below the existing ones
const box = (id, text, extra = {}) => ({
	box: {
		id,
		maxclass: "newobj",
		text,
		numinlets: 1,
		numoutlets: 1,
		outlettype: [""],
		patching_rect: [16, (y += 32), 220, 20],
		...extra,
	},
});
const line = (srcId, srcOut, dstId, dstIn) => ({
	patchline: { source: [srcId, srcOut], destination: [dstId, dstIn] },
});

// --- transport tick chain (shared by all 3 devices) ---------------------
// plugsync~ outlets are SIGNALS. We snapshot bar/beat/unit/tempo/playing at 10ms
// and pak them into: "tick <bar> <beat> <unit> <tempo> <playing>"
// !! VERIFY OUTLET INDICES against the plugsync~ reference in Max 9 and fix
// the OUT map below; this is the single most likely constant to be wrong.
// Target: jweb for midi/audio (the engine Web Worker consumes ticks),
// node.script for the sampler (beat-synced preview timing).
const PLUGSYNC_OUT = { playing: 1, bar: 2, beat: 3, unit: 4, tempo: 6 };
function tickChain(boxes, lines, targetId) {
	boxes.push(box("obj-sync", "plugsync~", { numoutlets: 9, outlettype: Array(9).fill("signal"), numinlets: 1 }));
	const order = ["bar", "beat", "unit", "tempo", "playing"];
	order.forEach((k) => {
		boxes.push(box(`obj-snap-${k}`, "snapshot~ 10", { numinlets: 2, numoutlets: 1, outlettype: ["float"] }));
		lines.push(line("obj-sync", PLUGSYNC_OUT[k], `obj-snap-${k}`, 0));
	});
	boxes.push(box("obj-pak", "pak 0. 0. 0. 0. 0.", { numinlets: 5, numoutlets: 1, outlettype: [""] }));
	order.forEach((k, i) => lines.push(line(`obj-snap-${k}`, 0, "obj-pak", i)));
	boxes.push(box("obj-ticktag", "prepend tick"));
	lines.push(line("obj-pak", 0, "obj-ticktag", 0));
	lines.push(line("obj-ticktag", 0, targetId, 0));
}

// --- MIDI output chain: jweb → pipe → makenote → midiformat → midiout ---
// the engine worker (via the UI) emits: "midinote <pitch> <vel> <durMs> <chan> <delayMs>"
function midiOutChain(boxes, lines, srcId) {
	boxes.push(box("obj-route", "route midinote flush", { numoutlets: 3, outlettype: ["", "", ""] }));
	boxes.push(
		box("obj-pipe", "pipe 0 0 0 0 0", {
			// 4 data inlets + delay
			numinlets: 5,
			numoutlets: 4,
			outlettype: ["int", "int", "int", "int"],
		}),
	);
	boxes.push(box("obj-makenote", "makenote 100 250", { numinlets: 3, numoutlets: 2, outlettype: ["int", "int"] }));
	boxes.push(box("obj-packnote", "pack 0 0", { numinlets: 2, numoutlets: 1, outlettype: [""] }));
	boxes.push(box("obj-fmt", "midiformat", { numinlets: 7, numoutlets: 1, outlettype: ["int"] }));
	// route strips the selector: a bare "flush" message comes out of outlet 1
	// as a bang, which makenote ignores - re-materialize the word via a
	// message box so makenote actually releases hanging notes.
	boxes.push(box("obj-flushmsg", "flush", { maxclass: "message", numinlets: 2, numoutlets: 1 }));
	// Explicit unpack instead of relying on pipe's list-spread reaching the
	// delay inlet: unpack fires right-to-left, so the delay (outlet 4) lands
	// in pipe's delay inlet before the pitch (outlet 0) hits the hot inlet.
	boxes.push(
		box("obj-unpack", "unpack 0 0 0 0 0", {
			numinlets: 1,
			numoutlets: 5,
			outlettype: ["int", "int", "int", "int", "int"],
		}),
	);
	// Console tap: every scheduled note prints "strudel-midi: <p> <v> <d> <c> <delay>"
	boxes.push(box("obj-midiprint", "print strudel-midi"));
	lines.push(line(srcId, 0, "obj-route", 0));
	lines.push(line("obj-route", 0, "obj-unpack", 0)); // midinote payload
	lines.push(line("obj-route", 0, "obj-midiprint", 0));
	lines.push(line("obj-route", 1, "obj-flushmsg", 0)); // "flush" → note-offs
	lines.push(line("obj-flushmsg", 0, "obj-makenote", 0));
	// unmatched messages (ui_ready/write_clip/read_notes) continue to [js]
	lines.push(line("obj-route", 2, "obj-2", 0));
	for (let i = 0; i < 5; i++) lines.push(line("obj-unpack", i, "obj-pipe", i));
	lines.push(line("obj-pipe", 0, "obj-makenote", 0)); // pitch
	lines.push(line("obj-pipe", 1, "obj-makenote", 1)); // velocity
	lines.push(line("obj-pipe", 2, "obj-makenote", 2)); // duration ms
	lines.push(line("obj-pipe", 3, "obj-fmt", 6)); // channel → midiformat channel inlet
	lines.push(line("obj-makenote", 0, "obj-packnote", 0));
	lines.push(line("obj-makenote", 1, "obj-packnote", 1));
	lines.push(line("obj-packnote", 0, "obj-fmt", 0));
	lines.push(line("obj-fmt", 0, "obj-midiout", 0));
}

function makeDevice(kind) {
	const p = structuredClone(base);
	const { boxes, lines } = p.patcher;
	p.patcher.project.amxdtype = AMXD[kind];

	// 1. every device: js gets a mode jsargument
	const js = boxes.find((b) => b.box.id === "obj-2").box;
	js.text = `js strudel-wrapper.js ${kind}`;

	// 2. Boot probe: proves the GENERATED boxes instantiate in the loaded
	// device. If the console never shows "strudel-gen: bang", Max dropped this
	// part of the patcher and no other generated object exists either.
	boxes.push(box("obj-genlb", "loadbang"));
	boxes.push(box("obj-genprint", "print strudel-gen"));
	lines.push(line("obj-genlb", 0, "obj-genprint", 0));

	// 3. Engine host. midi/audio: the Strudel engine runs in a Web Worker
	// inside jweb - ticks go INTO jweb, note events come OUT of jweb, no
	// node.script at all (Node for Max was unstable in Live: silent
	// non-starts, then a full Live crash). sampler: node.script remains for
	// fetch + filesystem work that jweb cannot do.
	const nodeId = "obj-node";
	if (kind === "sampler") {
		boxes.push(
			box(nodeId, `node.script strudel-node-${kind}.cjs @autostart 0 @watch 0`, {
				numinlets: 1,
				numoutlets: 2,
				outlettype: ["", ""],
			}),
		);
		// node.script's right outlet reports lifecycle/status - keep it
		// visible in the Max console for field debugging.
		boxes.push(box("obj-nodeprint", "print n4m"));
		lines.push(line(nodeId, 1, "obj-nodeprint", 0));
		tickChain(boxes, lines, nodeId);
		// jweb → node (load_map/preview/download - node ignores js messages)
		lines.push(line("obj-jweb", 0, nodeId, 0));
		// js → node (scale updates, "script start" bootstrap)
		lines.push(line("obj-2", 1, nodeId, 0));
	} else {
		tickChain(boxes, lines, "obj-jweb");
	}

	if (kind === "midi") {
		// jweb output fans into the MIDI chain; unmatched selectors
		// (ui_ready/write_clip/read_notes) continue to [js] via the route's
		// rightmost outlet, replacing the direct jweb → js patchline.
		for (let i = lines.length - 1; i >= 0; i--) {
			const pl = lines[i].patchline;
			if (pl.source[0] === "obj-jweb" && pl.destination[0] === "obj-2") lines.splice(i, 1);
		}
		midiOutChain(boxes, lines, "obj-jweb");
		// keep the direct midiin→midiout thru: Live merges streams; remove
		// only if double-noting is observed.
	}
	if (kind === "sampler") {
		// Audio effect ('aaaa'): remove midiin/midiout, add plugin~ → plugout~ passthrough.
		for (const id of ["obj-midiin", "obj-midiout"]) {
			const i = boxes.findIndex((b) => b.box.id === id);
			if (i >= 0) boxes.splice(i, 1);
			for (let j = lines.length - 1; j >= 0; j--) {
				const pl = lines[j].patchline;
				if (pl.source[0] === id || pl.destination[0] === id) lines.splice(j, 1);
			}
		}
		boxes.push(box("obj-plugin", "plugin~", { numinlets: 1, numoutlets: 2, outlettype: ["signal", "signal"] }));
		// Preview player. Timing model: NODE does the quantization (setTimeout to the
		// next beat, see sampler/main.mjs "preview" handler) and emits a bare
		// "preview_go" at the right moment - 5-10ms jitter is fine for previewing.
		// Max side is therefore trivially simple:
		//   "preview_open <path>" → sfplay~ open   |  "preview_go" → 1  |  "preview_stop" → 0
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
		// unmatched messages (catalog/downloaded/progress/fetcherr/engine_ready) → UI
		lines.push(line("obj-routes", 3, "obj-jweb", 0));
		// passthrough + preview mix (multiple signal cords into one inlet sum in MSP)
		lines.push(line("obj-plugin", 0, "obj-plugout", 0));
		lines.push(line("obj-plugin", 1, "obj-plugout", 1));
		lines.push(line("obj-sf", 0, "obj-plugout", 0));
		lines.push(line("obj-sf", 1, "obj-plugout", 1));
	}
	if (kind === "audio") {
		// jweb emits: "voice <note> <vel01> <durMs> <wave> <cutoff> <gain> <delayMs>"
		// and "allnotesoff" on stop (no consumer yet - poly~ voices release on
		// their own envelopes; wire "target 0, mute 1" here if voices hang).
		// Unmatched selectors continue to [js], replacing the jweb → js line.
		for (let i = lines.length - 1; i >= 0; i--) {
			const pl = lines[i].patchline;
			if (pl.source[0] === "obj-jweb" && pl.destination[0] === "obj-2") lines.splice(i, 1);
		}
		boxes.push(box("obj-routev", "route voice allnotesoff", { numoutlets: 3, outlettype: ["", "", ""] }));
		boxes.push(box("obj-pipev", "pipe 0 0. 0 s 0. 0. 0", { numinlets: 7, numoutlets: 6 }));
		boxes.push(box("obj-notemsg", "prepend note"));
		boxes.push(
			// filename must match the frozen extra file's basename (ableton-amxd/voice.maxpat,
			// passed to build-amxd.mjs by postbuild.mjs for the "audio" device).
			box("obj-poly", "poly~ voice.maxpat 16 @steal 1", {
				numinlets: 1,
				numoutlets: 2,
				outlettype: ["signal", "signal"],
			}),
		);
		boxes.push(box("obj-plugout", "plugout~", { numinlets: 2, numoutlets: 0 }));
		// remove midiout (device is an instrument: midiin stays, audio goes out)
		const moIdx = boxes.findIndex((b) => b.box.id === "obj-midiout");
		boxes.splice(moIdx, 1);
		for (let i = lines.length - 1; i >= 0; i--)
			if (lines[i].patchline.destination[0] === "obj-midiout") lines.splice(i, 1);
		// Same explicit right-to-left unpack as the MIDI chain (delay last inlet).
		boxes.push(
			box("obj-unpackv", "unpack 0 0. 0 s 0. 0. 0", {
				numinlets: 1,
				numoutlets: 7,
				outlettype: ["int", "float", "int", "", "float", "float", "int"],
			}),
		);
		boxes.push(box("obj-voiceprint", "print strudel-voice"));
		lines.push(line("obj-jweb", 0, "obj-routev", 0));
		lines.push(line("obj-routev", 0, "obj-unpackv", 0));
		lines.push(line("obj-routev", 0, "obj-voiceprint", 0));
		for (let i = 0; i < 7; i++) lines.push(line("obj-unpackv", i, "obj-pipev", i));
		// unmatched messages (ui_ready/write_clip/read_notes) → [js]
		lines.push(line("obj-routev", 2, "obj-2", 0));
		// pipev outlets (right-to-left) re-packed into a single "note ..." list:
		boxes.push(box("obj-pakv", "pak 0 0. 0 s 0. 0.", { numinlets: 6, numoutlets: 1 }));
		for (let i = 0; i < 6; i++) lines.push(line("obj-pipev", i, "obj-pakv", i));
		lines.push(line("obj-pakv", 0, "obj-notemsg", 0));
		lines.push(line("obj-notemsg", 0, "obj-poly", 0));
		lines.push(line("obj-poly", 0, "obj-plugout", 0));
		lines.push(line("obj-poly", 1, "obj-plugout", 1));
	}
	writeFileSync(path.join(root, "dist", "patchers", `${kind}.json`), JSON.stringify(p, null, "\t"));
	console.log(`generate-patchers: ${kind}.json (amxdtype ${AMXD[kind]})`);
}

for (const k of ["midi", "sampler", "audio"]) makeDevice(k);
