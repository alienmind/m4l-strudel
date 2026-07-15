import { describe, expect, it } from "vitest";
import { DEFAULT_CPS, detectCps, suggestBeatsPerCycle } from "../tempo";

describe("detectCps", () => {
	it("defaults to Strudel's rate when no tempo is set", () => {
		expect(detectCps('note("c e g")')).toBe(DEFAULT_CPS);
	});

	it("reads setcpm as cycles per minute", () => {
		expect(detectCps('setcpm(120)\nnote("c")')).toBe(2); // 120 / 60
	});

	it("reads setcps directly", () => {
		expect(detectCps("setcps(0.75)")).toBe(0.75);
	});

	it("evaluates arithmetic in the argument", () => {
		expect(detectCps("setcpm(140/4)")).toBeCloseTo(35 / 60); // 140 bpm in 4/4
	});

	it("takes the last directive when several are present", () => {
		expect(detectCps("setcps(1)\nsetcpm(120)")).toBe(2);
	});

	it("ignores a directive whose argument is not plain arithmetic", () => {
		expect(detectCps('setcpm(myVar)\nnote("c")')).toBe(DEFAULT_CPS);
	});
});

describe("suggestBeatsPerCycle", () => {
	it("is one bar at the default rate and 120 BPM", () => {
		expect(suggestBeatsPerCycle(DEFAULT_CPS, 120)).toBe(4);
	});

	it("is one beat for setcpm(120) at 120 BPM", () => {
		expect(suggestBeatsPerCycle(2, 120)).toBe(1);
	});

	it("follows Live's tempo", () => {
		expect(suggestBeatsPerCycle(2, 140)).toBeCloseTo(140 / 120);
	});

	it("falls back to 4 for nonsense input", () => {
		expect(suggestBeatsPerCycle(0, 120)).toBe(4);
	});
});
