/**
 * fx.ts - read a one-line Strudel effects chain into parameter values.
 *
 *   ".lpf(800).gain(1.2)"   ->   { cutoff: 800, gain: 1.2 }
 *
 * WHY THERE IS NO PARSER HERE. `.lpf(800).gain(1.2)` is not a new language - it
 * is JavaScript method chaining, and JavaScript already has a parser. So the line
 * is evaluated against a RECORDER: an object whose every method call appends
 * `{ effect, args }` and returns itself. The chain runs, and what it leaves behind
 * is the list of effects the user asked for, in order.
 *
 * That is the same lesson Phase 5 learned the hard way about the mini-notation
 * parser: do not reimplement a language that already has an implementation. The
 * alternative - hand-rolling a tokenizer for method chaining - would be a second
 * dialect to keep in step with Strudel's, and it would be wrong in exactly the
 * places nobody tested.
 *
 * WHAT V1 DOES NOT DO. Only CONSTANT arguments: `.lpf(800)` works, `.lpf(sine
 * .range(200, 2000))` does not. That is not an oversight, it is the honest v1 -
 * a pattern-driven parameter has to be re-queried on every transport tick and
 * written at 20 Hz, which is a different machine (see doc/TODO.md, Phase 7.2).
 * An expression like that fails to evaluate here and is reported, not ignored.
 */

import { parse } from "acorn";
import type { Node } from "acorn";
import { cosine, irand, isaw, isPattern, perlin, pure, rand, run, saw, signal, sine, square, tri } from "@strudel/core";

/**
 * THE RACK - one table, in the frozen graph's signal order (see ARCHITECTURE
 * §3c). Everything else in this file is derived from it: the neutral chain, the
 * effects the line may name, and the line the parameters are written back out as.
 * Adding a stage is a row here, a chain in the manifest (patcher/devices.mjs, drawn
 * from @m4l-jweb/build's vocabulary), and a dial in src/app/fx/surface.ts - not a
 * fourth hand-written list to fall out of step.
 *
 * `neutral` is the value at which the stage is a wire. `decimals` is how much of
 * the value is worth writing down: a filter does not need a milli-hertz, and a
 * slider that emits .lpf(4021.3287654321) is unreadable. It is also what keeps
 * text and parameter honest - see quantize().
 */
export const RACK = [
	{ param: "cutoff", call: "lpf", neutral: 18000, decimals: 0 },
	{ param: "hpfreq", call: "hpf", neutral: 0, decimals: 0 },
	{ param: "drive", call: "drive", neutral: 1, decimals: 2 },
	// Bits, and NOT Strudel's "16 = minimum crush": 16-bit quantisation is a quiet
	// crush, not a wire, and a stage that is always in the path needs a setting where
	// it does nothing (the frozen-graph law). So it rests at degrade~'s full 24 bits.
	// `.crush(16)` still gets 16-bit quantisation, exactly as superdough's does.
	{ param: "crush", call: "crush", neutral: 24, decimals: 0 },
	{ param: "delay", call: "delay", neutral: 0, decimals: 2 },
	{ param: "delaytime", call: "delaytime", neutral: 250, decimals: 0 },
	{ param: "delayfeedback", call: "delayfeedback", neutral: 0, decimals: 2 },
	{ param: "room", call: "room", neutral: 0, decimals: 2 },
	{ param: "gain", call: "gain", neutral: 1, decimals: 2 },
] as const;

/** What each Strudel effect maps to on the Max side. */
export type FxParam = (typeof RACK)[number]["param"];
export type FxParams = Record<FxParam, number>;

export interface FxResult {
	params: FxParams;
	/** The effects the line actually named, in the order the rack runs them. */
	used: FxParam[];
	/** Effects Strudel has but this device cannot make a sound with yet. */
	unsupported: string[];
	error: string | null;
	/**
	 * The stages driven by a PATTERN rather than a number - `.lpf(sine.range(200,
	 * 2000))`. Each carries the Strudel pattern to query, and the SOURCE TEXT it was
	 * written as.
	 *
	 * The source is here because it cannot be recovered from anywhere else. This
	 * device's model is that the parameters are the truth and the line is drawn from
	 * them (formatFxChain), which works perfectly for `.lpf(800)`: the number is in the
	 * parameter. A pattern is not a number - the parameter holds whatever value the
	 * modulation last passed through - so a line printed from the parameters would come
	 * back as `.lpf(1372)`, silently replacing the user's modulation with a snapshot of
	 * it. The expression is the only record of what they asked for.
	 */
	patterned: PatternedStage[];
}

/** One stage the line asked to MODULATE rather than set. */
export interface PatternedStage {
	param: FxParam;
	/** The Strudel pattern. Query it per tick; see queryFxPattern. */
	pattern: StrudelPattern;
	/** What the user typed inside the call, e.g. "sine.range(200, 2000)". */
	source: string;
}

/** The half of Strudel's Pattern this file needs - kept narrow so fx.ts owns no engine. */
export interface StrudelPattern {
	queryArc(begin: number, end: number): { value: unknown }[];
}

/**
 * The effects with a real Max chain behind them, and the parameter each drives.
 *
 * `lpf` and `cutoff` are the same control, as are `hpf` and `hcutoff` - Strudel
 * accepts both spellings, and a user who types the one we did not think of should not
 * get an error.
 */
const SUPPORTED: Record<string, FxParam> = {
	...Object.fromEntries(RACK.map((s) => [s.call, s.param])),
	cutoff: "cutoff",
	hcutoff: "hpfreq",
};

/**
 * The value as both the line and the dial will carry it.
 *
 * The Audio FX device shows one control with two faces (§3c), and they have to
 * agree exactly, or the text box rewrites itself the instant a slider moves. A
 * dial travels continuously; the line is written to a fixed number of decimals.
 * So the dial is snapped to what the line can say, which makes formatting and
 * parsing exact inverses and the two faces the same number.
 */
export function quantize(param: FxParam, v: number): number {
	const { decimals } = RACK.find((s) => s.param === param)!;
	const f = 10 ** decimals;
	return Math.round(v * f) / f;
}

/**
 * Effects Strudel really has, which this device knowingly cannot do yet. Named
 * explicitly so the UI can say "not yet" instead of "unknown effect" - the two
 * are very different messages to the person typing.
 */
const KNOWN_UNBUILT = new Set(["reverb", "pan", "distort", "shape", "coarse", "vowel", "phaser"]);

/** Wide open, unity gain: the chain that does nothing, which an empty line means. */
export const NEUTRAL: FxParams = Object.fromEntries(RACK.map((s) => [s.param, s.neutral])) as FxParams;

/**
 * Strudel's continuous SIGNALS, and the only names besides the recorder that a line
 * can reach.
 *
 * `.lpf(sine.range(200, 2000))` is not a number, it is a description of a shape over
 * time, and these are the shapes Strudel has. They are put in scope by name rather
 * than by handing the line the whole module: the recorder is still the only object it
 * can touch, so a line cannot reach the app, the DOM or Live - it can only build a
 * pattern. `sine` in scope and `fetch` out of it is the whole trust boundary.
 */
const SIGNALS: Record<string, unknown> = { sine, cosine, saw, isaw, tri, square, rand, perlin, run, irand, signal, pure };

/**
 * The source text of every call's first argument, in call order.
 *
 * WHY THE LINE IS PARSED TWICE. The recorder below evaluates the chain and hands back
 * VALUES - and a Pattern is where the source text goes to die: `sine.range(200, 2000)`
 * evaluates to an object that cannot say what it was written as. So acorn reads the
 * same line for its argument POSITIONS, and the two agree because they walk the same
 * chain in the same order: call i in the recorder is call i here.
 *
 * Returns null if acorn cannot read the line, in which case the eval is about to fail
 * with a better message than anything this could invent.
 */
function argSources(src: string): string[] | null {
	const prefixed = `fx${src}`;
	let ast: Node;
	try {
		ast = parse(prefixed, { ecmaVersion: 2022 }) as unknown as Node;
	} catch {
		return null;
	}
	const out: string[] = [];
	// A method chain is a left-leaning tree - fx.a(1).b(2) is call(member(call(...))) -
	// so walking OUT from the root yields the calls backwards. Collect, then reverse.
	let node: Node | undefined = ((ast as unknown as { body: { expression: Node }[] }).body?.[0] as { expression?: Node })?.expression;
	while (node && (node as { type: string }).type === "CallExpression") {
		const call = node as unknown as { arguments: { start: number; end: number }[]; callee: { object?: Node } };
		const a = call.arguments[0];
		out.push(a ? prefixed.slice(a.start, a.end) : "");
		node = call.callee.object;
	}
	return out.reverse();
}

export function parseFxChain(text: string): FxResult {
	const src = text.trim();
	const params: FxParams = { ...NEUTRAL };
	const named = new Set<FxParam>();
	const patterned: PatternedStage[] = [];
	// In rack order, not typing order: .gain(2).lpf(800) and .lpf(800).gain(2) are
	// the same signal path (§3c), so they must read back as the same line.
	const used = () => RACK.map((s) => s.param).filter((p) => named.has(p));

	if (src === "") return { params, used: [], unsupported: [], error: null, patterned };

	// A chain has to start with a call, or it is not a chain. Catching this here
	// keeps the eval below from having to make sense of arbitrary text.
	if (!src.startsWith(".")) {
		return {
			params,
			used: [],
			unsupported: [],
			error: "An effects chain starts with a dot: .lpf(800).gain(1.2)",
			patterned,
		};
	}

	const sources = argSources(src) ?? [];

	const calls: { effect: string; args: unknown[] }[] = [];
	const recorder: unknown = new Proxy(
		{},
		{
			get(_t, prop) {
				return (...args: unknown[]) => {
					calls.push({ effect: String(prop), args });
					return recorder;
				};
			},
		},
	);

	try {
		// The line is the user's own, running in their own device - the same trust
		// boundary the Strudel engine already sits inside (it evaluates their code
		// too). This is NOT a sandbox and never was: a `new Function` body sees the
		// global scope, so `.lpf(fetch)` reaches the real fetch. What saves it is that
		// nothing here CALLS what it is handed - an argument is recorded, checked, and
		// rejected unless it is a number or a pattern. Naming the signals just means
		// `sine` resolves to Strudel's rather than to nothing.
		const names = Object.keys(SIGNALS);
		new Function("fx", ...names, `return fx${src}`)(recorder, ...names.map((n) => SIGNALS[n]));
	} catch (e) {
		const msg = String((e as Error)?.message ?? e);
		return {
			params,
			used: [],
			unsupported: [],
			error: /is not defined/.test(msg) ? `${msg} - this line takes numbers and Strudel signals, e.g. .lpf(800) or .lpf(sine.range(200, 2000))` : msg,
			patterned,
		};
	}

	const unsupported: string[] = [];
	for (let i = 0; i < calls.length; i++) {
		const { effect, args } = calls[i];
		const target = SUPPORTED[effect];
		if (!target) {
			unsupported.push(effect);
			continue;
		}
		// Last one wins, the way it does in Strudel: `.gain(1).gain(2)` is gain 2. That
		// holds ACROSS the two kinds too - `.lpf(sine).lpf(800)` is a plain 800 - so a
		// stage drops any modulation it had before taking a new value.
		const prev = patterned.findIndex((p) => p.param === target);
		if (prev >= 0) patterned.splice(prev, 1);

		if (isPattern(args[0])) {
			patterned.push({ param: target, pattern: args[0] as StrudelPattern, source: sources[i] ?? "" });
			named.add(target);
			continue;
		}
		const v = Number(args[0]);
		if (!Number.isFinite(v)) {
			return {
				params,
				used: used(),
				unsupported,
				error: `.${effect}() needs a number or a signal, e.g. .${effect}(800) or .${effect}(sine.range(200, 2000))`,
				patterned,
			};
		}
		params[target] = quantize(target, v);
		named.add(target);
	}

	return { params, used: used(), unsupported, error: null, patterned };
}

/**
 * A patterned stage's value at a moment, in the parameter's own units.
 *
 * `cycle` is the transport position in CYCLES - the same clock the pattern was written
 * against, so `sine` completes one sweep per cycle. Query a zero-width span: a stage
 * has exactly one value at an instant, and that instant is the tick we are on.
 *
 * Returns null when the pattern has nothing at that point (a silence, or a discrete
 * pattern between events), which is not an error - it means "leave the parameter where
 * it is", and the caller should not write.
 */
export function queryFxPattern(stage: PatternedStage, cycle: number): number | null {
	let haps: { value: unknown }[];
	try {
		haps = stage.pattern.queryArc(cycle, cycle);
	} catch {
		return null; // a pattern that throws mid-transport must not take the device with it
	}
	if (!haps.length) return null;
	const v = Number(haps[haps.length - 1].value);
	if (!Number.isFinite(v)) return null;
	return quantize(stage.param, v);
}

/** How the UI explains an effect it cannot make a sound with. */
export function unsupportedMessage(effects: string[]): string {
	const known = effects.filter((e) => KNOWN_UNBUILT.has(e));
	const unknown = effects.filter((e) => !KNOWN_UNBUILT.has(e));
	const parts: string[] = [];
	if (known.length) {
		parts.push(`${known.map((e) => `.${e}()`).join(", ")} has no Max chain yet - ignored`);
	}
	if (unknown.length) {
		parts.push(`${unknown.map((e) => `.${e}()`).join(", ")} is not an effect this device knows`);
	}
	return parts.join("; ");
}

/**
 * The parameters, written back out as the line that would produce them - the
 * inverse of parseFxChain, and exactly its inverse: quantize() snaps a dial to
 * what this can say, so parse(format(p)) === p for any p the device can hold.
 * That is what lets the text box be a projection of the parameters rather than a
 * second source of truth racing them (see src/app/fx/App.tsx).
 *
 * A stage is written if the user named it, or if its value is not neutral - an
 * automation lane that opens the filter must show up in the line even though
 * nobody typed `.lpf()`.
 *
 * A MODULATED STAGE IS PRINTED AS WHAT IT IS, not as where it happens to be. `sources`
 * carries the expression a patterned stage was written as (parseFxChain's `patterned`,
 * persisted by the app), and it WINS over the parameter's value: a modulated filter's
 * parameter holds whatever the last ramp passed through, so printing the number would
 * quietly rewrite `.lpf(sine.range(200, 2000))` into `.lpf(1372)` - the user's
 * modulation replaced by a snapshot of it, on nothing more than a re-render. The
 * inverse property above still holds for every stage that is a number, which is every
 * stage the parameters are actually the truth for.
 */
export function formatFxChain(p: FxParams, used: readonly FxParam[], sources: Partial<Record<FxParam, string>> = {}): string {
	return RACK.filter((s) => used.includes(s.param) || sources[s.param] || p[s.param] !== s.neutral)
		.map((s) => `.${s.call}(${sources[s.param] ?? quantize(s.param, p[s.param])})`)
		.join("");
}

/** The `sources` map formatFxChain wants, from what parseFxChain found. */
export function patternSources(patterned: readonly PatternedStage[]): Partial<Record<FxParam, string>> {
	const out: Partial<Record<FxParam, string>> = {};
	for (const s of patterned) out[s.param] = s.source;
	return out;
}
