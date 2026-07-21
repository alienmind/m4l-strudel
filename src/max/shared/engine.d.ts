/**
 * Types for the headless Strudel engine (engine.mjs). Narrow on purpose - the module
 * is untyped `.mjs`; this declares the surface TypeScript callers actually import so
 * they are not `any`. Patterns stay loosely typed (`unknown`): the render/determinism
 * helpers that consume them define their own structural slices.
 */
declare module "*/max/shared/engine.mjs" {
	/* eslint-disable @typescript-eslint/no-explicit-any */
	export function bootScope(): Promise<void>;
	// `any`, not `unknown`: patterns and haps are structurally rich and every caller
	// (tests included) reaches into them; a narrow type here would fight all of them.
	export function compile(code: string): Promise<any>;
	export function queryWindow(pat: any, from: number, to: number, cps: number): any[];
	export function hapToNote(hap: any, cps: number, ctx?: any): any;
	export function hapToVoice(hap: any, cps: number): any;
	export function hapToClipNote(hap: any, ctx?: any): any;
	export function exportNotes(pat: any, cycles: number, cps: number, ctx?: any): any[];
	export function patternCycles(pat: any, cps: number, ctx?: any, maxCycles?: number): number;
	export function setLiveScale(name: string | undefined): void;
	export function installDollarCollector(): void;
	export function installReplShims(): void;
}
