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

	/** The Pattern class value (for prototype augmentation). Coexists with the interface. */
	export const Pattern: { prototype: Record<string, unknown> };
	/** The empty pattern - what a no-op statement returns. */
	export const silence: Pattern;

	/** The continuous signals: one sweep per cycle. */
	export const sine: Pattern;
	export const cosine: Pattern;
	export const saw: Pattern;
	export const isaw: Pattern;
	export const tri: Pattern;
	export const square: Pattern;
	export const rand: Pattern;
	export const perlin: Pattern;

	/** Register one or more generic controls by name; returns the param functions. */
	export function createParams(...names: string[]): Record<string, unknown>;

	export function run(n: number): Pattern;
	export function irand(n: number): Pattern;
	export function signal(fn: (t: number) => unknown): Pattern;
	export function pure(value: unknown): Pattern;
}

/**
 * superdough - the real synth/sample/effect engine, aliased into the submodule
 * (strudel/packages/superdough). Narrow to what src/lib/render/offline.ts uses for the
 * OfflineAudioContext render path. See the SUPERDOUGH Rendering design.
 */
declare module "superdough" {
	/** Schedule one hap. `t`/`dur` are seconds from the context's zero. */
	export function superdough(value: unknown, t: number, hapDuration: number, cps?: number, cycle?: number): Promise<void>;
	/** Set polyphony and load the DSP worklets into the current audio context. */
	export function initAudio(options?: { disableWorklets?: boolean; maxPolyphony?: number; multiChannelOrbits?: boolean }): Promise<void>;
	/** Load ONLY the DSP worklets into the current audio context - no kabelsalat, no resume. */
	export function loadWorklets(): Promise<unknown>;
	/** Set the max voice count before loading worklets. */
	export function setMaxPolyphony(polyphony: number): void;
	/** Register the built-in oscillator sounds (sine/saw/square/tri/supersaw/...) into the sound map. */
	export function registerSynthSounds(): void;
	/** Map the 0..1 gain value through a curve (superdough global state). */
	export function setGainCurve(fn: (x: number) => number): void;
	/** Swap the module-level audio context singleton (null re-defaults on next get). */
	export function setAudioContext(context: BaseAudioContext | null): void;
	/** Swap the output controller singleton. */
	export function setSuperdoughAudioController(controller: unknown | null): void;
	/** Clear global reverb/delay/etc. state between renders. */
	export function resetGlobalEffects(): void;
	/** Drop the cross-context node pool - required between OfflineAudioContexts (see offline.ts). */
	export function clearNodePools(): void;
	/** Load a sample map (e.g. "github:tidalcycles/dirt-samples") into the sound map. */
	export function samples(sampleMap: string | object, baseUrl?: string, options?: object): Promise<void>;
	export function initAudioOnFirstClick(options?: object): Promise<void>;
}

declare module "@strudel/webaudio" {
	export function getAudioContext(): BaseAudioContext;
	export function initAudioOnFirstClick(options?: object): Promise<void>;
}

declare module "superdough/superdoughoutput.mjs" {
	/** Owns orbits, buses and the destination merger for one audio context. */
	export class SuperdoughAudioController {
		constructor(ctx: BaseAudioContext);
	}
}
