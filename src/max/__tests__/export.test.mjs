import { expect, test, describe, beforeAll } from "vitest";
import { bootScope, compile, queryWindow, hapToNote, exportNotes, patternCycles } from "../shared/engine.mjs";
import { asStrudelCode } from "../../lib/strudelCode";
import { degreeToMidi } from "../../lib/mini/scales";
import { DEFAULT_DRUM_MAP } from "../../lib/mini/drums";

const CPS = 0.5;
const cMajor = { conv: "strudel", scale: { root: 0, name: "Major" } };

const pitches = (notes) => notes.map((n) => n.pitch);

beforeAll(async () => {
	await bootScope();
});

describe("patternCycles", () => {
	test("measures a pattern's true loop length", async () => {
		const cases = [
			['note("c5 e5")', 1],
			['note("<c5 e5>")', 2],
			['note("<c5 e5 g5>")', 3],
			['note("<c5 e5> <g5 a5 b5>")', 6],
			['note("<<c5 d5> e5>")', 4],
		];
		for (const [code, want] of cases) {
			expect(patternCycles(await compile(code), CPS), code).toBe(want);
		}
	});

	test("measures full Strudel code too, which no parser of ours could", async () => {
		// The whole point of exporting via the engine: this is not mini-notation.
		const pat = await compile('note("c5").add(note("<0 12>"))');
		expect(patternCycles(pat, CPS)).toBe(2);
	});
});

describe("exportNotes", () => {
	test("exports every cycle of an alternation, not just the first", async () => {
		// The reported bug: To Clip wrote one cycle, so half of <a b> was lost.
		// Absolute MIDI numbers, because this is raw Strudel code - it never went
		// through asStrudelCode, and Strudel's own note names are scientific.
		const pat = await compile('note("<60 64>")');
		const cycles = patternCycles(pat, CPS);
		const notes = exportNotes(pat, cycles, CPS);
		expect(cycles).toBe(2);
		expect(pitches(notes)).toEqual([60, 64]);
		expect(notes[1].start).toBe(1); // cycle 1, in cycles
		expect(notes[0].duration).toBe(1);
	});

	test("supports Strudel transformations that the mini parser cannot", async () => {
		// .transpose() used to grey the To Clip button out entirely.
		const pat = await compile('note("60 64").transpose(2)');
		expect(pitches(exportNotes(pat, 1, CPS))).toEqual([62, 66]);
	});

	test("times are in cycles, so the caller picks the bar length", async () => {
		const notes = exportNotes(await compile('note("c5 e5 g5 b5")'), 1, CPS);
		expect(notes.map((n) => n.start)).toEqual([0, 0.25, 0.5, 0.75]);
		expect(notes.every((n) => n.duration === 0.25)).toBe(true);
	});
});

describe("Live Play and To Clip agree", () => {
	// Both paths compile the SAME asStrudelCode() output, so this pins the whole
	// chain: token -> scale/drum resolution -> Strudel -> pitch.
	const patterns = [
		["scale degrees", "0 2 4", cMajor],
		["negative degrees", "-1 0 1", cMajor],
		["note names", "c5 e5 g5", cMajor],
		["drum words", "bd sd hh", { ...cMajor, drumMap: DEFAULT_DRUM_MAP }],
		["a shifted octave", "0 2", { ...cMajor, octaveOffset: -1 }],
		["another key", "0 2", { conv: "strudel", scale: { root: 7, name: "Minor" } }],
	];

	for (const [what, text, ctx] of patterns) {
		test(what, async () => {
			const pat = await compile(asStrudelCode(text, ctx));
			const livePitches = queryWindow(pat, 0, 1, CPS).map((h) => hapToNote(h, CPS).pitch);
			const clipPitches = pitches(exportNotes(pat, 1, CPS));
			expect(clipPitches).toEqual(livePitches);
		});
	}

	test("a replicated drum hit fires once per step, not 67 times", async () => {
		// The machine-gun bug, end to end: "bd!4" resolved to "36!67", and Strudel
		// replicated the kick 67 times a cycle. It must now be four hits, on the
		// beat, exactly as "bd bd bd bd" is.
		const drums = { ...cMajor, drumMap: DEFAULT_DRUM_MAP };
		const pat = await compile(asStrudelCode("bd!4", drums));
		const notes = exportNotes(pat, 1, CPS);
		expect(notes).toHaveLength(4);
		expect(pitches(notes)).toEqual([36, 36, 36, 36]);
		expect(notes.map((n) => n.start)).toEqual([0, 0.25, 0.5, 0.75]);

		const spelled = await compile(asStrudelCode("bd bd bd bd", drums));
		expect(exportNotes(spelled, 1, CPS)).toEqual(notes);
	});

	test("a scale degree is no longer a raw MIDI pitch", async () => {
		// "2 3" used to play MIDI 2 and 3 - two notes below the bottom of a piano.
		const pat = await compile(asStrudelCode("2 3", cMajor));
		expect(pitches(exportNotes(pat, 1, CPS))).toEqual([64, 65]);
	});
});

describe("our scale table matches Strudel's own", () => {
	// Strudel's .scale() is not used at runtime (it mis-parses names with spaces,
	// and disagrees with Ableton on the pentatonics), but for the seven-note modes
	// tonal is authoritative - so they are pinned against it here. A drift in the
	// anchor (middle C), the octave wrap or the negative-degree handling fails.
	const MODES = ["major", "minor", "dorian", "mixolydian", "lydian", "phrygian", "locrian"];
	const DEGREES = [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8];

	for (const mode of MODES) {
		test(mode, async () => {
			const pat = await compile(`n("${DEGREES.join(" ")}").scale("C4:${mode}")`);
			const strudel = queryWindow(pat, 0, 1, CPS).map((h) => hapToNote(h, CPS).pitch);
			const ours = DEGREES.map((d) => degreeToMidi(d, { root: 0, name: mode }));
			expect(ours).toEqual(strudel);
		});
	}
});
