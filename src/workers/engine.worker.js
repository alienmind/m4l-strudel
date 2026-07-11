/**
 * Strudel engine Web Worker (runs inside jweb's Chromium).
 *
 * Replaces the [node.script] engine host for the midi/audio devices: Node for
 * Max proved unstable in the field (silent non-start, then a full Live crash,
 * see doc/ARCHITECTURE.md section 6). jweb is the same platform strudel.cc
 * runs on, and a dedicated worker is exempt from the background-tab timer
 * clamping that would affect the page's main thread.
 *
 * The clock stays in Max: [plugsync~] ticks arrive as messages (never
 * timer-driven, so throttling does not apply), the lookahead window absorbs
 * messaging jitter, and note-on precision comes from [pipe] delays Max-side.
 *
 * Protocol (postMessage, structured clone - no base64 needed):
 *   in:  {t:'tick', bar, beat, unit, tempo, playing}
 *        {t:'code', code}   -> {t:'evalok'} | {t:'evalerr', message}
 *        {t:'hush'}         -> {t:'flush'}
 *   out: {t:'ready'} once the strudel scope is booted
 *        {t:'notes', notes:[...]} per lookahead window; each note carries both
 *          the MIDI fields (velocity 1-127, chan) and the synth fields
 *          (vel01, wave, cutoff, gain) - the UI picks per device mode.
 *        {t:'flush'} on transport stop
 */
import { bootScope, compile, queryWindow, hapToNote } from "../max/shared/engine.mjs";
import { LiveTransport } from "../max/shared/transport.mjs";
import { asStrudelCode } from "../lib/strudelCode";

const WAVES = new Set(["sine", "sawtooth", "square", "triangle"]);

let pattern = null;
let running = false;

const transport = new LiveTransport({
	lookaheadMs: 150,
	onWindow(from, to, cps, bpm, nowBeats) {
		if (!pattern || !running) return;
		let haps;
		try {
			haps = queryWindow(pattern, from, to, cps);
		} catch (e) {
			postMessage({ t: "evalerr", message: `query: ${e.message}` });
			return;
		}
		const notes = [];
		for (const hap of haps) {
			const n = hapToNote(hap, cps);
			if (!n) continue;
			const v = n.value;
			notes.push({
				pitch: n.pitch,
				velocity: n.velocity,
				durMs: Math.round(n.durMs),
				chan: n.chan,
				delayMs: Math.round(transport.delayMs(n.beginCycle, nowBeats, bpm)),
				vel01: v.velocity ?? v.gain ?? 0.75,
				wave: WAVES.has(v.s) ? v.s : "sawtooth",
				cutoff: v.cutoff ?? 8000,
				gain: v.gain ?? 0.8,
			});
		}
		if (notes.length) postMessage({ t: "notes", notes });
	},
	onStop() {
		postMessage({ t: "flush" });
	},
});

onmessage = async (e) => {
	const m = e.data;
	if (m.t === "tick") {
		transport.tick(m.bar, m.beat, m.unit, m.tempo, m.playing);
	} else if (m.t === "code") {
		try {
			pattern = await compile(asStrudelCode(m.code));
			running = true;
			postMessage({ t: "evalok" });
		} catch (err) {
			postMessage({ t: "evalerr", message: String((err && err.message) || err) });
		}
	} else if (m.t === "hush") {
		running = false;
		postMessage({ t: "flush" });
	}
};

bootScope()
	.then(() => postMessage({ t: "ready" }))
	.catch((e) => postMessage({ t: "evalerr", message: `boot: ${e.message}` }));
