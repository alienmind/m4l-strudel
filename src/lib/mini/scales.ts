/**
 * scales.ts - Live 12's global scale, as semitone intervals.
 *
 * Live broadcasts its song scale as `root_note` (0-11, C=0) and `scale_name`
 * (a display string like "Harmonic Minor"). A bare number in mini-notation is a
 * SCALE DEGREE, not a MIDI pitch - degree 0 is the root, degree 7 is the root an
 * octave up, degree -1 is the note below the root.
 *
 * WHY THE INTERVALS LIVE HERE and are not delegated to Strudel's own `.scale()`:
 * `.scale("C4:harmonic minor")` does not work. Strudel parses that argument as
 * mini-notation, so the space splits "harmonic minor" into two words and tonal
 * gets a truncated name. Owning the table means degrees resolve identically for
 * Live Play and for To Clip (both go through degreeToMidi), and it costs one
 * table that tests pin against Strudel's own output for the scales it agrees on.
 *
 * Degree 0 is anchored at MIDI 60 + root, so a C-major song puts degree 0 on
 * middle C rather than somewhere near the bottom of the keyboard.
 */

export const DEGREE_ZERO_MIDI = 60;

/** Live scale name (lowercased) -> semitone offsets from the root. */
const SCALES: Record<string, number[]> = {
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
	dorian: [0, 2, 3, 5, 7, 9, 10],
	mixolydian: [0, 2, 4, 5, 7, 9, 10],
	lydian: [0, 2, 4, 6, 7, 9, 11],
	phrygian: [0, 1, 3, 5, 7, 8, 10],
	locrian: [0, 1, 3, 5, 6, 8, 10],
	"whole tone": [0, 2, 4, 6, 8, 10],
	"half-whole dim.": [0, 1, 3, 4, 6, 7, 9, 10],
	"whole-half dim.": [0, 2, 3, 5, 6, 8, 9, 11],
	"minor blues": [0, 3, 5, 6, 7, 10],
	"minor pentatonic": [0, 3, 5, 7, 10],
	"major pentatonic": [0, 2, 4, 7, 9],
	"harmonic minor": [0, 2, 3, 5, 7, 8, 11],
	"harmonic major": [0, 2, 4, 5, 7, 8, 11],
	"dorian #4": [0, 2, 3, 6, 7, 9, 10],
	"phrygian dominant": [0, 1, 4, 5, 7, 8, 10],
	"melodic minor": [0, 2, 3, 5, 7, 9, 11],
	"lydian augmented": [0, 2, 4, 6, 8, 9, 11],
	"lydian dominant": [0, 2, 4, 6, 7, 9, 10],
	"super locrian": [0, 1, 3, 4, 6, 8, 10],
	"8-tone spanish": [0, 1, 3, 4, 5, 6, 8, 10],
	bhairav: [0, 1, 4, 5, 7, 8, 11],
	"hungarian minor": [0, 2, 3, 6, 7, 8, 11],
	hirajoshi: [0, 2, 3, 7, 8],
	"in-sen": [0, 1, 5, 7, 10],
	iwato: [0, 1, 5, 6, 10],
	kumoi: [0, 2, 3, 7, 9],
	"pelog selisir": [0, 1, 3, 7, 8],
	"pelog tembung": [0, 1, 5, 7, 8],
};

/** The scale in force: what Live sends, plus the identity default. */
export interface Scale {
	/** 0-11, C=0. */
	root: number;
	/** Live's display name; unknown names fall back to Major. */
	name: string;
}

export const DEFAULT_SCALE: Scale = { root: 0, name: "Major" };

export function scaleIntervals(name: string): number[] {
	return SCALES[name.trim().toLowerCase()] ?? SCALES.major;
}

/** Is this a scale Live named and we know the intervals for? */
export function isKnownScale(name: string): boolean {
	return name.trim().toLowerCase() in SCALES;
}

export const ROOT_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * The scale as STRUDEL would name it: "C4:harmonic minor".
 *
 * Handed to the pattern as a global (`liveScale`) so code can opt into Strudel's
 * own implementation explicitly - `n("0 2 4").scale(liveScale)` - instead of ours.
 * The two do NOT always agree; see strudelAgrees().
 */
export function strudelScaleName(scale: Scale): string {
	// Octave 4, because Strudel's note names are scientific: its "c4" is MIDI 60,
	// which is where degreeToMidi() anchors degree 0 too.
	return `${ROOT_NAMES[scale.root] ?? "C"}4:${scale.name.trim().toLowerCase()}`;
}

/**
 * Would Strudel's own `.scale()` produce the same notes as degreeToMidi() does?
 *
 * Only for the seven-note modes, which a test pins against Strudel's real output.
 * Everywhere else it will not, for two independent reasons:
 *
 *  - A NAME WITH A SPACE IS MIS-PARSED. `.scale("C4:harmonic minor")` reads its
 *    argument as mini-notation, so the space splits the name into two words and
 *    tonal receives a truncated one.
 *  - IT DISAGREES WITH ABLETON on the pentatonics and blues scales - it returns
 *    plain minor-scale pitches for a minor pentatonic.
 *
 * This is why the Live Scale toggle resolves degrees itself rather than emitting a
 * `.scale()` call, and why the UI warns when a user reaches for Strudel's.
 */
const STRUDEL_AGREES = new Set([
	"major",
	"minor",
	"dorian",
	"mixolydian",
	"lydian",
	"phrygian",
	"locrian",
]);

export function strudelAgrees(name: string): boolean {
	return STRUDEL_AGREES.has(name.trim().toLowerCase());
}

/**
 * Scale degree -> MIDI pitch. Degrees outside the scale's length wrap into
 * higher/lower octaves, so degree 7 of a 7-note scale is the root + 12 and
 * degree -1 is the note below it.
 */
export function degreeToMidi(degree: number, scale: Scale, octaveOffset = 0): number {
	const iv = scaleIntervals(scale.name);
	const n = iv.length;
	const idx = ((degree % n) + n) % n;
	const octave = Math.floor(degree / n);
	return DEGREE_ZERO_MIDI + scale.root + iv[idx] + 12 * octave + 12 * octaveOffset;
}
