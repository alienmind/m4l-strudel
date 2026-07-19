import { describe, it, expect, beforeAll } from "vitest";
// @ts-expect-error - engine.mjs is untyped (raw submodule-facing JS)
import { bootScope, compile } from "@/max/shared/engine.mjs";
import { beginSliderCapture, getSliderSpecs, installRenderScope, setSliderOverrides } from "@/lib/render/scope";

/**
 * The slider -> knob seam, end to end through the REAL transpiler: `slider(...)` is
 * rewritten to `sliderWithID(id, ...)`, the render scope captures each occurrence in
 * source order, and an override substitutes the knob's value into the next compile.
 */

/** `.lpf()` is strudel's alias for the `cutoff` control - the hap value carries the
 *  canonical key, not the alias the code typed. */
interface HapValue {
	cutoff?: number;
	gain?: number;
}

beforeAll(async () => {
	await bootScope();
	installRenderScope();
});

const firstValue = async (code: string): Promise<HapValue> => {
	const pat = await compile(code);
	const haps = pat.queryArc(0, 1, { _cps: 0.5 });
	return haps[0].value as HapValue;
};

describe("render scope sliders", () => {
	it("captures slider occurrences in source order, with ranges", async () => {
		setSliderOverrides([]);
		beginSliderCapture();
		await compile('note("c3").lpf(slider(400, 100, 1000)).gain(slider(0.5))');
		const specs = getSliderSpecs();
		expect(specs.length).toBe(2);
		expect(specs[0]).toMatchObject({ value: 400, min: 100, max: 1000 });
		expect(specs[1]).toMatchObject({ value: 0.5, min: 0, max: 1 }); // default range
	});

	it("plays the code's own value when no override is set", async () => {
		setSliderOverrides([]);
		beginSliderCapture();
		const v = await firstValue('note("c3").lpf(slider(400, 100, 1000))');
		expect(v.cutoff).toBe(400);
	});

	it("substitutes the knob override into the next compile", async () => {
		setSliderOverrides([800]);
		beginSliderCapture();
		const v = await firstValue('note("c3").lpf(slider(400, 100, 1000))');
		expect(v.cutoff).toBe(800);
		setSliderOverrides([]); // leave no global residue
	});

	it("null override keeps the code's value (untouched knob)", async () => {
		setSliderOverrides([null, 0.9]);
		beginSliderCapture();
		const v = await firstValue('note("c3").lpf(slider(400, 100, 1000)).gain(slider(0.5))');
		expect(v.cutoff).toBe(400);
		expect(v.gain).toBe(0.9);
		setSliderOverrides([]);
	});
});
