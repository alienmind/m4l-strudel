/**
 * render.ts - glue the parser + scheduler + note conversion into concrete MIDI
 * note events (in beats), and encode them for the Max [js] side.
 *
 * This is the LOCAL renderer. Since the clip exporter moved onto the Strudel
 * engine (useStrudel.ts's toMidi), its job is the live note-count readout while
 * the user types - instant, synchronous, and bare-mini-only. The engine is
 * authoritative for what actually lands in a clip.
 */

import { parseMini } from "./parser";
import { schedule } from "./schedule";
import { astCycleLength } from "./cycles";
import { noteToMidi, type NoteContext } from "./notes";
import type { ParseError } from "./ast";

export interface NoteEvent {
	pitch: number;
	start: number; // beats from clip start
	duration: number;
	velocity: number;
}

export interface RenderOptions extends NoteContext {
	bars: number; // one cycle spans this many bars
	/** How many cycles to render. Defaults to the pattern's own loop length, so
	 *  `<a b>` renders both halves instead of being truncated at cycle 1. */
	cycles?: number;
	beatsPerBar?: number; // default 4
	velocity?: number;
}

export interface RenderResult {
	notes: NoteEvent[];
	lengthBeats: number;
	cycles: number;
	errors: ParseError[];
}

export function renderPattern(src: string, opts: RenderOptions): RenderResult {
	const beatsPerBar = opts.beatsPerBar ?? 4;
	const velocity = opts.velocity ?? 100;
	const beatsPerCycle = opts.bars * beatsPerBar;

	const { ast, errors } = parseMini(src);
	const cycles = opts.cycles ?? astCycleLength(ast);
	const notes: NoteEvent[] = [];

	for (let c = 0; c < cycles; c++) {
		const evs = schedule(ast, c);
		for (const ev of evs) {
			const pitch = noteToMidi(ev.note, opts);
			if (pitch === null) continue;
			notes.push({
				pitch,
				start: (c + ev.start) * beatsPerCycle,
				duration: ev.duration * beatsPerCycle,
				velocity,
			});
		}
	}

	return { notes, lengthBeats: cycles * beatsPerCycle, cycles, errors };
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
