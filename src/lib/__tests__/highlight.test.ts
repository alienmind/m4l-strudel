import { describe, expect, it } from "vitest";
import { tokenize } from "../highlight";

/** What the user typed must be exactly what the painted layer shows. */
const roundTrip = (code: string) =>
	tokenize(code)
		.map((t) => t.text)
		.join("");

const kindsOf = (code: string, text: string) => tokenize(code).filter((t) => t.text.includes(text))[0]?.kind;

describe("tokenize", () => {
	it("never loses a character", () => {
		// The editor paints these runs UNDER a transparent textarea, so a dropped or
		// duplicated character is text the user can see but not edit - the worst
		// possible failure for this file, and invisible in a screenshot.
		for (const code of [
			's("bd sd").lpf(500)',
			"// a comment\nnote('c3')",
			"/* unterminated",
			'"unterminated',
			"",
			"   ",
			"n(\"0 .. 7\").scale('C:minor')",
			"$: s('hh*8') // trailing",
			"x = 1_000.5 + .25",
			"`template ${x}`",
		]) {
			expect(roundTrip(code), code).toBe(code);
		}
	});

	it("colours mini notation as a string, because that IS the pattern", () => {
		expect(kindsOf('s("bd sd")', '"bd sd"')).toBe("string");
	});

	it("finds the method chain, which is what a reader scans for", () => {
		const kinds = tokenize('s("saw").lpf(500)');
		expect(kinds.find((t) => t.text === "lpf")?.kind).toBe("method");
		expect(kinds.find((t) => t.text === "s")?.kind).toBe("method");
	});

	it("does not call a bare identifier a method", () => {
		expect(kindsOf("const x = y", "y")).toBe("plain");
	});

	it("reads a comment to the end of the line and no further", () => {
		const t = tokenize("// one\ntwo");
		expect(t[0]).toEqual({ text: "// one", kind: "comment" });
		expect(roundTrip("// one\ntwo")).toBe("// one\ntwo");
	});

	it("does not let an escaped quote close a string", () => {
		expect(kindsOf('s("a\\"b")', '"a\\"b"')).toBe("string");
	});

	it("merges runs of one kind, so a line of punctuation is not 40 spans", () => {
		expect(tokenize("))))").length).toBe(1);
	});
});
