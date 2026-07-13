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

/** What each Strudel effect maps to on the Max side. */
export interface FxParams {
	/** Lowpass cutoff, in Hz - the real unit the Live parameter carries. */
	cutoff: number;
	/** Output level, a linear multiplier. 1 is unity, as in Strudel. */
	gain: number;
}

export interface FxResult {
	params: FxParams;
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
const SUPPORTED: Record<string, keyof FxParams> = {
	lpf: "cutoff",
	cutoff: "cutoff",
	gain: "gain",
};

/**
 * Effects Strudel really has, which this device knowingly cannot do yet. Named
 * explicitly so the UI can say "not yet" instead of "unknown effect" - the two
 * are very different messages to the person typing.
 */
const KNOWN_UNBUILT = new Set([
	"room",
	"reverb",
	"delay",
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
export const NEUTRAL: FxParams = { cutoff: 18000, gain: 1 };

export function parseFxChain(text: string): FxResult {
	const src = text.trim();
	const params: FxParams = { ...NEUTRAL };
	if (src === "") return { params, unsupported: [], error: null };

	// A chain has to start with a call, or it is not a chain. Catching this here
	// keeps the eval below from having to make sense of arbitrary text.
	if (!src.startsWith(".")) {
		return { params, unsupported: [], error: 'An effects chain starts with a dot: .lpf(800).gain(1.2)' };
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
			unsupported: [],
			error: /is not defined/.test(msg)
				? `${msg} - v1 takes constant values only, e.g. .lpf(800)`
				: msg,
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
			return { params, unsupported, error: `.${effect}() needs a number, e.g. .${effect}(800)` };
		}
		// Last one wins, the way it does in Strudel: `.gain(1).gain(2)` is gain 2.
		params[target] = v;
	}

	return { params, unsupported, error: null };
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
