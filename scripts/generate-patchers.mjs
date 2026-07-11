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
const PLUGSYNC_OUT = { playing: 1, bar: 2, beat: 3, unit: 4, tempo: 6 };
function tickChain(boxes, lines, nodeId) {
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
	lines.push(line("obj-ticktag", 0, nodeId, 0));
}

// --- MIDI output chain: node → pipe → makenote → midiformat → midiout ---
// node emits: "midinote <pitch> <vel> <durMs> <chan> <delayMs>"
function midiOutChain(boxes, lines, nodeId) {
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
	lines.push(line(nodeId, 0, "obj-route", 0));
	lines.push(line("obj-route", 0, "obj-pipe", 0)); // midinote payload
	lines.push(line("obj-route", 1, "obj-makenote", 0)); // "flush" → makenote (note-offs)
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

	// 2. every device: a node.script (autostart; watch off in production)
	const nodeId = "obj-node";
	boxes.push(
		box(nodeId, `node.script strudel-node-${kind}.cjs @autostart 1 @watch 0`, {
			numinlets: 1,
			numoutlets: 2,
			outlettype: ["", ""],
		}),
	);
	tickChain(boxes, lines, nodeId);

	// 3. jweb → node (code/hush/etc. — node ignores messages meant for js)
	lines.push(line("obj-jweb", 0, nodeId, 0));
	// 4. js → node (scale updates, node_path handshake)
	//    js outlet 1 currently goes to print; repurpose outlet 1 → node
	lines.push(line("obj-2", 1, nodeId, 0));

	if (kind === "midi") {
		midiOutChain(boxes, lines, nodeId);
		// sever the direct midiin→midiout thru (node now owns the output);
		// keep midiin for future input-merge, or leave the thru — DECISION: keep thru,
		// Live merges streams; remove only if double-noting is observed.
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
		// "preview_go" at the right moment — 5-10ms jitter is fine for previewing.
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
		// passthrough + preview mix (multiple signal cords into one inlet sum in MSP)
		lines.push(line("obj-plugin", 0, "obj-plugout", 0));
		lines.push(line("obj-plugin", 1, "obj-plugout", 1));
		lines.push(line("obj-sf", 0, "obj-plugout", 0));
		lines.push(line("obj-sf", 1, "obj-plugout", 1));
	}
	if (kind === "audio") {
		// node emits: "voice <note> <vel01> <durMs> <wave> <cutoff> <gain> <delayMs>"
		boxes.push(box("obj-routev", "route voice", { numoutlets: 2, outlettype: ["", ""] }));
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
		lines.push(line(nodeId, 0, "obj-routev", 0));
		lines.push(line("obj-routev", 0, "obj-pipev", 0));
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
