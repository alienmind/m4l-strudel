/**
 * Headless Strudel engine for Node for Max.
 * - bootScope(): register @strudel/{core,mini,tonal} into globalThis (once).
 * - compile(code): code string -> Pattern ($:-aware, mirrors core/repl.mjs).
 * - queryWindow(pat, from, to, cps): onset haps in a cycle window.
 * - hapToNote(hap, cps): normalized MIDI-ish event or null.
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

export function hapToNote(hap, cps) {
	const v = hap.value ?? {};
	let note = v.note ?? v.n;
	if (typeof note === "string") note = noteToMidi(note);
	if (typeof note !== "number" || Number.isNaN(note)) return null;
	const durCycles = hap.duration.valueOf(); // Fraction → number (cycles)
	return {
		pitch: Math.max(0, Math.min(127, Math.round(note))),
		velocity: Math.max(1, Math.min(127, Math.round((v.velocity ?? v.gain ?? 0.75) * 127))),
		durMs: Math.max(5, (durCycles / cps) * 1000),
		chan: Math.max(1, Math.min(16, Math.round(v.midichan ?? 1))),
		beginCycle: hap.whole.begin.valueOf(),
		value: v, // raw params (audio device)
	};
}
