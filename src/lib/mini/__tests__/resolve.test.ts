import { describe, it, expect } from "vitest";
import { resolveMini } from "../resolve";
import { tokenize, parseMini } from "../parser";
import { DEFAULT_DRUM_MAP } from "../drums";
import { schedule } from "../schedule";

const cMajor = { conv: "strudel" as const, scale: { root: 0, name: "Major" } };

describe("resolveMini", () => {
	it("turns scale degrees into absolute MIDI numbers, keeping the structure", () => {
		expect(resolveMini("0 [2 ~] <4 5>", cMajor)).toBe("60 [64 ~] <67 69>");
	});

	it("leaves modifiers alone - the 2 in *2 is not a note", () => {
		expect(resolveMini("0*2 1@3 2(3,8)", cMajor)).toBe("60*2 62@3 64(3,8)");
	});

	it("resolves note names through the octave convention", () => {
		expect(resolveMini("c5 e5", cMajor)).toBe("60 64");
		expect(resolveMini("c5", { conv: "scientific" })).toBe("72");
	});

	it("applies the octave shift", () => {
		expect(resolveMini("c5 0", { ...cMajor, octaveOffset: -1 })).toBe("48 48");
	});

	it("maps drum words onto their pads", () => {
		expect(resolveMini("bd ~ sd hh", { ...cMajor, drumMap: DEFAULT_DRUM_MAP })).toBe("36 ~ 38 42");
	});

	it("does not shift drum words - a pad is a fixed slot", () => {
		const ctx = { ...cMajor, drumMap: DEFAULT_DRUM_MAP, octaveOffset: 2 };
		expect(resolveMini("bd", ctx)).toBe("36");
	});

	it("leaves an unmapped word as written rather than mangling the pattern", () => {
		expect(resolveMini("bd zz", { ...cMajor, drumMap: DEFAULT_DRUM_MAP })).toBe("36 zz");
	});

	it("preserves the user's own spacing", () => {
		expect(resolveMini("0   [2 ~]", cMajor)).toBe("60   [64 ~]");
	});

	it("rewrites a replicated token exactly once", () => {
		// The machine-gun bug: "!" was not a token, so the parser dropped it and read
		// the 4 as a NOTE - degree 4 of C major, MIDI 67. "bd!4" became "36!67", and
		// Strudel dutifully fired the kick 67 times a cycle.
		const drums = { ...cMajor, drumMap: DEFAULT_DRUM_MAP };
		expect(resolveMini("bd!4", drums)).toBe("36!4");
		expect(resolveMini("0!3", cMajor)).toBe("60!3");
		expect(resolveMini("bd! sd", drums)).toBe("36! 38");
		expect(resolveMini("bd ! !", drums)).toBe("36 ! !");
	});
});

describe("replication (!)", () => {
	/** What is played, ignoring WHERE in the text each step was written - the two
	 *  spellings below differ in source positions by construction. */
	const steps = (src: string) =>
		schedule(parseMini(src).ast, 0).map((e) => ({
			note: e.note,
			start: e.start,
			duration: e.duration,
		}));

	it("takes one step per copy, unlike * which subdivides one step", () => {
		// "bd!4" is four steps of a four-step bar...
		const repl = steps("bd!4");
		expect(repl).toHaveLength(4);
		expect(repl.map((e) => e.start)).toEqual([0, 0.25, 0.5, 0.75]);
		expect(repl.every((e) => e.duration === 0.25)).toBe(true);

		// ...and it lines up with writing them out by hand, which is what the user
		// reported working while "bd!4" machine-gunned.
		expect(repl).toEqual(steps("bd bd bd bd"));
	});

	it("a bare ! repeats the previous step", () => {
		expect(steps("bd ! !")).toEqual(steps("bd bd bd"));
		expect(steps("bd!")).toEqual(steps("bd bd"));
	});

	it("shares a bar with its neighbours", () => {
		const evs = steps("bd!2 sd");
		expect(evs.map((e) => e.start)).toEqual([0, 1 / 3, 2 / 3]);
	});
});

describe("tokenize", () => {
	it("reads a negative number as one token", () => {
		// The reported bug: "-" was an unexpected character, so a bare relative
		// sequence could not be written without wrapping it in n("...") by hand.
		const { tokens, errors } = tokenize("[-1 ~] -1");
		expect(errors).toEqual([]);
		expect(tokens.filter((t) => t.kind === "number").map((t) => t.value)).toEqual(["-1", "-1"]);
	});

	it("negative degrees resolve below the root", () => {
		expect(resolveMini("[-1 ~] -2", cMajor)).toBe("[59 ~] 57");
	});

	it("keeps a multi-letter drum word whole", () => {
		// "bd" used to tokenize as the note B followed by the note D.
		const { tokens } = tokenize("bd hh");
		expect(tokens.map((t) => t.value)).toEqual(["bd", "hh"]);
	});

	it("still reads note names with accidentals and octaves", () => {
		const { ast } = parseMini("f#2 eb4 c-1");
		expect(schedule(ast, 0).map((e) => e.note)).toEqual(["f#2", "eb4", "c-1"]);
	});
});
