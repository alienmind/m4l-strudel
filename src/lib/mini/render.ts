/**
 * render.ts - glue the parser + scheduler + note conversion into concrete MIDI
 * note events (in beats), and encode them for the Max [js] side.
 */

import { parseMini } from "./parser";
import { schedule } from "./schedule";
import { noteToMidi, type OctaveConvention } from "./notes";
import type { ParseError } from "./ast";

export interface NoteEvent {
	pitch: number;
	start: number; // beats from clip start
	duration: number;
	velocity: number;
}

export interface RenderOptions {
	bars: number; // one cycle spans this many bars
	cycles?: number; // how many cycles to render (default 1)
	beatsPerBar?: number; // default 4
	conv: OctaveConvention;
	octaveOffset?: number;
	velocity?: number;
}

export interface RenderResult {
	notes: NoteEvent[];
	lengthBeats: number;
	errors: ParseError[];
}

export function renderPattern(src: string, opts: RenderOptions): RenderResult {
	const beatsPerBar = opts.beatsPerBar ?? 4;
	const cycles = opts.cycles ?? 1;
	const velocity = opts.velocity ?? 100;
	const beatsPerCycle = opts.bars * beatsPerBar;

	const { ast, errors } = parseMini(src);
	const notes: NoteEvent[] = [];

	for (let c = 0; c < cycles; c++) {
		const evs = schedule(ast, c);
		for (const ev of evs) {
			const pitch = noteToMidi(ev.note, opts.conv, opts.octaveOffset ?? 0);
			if (pitch === null) continue;
			notes.push({
				pitch,
				start: (c + ev.start) * beatsPerCycle,
				duration: ev.duration * beatsPerCycle,
				velocity,
			});
		}
	}

	return { notes, lengthBeats: cycles * beatsPerCycle, errors };
}

/** [lengthBeats, n, p1,s1,d1,v1, ...] for the Max write_clip message. */
export function toFlatList(notes: NoteEvent[], lengthBeats: number): number[] {
	const out: number[] = [round(lengthBeats), notes.length];
	for (const n of notes) {
		out.push(n.pitch, round(n.start), round(n.duration), n.velocity);
	}
	return out;
}

function round(n: number): number {
	return Math.round(n * 1000) / 1000;
}
