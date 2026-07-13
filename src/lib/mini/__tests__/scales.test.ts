import { describe, it, expect } from "vitest";
import {
	degreeToMidi,
	isKnownScale,
	scaleIntervals,
	strudelAgrees,
	strudelScaleName,
} from "../scales";
import { noteToMidi } from "../notes";

describe("degreeToMidi", () => {
	const cMajor = { root: 0, name: "Major" };

	it("anchors degree 0 on middle C", () => {
		expect(degreeToMidi(0, cMajor)).toBe(60);
	});

	it("walks the scale, not the chromatic keyboard", () => {
		expect([0, 1, 2, 3, 4, 5, 6].map((d) => degreeToMidi(d, cMajor))).toEqual([
			60, 62, 64, 65, 67, 69, 71,
		]);
	});

	it("wraps degrees past the end into the next octave", () => {
		expect(degreeToMidi(7, cMajor)).toBe(72);
		expect(degreeToMidi(14, cMajor)).toBe(84);
	});

	it("wraps negative degrees downwards", () => {
		expect(degreeToMidi(-1, cMajor)).toBe(59); // the B below middle C
		expect(degreeToMidi(-7, cMajor)).toBe(48);
	});

	it("follows Live's root note", () => {
		expect(degreeToMidi(0, { root: 2, name: "Minor" })).toBe(62); // D minor
		expect(degreeToMidi(2, { root: 2, name: "Minor" })).toBe(65); // D, E, F
	});

	it("shifts whole octaves with the Shift control", () => {
		expect(degreeToMidi(0, cMajor, -1)).toBe(48);
		expect(degreeToMidi(0, cMajor, 2)).toBe(84);
	});

	it("falls back to Major for a scale Live named but we do not know", () => {
		expect(isKnownScale("Messiaen 6")).toBe(false);
		expect(scaleIntervals("Messiaen 6")).toEqual(scaleIntervals("Major"));
	});

	it("handles scales with fewer than 7 notes", () => {
		// Minor pentatonic: C Eb F G Bb, so degree 5 is the octave.
		const pent = { root: 0, name: "Minor Pentatonic" };
		expect([0, 1, 2, 3, 4, 5].map((d) => degreeToMidi(d, pent))).toEqual([60, 63, 65, 67, 70, 72]);
	});
});

describe("the Live Scale toggle", () => {
	it("off: a bare number is a raw MIDI pitch, which is Strudel's own reading", () => {
		// No `scale` in the context = the toggle is off. This is the footgun the UI
		// warns about in amber: 2 really is a D-2.
		expect(noteToMidi("2", { conv: "strudel" })).toBe(2);
		expect(noteToMidi("60", { conv: "strudel" })).toBe(60);
	});

	it("on: the same number is a degree of the song's key", () => {
		expect(noteToMidi("2", { conv: "strudel", scale: { root: 0, name: "Major" } })).toBe(64);
	});

	it("names the scale the way Strudel spells it, for .scale(liveScale) in code", () => {
		expect(strudelScaleName({ root: 0, name: "Major" })).toBe("C4:major");
		expect(strudelScaleName({ root: 6, name: "Harmonic Minor" })).toBe("F#4:harmonic minor");
	});

	it("knows where Strudel's own scale can be trusted", () => {
		expect(strudelAgrees("Dorian")).toBe(true);
		// Strudel returns plain minor-scale pitches for a minor pentatonic, and
		// mis-parses any name with a space - so the UI warns before a user leans on it.
		expect(strudelAgrees("Minor Pentatonic")).toBe(false);
		expect(strudelAgrees("Harmonic Minor")).toBe(false);
	});
});

describe("noteToMidi with a scale", () => {
	it("resolves degrees against the song's key", () => {
		const ctx = { conv: "strudel" as const, scale: { root: 9, name: "Minor" } }; // A minor
		expect(noteToMidi("0", ctx)).toBe(69);
		expect(noteToMidi("1", ctx)).toBe(71);
		expect(noteToMidi("2", ctx)).toBe(72);
	});

	it("leaves note names absolute - only numbers are degrees", () => {
		const ctx = { conv: "strudel" as const, scale: { root: 9, name: "Minor" } };
		expect(noteToMidi("c5", ctx)).toBe(60);
	});
});
