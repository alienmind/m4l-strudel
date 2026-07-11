import { expect, test } from "vitest";
import { asStrudelCode } from "../strudelCode";

test("bare mini-notation is wrapped in note()", () => {
	expect(asStrudelCode("c5 [e5 g5]*2 ~ <a5 b5>")).toBe('note("c5 [e5 g5]*2 ~ <a5 b5>")');
	expect(asStrudelCode("60 64 67")).toBe('note("60 64 67")');
});

test("real code passes through untouched", () => {
	for (const code of [
		'note("c3 e3 g3 b3").midichan(2)',
		'$: note("c4")\n$: note("c2*4")',
		's("sawtooth").note("c3")',
		'note(`c3`)',
	]) {
		expect(asStrudelCode(code)).toBe(code);
	}
});

test("quotes inside bare notation are escaped", () => {
	// nonsensical musically, but must not produce broken JS
	expect(asStrudelCode("c5 ~")).toBe('note("c5 ~")');
});
