import Max from "max-api";
import { bootScope, compile, queryWindow, hapToNote } from "../shared/engine.mjs";
import { LiveTransport } from "../shared/transport.mjs";

let pattern = null,
	running = false;
const WAVES = new Set(["sine", "sawtooth", "square", "triangle"]);

const transport = new LiveTransport({
	lookaheadMs: 150,
	onWindow(from, to, cps, bpm, nowBeats) {
		if (!pattern || !running) return;
		for (const hap of queryWindow(pattern, from, to, cps)) {
			const n = hapToNote(hap, cps);
			if (!n) continue;
			const v = n.value;
			const wave = WAVES.has(v.s) ? v.s : "sawtooth";
			const delay = Math.round(transport.delayMs(n.beginCycle, nowBeats, bpm));
			// "voice <note> <vel01> <durMs> <wave> <cutoff> <gain> <delayMs>"
			Max.outlet(
				"voice",
				n.pitch,
				v.velocity ?? v.gain ?? 0.75,
				Math.round(n.durMs),
				wave,
				v.cutoff ?? 8000,
				v.gain ?? 0.8,
				delay,
			);
		}
	},
	onStop() {
		Max.outlet("allnotesoff");
	},
});

Max.addHandler("tick", (...a) => transport.tick(...a));
Max.addHandler("code", async (b64) => {
	try {
		pattern = await compile(Buffer.from(String(b64), "base64").toString("utf8"));
		running = true;
		Max.outlet("evalok");
	} catch (e) {
		Max.outlet("evalerr", Buffer.from(String(e.message)).toString("base64"));
	}
});
Max.addHandler("hush", () => {
	running = false;
	Max.outlet("allnotesoff");
});
for (const ig of ["ui_ready"]) Max.addHandler(ig, () => {});
// esbuild's cjs output format does not support top-level await.
(async () => {
	await bootScope();
	Max.outlet("engine_ready");
})();
