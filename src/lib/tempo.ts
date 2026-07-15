/**
 * Read a tempo directive out of Strudel code, as cycles-per-second (cps).
 *
 * The headless export engine does NOT wire up setcpm/setcps - they live in
 * repl.mjs, which the worker never loads - so a `setcpm(120)` in the pattern is
 * silently ignored and every cycle falls back to Strudel's default rate. That is
 * why importing such a pattern used to place one cycle in a whole bar regardless
 * of the tempo it declared. We honour the directive ourselves: scan the text and
 * convert the LAST setcpm/setcps to cps.
 *
 *   setcps(x) -> x cps
 *   setcpm(x) -> x / 60 cps    (x is cycles per MINUTE)
 *
 * Returns Strudel's default (0.5 cps, i.e. two seconds a cycle) when the code
 * sets no tempo - which at 120 BPM is one bar, the historical default.
 */
export const DEFAULT_CPS = 0.5;

export function detectCps(code: string): number {
	let cps = DEFAULT_CPS;
	const re = /\bset(cpm|cps)\s*\(\s*([-+0-9.eE\s/*]+?)\s*\)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(code)) !== null) {
		const val = evalArith(m[2]);
		if (val === null || val <= 0) continue;
		cps = m[1] === "cpm" ? val / 60 : val; // last valid directive wins
	}
	return cps;
}

/**
 * How many of Live's beats one Strudel cycle should occupy so the clip, played
 * at Live's transport tempo, lasts as long as the pattern does in Strudel.
 *
 *   one cycle = 1/cps seconds = (bpm / 60 / cps) beats
 *
 * At the default 0.5 cps and 120 BPM this is 4 - one bar - so a pattern with no
 * tempo directive keeps the historical behaviour. `setcpm(120)` is 2 cps, giving
 * one beat a cycle at 120 BPM.
 */
export function suggestBeatsPerCycle(cps: number, bpm: number): number {
	if (!(cps > 0) || !(bpm > 0)) return 4;
	return round3(bpm / (60 * cps));
}

/** Evaluate a plain arithmetic expression like "140/4". Refuses anything that is
 *  not digits and the four operators, so this never runs pattern code. */
function evalArith(expr: string): number | null {
	if (!/^[-+*/().0-9eE\s]+$/.test(expr)) return null;
	try {
		const v = Function(`"use strict"; return (${expr});`)() as unknown;
		return typeof v === "number" && Number.isFinite(v) ? v : null;
	} catch {
		return null;
	}
}

function round3(n: number): number {
	return Math.round(n * 1000) / 1000;
}
