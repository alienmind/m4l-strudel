/*
offline.ts - render Strudel cycles with the REAL superdough into a WAV.

This is NOT the retired 0.9.x playback pipeline (that looped rendered WAVs in Max; see
doc/DRAWER_OF_FAILED_IDEAS.md). Live playback is native now. This is the one heir worth
keeping: an on-demand BOUNCE - "Export audio" renders the pattern to a .wav next to the
device, the same file you can drag into a track.

An OfflineAudioContext is injected into superdough's module-level singletons, every hap
in the arc is scheduled through the real `superdough()`, and startRendering() hands back
an AudioBuffer we encode to 16-bit PCM. MAIN thread only: OfflineAudioContext does not
exist in a Worker, and the engine worker keeps owning transport time.

The recipe (worklets-not-initAudio, serialized renders, node-pool clearing) is the one
the 0.9.x S1 spike proved in Chromium; it is restored here intact.
*/

import {
	superdough,
	loadWorklets,
	setMaxPolyphony,
	registerSynthSounds,
	setAudioContext,
	setSuperdoughAudioController,
	resetGlobalEffects,
	clearNodePools,
} from "superdough";
import { SuperdoughAudioController } from "superdough/superdoughoutput.mjs";
import { audioBufferToWav } from "./wav";

// The oscillator sounds (sine/saw/square/tri/supersaw/...) are registered by an EXPORTED
// function, not on import - superdough leaves the call to the host. Do it once, lazily,
// so `s("sawtooth")` and friends resolve. Sample sounds are registered separately via
// samples() before the first sample render (the superdough device does this at init).
let synthSoundsRegistered = false;
function ensureSynthSounds(): void {
	if (synthSoundsRegistered) return;
	registerSynthSounds();
	synthSoundsRegistered = true;
}

/** The slice of a Strudel Hap the renderer touches. engine.mjs is untyped. */
interface HapLike {
	value: unknown;
	whole: { begin: { valueOf(): number } } | null;
	duration: { valueOf(): number };
	hasOnset(): boolean;
	ensureObjectValue(): void;
}

/** The slice of a Strudel Pattern the renderer touches. */
export interface RenderablePattern {
	queryArc(begin: number, end: number, controls: Record<string, unknown>): HapLike[];
}

export interface RenderResult {
	/** 16-bit PCM WAV, ready for saveToFile(). */
	wav: ArrayBuffer;
	/** Rendered length in seconds. */
	seconds: number;
}

/**
 * SERIALIZED, one render at a time. superdough's audio context and output controller
 * are MODULE-LEVEL SINGLETONS: a second render starting while one is in flight swaps
 * the globals under the first, whose remaining haps then try to connect nodes across
 * two OfflineAudioContexts - "cannot connect to an AudioNode belonging to a different
 * audio context". Every call queues behind the previous one.
 */
let renderQueue: Promise<unknown> = Promise.resolve();

/**
 * Render cycles [begin, begin+cycles) of `pat` with the real superdough.
 *
 * `pat` must be a FRESH compile (not the worker's live pattern - it lives in another
 * thread). Superdough's globals are swapped for the duration and restored in `finally`.
 */
export function renderCycles(
	pat: RenderablePattern,
	cps: number,
	begin: number,
	cycles: number,
	sampleRate = 44100,
): Promise<RenderResult> {
	const run = renderQueue.then(() => renderCyclesNow(pat, cps, begin, cycles, sampleRate));
	renderQueue = run.catch(() => {}); // a failed render must not jam the queue
	return run;
}

async function renderCyclesNow(
	pat: RenderablePattern,
	cps: number,
	begin: number,
	cycles: number,
	sampleRate: number,
): Promise<RenderResult> {
	const seconds = cycles / cps;
	const ctx = new OfflineAudioContext(2, Math.ceil(seconds * sampleRate), sampleRate);
	setAudioContext(ctx);
	setSuperdoughAudioController(new SuperdoughAudioController(ctx));
	try {
		// Load the DSP worklets into THIS context. We deliberately do NOT call superdough's
		// initAudio(): it awaits initKabelsalat() unconditionally, which hangs under
		// OfflineAudioContext. kabelsalat is only needed for the `kabel` synth type, not
		// for standard synths/samples/effects, so loadWorklets() alone is the offline path.
		ensureSynthSounds();
		setMaxPolyphony(128);
		await loadWorklets();
		const haps = pat
			.queryArc(begin, begin + cycles, { _cps: cps })
			.filter((h) => h.hasOnset())
			// Sorted by onset - matters for controls that depend on graph state like `cut`.
			.sort((a, b) => (a.whole?.begin.valueOf() ?? 0) - (b.whole?.begin.valueOf() ?? 0));
		for (const hap of haps) {
			hap.ensureObjectValue();
			const onset = hap.whole?.begin.valueOf() ?? begin;
			// Awaited: sample loads (fetch + decodeAudioData) complete BEFORE startRendering,
			// so sample patterns render. Times are relative to the chunk start, in seconds.
			await superdough(hap.value, (onset - begin) / cps, hap.duration.valueOf() / cps, cps, onset - begin);
		}
		const buffer = await ctx.startRendering();
		return { wav: audioBufferToWav(buffer), seconds };
	} finally {
		// Do not leave a closed offline context installed; the next getAudioContext()
		// lazily rebuilds a realtime one if anyone asks.
		setAudioContext(null);
		setSuperdoughAudioController(null);
		resetGlobalEffects();
		// The node pool is keyed by node type ACROSS contexts - a pooled node from this
		// render's OfflineAudioContext would be handed to the next render's context and
		// throw on connect. Clear it so every render starts clean.
		clearNodePools();
	}
}
