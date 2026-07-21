import { useCallback, useEffect, useRef, useState } from "react";
import { registerSynthSounds, samples, setGainCurve, superdough, initAudio, getAudioContext } from "superdough";
import { saveToFile } from "@m4l-jweb/bridge";
import { bootScope, compile } from "../../max/shared/engine.mjs";
import { renderPeriod } from "../../lib/render/determinism";
import { renderCycles } from "../../lib/render/offline";
import { asStrudelCode } from "../../lib/strudelCode";
import { useStrudelEngine } from "../shared/useStrudelEngine";
import surface, { INITIAL_TEXT } from "./surface";

/**
 * The sample maps strudel.cc prebakes (strudel/packages/repl/prebake.mjs). Without
 * them `s("bd")`, `s("piano")`, and the drum machines resolve to nothing and
 * superdough logs "sound not found". Synths (registerSynthSounds) need no network;
 * these do, so they are loaded best-effort - a failed map must not sink the others,
 * nor block synth playback. Offline caching of these fetches is TODO item 2.
 */
const DOUGH = "https://raw.githubusercontent.com/felixroos/dough-samples/main";
const UZU = "https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main";
const SAMPLE_MAPS = [
	`${DOUGH}/tidal-drum-machines.json`,
	`${DOUGH}/piano.json`,
	`${DOUGH}/Dirt-Samples.json`,
	`${DOUGH}/vcsl.json`,
	`${DOUGH}/mridangam.json`,
	`${UZU}/strudel.json`,
];

/**
 * The native Web Audio sink for the Superdough device.
 *
 * The engine worker schedules haps against the Live transport and hands each one
 * over with a delayMs computed on ITS clock (plugsync~ ticks, or the free-run
 * wall-clock timer when Live is stopped). The page's AudioContext under jweb~
 * is a different clock, and the two can drift: if we scheduled blindly at
 * currentTime + delayMs, drift past the lookahead window would put every event
 * in the past and superdough DROPS past events - the audio "collapses" into
 * silence. So clamp: an event that arrives late plays now (a few ms of jitter)
 * instead of never, and the accumulated lateness is logged so the drift is
 * visible in the jweb console instead of being a mystery.
 */
const MIN_LEAD_S = 0.01;

/** Longest bounce we render, in cycles - a pattern whose period does not settle is
 *  capped here rather than rendering forever. */
const MAX_EXPORT_CYCLES = 32;

export function useSuperdoughRender() {
	const [samplesNote, setSamplesNote] = useState<string | null>("Loading samples...");
	const initialized = useRef(false);
	const lateStats = useRef({ count: 0, worstMs: 0, lastLogged: 0 });
	const [exporting, setExporting] = useState(false);
	const [exportNote, setExportNote] = useState<string | null>(null);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;
		Promise.all([initAudio(), registerSynthSounds()])
			.then(() => {
				// Synths are ready now; sample maps load in the background so a slow (or
				// offline) fetch never holds up synth patterns. allSettled: one dead map
				// must not silence the rest.
				setSamplesNote("Loading sample maps...");
				void Promise.allSettled(SAMPLE_MAPS.map((m) => samples(m))).then((results) => {
					const failed = results.filter((r) => r.status === "rejected").length;
					setSamplesNote(failed ? `${failed}/${SAMPLE_MAPS.length} sample maps offline - synths still play` : null);
				});
			})
			.catch((e) => setSamplesNote("Failed to load sounds: " + e.message));
	}, []);

	const engine = useStrudelEngine({
		surface: surface as any,
		initialText: INITIAL_TEXT,
		ctx: {},
		liveScale: "C4:major",
		superdoughSink: (ev) => {
			if (!initialized.current) return;
			const ctx = getAudioContext();
			const ideal = ctx.currentTime + ev.delayMs / 1000;
			const t = Math.max(ctx.currentTime + MIN_LEAD_S, ideal);
			const lateMs = (t - ideal) * 1000;
			if (lateMs > 1) {
				const s = lateStats.current;
				s.count++;
				s.worstMs = Math.max(s.worstMs, lateMs);
				const now = Date.now();
				if (now - s.lastLogged > 5000) {
					s.lastLogged = now;
					console.warn(`[superdough-sink] ${s.count} late events, worst ${s.worstMs.toFixed(0)}ms - engine/audio clock drift`);
				}
			}
			superdough(ev.value, t, ev.durMs / 1000, ev.cps, ev.cycle);
		},
	});

	/**
	 * Export the current pattern to a WAV next to the device (TODO item 3).
	 *
	 * A one-shot BOUNCE, not the retired loop pipeline: compile fresh on this thread
	 * (the worker's pattern lives in another one), find the true loop period, render
	 * it offline with the real superdough, and saveToFile the WAV. The file lands
	 * flat in the device folder - the same drag-out handle the sample browser writes.
	 */
	const exportAudio = useCallback(async () => {
		if (exporting) return;
		setExporting(true);
		setExportNote("Compiling...");
		try {
			await bootScope();
			// The real gain curve, so a pattern's setGainCurve() shapes the bounce (bootScope
			// installs a no-op; the audio thread's superdough owns the real one).
			(globalThis as Record<string, unknown>).setGainCurve = setGainCurve;
			const cps = engine.tempo / 60 / engine.beatsPerCycle;
			const pat = await compile(asStrudelCode(engine.text, engine.noteCtx));
			const cycles = renderPeriod(pat, cps, MAX_EXPORT_CYCLES);
			setExportNote(`Rendering ${cycles} cycle${cycles === 1 ? "" : "s"}...`);
			// Render at the page's own rate, so the bounce matches what Live is running
			// rather than forcing a resample on import.
			const { wav, seconds } = await renderCycles(pat, cps, 0, cycles, getAudioContext().sampleRate);
			const name = `superdough-export-${Date.now()}.wav`;
			await saveToFile(name, wav);
			setExportNote(`Exported ${name} (${seconds.toFixed(1)}s) - drag from the device folder`);
		} catch (e) {
			setExportNote("Export failed: " + (e instanceof Error ? e.message : String(e)));
		} finally {
			setExporting(false);
		}
	}, [exporting, engine.tempo, engine.beatsPerCycle, engine.text, engine.noteCtx]);

	// The shape App.tsx reads: the engine's own fields, plus the few the device adds.
	return {
		...engine,
		samplesNote,
		sliders: [],
		status: { phase: engine.status, message: engine.debug },
		beats: 0,
		beatsPerCycle: engine.beatsPerCycle,
		playing: engine.live,
		exportAudio,
		exporting,
		exportNote,
	};
}
