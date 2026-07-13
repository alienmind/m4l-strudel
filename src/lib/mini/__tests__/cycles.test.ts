import { describe, it, expect } from "vitest";
import { parseMini } from "../parser";
import { astCycleLength, MAX_CYCLES } from "../cycles";
import { schedule } from "../schedule";
import { renderPattern } from "../render";

const cyclesOf = (src: string) => astCycleLength(parseMini(src).ast).length;

describe("astCycleLength", () => {
	it("is 1 for a pattern with no alternation", () => {
		expect(cyclesOf("c5 e5 g5")).toBe(1);
		expect(cyclesOf("[c5,e5] c5*4 c5(3,8)")).toBe(1);
	});

	it("counts an alternation's items", () => {
		expect(cyclesOf("<a5 b5>")).toBe(2);
		expect(cyclesOf("<a5 b5 c5>")).toBe(3);
	});

	it("takes the LCM across a sequence", () => {
		// <a b> repeats every 2, <c d e> every 3: together, every 6.
		expect(cyclesOf("<a5 b5> <c5 d5 e5>")).toBe(6);
	});

	it("multiplies out a nested alternation", () => {
		// The inner <p q> advances once per visit to the outer item, and that item
		// is visited every other cycle: 4 cycles before the whole thing repeats.
		expect(cyclesOf("<<c5 d5> e5>")).toBe(4);
	});

	it("a repeat consumes alternations faster", () => {
		// <a b>*2 plays both items within one cycle, so it repeats every cycle.
		expect(cyclesOf("<a5 b5>*2")).toBe(1);
		// <a b c>*2 needs 3 cycles to come back into phase.
		expect(cyclesOf("<a5 b5 c5>*2")).toBe(3);
	});

	it("caps pathological nesting", () => {
		expect(cyclesOf("<a5 b5 c5 d5 e5> <a5 b5 c5> <a5 b5 c5 d5 e5 f5 g5>")).toBeLessThanOrEqual(
			MAX_CYCLES,
		);
	});

	it("agrees with what schedule() actually plays", () => {
		for (const src of ["<a5 b5>", "<a5 b5 c5>", "<<c5 d5> e5>", "<a5 b5> <c5 d5 e5>"]) {
			const { ast } = parseMini(src);
			const { length: n } = astCycleLength(ast);
			const sig = (c: number) => JSON.stringify(schedule(ast, c));
			// The claimed period is real...
			for (let c = 0; c < 2 * n; c++) expect(sig(c)).toBe(sig(c % n));
			// ...and it is the SHORTEST one, so nothing is exported twice over.
			for (let p = 1; p < n; p++) {
				const repeats = Array.from({ length: n }, (_, c) => sig(c) === sig(c % p)).every(Boolean);
				expect(repeats).toBe(false);
			}
		}
	});
});

describe("schedule: nested alternation", () => {
	it("advances the inner alternation once per visit, like Strudel's slowcat", () => {
		const { ast } = parseMini("<<c5 d5> e5>");
		const notes = [0, 1, 2, 3].map((c) => schedule(ast, c)[0].note);
		expect(notes).toEqual(["c5", "e5", "d5", "e5"]);
	});
});

describe("renderPattern expands the full loop", () => {
	it("renders <a b> over both cycles instead of truncating it", () => {
		const r = renderPattern("<a5 b5>", { bars: 1, conv: "strudel" });
		expect(r.cycles).toBe(2);
		expect(r.lengthBeats).toBe(8);
		expect(r.notes.map((n) => n.pitch)).toEqual([69, 71]);
	});
});
