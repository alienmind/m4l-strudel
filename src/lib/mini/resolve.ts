/**
 * resolve.ts - rewrite bare mini-notation so every note token is an absolute
 * MIDI number, leaving the structure (rests, groups, modifiers) untouched:
 *
 *   "0 [2 ~] bd*2"  ->  "60 [64 ~] 36*2"     (C major, default drum map)
 *
 * WHY. The live engine and the clip exporter used to disagree about what a token
 * means: Strudel read `2` as MIDI pitch 2 (a D-2, hence "the stream of notes is
 * super low"), knows nothing about Live's global scale, and has never heard of a
 * drum named `bd` unless a sample is loaded. Rather than teaching each path its
 * own dialect, both are handed the SAME pre-resolved numbers. notes.ts is then
 * the only place a token becomes a pitch, and the two paths cannot drift.
 *
 * The rewrite is positional - each note token is replaced in the source string
 * where it stands - so a pattern the user typed keeps its own layout.
 */

import type { Node } from "./ast";
import { parseMini } from "./parser";
import { noteToMidi, type NoteContext } from "./notes";

/**
 * The tokens in NOTE POSITION, as written. Deliberately not `tokenize()`: the
 * tokenizer cannot tell the `2` in `c5*2` (a repeat count) from the `2` in
 * `c5 2` (a note), and only the parser knows which is which.
 */
export function miniNoteTokens(src: string): string[] {
	const notes: { pos: number; len: number; name: string }[] = [];
	collectNotes(parseMini(src).ast, notes);
	return notes.map((n) => n.name);
}

/** Replace every note token in `src` with its MIDI number. */
export function resolveMini(src: string, ctx: NoteContext): string {
	const notes: { pos: number; len: number; name: string }[] = [];
	collectNotes(parseMini(src).ast, notes);

	// One entry per SOURCE token: "a!3" puts the same node in the tree three times,
	// and rewriting its one occurrence in the text three times would corrupt it.
	const unique = [...new Map(notes.map((n) => [n.pos, n])).values()];
	// Right to left, so an earlier replacement cannot shift a later token's index.
	unique.sort((a, b) => b.pos - a.pos);

	let out = src;
	for (const n of unique) {
		const midi = noteToMidi(n.name, ctx);
		// An unresolvable token (a drum word with no mapping) is left as written:
		// Strudel will ignore it, and the clip exporter drops it, which is the same
		// outcome as before and keeps the surrounding pattern playable.
		if (midi === null) continue;
		out = out.slice(0, n.pos) + String(midi) + out.slice(n.pos + n.len);
	}
	return out;
}

function collectNotes(node: Node, out: { pos: number; len: number; name: string }[]): void {
	switch (node.kind) {
		case "note":
			out.push({ pos: node.pos, len: node.len, name: node.name });
			return;
		case "rest":
			return;
		case "seq":
			for (const w of node.items) collectNotes(w.node, out);
			return;
		case "stack":
		case "poly":
			for (const l of node.layers) collectNotes(l, out);
			return;
		case "alt":
			for (const i of node.items) collectNotes(i, out);
			return;
		case "repeat":
		case "euclid":
			collectNotes(node.node, out);
			return;
	}
}
