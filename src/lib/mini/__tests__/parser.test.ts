import { describe, it, expect } from "vitest";
import { parseMini, tokenize } from "../parser";
import { schedule } from "../schedule";
import { bjorklund } from "../euclid";
import { noteToMidi, midiToNote } from "../notes";

describe("tokenize", () => {
	it("splits notes, rests and structure", () => {
		const { tokens } = tokenize("c3 [e3 g3]*2 ~ <a3 b3>");
		const kinds = tokens.map((t) => t.kind);
		expect(kinds).toContain("note");
		expect(kinds).toContain("lbracket");
		expect(kinds).toContain("star");
		expect(kinds).toContain("rest");
		expect(kinds).toContain("langle");
	});
});

describe("noteToMidi", () => {
	const strudel = { conv: "strudel" } as const;
	it("uses strudel convention c5=60 by default", () => {
		expect(noteToMidi("c5", strudel)).toBe(60);
		expect(noteToMidi("c3", strudel)).toBe(36);
		expect(noteToMidi("a5", strudel)).toBe(69);
	});
	it("uses scientific convention c4=60", () => {
		expect(noteToMidi("c4", { conv: "scientific" })).toBe(60);
	});
	it("parses accidentals", () => {
		expect(noteToMidi("f#5", strudel)).toBe(66);
		expect(noteToMidi("eb5", strudel)).toBe(63);
	});
	it("reads a bare number as a scale degree when Live Scale is on", () => {
		// The reported bug: "2" used to mean MIDI 2, a D-2, which is why the note
		// stream came out below the bottom of the keyboard. With the toggle OFF that
		// is still what it means - see scales.test.ts - but the toggle defaults on.
		const cMajor = { ...strudel, scale: { root: 0, name: "Major" } };
		expect(noteToMidi("0", cMajor)).toBe(60);
		expect(noteToMidi("2", cMajor)).toBe(64); // C major, degree 2 = E
		expect(noteToMidi("7", cMajor)).toBe(72); // an octave up
	});
	it("round-trips midiToNote", () => {
		for (const midi of [36, 48, 60, 63, 72]) {
			expect(noteToMidi(midiToNote(midi, "strudel"), strudel)).toBe(midi);
		}
	});
});

describe("bjorklund", () => {
	it("(3,8) is the tresillo pattern", () => {
		expect(bjorklund(3, 8)).toEqual([true, false, false, true, false, false, true, false]);
	});
	it("(0,n) and (n,n) degenerate", () => {
		expect(bjorklund(0, 4)).toEqual([false, false, false, false]);
		expect(bjorklund(4, 4)).toEqual([true, true, true, true]);
	});
});

describe("schedule", () => {
	it("lays a flat sequence in equal shares", () => {
		const { ast } = parseMini("c3 e3 g3 b3");
		const evs = schedule(ast, 0);
		expect(evs).toHaveLength(4);
		expect(evs[0].start).toBeCloseTo(0);
		expect(evs[1].start).toBeCloseTo(0.25);
		expect(evs[0].duration).toBeCloseTo(0.25);
	});

	it("subdivides groups and repeats them", () => {
		const { ast } = parseMini("c3 [e3 g3]*2");
		const evs = schedule(ast, 0);
		// c3 fills [0,0.5); [e3 g3]*2 fills [0.5,1) as two halves each split in two
		expect(evs).toHaveLength(5);
		expect(evs[0].note).toBe("c3");
		expect(evs[0].duration).toBeCloseTo(0.5);
	});

	it("skips rests", () => {
		const { ast } = parseMini("c3 ~ e3 ~");
		const evs = schedule(ast, 0);
		expect(evs).toHaveLength(2);
		expect(evs[1].start).toBeCloseTo(0.5);
	});

	it("alternates <> across cycles", () => {
		const { ast } = parseMini("<a3 b3>");
		expect(schedule(ast, 0)[0].note).toBe("a3");
		expect(schedule(ast, 1)[0].note).toBe("b3");
		expect(schedule(ast, 2)[0].note).toBe("a3");
	});

	it("applies euclidean rhythm", () => {
		const { ast } = parseMini("c3(3,8)");
		const evs = schedule(ast, 0);
		expect(evs).toHaveLength(3);
		expect(evs[0].start).toBeCloseTo(0);
		expect(evs[1].start).toBeCloseTo(3 / 8);
	});

	it("stacks parallel notes with a comma", () => {
		const { ast } = parseMini("[c3,e3,g3]");
		const evs = schedule(ast, 0);
		expect(evs).toHaveLength(3);
		expect(evs.every((e) => e.start === 0 && e.duration === 1)).toBe(true);
	});
});
