import { describe, it, expect } from "vitest";
import { renderPattern, toFlatList } from "../render";
import { eventsToMini } from "../unparse";

describe("renderPattern → MIDI", () => {
	it("maps a one-bar sequence to beats", () => {
		const { notes, lengthBeats } = renderPattern("c5 e5 g5 c6", {
			bars: 1,
			conv: "strudel",
		});
		expect(lengthBeats).toBe(4);
		expect(notes).toHaveLength(4);
		expect(notes[0]).toMatchObject({ pitch: 60, start: 0, duration: 1 });
		expect(notes[1].start).toBeCloseTo(1);
		expect(notes[3].pitch).toBe(72);
	});

	it("handles subdivisions and rests over 2 bars", () => {
		const { notes, lengthBeats } = renderPattern("c5 [e5 g5] ~ c6", {
			bars: 2,
			conv: "strudel",
		});
		expect(lengthBeats).toBe(8);
		// 4 top-level slots over 8 beats → 2 beats each; the group splits into 1 beat each
		const starts = notes.map((n) => n.start).sort((a, b) => a - b);
		expect(starts[0]).toBeCloseTo(0);
		expect(starts).toContainEqual(expect.closeTo(6, 3)); // c6 in final slot
	});

	it("flat list encoding has the right shape", () => {
		const { notes, lengthBeats } = renderPattern("c5", { bars: 1, conv: "strudel" });
		const flat = toFlatList(notes, lengthBeats);
		expect(flat).toEqual([4, 1, 60, 0, 4, 100]);
	});
});

describe("eventsToMini (From MIDI)", () => {
	it("emits notes and rests on a grid", () => {
		// four quarter notes c5 e5 g5 c6 over one bar, grid 4
		const notes = [
			{ pitch: 60, start: 0, duration: 1 },
			{ pitch: 64, start: 1, duration: 1 },
			{ pitch: 67, start: 2, duration: 1 },
			{ pitch: 72, start: 3, duration: 1 },
		];
		const text = eventsToMini(notes, { bars: 1, grid: 4, conv: "strudel" });
		expect(text).toBe("c5 e5 g5 c6");
	});

	it("represents chords as stacks", () => {
		const notes = [
			{ pitch: 60, start: 0, duration: 1 },
			{ pitch: 64, start: 0, duration: 1 },
			{ pitch: 67, start: 0, duration: 1 },
		];
		const text = eventsToMini(notes, { bars: 1, grid: 4, conv: "strudel" });
		expect(text.startsWith("[c5,e5,g5]")).toBe(true);
	});

	it("round-trips a simple pattern through MIDI and back", () => {
		const src = "c5 e5 g5 c6";
		const { notes } = renderPattern(src, { bars: 1, conv: "strudel" });
		// renderPattern gives each note duration = 1 beat (grid 4 over 1 bar)
		const back = eventsToMini(
			notes.map((n) => ({ pitch: n.pitch, start: n.start, duration: n.duration })),
			{ bars: 1, grid: 4, conv: "strudel" },
		);
		expect(back).toBe(src);
	});
});
