import { describe, it, expect, beforeAll } from "vitest";
// @ts-expect-error - engine.mjs is untyped (raw submodule-facing JS)
import { bootScope, compile } from "@/max/shared/engine.mjs";
import { isDeterministic, renderPeriod } from "@/lib/render/determinism";

/**
 * Real patterns through the real compile, because the whole reason renderPeriod exists
 * is a probe that lied about real ones: engine.mjs's patternCycles signatures a hap by
 * its MIDI pitch, so `s("bd <sd cp>")` - no pitch anywhere - signatured to nothing and
 * "repeated" every cycle, and `.lpf("<400 800>")` was invisible to it. The renderer
 * plays the whole hap value; the probe must see it.
 */

beforeAll(async () => {
	await bootScope();
});

const CPS = 0.5;

describe("renderPeriod", () => {
	it("one cycle for a plain pattern", async () => {
		const pat = await compile('s("bd sd")');
		expect(renderPeriod(pat, CPS)).toBe(1);
	});

	it("hears alternation in s() names alone (no pitch to signature)", async () => {
		const pat = await compile('s("bd <sd cp>")');
		expect(renderPeriod(pat, CPS)).toBe(2);
	});

	it("hears alternation in effects alone", async () => {
		const pat = await compile('s("bd").lpf("<400 800>")');
		expect(renderPeriod(pat, CPS)).toBe(2);
	});

	it("finds the true period of a longer alternation", async () => {
		const pat = await compile('note("<c3 e3 g3>").s("sawtooth")');
		expect(renderPeriod(pat, CPS)).toBe(3);
	});

	it("caps at maxCycles when nothing repeats inside the probe window", async () => {
		const pat = await compile('note("<c3 e3>").s("sawtooth")');
		expect(renderPeriod(pat, CPS, 1)).toBe(1); // cap below the true period
	});
});

describe("isDeterministic", () => {
	it("accepts a plain pattern", async () => {
		const pat = await compile('s("bd <sd cp>").lpf(800)');
		expect(isDeterministic('s("bd <sd cp>").lpf(800)', pat, 2, CPS)).toBe(true);
	});

	it("refuses the rand family by source scan", async () => {
		const code = 's("bd*4").degrade()';
		const pat = await compile(code);
		expect(isDeterministic(code, pat, 1, CPS)).toBe(false);
	});
});
