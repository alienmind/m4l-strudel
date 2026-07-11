/**
 * Maps Live transport ticks to strudel cycle windows with lookahead.
 * Convention: 1 strudel cycle = 1 bar of 4 beats (cps = bpm/60/4).
 * tick() is fed ~every 10ms from [plugsync~]→[snapshot~ 10]→[pak].
 */
export class LiveTransport {
	constructor({ lookaheadMs = 120, onWindow, onStop }) {
		this.lookaheadMs = lookaheadMs;
		this.onWindow = onWindow; // (fromCycle, toCycle, cps, bpm, nowBeats) => void
		this.onStop = onStop;
		this.lastEnd = null; // cycle position already queried up to
		this.playing = false;
	}

	/** bar/beat 1-based, unit 0-479 ticks, per plugsync~. Assumes 4/4 (v1). */
	static beatsFrom(bar, beat, unit) {
		return (bar - 1) * 4 + (beat - 1) + unit / 480;
	}

	tick(bar, beat, unit, tempo, playing) {
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
		const bpm = tempo;
		const cps = bpm / 60 / 4;
		const nowBeats = LiveTransport.beatsFrom(bar, beat, unit);
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
