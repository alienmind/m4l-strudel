/**
 * Headless Strudel engine.
 * - bootScope(): register @strudel/{core,mini,tonal} into globalThis (once).
 * - compile(code): code string -> Pattern ($:-aware, mirrors core/repl.mjs).
 * - queryWindow(pat, from, to, cps): onset haps in a cycle window.
 * - hapToNote(hap, cps, ctx): normalized MIDI-ish event or null (live play).
 * - hapToClipNote(hap, ctx): the same event in CYCLES, not ms (clip export).
 * - patternCycles(pat, cps, ctx): how many cycles before the pattern repeats.
 */
import { evalScope, evaluate, silence, stack, Pattern, isPattern, noteToMidi } from "@strudel/core";
import { transpiler } from "@strudel/transpiler";

let pPatterns = {};
let anonymousIndex = 0;

/** Mirrors repl.mjs injectPatternMethods (core/repl.mjs:352-383). */
export function installDollarCollector() {
	Pattern.prototype.p = function (id) {
		if (typeof id === "string" && (id.startsWith("_") || id.endsWith("_"))) return silence; // x_ / _x mutes a line
		if (String(id).includes("$")) id = `${id}${anonymousIndex++}`;
		pPatterns[id] = this;
		return this;
	};
	Pattern.prototype.q = function () {
		return silence;
	};
	for (let i = 1; i < 10; ++i) {
		Object.defineProperty(Pattern.prototype, `d${i}`, {
			get() {
				return this.p(i);
			},
			configurable: true,
		});
		Object.defineProperty(Pattern.prototype, `p${i}`, {
			get() {
				return this.p(i);
			},
			configurable: true,
		});
		Pattern.prototype[`q${i}`] = silence;
	}
}

/**
 * Publish Live's global scale into the pattern scope as `liveScale`, so code can
 * opt into STRUDEL's own scale implementation explicitly:
 *
 *   n("0 2 4").scale(liveScale)
 *
 * Deliberately a global rather than an injected `.scale()` call: appending one
 * would silently override a `.scale()` the user wrote, and could not be appended
 * to a multi-line `$:` pattern at all. Note that Strudel's implementation does not
 * always agree with Ableton's - see strudelAgrees() - which is what the UI warns
 * about when a pattern reaches for this.
 */
export function setLiveScale(name) {
	globalThis.liveScale = name;
}

let booted = false;
export async function bootScope() {
	if (booted) return;
	await evalScope(import("@strudel/core"), import("@strudel/mini"), import("@strudel/tonal"));
	installDollarCollector();
	booted = true;
}

export async function compile(code) {
	pPatterns = {};
	anonymousIndex = 0;
	const { pattern } = await evaluate(code, transpiler);
	const named = Object.values(pPatterns);
	const pat = named.length ? stack(...named) : pattern; // repl.mjs:231-253 semantics
	if (!isPattern(pat)) throw new Error("Code did not evaluate to a pattern");
	return pat;
}

export function queryWindow(pat, fromCycle, toCycle, cps) {
	return pat.queryArc(fromCycle, toCycle, { _cps: cps }).filter((h) => h.hasOnset());
}

export function hapToNote(hap, cps, ctx) {
	const p = hapPitch(hap, ctx);
	if (p === null) return null;
	const v = hap.value ?? {};
	const durCycles = hap.duration.valueOf(); // Fraction → number (cycles)
	return {
		pitch: p,
		velocity: hapVelocity(hap),
		durMs: Math.max(5, (durCycles / cps) * 1000),
		chan: Math.max(1, Math.min(16, Math.round(v.midichan ?? 1))),
		beginCycle: hap.whole.begin.valueOf(),
		value: v, // raw params (audio device)
	};
}

/**
 * The clip exporter's view of a hap: times in CYCLES, because a clip is written
 * in beats, not milliseconds - one cycle is however many bars the user picked,
 * and nothing here needs to know the tempo.
 */
export function hapToClipNote(hap, ctx) {
	const p = hapPitch(hap, ctx);
	if (p === null) return null;
	return {
		pitch: p,
		velocity: hapVelocity(hap),
		start: hap.whole.begin.valueOf(),
		duration: hap.duration.valueOf(),
	};
}

/**
 * The pitch of a hap, in three tiers.
 *
 * `note` first: `note("c3").s("bd")` names a pitch outright, and no drum map may
 * overrule it.
 *
 * Then the drum map, on the sample name - BEFORE `n`. This ordering is the whole
 * point: `s("bd:3")` picks the fourth bd sample and comes through as
 * `{ s: "bd", n: 3 }`, so reading `n` first would sound a bd as MIDI note 3
 * rather than as its Drum Rack pad. `n` is a sample INDEX whenever `s` carries a
 * mapped name; it is a pitch only in the absence of one.
 */
function hapPitch(hap, ctx) {
	const v = hap.value ?? {};
	let note = v.note;
	if (note === undefined && v.s && ctx?.drumMap) {
		const mapped = ctx.drumMap[v.s];
		if (mapped !== undefined) return mapped;
	}
	if (note === undefined) note = v.n;
	if (typeof note === "string") note = noteToMidi(note);
	if (typeof note !== "number" || Number.isNaN(note)) return null;
	return Math.max(0, Math.min(127, Math.round(note)));
}

function hapVelocity(hap) {
	const v = hap.value ?? {};
	return Math.max(1, Math.min(127, Math.round((v.velocity ?? v.gain ?? 0.75) * 127)));
}

/**
 * How many cycles before the pattern repeats itself.
 *
 * `<a b>` alternates per cycle, so exporting one cycle of it - which is what To
 * Clip did - threw half the pattern away. The length is measured, not derived:
 * query the first `probe` cycles and find the shortest period they are consistent
 * with. That works for full Strudel code too, whose loop length no parser of ours
 * could compute, and it costs a handful of stateless queries.
 *
 * A period is only trusted if it survives the whole probe window, so a pattern
 * that repeats every 3 cycles is not mistaken for one that repeats every 6.
 */
export function patternCycles(pat, cps, ctx, maxCycles = 16) {
	const probe = maxCycles * 2;
	const sigs = [];
	for (let c = 0; c < probe; c++) {
		const events = queryWindow(pat, c, c + 1, cps)
			.map((h) => {
				const n = hapToClipNote(h, ctx);
				if (!n) return null;
				// Relative to this cycle's start, so cycle k looks like cycle 0 when
				// the pattern has come back around.
				return `${n.pitch}@${(n.start - c).toFixed(6)}+${n.duration.toFixed(6)}v${n.velocity}`;
			})
			.filter(Boolean)
			.sort();
		sigs.push(events.join("|"));
	}
	for (let p = 1; p <= maxCycles; p++) {
		let ok = true;
		for (let c = 0; c < probe && ok; c++) {
			if (sigs[c] !== sigs[c % p]) ok = false;
		}
		if (ok) return p;
	}
	return maxCycles;
}

/**
 * Every note of `cycles` cycles, at once. Strudel patterns are pure functions of
 * time, so the whole clip can be queried instantly - no transport, no real-time
 * wait - and querying it does not disturb a pattern that is currently playing.
 */
export function exportNotes(pat, cycles, cps, ctx) {
	return queryWindow(pat, 0, cycles, cps)
		.map(h => hapToClipNote(h, ctx))
		.filter(Boolean);
}
