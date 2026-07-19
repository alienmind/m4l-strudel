import { useCallback, useEffect, useRef, useState } from "react";
import { bindInlet, onRenderReady, outlet, renderStop, saveToFile, renderLoad, renderArm, renderSync, uiReady, DEVICE_IN } from "@m4l-jweb/bridge";
import { useParam, useStateSync } from "@m4l-jweb/surface/react";
// @ts-expect-error - engine.mjs is untyped (raw submodule-facing JS)
import { bootScope, compile } from "@/max/shared/engine.mjs";
import { renderCycles } from "@/lib/render/offline";
import { isDeterministic, renderPeriod } from "@/lib/render/determinism";
import {
	beginSliderCapture,
	getSliderSpecs,
	installRenderScope,
	setSliderOverrides,
	type SliderSpec,
} from "@/lib/render/scope";
import { SuperdoughConductor, type ConductorStatus, type CompiledPattern } from "@/lib/render/conductor";
import { detectCps, beatsPerCycleForTempoLock } from "@/lib/tempo";
import { samples, setGainCurve } from "superdough";
import surface, { INITIAL_TEXT } from "./surface";

/**
 * useSuperdoughRender - the superdough device's one hook: the conductor wired to its
 * REAL dependencies, plus the device state around it (code slot, Play param, transport
 * readout, status).
 *
 * NO ENGINE WORKER here, deviating from the first sketch on purpose. The worker exists
 * to schedule notes against the transport; this device schedules nothing live - Max
 * plays a rendered WAV. What the worker would have added is a SECOND compile of the
 * code in a scope without the full-Strudel shims (setCpm, slider, _scope...), which
 * fails on exactly the strudel.cc patterns this device is for and would surface a
 * spurious eval error next to a render that works. And the editor playhead it feeds is
 * bare-mini-only - full Strudel code has no source spans - so it bought nothing here.
 * One compile, the conductor's, is the single source of truth for errors.
 *
 * The tick/tempo inlets are bound HERE (the bridge keeps one handler per selector, so
 * whoever owns them must fan out): tick feeds conductor.tick() - the transport lock -
 * and a throttled readout for the UI.
 */

/**
 * Per-instance WAV prefix. Relative saveToFile paths land in the device folder, which
 * two instances of this device SHARE - unprefixed names would have them overwrite each
 * other's renders (the buffers are `---`-scoped; the files must be scoped too). A fresh
 * id per page load also means a reloaded set never plays a stale WAV from last session.
 */
const instanceId = Math.random().toString(36).slice(2, 8);

/** How long a rendered loop's WAV files linger: two per instance per session, replaced
 *  in place on every re-render. Old sessions' files are dead weight on disk, not a bug. */
const FILE_PREFIX = `superdough-${instanceId}-`;

/** The strudel.cc default sample map, loaded once so `s("bd")` resolves. Network on
 *  first use; superdough's module caches hold the decoded buffers for the session. */
const DEFAULT_SAMPLE_MAP = "github:tidalcycles/dirt-samples";

export interface SuperdoughState {
	text: string;
	setText: (t: string) => void;
	/** The conductor's status verbatim - phase, loop/rolling mode, message, slot. */
	status: ConductorStatus;
	/** A pattern has been evaluated and its render is (or will be) looping. */
	live: boolean;
	run: () => void;
	hush: () => void;
	/** Amber note when the sample map could not load - synth patterns still render. */
	samplesNote: string | null;
	/** Transport readout (throttled to ~4 Hz for display). */
	playing: boolean;
	beats: number;
	tempo: number;
	/** How many Live beats one cycle spans at the current tempo - the loop geometry. */
	beatsPerCycle: number;
	/** The slider() occurrences the last compile found, in source order, each bound to
	 *  a native knob (S1 maps to the first, ... first eight only) and to a web slider. */
	sliders: SliderControl[];
	/** BUILD_STAMP of the .amxd wrapper ("?" until reported). */
	amxdBuild: string;
}

/** How many native knobs the surface declares (s1..s8). */
const KNOBS = 8;

const normalize = (raw: number, s: SliderSpec) => (s.max === s.min ? 0 : (raw - s.min) / (s.max - s.min));
const denormalize = (v: number, s: SliderSpec) => s.min + v * (s.max - s.min);

/** One slider as the UI sees it: the code's declaration bound to a knob. */
export interface SliderControl {
	/** Derived from the code around the slider ("lpf", "rlpf", ...), or S<n>. */
	label: string;
	min: number;
	max: number;
	/** The value currently sounding, in the slider's own units. */
	raw: number;
	/** The knob's normalized 0..1 position. */
	norm: number;
	/** Move it (normalized). Writes the native knob param; the re-render follows. */
	set: (norm: number) => void;
}

/**
 * A human label for a slider, from the code around it. The transpiler's widget id is
 * the source range of the slider's VALUE argument (`from:to`), so the text just before
 * `from` ends with `...<method>(slider(` - that method name ("lpf", "trancegate") is
 * the best name the code offers; sliders themselves are anonymous.
 */
function sliderLabel(code: string, spec: SliderSpec, index: number): string {
	const from = Number(spec.id.split(":")[0]);
	if (Number.isFinite(from) && from > 0 && from <= code.length) {
		const head = code.slice(0, from);
		const m = head.match(/([A-Za-z_$][\w$]*)\s*\(\s*slider\s*\(\s*$/);
		if (m) return m[1];
	}
	return `S${index + 1}`;
}

export function useSuperdoughRender(): SuperdoughState {
	const [playParam, setPlayParam] = useParam(surface, "play");
	const [savedText, setSavedText] = useStateSync(surface, "code");
	// An empty box is a value, not a missing one - same rule as useStrudelEngine.
	const text = typeof savedText === "string" ? savedText : INITIAL_TEXT;
	const textRef = useRef(text);
	textRef.current = text;

	const [status, setStatus] = useState<ConductorStatus>({ phase: "idle", mode: null, message: "idle", slot: null });
	const [live, setLive] = useState(false);
	const liveRef = useRef(false);
	liveRef.current = live;
	const [samplesNote, setSamplesNote] = useState<string | null>(null);
	const [amxdBuild, setAmxdBuild] = useState("?");

	// THE SLIDER KNOBS (s1..s8 <-> slider() occurrences, see surface.ts). Hooks cannot
	// live in a loop over a dynamic count, so the eight pairs are spelled out.
	const knob1 = useParam(surface, "s1");
	const knob2 = useParam(surface, "s2");
	const knob3 = useParam(surface, "s3");
	const knob4 = useParam(surface, "s4");
	const knob5 = useParam(surface, "s5");
	const knob6 = useParam(surface, "s6");
	const knob7 = useParam(surface, "s7");
	const knob8 = useParam(surface, "s8");
	const knobs = [knob1, knob2, knob3, knob4, knob5, knob6, knob7, knob8];
	const knobValues = knobs.map(([v]) => Number(v) || 0);
	const knobSetters = knobs.map(([, set]) => set);
	const knobSettersRef = useRef(knobSetters);
	knobSettersRef.current = knobSetters;

	const [sliderSpecs, setSliderSpecs] = useState<SliderSpec[]>([]);
	const [sliderLabels, setSliderLabels] = useState<string[]>([]);
	/** Knob values the device wants instead of the code's defaults, by slider order.
	 *  null = untouched knob, the code's own value plays. Cleared when the code changes. */
	const overridesRef = useRef<(number | null)[]>(new Array(KNOBS).fill(null));
	/** The normalized value WE last pushed to each knob, so the knob-change effect can
	 *  tell a user turn from our own echo. */
	const appliedNormRef = useRef<number[]>(new Array(KNOBS).fill(0));
	const slidersRef = useRef<SliderSpec[]>([]);
	const lastCodeRef = useRef<string | null>(null);

	const [tempo, setTempo] = useState(120);
	const tempoRef = useRef(120);
	const [transport, setTransport] = useState({ playing: false, beats: 0 });

	// The conductor, created once with its real deps. Everything async it needs
	// (bootScope, the render scope shims, the sample map) is folded into the compile
	// dep so evaluate() stays one call.
	const conductorRef = useRef<SuperdoughConductor | null>(null);
	if (!conductorRef.current) {
		let bootstrapped = false;
		let samplesTried = false;
		const bootstrap = async () => {
			if (bootstrapped) return;
			await bootScope();
			// setGainCurve injected: scope.ts must stay superdough-free for node tests.
			installRenderScope({ setGainCurve });
			bootstrapped = true;
		};
		const ensureSamples = async () => {
			if (samplesTried) return;
			samplesTried = true;
			try {
				await samples(DEFAULT_SAMPLE_MAP);
			} catch {
				// Offline, or the CDN hiccuped: synth patterns still render; say so once
				// instead of failing every render that never names a sample.
				setSamplesNote("sample map unavailable (offline?) - sample patterns need network on first render");
			}
		};
		conductorRef.current = new SuperdoughConductor(
			{
				compile: async (code: string) => {
					await bootstrap();
					await ensureSamples();
					// Sliders: feed the knob overrides into this compile, capture what the
					// code declares, then reflect the effective values back onto the knobs
					// (normalized) so the panel shows what is actually sounding.
					setSliderOverrides(overridesRef.current);
					beginSliderCapture();
					const pat = await compile(code);
					const specs = getSliderSpecs().slice(0, KNOBS);
					slidersRef.current = specs;
					setSliderSpecs(specs);
					setSliderLabels(specs.map((spec, i) => sliderLabel(code, spec, i)));
					specs.forEach((spec, i) => {
						const effective = overridesRef.current[i] ?? spec.value;
						const norm = Math.max(0, Math.min(1, normalize(effective, spec)));
						appliedNormRef.current[i] = norm;
						knobSettersRef.current[i](norm);
						// Best-effort: ask the wrapper to rename the native dial after the code's
						// own name for it ("S1" -> "lpf"), so a Rack macro or Push shows the
						// semantic name (H.7's "dynamic renaming" - Live check pending).
						outlet("knob_label", i, sliderLabel(code, spec, i));
					});
					// Reset the dials the code no longer uses back to their generic "S<n>" name -
					// otherwise a knob renamed "lpf" keeps that name after the slider is deleted.
					for (let i = specs.length; i < KNOBS; i++) {
						outlet("knob_label", i, `S${i + 1}`);
					}
					return pat;
				},
				probePeriod: (pat: CompiledPattern, cps: number) => renderPeriod(pat as Parameters<typeof renderPeriod>[0], cps),
				isDeterministic: (code, pat, cycles, cps) => isDeterministic(code, pat as Parameters<typeof isDeterministic>[1], cycles, cps),
				renderCycles: (pat, cps, begin, cycles) => renderCycles(pat as Parameters<typeof renderCycles>[0], cps, begin, cycles),
				saveToFile,
				renderLoad,
				renderArm,
				renderSync,
				onStatus: setStatus,
			},
			{ filePrefix: FILE_PREFIX },
		);
	}
	const conductor = conductorRef.current;

	/** beatsPerCycle is tempo-INDEPENDENT (set by the pattern's own cps), so the render
	 *  cps = bpm/60/beatsPerCycle scales with Live's tempo: the WAV is exactly loopBeats
	 *  long at the CURRENT tempo, the premise of the rate-1 transport lock. Raise the BPM
	 *  and the pattern speeds up and stays bar-locked; the tempo debounce re-renders so a
	 *  change re-locks. A setcpm in the code moves beatsPerCycle, not the render rate. */
	const beatsPerCycle = beatsPerCycleForTempoLock(detectCps(text));
	const bpcRef = useRef(beatsPerCycle);
	bpcRef.current = beatsPerCycle;

	const run = useCallback(() => {
		// New code means the knobs' meaning changed: drop the overrides so the pattern's
		// own slider defaults play (and get pushed back onto the knobs by the compile).
		if (textRef.current !== lastCodeRef.current) {
			lastCodeRef.current = textRef.current;
			overridesRef.current = new Array(KNOBS).fill(null);
		}
		void conductor.evaluate(textRef.current, tempoRef.current, bpcRef.current);
		setLive(true);
		setPlayParam(true);
	}, [conductor, setPlayParam]);

	const hush = useCallback(() => {
		conductor.stop();
		renderStop();
		setLive(false);
		setPlayParam(false);
	}, [conductor, setPlayParam]);

	// The bridge bindings, once. tick fans out to the conductor (transport lock, rolling
	// pace) and to a throttled display state; tempo re-renders a LIVE pattern after a
	// 300 ms debounce (a tempo change alters every duration - it is a full re-render).
	useEffect(() => {
		let lastShown = 0;
		bindInlet(DEVICE_IN.tick, (playing, beats) => {
			const p = Number(playing) >= 0.5;
			const b = Number(beats);
			conductor.tick(p, b);
			const now = Date.now();
			if (now - lastShown > 250) {
				lastShown = now;
				setTransport({ playing: p, beats: b });
			}
		});
		let tempoDebounce: ReturnType<typeof setTimeout> | null = null;
		bindInlet(DEVICE_IN.tempo, (bpm) => {
			const v = Number(bpm);
			if (!(v > 0)) return;
			const changed = Math.abs(v - tempoRef.current) > 0.001;
			tempoRef.current = v;
			setTempo(v);
			if (changed && liveRef.current) {
				if (tempoDebounce) clearTimeout(tempoDebounce);
				tempoDebounce = setTimeout(() => {
					void conductor.evaluate(textRef.current, tempoRef.current, bpcRef.current);
				}, 300);
			}
		});
		bindInlet(DEVICE_IN.build, (stamp) => setAmxdBuild(String(stamp).split(" ")[0]));
		onRenderReady((slot) => conductor.ready(slot));
		uiReady();
		return () => {
			if (tempoDebounce) clearTimeout(tempoDebounce);
		};
	}, [conductor]);

	// The Play parameter (macro/Push/automation) drives run/hush, and run/hush set it
	// back - same loop the MIDI device uses.
	useEffect(() => {
		if (playParam && !live) run();
		else if (!playParam && live) hush();
	}, [playParam, live, run, hush]);

	// A KNOB TURN re-renders the pattern with the new slider value - the offline-render
	// answer to dragging strudel.cc's widget, at one render of latency. Debounced: a dial
	// sweep is a burst of param messages and each render costs real work. Our own pushes
	// (the compile reflecting effective values back) are filtered via appliedNormRef, so
	// this only fires on a genuine user turn of a knob that maps to a slider.
	const knobDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => {
		if (!liveRef.current) return;
		let touched = false;
		knobValues.forEach((v, i) => {
			const spec = slidersRef.current[i];
			if (!spec) return;
			if (Math.abs(v - appliedNormRef.current[i]) < 0.004) return;
			appliedNormRef.current[i] = v;
			overridesRef.current[i] = denormalize(v, spec);
			touched = true;
		});
		if (!touched) return;
		if (knobDebounce.current) clearTimeout(knobDebounce.current);
		knobDebounce.current = setTimeout(() => {
			void conductor.evaluate(textRef.current, tempoRef.current, bpcRef.current);
		}, 300);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, knobValues);

	// The web-side slider controls (H.7's React zone). Each writes the SAME native knob
	// param its slider is bound to, so web slider, native dial, a Rack macro and Push are
	// four faces of one value, and the knob-change effect above owns the re-render.
	const sliders: SliderControl[] = sliderSpecs.map((spec, i) => ({
		label: sliderLabels[i] ?? `S${i + 1}`,
		min: spec.min,
		max: spec.max,
		raw: denormalize(knobValues[i] ?? 0, spec),
		norm: knobValues[i] ?? 0,
		set: (norm: number) => knobSettersRef.current[i](Math.max(0, Math.min(1, norm))),
	}));

	return {
		text,
		setText: setSavedText,
		status,
		live,
		run,
		hush,
		samplesNote,
		playing: transport.playing,
		beats: transport.beats,
		tempo,
		beatsPerCycle,
		sliders,
		amxdBuild,
	};
}
