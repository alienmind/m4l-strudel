import { useEffect, useMemo, useState } from "react";
import { bindInlet } from "@m4l-jweb/bridge";
import { useParam } from "@m4l-jweb/surface/react";
import type { SliderKnob } from "../shared/useSliderKnobs";
import surface from "./surface";

const KNOB_IDS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"] as const;

/** What a pattern said about one dial: `m4lKnob(1, { name, unit, range })`. */
interface KnobDesc {
	label: string;
	min: number;
	max: number;
	/** Whether Live took the range onto the dial itself - see wrapper/device.ts. */
	real: boolean;
}

/**
 * The dials the STUDIO's pattern declared, as faders this view can draw.
 *
 * The Studio owns the engine, so it is the Studio's pattern that knows a dial is a
 * cutoff in Hz. That description reaches Live through the wrapper (knob_label /
 * knob_range) and is echoed here, because a device view with its Studio window shut
 * still has to be playable - and a row of eight anonymous 0..1 faders is not.
 *
 * The VALUES are not echoed: they are the Live parameters themselves, read with
 * useParam like any other control, so dragging a fader here writes exactly what a
 * Push encoder or an automation lane writes. One control, several views of it.
 */
export function useReplKnobs(): { faders: SliderKnob[]; declared: boolean } {
	const [descs, setDescs] = useState<Record<number, KnobDesc>>({});

	/* eslint-disable react-hooks/rules-of-hooks */
	const params = KNOB_IDS.map((id) => useParam(surface, id));
	/* eslint-enable react-hooks/rules-of-hooks */

	useEffect(() => {
		bindInlet("knob_desc", (index: unknown, ...rest: unknown[]) => {
			const i = Number(index);
			const label = rest.join(" ");
			if (!(i >= 0 && i < 8) || !label) return;
			setDescs((prev) => ({ ...prev, [i]: { ...(prev[i] ?? { min: 0, max: 1, real: false }), label } }));
		});
		bindInlet("knob_desc_range", (index: unknown, lo: unknown, hi: unknown, took: unknown) => {
			const i = Number(index);
			if (!(i >= 0 && i < 8)) return;
			setDescs((prev) => ({
				...prev,
				[i]: { ...(prev[i] ?? { label: `S${i + 1}` }), min: Number(lo), max: Number(hi), real: Number(took) === 1 },
			}));
		});
	}, []);

	const faders = useMemo(() => {
		const out: SliderKnob[] = [];
		for (let i = 0; i < KNOB_IDS.length; i++) {
			const desc = descs[i];
			if (!desc) continue;
			const [value, setValue] = params[i];
			const v = typeof value === "number" ? value : 0;
			const span = desc.max - desc.min;
			// When Live took the range onto the dial, the parameter already IS the real
			// value and the fader only has to place it; otherwise the dial is 0..1 and
			// the real value is derived. Exactly the split the shim makes.
			const norm = desc.real ? (span ? (v - desc.min) / span : 0) : v;
			const raw = desc.real ? v : desc.min + v * span;
			out.push({
				label: desc.label,
				min: desc.min,
				max: desc.max,
				norm,
				raw,
				set: (n: number) => setValue(desc.real ? desc.min + n * span : n),
				knob: i + 1,
			});
		}
		return out;
		// `params` is rebuilt every render by design (eight useParam hooks), so it
		// cannot be a dependency without spinning; the values it carries are.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [descs, ...params.map(([v]) => v)]);

	return { faders, declared: faders.length > 0 };
}
