/**
 * notes.ts - note-name ↔ MIDI conversion with a selectable octave convention.
 *
 * Strudel/Tidal heritage: "c5" is middle C (MIDI 60). Scientific pitch: "c4" is
 * middle C. The convention is a single per-octave offset; the UI also exposes a
 * ±octave stepper so users can always match their DAW regardless of default.
 *
 * IMPLEMENTATION NOTE: verify the Strudel default against strudel.cc if in doubt
 * (evaluate note("c5") and read its MIDI/frequency). If it turns out Strudel maps
 * c4→60, flip STRUDEL_MIDDLE_C_OCTAVE below - nothing else changes.
 */

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

function middleCOctave(conv: OctaveConvention): number {
	return conv === "strudel" ? STRUDEL_MIDDLE_C_OCTAVE : SCIENTIFIC_MIDDLE_C_OCTAVE;
}

/**
 * Parse a note token to a MIDI number, or return null if it isn't a note.
 * Accepts: letter (a-g) + accidentals (# / s / b) + optional octave, e.g.
 * "c", "cs3", "eb4", "f#2", and raw integers ("60" → MIDI 60).
 */
export function noteToMidi(
	token: string,
	conv: OctaveConvention,
	octaveOffset = 0,
): number | null {
	const t = token.trim();

	// Raw MIDI number
	if (/^-?\d+$/.test(t)) return parseInt(t, 10) + octaveOffset * 12;

	const m = /^([a-gA-G])([#sb]*)(-?\d+)?$/.exec(t);
	if (!m) return null;

	let semitone = LETTER_SEMITONE[m[1].toLowerCase()];
	for (const ch of m[2]) {
		if (ch === "#" || ch === "s") semitone += 1;
		else if (ch === "b") semitone -= 1;
	}
	// Default octave is the middle-C octave so a bare "c" is MIDI 60.
	const octave = m[3] !== undefined ? parseInt(m[3], 10) : middleCOctave(conv);
	const midi = (octave - middleCOctave(conv)) * 12 + 60 + semitone;
	return midi + octaveOffset * 12;
}

const SHARP_NAMES = ["c", "c#", "d", "d#", "e", "f", "f#", "g", "g#", "a", "a#", "b"];

/** MIDI number → mini-notation note name, e.g. 60 → "c5" (strudel). */
export function midiToNote(
	midi: number,
	conv: OctaveConvention,
	octaveOffset = 0,
): string {
	const m = midi - octaveOffset * 12;
	const semitone = ((m % 12) + 12) % 12;
	const octave = Math.floor((m - 60) / 12) + middleCOctave(conv);
	return SHARP_NAMES[semitone] + octave;
}
