/**
 * schedule.test.ts - pattern time -> audio time, the rule the superdough sink applies.
 *
 * THE BUG THIS PINS. The sink used to convert the worker's `delayMs` into an audio time
 * with `currentTime + delayMs/1000`, clamping anything already in the past up to "now"
 * so superdough would not drop it. Once the two clocks drifted past the lookahead
 * window, EVERY event clamped to the same instant: a bar of notes fired simultaneously,
 * which is heard as audio that starts, collapses, spikes the CPU and distorts.
 *
 * The rule below replaces it. An anchor pins one cycle to one audio time, and every
 * later event is derived from the PATTERN's own spacing, so message jitter cannot
 * compress two events together. Re-anchoring happens only when the mapping is
 * meaningless: first event, tempo change, fallen behind, or absurdly ahead.
 *
 * `schedule()` mirrors useStrudelRender's sink exactly. It is duplicated rather than
 * imported because the hook needs React and a live AudioContext; the arithmetic does
 * not, and the arithmetic is the part that was wrong.
 */
import { describe, expect, it } from "vitest";

const ANCHOR_LEAD_S = 0.08;
const MIN_LEAD_S = 0.005;
const MAX_AHEAD_S = 2;

interface Anchor {
	cycle: number;
	time: number;
	cps: number;
}

function schedule(
	anchor: Anchor | null,
	ev: { cycle: number; cps: number },
	now: number,
): { t: number; anchor: Anchor; reanchored: boolean } {
	let a = anchor;
	if (a && a.cps !== ev.cps) a = null;
	let t = a ? a.time + (ev.cycle - a.cycle) / ev.cps : now + ANCHOR_LEAD_S;
	if (!a || t < now + MIN_LEAD_S || t > now + MAX_AHEAD_S) {
		t = now + ANCHOR_LEAD_S;
		return { t, anchor: { cycle: ev.cycle, time: t, cps: ev.cps }, reanchored: a !== null };
	}
	return { t, anchor: a, reanchored: false };
}

describe("pattern time mapped onto the audio clock", () => {
	const cps = 0.5; // 120 bpm, one cycle = one bar of 4

	it("spaces events by the PATTERN, not by when the message arrived", () => {
		// Four events one quarter-cycle apart. They are delivered in one burst (the
		// lookahead window), all seeing the same `now` - the case that used to collapse
		// them onto one instant.
		let a: Anchor | null = null;
		const times: number[] = [];
		for (const cycle of [0, 0.25, 0.5, 0.75]) {
			const r = schedule(a, { cycle, cps }, 10);
			a = r.anchor;
			times.push(r.t);
		}
		// A quarter cycle at 0.5 cps is 0.5 s, exactly, regardless of arrival time.
		expect(times[1] - times[0]).toBeCloseTo(0.5, 10);
		expect(times[2] - times[1]).toBeCloseTo(0.5, 10);
		expect(times[3] - times[2]).toBeCloseTo(0.5, 10);
	});

	it("never schedules in the past, which superdough would drop", () => {
		let a: Anchor | null = null;
		let now = 10;
		for (const cycle of [0, 0.25, 0.5, 0.75, 1]) {
			const r = schedule(a, { cycle, cps }, now);
			a = r.anchor;
			expect(r.t).toBeGreaterThan(now);
			now += 0.05; // the audio clock advances between deliveries
		}
	});

	it("re-anchors once when the transport jumps, instead of piling events on now", () => {
		const first = schedule(null, { cycle: 0, cps }, 10);
		// The pattern jumps back to cycle 0 while the audio clock has moved on - a loop
		// wrap. Derived time would be far behind `now`.
		const jumped = schedule(first.anchor, { cycle: 0, cps }, 30);
		expect(jumped.reanchored).toBe(true);
		expect(jumped.t).toBeGreaterThan(30);
		// ...and the event AFTER the jump is spaced from the new anchor, not re-pinned.
		const next = schedule(jumped.anchor, { cycle: 0.25, cps }, 30);
		expect(next.reanchored).toBe(false);
		expect(next.t - jumped.t).toBeCloseTo(0.5, 10);
	});

	it("re-anchors on a tempo change, because the mapping rescales", () => {
		const first = schedule(null, { cycle: 0, cps }, 10);
		const faster = schedule(first.anchor, { cycle: 0.25, cps: 1 }, 10);
		expect(faster.reanchored).toBe(false); // a null anchor is not a RE-anchor
		expect(faster.anchor.cps).toBe(1);
		// New rate honoured from here on: a quarter cycle at 1 cps is 0.25 s.
		const after = schedule(faster.anchor, { cycle: 0.5, cps: 1 }, 10);
		expect(after.t - faster.t).toBeCloseTo(0.25, 10);
	});

	it("holds the anchor across a long run - no creeping re-anchor", () => {
		let a: Anchor | null = null;
		let reanchors = 0;
		let now = 0;
		// 64 cycles at 0.5 cps = 128 s of playback, delivered a window at a time.
		for (let i = 0; i <= 64 * 4; i++) {
			const cycle = i * 0.25;
			const r = schedule(a, { cycle, cps }, now);
			if (r.reanchored) reanchors++;
			a = r.anchor;
			now = Math.max(now, r.t - ANCHOR_LEAD_S); // clock trails the schedule
		}
		expect(reanchors).toBe(0);
	});
});
