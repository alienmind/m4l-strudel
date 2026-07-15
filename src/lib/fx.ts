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
	{ param: "drive", call: "drive", neutral: 1, decimals: 2 },
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
}

/**
 * The effects with a real Max chain behind them, and the parameter each drives.
 *
 * `lpf` and `cutoff` are the same control - Strudel accepts both spellings, and a
 * user who types the one we did not think of should not get an error.
 */
const SUPPORTED: Record<string, FxParam> = {
	...Object.fromEntries(RACK.map((s) => [s.call, s.param])),
	cutoff: "cutoff",
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
const KNOWN_UNBUILT = new Set([
	"reverb",
	"crush",
	"pan",
	"hpf",
	"distort",
	"shape",
	"coarse",
	"vowel",
	"phaser",
]);

/** Wide open, unity gain: the chain that does nothing, which an empty line means. */
export const NEUTRAL: FxParams = Object.fromEntries(RACK.map((s) => [s.param, s.neutral])) as FxParams;

export function parseFxChain(text: string): FxResult {
	const src = text.trim();
	const params: FxParams = { ...NEUTRAL };
	const named = new Set<FxParam>();
	// In rack order, not typing order: .gain(2).lpf(800) and .lpf(800).gain(2) are
	// the same signal path (§3c), so they must read back as the same line.
	const used = () => RACK.map((s) => s.param).filter((p) => named.has(p));

	if (src === "") return { params, used: [], unsupported: [], error: null };

	// A chain has to start with a call, or it is not a chain. Catching this here
	// keeps the eval below from having to make sense of arbitrary text.
	if (!src.startsWith(".")) {
		return {
			params,
			used: [],
			unsupported: [],
			error: "An effects chain starts with a dot: .lpf(800).gain(1.2)",
		};
	}

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
		// too). What it CANNOT do is reach anything: the recorder is the only name
		// in scope, so `.lpf(sine.range(...))` throws a ReferenceError rather than
		// silently resolving to something.
		new Function("fx", `return fx${src}`)(recorder);
	} catch (e) {
		const msg = String((e as Error)?.message ?? e);
		return {
			params,
			used: [],
			unsupported: [],
			error: /is not defined/.test(msg) ? `${msg} - v1 takes constant values only, e.g. .lpf(800)` : msg,
		};
	}

	const unsupported: string[] = [];
	for (const { effect, args } of calls) {
		const target = SUPPORTED[effect];
		if (!target) {
			unsupported.push(effect);
			continue;
		}
		const v = Number(args[0]);
		if (!Number.isFinite(v)) {
			return {
				params,
				used: used(),
				unsupported,
				error: `.${effect}() needs a number, e.g. .${effect}(800)`,
			};
		}
		// Last one wins, the way it does in Strudel: `.gain(1).gain(2)` is gain 2.
		params[target] = quantize(target, v);
		named.add(target);
	}

	return { params, used: used(), unsupported, error: null };
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
 */
export function formatFxChain(p: FxParams, used: readonly FxParam[]): string {
	return RACK.filter((s) => used.includes(s.param) || p[s.param] !== s.neutral)
		.map((s) => `.${s.call}(${quantize(s.param, p[s.param])})`)
		.join("");
}
