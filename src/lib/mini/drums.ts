/**
 * drums.ts - the drum map: mini-notation words -> MIDI notes.
 *
 * A Drum Rack lays its pads out chromatically from C1 (MIDI 36), so a pattern
 * written as `bd ~ sd ~` is just a note pattern once each word is looked up. The
 * defaults follow the General MIDI drum layout, which is what a stock Live Drum
 * Rack matches, and they use Strudel's own abbreviations (`bd`, `sd`, `hh`, ...)
 * so a pattern copied off strudel.cc plays the right pad.
 *
 * A word only reaches this map if it is NOT a valid note name (see notes.ts) -
 * so `e` is always the note E, never a drum called "e". Two-letter drum names
 * never collide with note names, which is why the defaults all have two.
 *
 * The map the user EDITS is not here: it is a state slot on the drums device
 * (src/app/midi-drums/surface.ts), persisted in the Live set, per instance. This
 * file holds the defaults it starts from and the lookup itself, which is all that a
 * pattern needs and all that is worth testing.
 */

export type DrumMap = Record<string, number>;

/** General MIDI drums, which is the layout a stock Live Drum Rack uses. */
export const DEFAULT_DRUM_MAP: DrumMap = {
	bd: 36, // bass/kick
	rim: 37,
	sd: 38, // snare
	cp: 39, // clap
	lt: 45, // low tom
	hh: 42, // closed hat
	ht: 50, // high tom
	oh: 46, // open hat
	mt: 47, // mid tom
	cr: 49, // crash
	rd: 51, // ride
};

/** Look a word up, case-insensitively. Returns null when it is not a drum. */
export function drumToMidi(word: string, map: DrumMap): number | null {
	const hit = map[word.trim().toLowerCase()];
	return typeof hit === "number" ? hit : null;
}
