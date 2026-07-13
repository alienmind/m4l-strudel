import { expect, test } from "vitest";
import { asStrudelCode } from "../strudelCode";
import { DEFAULT_DRUM_MAP } from "../mini/drums";

const cMajor = { conv: "strudel" as const, scale: { root: 0, name: "Major" } };

test("bare mini-notation is resolved to MIDI numbers and wrapped in note()", () => {
	// Note names go through the octave convention, so the engine plays exactly
	// what To Clip would write - Strudel's own parser reads "c5" as MIDI 72.
	expect(asStrudelCode("c5 [e5 g5]*2 ~ <a5 b5>", cMajor)).toBe('note("60 [64 67]*2 ~ <69 71>")');
});

test("bare numbers are scale degrees, not raw MIDI pitches", () => {
	expect(asStrudelCode("0 2 4", cMajor)).toBe('note("60 64 67")');
	expect(asStrudelCode("0 2", { conv: "strudel", scale: { root: 9, name: "Minor" } })).toBe(
		'note("69 72")',
	);
});

test("drum words are resolved through the drum map", () => {
	expect(asStrudelCode("bd ~ sd", { ...cMajor, drumMap: DEFAULT_DRUM_MAP })).toBe('note("36 ~ 38")');
});

test("real code passes through untouched", () => {
	for (const code of [
		'note("c3 e3 g3 b3").midichan(2)',
		'$: note("c4")\n$: note("c2*4")',
		's("sawtooth").note("c3")',
		"note(`c3`)",
	]) {
		expect(asStrudelCode(code, cMajor)).toBe(code);
	}
});
