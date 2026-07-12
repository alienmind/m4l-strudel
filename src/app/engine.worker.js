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
 *   in:  {t:'tick', playing, beats}   (plugsync~ outlets 0 and 6)
 *        {t:'tempo', bpm}             (LiveAPI live_set tempo observer)
 *        {t:'code', code}   -> {t:'evalok'} | {t:'evalerr', message}
 *        {t:'hush'}         -> {t:'flush'}
 *   out: {t:'ready'} once the strudel scope is booted
 *        {t:'clock', free} when the clock source flips (free-run vs Live)
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
let bpm = 120;

/**
 * Free-run clock: strudel.cc plays the moment you evaluate - users expect
 * Run to make sound without touching Live's transport. While a pattern is
 * running and Live's transport is stopped, an internal 25ms timer advances
 * the beat counter at the current tempo (dedicated workers are exempt from
 * Chromium's hidden-page timer clamping). The moment Live starts playing,
 * the real transport takes over and the pattern locks to the grid.
 */
let livePlaying = false;
let lastBeats = 0;
const free = { timer: null, beats: 0, last: 0 };

function startFreeRun() {
	if (free.timer) return;
	free.beats = lastBeats;
	free.last = Date.now();
	free.timer = setInterval(() => {
		const now = Date.now();
		free.beats += ((now - free.last) * bpm) / 60000;
		free.last = now;
		transport.tick(1, free.beats, bpm);
	}, 25);
	postMessage({ t: "clock", free: true });
}
function stopFreeRun() {
	if (!free.timer) return;
	clearInterval(free.timer);
	free.timer = null;
	postMessage({ t: "clock", free: false });
}
function syncClockMode() {
	if (running && pattern && !livePlaying) startFreeRun();
	else stopFreeRun();
}

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
		livePlaying = m.playing >= 0.5;
		if (livePlaying) lastBeats = m.beats;
		syncClockMode();
		if (livePlaying) transport.tick(m.playing, m.beats, bpm);
		else if (!free.timer) transport.tick(0, m.beats, bpm); // idle: flush path
	} else if (m.t === "tempo") {
		if (m.bpm > 0) bpm = m.bpm;
	} else if (m.t === "code") {
		try {
			pattern = await compile(asStrudelCode(m.code));
			running = true;
			syncClockMode();
			postMessage({ t: "evalok" });
		} catch (err) {
			postMessage({ t: "evalerr", message: String((err && err.message) || err) });
		}
	} else if (m.t === "hush") {
		running = false;
		syncClockMode();
		postMessage({ t: "flush" });
	}
};

bootScope()
	.then(() => postMessage({ t: "ready" }))
	.catch((e) => postMessage({ t: "evalerr", message: `boot: ${e.message}` }));
