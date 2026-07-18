/**
 * Strudel engine Web Worker (runs inside jweb's Chromium).
 *
 * Replaces the [node.script] engine host: Node for Max proved unstable in the
 * field (silent non-start, then a full Live crash, see doc/ARCHITECTURE.md
 * section 6). jweb is the same platform strudel.cc runs on, and a dedicated
 * worker is exempt from the background-tab timer clamping that would affect
 * the page's main thread.
 *
 * The clock stays in Max: [plugsync~] ticks arrive as messages (never
 * timer-driven, so throttling does not apply), the lookahead window absorbs
 * messaging jitter, and note-on precision comes from [pipe] delays Max-side.
 *
 * Protocol (postMessage, structured clone - no base64 needed):
 *   in:  {t:'tick', playing, beats}   (plugsync~ outlets 0 and 6)
 *        {t:'tempo', bpm}             (LiveAPI live_set tempo observer)
 *        {t:'code', code, ctx, liveScale, sink}   -> {t:'evalok'} | {t:'evalerr', message}
 *          (sink 'note' = MIDI out (default), 'voice' = sample voices for the Sampler)
 *        {t:'export', code, ctx, beatsPerCycle, liveScale} -> {t:'clip'} | {t:'exporterr'}
 *        {t:'hush'}              -> {t:'flush'}
 *   out: {t:'ready'} once the strudel scope is booted
 *        {t:'clock', free} when the clock source flips (free-run vs Live)
 *        {t:'notes', notes:[...]} per lookahead window, MIDI-shaped
 *          (pitch, velocity 1-127, durMs, chan, delayMs)
 *        {t:'voices', voices:[...]} per window when sink='voice'
 *          (s name, n variation, velocity 1-127, rate, durMs, delayMs)
 *        {t:'clip', notes:[...], cycles} the whole loop, times in CYCLES
 *        {t:'phase', cycle} ~20 Hz playhead for the editor highlight (-1 = idle)
 *        {t:'flush'} on transport stop
 *
 * `ctx` is the NoteContext (octave convention, shift, Live's scale, drum map):
 * bare mini-notation is resolved to absolute MIDI numbers before it is compiled,
 * so the engine never has to know what a scale degree or a drum word is. Its
 * `scale` is absent when the user has turned the Live Scale toggle off.
 *
 * `liveScale` is the same scale in STRUDEL's spelling ("C4:major"), published into
 * the pattern scope regardless of the toggle, so code can ask for Strudel's own
 * implementation on purpose: `n("0 2 4").scale(liveScale)`.
 */
import {
	bootScope,
	compile,
	queryWindow,
	hapToNote,
	hapToVoice,
	exportNotes,
	patternCycles,
	setLiveScale,
} from "../../max/shared/engine.mjs";
import { LiveTransport } from "../../max/shared/transport.mjs";
import { asStrudelCode } from "../../lib/strudelCode";

let pattern = null;
let running = false;
let bpm = 120;
/**
 * WHERE THE HAPS GO: "note" (the MIDI devices - out to the midiout chain via sendNote)
 * or "voice" (the code-driven Sampler - each hap's sample name to a [poly~] voice). Set
 * per compile from the `code` message, because it belongs to the device, not the tick.
 */
let sink = "note";

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
let engineCtx = null;
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

/**
 * The playhead, for the editor's highlight. Posted from the transport rather than
 * computed in React, because the free-run clock (Live stopped, pattern playing)
 * only exists in here - the UI sees no ticks at all then.
 *
 * Throttled: the transport ticks at ~100 Hz and nothing is gained by re-rendering
 * a text editor that fast.
 */
const PHASE_MS = 50;
let lastPhasePost = 0;

function postPhase(nowBeats) {
	const now = Date.now();
	if (now - lastPhasePost < PHASE_MS) return;
	lastPhasePost = now;
	// The transport's own convention: one cycle is one bar of four beats.
	postMessage({ t: "phase", cycle: nowBeats / 4 });
}

const transport = new LiveTransport({
	lookaheadMs: 150,
	onWindow(from, to, cps, bpm, nowBeats) {
		if (!pattern || !running) return;
		postPhase(nowBeats);
		let haps;
		try {
			haps = queryWindow(pattern, from, to, cps);
		} catch (e) {
			postMessage({ t: "evalerr", message: `query: ${e.message}` });
			return;
		}
		if (sink === "voice") {
			// The Sampler sink: each hap names a sample, played on a [poly~] voice.
			const voices = [];
			for (const hap of haps) {
				const voice = hapToVoice(hap, cps);
				if (!voice) continue;
				voices.push({
					s: voice.s,
					n: voice.n,
					velocity: voice.velocity,
					rate: voice.rate,
					durMs: Math.round(voice.durMs),
					delayMs: Math.round(transport.delayMs(voice.beginCycle, nowBeats, bpm)),
				});
			}
			if (voices.length) postMessage({ t: "voices", voices });
			return;
		}
		const notes = [];
		for (const hap of haps) {
			const n = hapToNote(hap, cps, engineCtx);
			if (!n) continue;
			notes.push({
				pitch: n.pitch,
				velocity: n.velocity,
				durMs: Math.round(n.durMs),
				chan: n.chan,
				delayMs: Math.round(transport.delayMs(n.beginCycle, nowBeats, bpm)),
			});
		}
		if (notes.length) postMessage({ t: "notes", notes });
	},
	onStop() {
		postMessage({ t: "flush" });
		postMessage({ t: "phase", cycle: -1 }); // nothing is sounding: clear the highlight
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
			setLiveScale(m.liveScale);
			engineCtx = m.ctx;
			sink = m.sink === "voice" ? "voice" : "note";
			pattern = await compile(asStrudelCode(m.code, m.ctx));
			running = true;
			syncClockMode();
			postMessage({ t: "evalok" });
		} catch (err) {
			postMessage({ t: "evalerr", message: String((err && err.message) || err) });
		}
	} else if (m.t === "export") {
		// A separate compile, deliberately: the export must not touch the pattern
		// that may be playing right now. Querying is stateless, so this cannot
		// disturb it either - the same pattern object answers both.
		try {
			setLiveScale(m.liveScale);
			const pat = await compile(asStrudelCode(m.code, m.ctx));
			// One cycle occupies `beatsPerCycle` of Live's beats, so its rate follows
			// the tempo. Only patterns that read _cps care, but they should read the
			// right one - and this makes it the pattern's own declared cps when the
			// UI left beatsPerCycle on its auto (tempo-derived) suggestion.
			const cps = bpm / 60 / m.beatsPerCycle;
			const cycles = patternCycles(pat, cps, m.ctx);
			postMessage({ t: "clip", notes: exportNotes(pat, cycles, cps, m.ctx), cycles });
		} catch (err) {
			postMessage({ t: "exporterr", message: String((err && err.message) || err) });
		}
	} else if (m.t === "hush") {
		running = false;
		syncClockMode();
		postMessage({ t: "flush" });
		postMessage({ t: "phase", cycle: -1 });
	}
};

bootScope()
	.then(() => postMessage({ t: "ready" }))
	.catch((e) => postMessage({ t: "evalerr", message: `boot: ${e.message}` }));
