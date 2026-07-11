import Max from "max-api";
import { bootScope, compile, queryWindow, hapToNote } from "../shared/engine.mjs";
import { LiveTransport } from "../shared/transport.mjs";

let pattern = null;
let running = false; // user pressed Run in the UI

const transport = new LiveTransport({
	lookaheadMs: 120,
	onWindow(from, to, cps, bpm, nowBeats) {
		if (!pattern || !running) return;
		let haps;
		try {
			haps = queryWindow(pattern, from, to, cps);
		} catch (e) {
			Max.post(`query error: ${e.message}`);
			return;
		}
		for (const hap of haps) {
			const n = hapToNote(hap, cps);
			if (!n) continue;
			const delay = transport.delayMs(n.beginCycle, nowBeats, bpm);
			// → [route midinote] → [pipe pitch vel dur chan @delay] → makenote/midiformat
			Max.outlet("midinote", n.pitch, n.velocity, Math.round(n.durMs), n.chan, Math.round(delay));
		}
	},
	onStop() {
		Max.outlet("flush");
	}, // makenote releases hanging notes
});

Max.addHandler("tick", (bar, beat, unit, tempo, playing) => transport.tick(bar, beat, unit, tempo, playing));

/** UI sends code base64-encoded (Max messages choke on commas/newlines). */
Max.addHandler("code", async (b64) => {
	try {
		const code = Buffer.from(String(b64), "base64").toString("utf8");
		pattern = await compile(code);
		running = true;
		Max.outlet("evalok");
	} catch (e) {
		Max.outlet("evalerr", Buffer.from(String(e.message)).toString("base64"));
	}
});

Max.addHandler("hush", () => {
	running = false;
	Max.outlet("flush");
});

// Ignore messages destined for [js] (same jweb outlet fans out to both):
for (const ignored of ["ui_ready", "write_clip", "read_notes"]) Max.addHandler(ignored, () => {});

// esbuild's cjs output format does not support top-level await.
(async () => {
	await bootScope();
	Max.post(`strudel engine ready (node ${process.version})`);
	Max.outlet("engine_ready");
})();
