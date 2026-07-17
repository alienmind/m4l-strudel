/**
 * strudel.d.ts - types for the parts of @strudel/core this repo imports from
 * TypeScript.
 *
 * WHY THIS FILE EXISTS. Strudel is a git SUBMODULE of raw `.mjs`, not an npm dependency
 * with types (vite.config.ts and tsconfig.json both alias `@strudel/*` into
 * `strudel/packages/*`). The headless engine got away with no declarations because it
 * is `.mjs` itself and tsc never looks inside; `src/lib/fx.ts` imports the signals from
 * TypeScript, and tsc does.
 *
 * DELIBERATELY NARROW. This describes what we USE, not what Strudel has - the real
 * types live upstream and any fuller copy here would be a second, rotting definition of
 * someone else's API. A signal is a Pattern; a Pattern can be queried. That is all fx.ts
 * asks of it.
 */
declare module "@strudel/core" {
	/** One event: a value, over a span of the timeline. */
	export interface Hap {
		value: unknown;
	}

	/**
	 * A pattern of values over time. `queryArc(begin, end)` asks what it holds across a
	 * span of CYCLES - a zero-width span asks for one instant, which is what a transport
	 * tick wants.
	 */
	export interface Pattern {
		queryArc(begin: number, end: number): Hap[];
		/** Map a signal's 0..1 travel onto a real range - `sine.range(200, 2000)`. */
		range(min: number, max: number): Pattern;
		[key: string]: unknown;
	}

	export function isPattern(x: unknown): x is Pattern;

	/** The continuous signals: one sweep per cycle. */
	export const sine: Pattern;
	export const cosine: Pattern;
	export const saw: Pattern;
	export const isaw: Pattern;
	export const tri: Pattern;
	export const square: Pattern;
	export const rand: Pattern;
	export const perlin: Pattern;

	export function run(n: number): Pattern;
	export function irand(n: number): Pattern;
	export function signal(fn: (t: number) => unknown): Pattern;
	export function pure(value: unknown): Pattern;
}
