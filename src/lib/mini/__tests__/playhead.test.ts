import { describe, it, expect } from "vitest";
import { activeSpans, parseForPlayhead } from "../playhead";

/** The highlighted text, so the assertions read like what the user would see. */
function lit(src: string, cycle: number): string[] {
	const ast = parseForPlayhead(src);
	if (!ast) return [];
	return activeSpans(ast, cycle).map(([a, b]) => src.slice(a, b));
}

describe("activeSpans", () => {
	it("follows the playhead across a bar", () => {
		const src = "c5 e5 g5 b5";
		expect(lit(src, 0)).toEqual(["c5"]);
		expect(lit(src, 0.3)).toEqual(["e5"]);
		expect(lit(src, 0.5)).toEqual(["g5"]);
		expect(lit(src, 0.99)).toEqual(["b5"]);
	});

	it("lights every note of a chord at once", () => {
		expect(lit("[c5,e5,g5]", 0.5)).toEqual(["c5", "e5", "g5"]);
	});

	it("lights nothing during a rest", () => {
		expect(lit("c5 ~", 0.75)).toEqual([]);
	});

	it("follows the item an alternation is actually playing", () => {
		// Cycle 0 plays the first half, cycle 1 the second - the highlight has to
		// agree with what is sounding, or it is worse than no highlight at all.
		const src = "<[0 1] [5 6]>";
		expect(lit(src, 0.0)).toEqual(["0"]);
		expect(lit(src, 0.6)).toEqual(["1"]);
		expect(lit(src, 1.0)).toEqual(["5"]);
		expect(lit(src, 1.6)).toEqual(["6"]);
		expect(lit(src, 2.0)).toEqual(["0"]); // back around
	});

	it("finds each copy of a replicated step in its own slot", () => {
		expect(lit("bd!2 sd", 0.1)).toEqual(["bd"]);
		expect(lit("bd!2 sd", 0.9)).toEqual(["sd"]);
	});

	it("is silent for full Strudel code, which has no link to the text", () => {
		expect(lit('note("c3").fast(2)', 0.5)).toEqual([]);
	});

	it("is silent when idle", () => {
		expect(lit("c5 e5", -1)).toEqual([]);
	});
});
