import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { describeParam, onParamRange } from "@m4l-jweb/bridge";
import { useParam } from "@m4l-jweb/surface/react";
import type { SliderSpec } from "./useStrudelEngine";

/**
 * Bind the `slider()` calls in a pattern to the device's native knob POOL (S1..S8).
 *
 * strudel.cc renders `slider(500, 100, 1000)` as a codemirror widget you drag. There is
 * no codemirror here, and a widget would be the wrong answer anyway: a value a musician
 * wants to move during a take has to be a REAL Live parameter, so it automates, MIDI-maps
 * and reaches Push. So each slider the code declares is bound, in source order, to one
 * of eight native dials.
 *
 * The pool is STATIC - eight dials exist in the patcher whether the code uses them or
 * not - because a frozen device cannot grow a parameter at runtime. Source order is the
 * mapping: the first `slider()` in the text is S1, the second is S2. Nothing to
 * configure, and re-editing the line keeps the same knob on the same slider.
 *
 * Values travel in NORMALIZED form (0..1) because that is what the dial holds; the
 * slider's own min..max is applied here, on the way in and out. A dial cannot carry its
 * slider's real range - a spike to set `_parameter_range` at runtime was tried and
 * reverted (it shifts the value domain the dial reports and the knob sticks at its
 * minimum), so the dials stay 0..1 and the arithmetic lives in this file.
 */

/** How many native dials the device declares. Eight is Push's bank size. */
export const KNOB_POOL = 8;
const KNOB_IDS = Array.from({ length: KNOB_POOL }, (_, i) => `s${i + 1}`);

export interface SliderKnob {
	/** What to call it in the UI - the code's own term where we can infer one. */
	label: string;
	min: number;
	max: number;
	/** Position 0..1, which is what the native dial holds. */
	norm: number;
	/** The value the pattern actually sees. */
	raw: number;
	/** Move it: takes a normalized 0..1 position. */
	set: (norm: number) => void;
	/** Which native dial this one is on (1-based), for the tooltip. */
	knob: number;
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const toNorm = (raw: number, min: number, max: number) => (max === min ? 0 : clamp01((raw - min) / (max - min)));
const toRaw = (norm: number, min: number, max: number) => min + clamp01(norm) * (max - min);

/**
 * `sliderWithID`'s id carries the source position, not a name, so there is nothing in it
 * to show a user. Where the code reads `.lpf(slider(...))` the surrounding method IS the
 * name the user thinks in, so the device passes the source text and we look backwards
 * from each occurrence for the method that wraps it.
 */
export function sliderLabels(code: string, count: number): string[] {
	const labels: string[] = [];
	const re = /\.([a-zA-Z_$][\w$]*)\s*\(\s*[^)]*?slider/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(code)) !== null && labels.length < count) labels.push(m[1]);
	while (labels.length < count) labels.push(`slider ${labels.length + 1}`);
	return labels;
}

export function useSliderKnobs(
	surface: unknown,
	specs: SliderSpec[],
	code: string,
	setSliderValues: (values: (number | null)[]) => void,
): SliderKnob[] {
	// Eight fixed hooks: a pool is static precisely so the hook count never varies with
	// the pattern, which is the rule React cares about.
	/* eslint-disable react-hooks/rules-of-hooks */
	const params = KNOB_IDS.map((id) => useParam(surface as never, id));
	/* eslint-enable react-hooks/rules-of-hooks */

	const labels = useMemo(() => sliderLabels(code, specs.length), [code, specs.length]);

	/**
	 * Which dials Live agreed to widen to their slider's real range.
	 *
	 * THIS IS THE BUG THAT REVERTED THE FIRST ATTEMPT AT THIS. `_parameter_range`
	 * takes, and the dial then reports its value IN THE NEW DOMAIN - so a page that
	 * goes on normalizing 0..1 scales an already-scaled value, and the knob sticks at
	 * its minimum. The library answers whether each one took; everything below reads
	 * this flag and scales exactly once.
	 */
	const [real, setReal] = useState<boolean[]>([]);
	useEffect(() => {
		onParamRange((id, took) => {
			const i = KNOB_IDS.indexOf(id);
			if (i < 0) return;
			setReal((prev) => {
				if (prev[i] === took) return prev;
				const next = prev.slice();
				next[i] = took;
				return next;
			});
		});
	}, []);

	/**
	 * Carry the semantic name onto the native dial: `.lpf(slider(...))` should leave a
	 * knob called "lpf", not "S1". The wrapper's `knob_label <index> <name>` writes
	 * `_parameter_shortname`; dials past the end of the pattern's sliders are reset to
	 * their pool name so a stale label never outlives the code that named it.
	 *
	 * Known limit, measured in Live: the rename takes on the DEVICE PANEL but does NOT
	 * reach the Rack macro picker or Live's parameter registry, which keep showing
	 * S1..S8. A frozen device cannot rename a parameter there. Cosmetic either way -
	 * nothing rides on it.
	 */
	const sentLabels = useRef<string[]>([]);
	useEffect(() => {
		for (let i = 0; i < KNOB_POOL; i++) {
			const spec = specs[i];
			const wanted = i < specs.length ? labels[i] : `S${i + 1}`;
			// The RANGE goes with the name: a dial called "lpf" that still travels 0..1
			// is only half the answer, and describeParam carries both (the library
			// applies each and says what took). A dial past the end of the pattern's
			// sliders goes back to its pool name and its declared 0..1.
			const key = spec ? `${wanted} ${spec.min} ${spec.max}` : wanted;
			if (sentLabels.current[i] === key) continue;
			sentLabels.current[i] = key;
			describeParam(`s${i + 1}`, spec ? { name: wanted, range: [spec.min, spec.max] } : { name: wanted, range: [0, 1] });
		}
	}, [labels, specs]);

	// Seed a knob from the code's own default the first time a slider appears at that
	// position, so an untouched knob reads what the text says rather than 0.
	const seeded = useRef<string[]>([]);
	useEffect(() => {
		specs.forEach((spec, i) => {
			if (i >= KNOB_POOL) return;
			if (seeded.current[i] === spec.id) return;
			seeded.current[i] = spec.id;
			params[i][1](real[i] ? spec.value : toNorm(spec.value, spec.min, spec.max));
		});
		seeded.current.length = specs.length;
		// params identity changes every render; the seed is guarded by `seeded` instead.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [specs]);

	// Push the current knob positions back into the pattern. Runs whenever a dial moves -
	// from the web slider, an automation lane, a Push encoder or a macro, since all four
	// write the same parameter.
	const norms = specs
		.slice(0, KNOB_POOL)
		.map((spec, i) =>
			real[i] ? toNorm(Number(params[i][0] ?? spec.min), spec.min, spec.max) : Number(params[i][0] ?? 0),
		);
	const signature = norms.join(",");
	useEffect(() => {
		if (!specs.length) return;
		setSliderValues(specs.slice(0, KNOB_POOL).map((spec, i) => toRaw(norms[i], spec.min, spec.max)));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [signature, specs.length]);

	const setAt = useCallback(
		(i: number, norm: number) => {
			const spec = specs[i];
			const n = clamp01(norm);
			params[i][1](real[i] && spec ? toRaw(n, spec.min, spec.max) : n);
		},
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[signature, real, specs],
	);

	return specs.slice(0, KNOB_POOL).map((spec, i) => ({
		label: labels[i],
		min: spec.min,
		max: spec.max,
		norm: norms[i],
		raw: toRaw(norms[i], spec.min, spec.max),
		set: (n: number) => setAt(i, n),
		knob: i + 1,
	}));
}
