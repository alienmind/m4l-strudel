/**
 * Maps Live transport ticks to strudel cycle windows with lookahead.
 * Convention: 1 strudel cycle = 1 bar of 4 beats (cps = bpm/60/4).
 *
 * tick() is fed ~every 10ms from [plugsync~] via [snapshot~ 10]:
 *   playing  - plugsync~ outlet 0 (1 while the host transport runs)
 *   beats    - plugsync~ outlet 6 (song position in beats, float)
 * bpm arrives separately (LiveAPI live_set tempo observer in the wrapper);
 * plugsync~ itself only reports tempo as samples-per-beat.
 */
export class LiveTransport {
	constructor({ lookaheadMs = 120, onWindow, onStop }) {
		this.lookaheadMs = lookaheadMs;
		this.onWindow = onWindow; // (fromCycle, toCycle, cps, bpm, nowBeats) => void
		this.onStop = onStop;
		this.lastEnd = null; // cycle position already queried up to
		this.playing = false;
	}

	tick(playing, beats, bpm) {
		const isPlaying = playing >= 0.5;
		if (!isPlaying) {
			if (this.playing) {
				this.playing = false;
				this.lastEnd = null;
				this.onStop?.();
			}
			return;
		}
		this.playing = true;
		const cps = bpm / 60 / 4;
		const nowBeats = beats;
		const nowCycle = nowBeats / 4;
		const lookaheadCycles = (this.lookaheadMs / 1000) * cps;
		const to = nowCycle + lookaheadCycles;

		// First tick after start, or transport jumped (loop wrap / scrub):
		if (
			this.lastEnd === null ||
			nowCycle < this.lastEnd - lookaheadCycles * 2 ||
			nowCycle > this.lastEnd + lookaheadCycles * 4
		) {
			this.lastEnd = nowCycle;
		}
		if (to <= this.lastEnd) return; // window already covered
		const from = this.lastEnd;
		this.lastEnd = to;
		this.onWindow(from, to, cps, bpm, nowBeats);
	}

	/** ms from "now" until a cycle position, given current tempo/position. */
	delayMs(targetCycle, nowBeats, bpm) {
		const targetBeats = targetCycle * 4;
		return Math.max(0, ((targetBeats - nowBeats) * 60000) / bpm);
	}
}
