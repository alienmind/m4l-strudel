/**
 * notes.ts - mini-notation token <-> MIDI conversion.
 *
 * A token in bare mini-notation is one of three things, resolved in this order:
 *
 *   1. a NUMBER   -> a scale degree against Live's global scale (0 = the root,
 *                    7 = the root an octave up, -1 = the note below it)
 *   2. a NOTE NAME-> an absolute pitch ("c5", "eb4", "f#2")
 *   3. a DRUM WORD-> whatever the drum map says ("bd", "hh")
 *
 * Note names win over drum words, so `e` is always the note E; see drums.ts.
 *
 * OCTAVE CONVENTION. Strudel/Tidal heritage puts middle C at "c5"; scientific
 * pitch puts it at "c4". Both are offered because DAWs disagree, and the UI adds
 * a +-octave shift on top. Note that Strudel's OWN parser is scientific ("c5" is
 * MIDI 72, verified against @strudel/core) - which does not divide the two paths
 * here, because bare mini-notation never reaches Strudel's note parser: resolve.ts
 * rewrites every token to an absolute MIDI number first, using this file. Live
 * Play and To Clip therefore always agree.
 */

import { degreeToMidi, type Scale } from "./scales";
import { drumToMidi, type DrumMap } from "./drums";

export type OctaveConvention = "strudel" | "scientific";

const STRUDEL_MIDDLE_C_OCTAVE = 5; // "c5" = MIDI 60
const SCIENTIFIC_MIDDLE_C_OCTAVE = 4; // "c4" = MIDI 60

const LETTER_SEMITONE: Record<string, number> = {
	c: 0,
	d: 2,
	e: 4,
	f: 5,
	g: 7,
	a: 9,
	b: 11,
};

/** Everything a token needs to become a pitch. */
export interface NoteContext {
	conv: OctaveConvention;
	octaveOffset?: number;
	/**
	 * Live 12's global scale, when the Live Scale toggle is ON: bare numbers are
	 * degrees of it.
	 *
	 * ABSENT means the toggle is OFF, and a bare number falls back to Strudel's own
	 * reading of it - a raw MIDI pitch, so `2` is a D-2. That is a footgun (it is
	 * the bug this feature was reported for), which is why the UI says so in orange
	 * - but it is what Strudel does, and a user who has turned Live's scale off has
	 * asked for Strudel's semantics.
	 */
	scale?: Scale;
	drumMap?: DrumMap;
}

function middleCOctave(conv: OctaveConvention): number {
	return conv === "strudel" ? STRUDEL_MIDDLE_C_OCTAVE : SCIENTIFIC_MIDDLE_C_OCTAVE;
}

/** Resolve a token to a MIDI number, or null if it is not a note at all. */
export function noteToMidi(token: string, ctx: NoteContext): number | null {
	const t = token.trim();
	const octaveOffset = ctx.octaveOffset ?? 0;

	// A number: a degree of Live's scale, or - with the toggle off - a raw pitch.
	if (/^-?\d+$/.test(t)) {
		const n = parseInt(t, 10);
		if (!ctx.scale) return n + octaveOffset * 12;
		return degreeToMidi(n, ctx.scale, octaveOffset);
	}

	const m = /^([a-gA-G])([#sb]*)(-?\d+)?$/.exec(t);
	if (m) {
		let semitone = LETTER_SEMITONE[m[1].toLowerCase()];
		for (const ch of m[2]) {
			if (ch === "#" || ch === "s") semitone += 1;
			else if (ch === "b") semitone -= 1;
		}
		// Default octave is the middle-C octave, so a bare "c" is MIDI 60.
		const octave = m[3] !== undefined ? parseInt(m[3], 10) : middleCOctave(ctx.conv);
		const midi = (octave - middleCOctave(ctx.conv)) * 12 + 60 + semitone;
		return midi + octaveOffset * 12;
	}

	// Drum word. Not octave-shifted: a Drum Rack pad is a fixed slot, and moving
	// "bd" an octave up would land on a different pad (or on nothing at all).
	if (ctx.drumMap) return drumToMidi(t, ctx.drumMap);
	return null;
}

const SHARP_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];

/** MIDI number -> mini-notation note name, e.g. 60 -> "c5" (strudel). */
export function midiToNote(midi: number, conv: OctaveConvention, octaveOffset = 0): string {
	const m = midi - octaveOffset * 12;
	const semitone = ((m % 12) + 12) % 12;
	const octave = Math.floor((m - 60) / 12) + middleCOctave(conv);
	return SHARP_NAMES[semitone] + octave;
}
