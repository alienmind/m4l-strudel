import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAudioContext, initAudio, registerSynthSounds, samples, superdough } from "superdough";
import { bindInlet, onNote, onNoteOff, uiReady } from "@m4l-jweb/bridge";
import { useStateSync } from "@m4l-jweb/surface/react";
import {
	beginSliderCapture,
	bootScope,
	compile,
	getSliderSpecs,
	setSliderOverrides,
} from "../../max/shared/engine.mjs";
import { loadSampleMaps } from "../../lib/sampleMaps";
import { sampleCacheStatus } from "../../lib/sampleCache";
import { useSliderKnobs } from "../shared/useSliderKnobs";
import type { SliderSpec } from "../shared/useStrudelEngine";
import surface, { INITIAL_TEXT } from "./surface";

/**
 * useSynth - the whole Synth device (doc/TODO.md item 3).
 *
 * It is deliberately tiny, and the 0.9.9 rewrite is why. With the real superdough live
 * in the page, a MIDI-driven synth is `onNote -> superdough(value, now)`: no timeline,
 * no transport, no engine worker, no scheduler. The only real work is turning the typed
 * SOUND SPEC into a superdough value once, at eval, and merging each note into it.
 *
 * THE SPEC IS A VALUE, NOT A PATTERN. `s("sawtooth").lpf(800).room(.3)` is compiled as
 * a pattern (that is the only parser Strudel has) and then QUERIED for its first hap -
 * whose value is the control object superdough wants. A spec with structure in it
 * (`s("<sawtooth square>")`) therefore collapses to its first cycle's first event: a
 * sound, not a sequence. That is the trade the device exists to make; the Superdough
 * device is where patterns belong.
 *
 * NOTE-OFF IS NOT A RELEASE, and this is the one honest limitation.
 * `superdough(value, t, duration)` is fire-and-forget - the voice's whole envelope is
 * scheduled at trigger time and there is no handle to cut it short. So a note's length
 * is decided WHEN IT STARTS, from the spec's own `sustain` (default below), and holding
 * a key longer does not hold the note. Note-offs are still tracked, because the next
 * thing that wants them is a re-trigger guard, not because they can stop a voice.
 */

/** How long a voice lasts when the spec does not say - short enough to feel like a
 *  keyboard, long enough for a pad to bloom. Seconds. */
const DEFAULT_SUSTAIN_S = 0.6;

/** Scheduling lead. superdough refuses to schedule in the past, and "now" IS the past
 *  by the time the value has crossed the bridge and React. */
const LEAD_S = 0.02;

export function useSynth() {
	const [savedText, setSavedText] = useStateSync(surface, "code");
	const text = typeof savedText === "string" ? savedText : INITIAL_TEXT;
	const [status, setStatus] = useState("Loading sounds...");
	const [error, setError] = useState<string | null>(null);
	const [sliderSpecs, setSliderSpecs] = useState<SliderSpec[]>([]);
	const [ready, setReady] = useState(false);
	/** How many notes have sounded, for the health line - the one number that says
	 *  whether MIDI is arriving at all. */
	const played = useRef(0);
	const [playedNow, setPlayedNow] = useState(0);
	/** The compiled sound: the control object every note is merged into. */
	const spec = useRef<Record<string, unknown> | null>(null);
	/** Which pitches are down. Not a release mechanism (see above) - a re-trigger guard,
	 *  so a stuck note-on repeat does not stack voices. */
	const held = useRef(new Set<number>());
	const booted = useRef(false);

	/* --- sounds ---------------------------------------------------------- */

	useEffect(() => {
		if (booted.current) return;
		booted.current = true;
		void (async () => {
			try {
				await Promise.all([initAudio(), registerSynthSounds()]);
				setReady(true);
				setStatus("Play a note");
				const failed = await loadSampleMaps((m) => samples(m) as Promise<unknown>);
				if (failed) {
					const cache = await sampleCacheStatus();
					setStatus(
						cache.entries
							? `${failed} sample map(s) offline - ${cache.entries} cached sound(s) still play`
							: `${failed} sample map(s) offline - synths still play`,
					);
				}
			} catch (e) {
				setError("Could not start audio: " + message(e));
			}
		})();
	}, []);

	/* --- the spec -------------------------------------------------------- */

	/**
	 * Compile the spec and keep its value. Ctrl+Enter runs this; so does a knob turn,
	 * which recompiles with the new slider values (the Superdough device's mechanism -
	 * `setSliderOverrides` feeds the NEXT compile).
	 */
	const run = useCallback(
		async (source?: string, overrides?: (number | null)[]) => {
			const code = source ?? text;
			try {
				await bootScope();
				if (overrides) setSliderOverrides(overrides);
				beginSliderCapture();
				const pat = await compile(code);
				const haps = pat.queryArc(0, 1, { _cps: 0.5 });
				const first = haps.find((h: { hasOnset?: () => boolean }) => h.hasOnset?.() !== false);
				const value = first?.value;
				if (!value || typeof value !== "object") {
					throw new Error('the spec produced no sound - try s("sawtooth")');
				}
				// `note` belongs to the KEYBOARD, not to the spec: a spec that names one would
				// make every key play the same pitch. Same for the pattern's own structure -
				// there is none left by this point.
				const { note: _note, n: _n, ...rest } = value as Record<string, unknown>;
				spec.current = rest;
				setSliderSpecs(getSliderSpecs().slice());
				setError(null);
				setStatus(describe(rest));
			} catch (e) {
				setError(message(e));
			}
		},
		[text],
	);

	// Compile once, as soon as audio is up, so a set that reopens is playable without
	// anyone pressing Run first.
	const firstRun = useRef(false);
	useEffect(() => {
		if (!ready || firstRun.current) return;
		firstRun.current = true;
		void run();
	}, [ready, run]);

	const setSliderValues = useCallback(
		(values: (number | null)[]) => {
			void run(undefined, values);
		},
		[run],
	);
	const sliders = useSliderKnobs(surface, sliderSpecs, text, setSliderValues);

	/* --- notes ----------------------------------------------------------- */

	/** Play one note. Bound once; reads the current spec through the ref. */
	const play = useCallback((pitch: number, velocity: number) => {
		const value = spec.current;
		if (!value) return;
		const ac = getAudioContext();
		const sustain = Number(value.sustain);
		const duration = Number.isFinite(sustain) && sustain > 0 ? sustain : DEFAULT_SUSTAIN_S;
		// `note` as a MIDI number is what superdough wants (it accepts names too); velocity
		// arrives 0..127 from Max and becomes superdough's 0..1 gain.
		superdough(
			{ ...value, note: pitch, velocity: Math.max(0, Math.min(1, velocity / 127)) },
			ac.currentTime + LEAD_S,
			duration,
		);
		played.current++;
	}, []);

	useEffect(() => {
		onNote((pitch, velocity) => {
			if (velocity <= 0) {
				held.current.delete(pitch);
				return;
			}
			held.current.add(pitch);
			play(pitch, velocity);
		});
		// A note-off cannot stop a voice that is already scheduled; it only clears the
		// held set, so the next press of the same key is a fresh trigger.
		onNoteOff((pitch) => held.current.delete(pitch));
		uiReady();
	}, [play]);

	// The health line, once a second: notes in, sounds out.
	useEffect(() => {
		const iv = setInterval(() => setPlayedNow(played.current), 1000);
		return () => clearInterval(iv);
	}, []);

	const [amxdBuild, setAmxdBuild] = useState("?");
	useEffect(() => {
		bindInlet("build", (stamp) => setAmxdBuild(String(stamp).split(" ")[0]));
	}, []);

	const debug = useMemo(
		() => `${ready ? "audio ready" : "booting"} / notes ${playedNow} / held ${held.current.size}`,
		[ready, playedNow],
	);

	return {
		text,
		setText: setSavedText,
		run: () => void run(),
		status,
		error,
		sliders,
		debug,
		amxdBuild,
	};
}

/** A one-line summary of what the spec is, for the status row. */
function describe(value: Record<string, unknown>): string {
	const sound = value.s ? String(value.s) : "the default sound";
	const rest = Object.keys(value).filter((k) => k !== "s");
	return rest.length ? `${sound} + ${rest.join(", ")}` : sound;
}

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));
