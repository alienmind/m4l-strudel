/**
 * unparse.ts - reverse direction: quantize MIDI notes into a grid and emit
 * mini-notation text.
 *
 * Algorithm (one cycle = `bars` bars):
 * 1. Quantize each note's start and duration to `grid` steps per bar.
 * 2. Bucket notes by their start step. Simultaneous notes → "[a,b]" stack.
 * 3. Empty steps → "~". A note held over k steps → "note@k".
 * 4. Emit one whitespace-separated token per step.
 */

import { midiToNote, type OctaveConvention } from "./notes";

export interface RawNote {
	pitch: number;
	start: number; // beats from clip start
	duration: number; // beats
}

export interface UnparseOptions {
	bars: number;
	beatsPerBar?: number; // default 4
	grid: number; // steps per bar, e.g. 16
	conv: OctaveConvention;
	octaveOffset?: number;
}

export function eventsToMini(notes: RawNote[], opts: UnparseOptions): string {
	const beatsPerBar = opts.beatsPerBar ?? 4;
	const octaveOffset = opts.octaveOffset ?? 0;
	const totalSteps = opts.bars * opts.grid;
	const beatsPerStep = beatsPerBar / opts.grid;

	// step index → list of { name, lengthSteps }
	const buckets: { name: string; len: number }[][] = Array.from(
		{ length: totalSteps },
		() => [],
	);

	for (const n of notes) {
		const step = Math.round(n.start / beatsPerStep);
		if (step < 0 || step >= totalSteps) continue;
		const len = Math.max(1, Math.round(n.duration / beatsPerStep));
		buckets[step].push({
			name: midiToNote(n.pitch, opts.conv, octaveOffset),
			len,
		});
	}

	const tokens: string[] = [];
	for (let i = 0; i < totalSteps; i++) {
		const cell = buckets[i];
		if (cell.length === 0) {
			tokens.push("~");
			continue;
		}
		// Use the max held length in this cell for elongation.
		const maxLen = Math.max(...cell.map((c) => c.len));
		let tok: string;
		if (cell.length === 1) {
			tok = cell[0].name;
		} else {
			tok = "[" + cell.map((c) => c.name).join(",") + "]";
		}
		if (maxLen > 1) tok += "@" + maxLen;
		tokens.push(tok);
		// Skip the steps this token occupies (approximate; keeps length sane).
		for (let s = 1; s < maxLen && i + 1 < totalSteps; s++) {
			i++;
			tokens.push(""); // consumed by elongation, drop below
		}
	}

	const compact = tokens.filter((t) => t !== "").join(" ");
	return compact;
}
