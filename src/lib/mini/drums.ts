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

/**
 * The layout of a stock Live Drum Rack, pad for pad (C1 = 36 at bottom-left up to
 * D#2 = 51, the 16-pad block Live shows by default):
 *
 *     Crash Crash Ride  Ride     48 49 50 51
 *     LoTom MdTom OpnHH HiTom     44 45 46 47
 *     Kick  Snare ClsHH Snare     40 41 42 43
 *     Kick  Rim   Snare Clap      36 37 38 39
 *
 * The canonical Strudel words (`bd`, `sd`, `hh`, `oh`, `cp`, `rim`, the toms and the
 * cymbals) land on the pad that holds that sound, so a rhythm copied off strudel.cc
 * hits the right pad. The repeated pads (a second kick, extra snares, the second
 * crash/ride) get `bd2`/`sd2`/... so every pad in the rack is reachable, not just the
 * eleven a one-word-per-sound map would cover.
 *
 * A word only reaches this map if it is NOT a valid note name (notes.ts), so `cb`
 * ("C flat") is deliberately absent - it parses as a note, never a cowbell.
 */
export const DEFAULT_DRUM_MAP: DrumMap = {
	bd: 36, // Bass Drum
	rim: 37, // Rim Shot
	sd: 38, // Snare Drum
	cp: 39, // Hand Clap
	bd2: 40, // Bass Drum (2)
	sd2: 41, // Snare Drum (2)
	hh: 42, // Closed Hi-Hat
	sd3: 43, // Snare Drum (3)
	lt: 44, // Low Tom
	mt: 45, // Mid Tom
	oh: 46, // Open Hi-Hat
	ht: 47, // Hi Tom
	cr: 48, // Crash
	cr2: 49, // Crash (2)
	rd: 50, // Ride
	rd2: 51, // Ride (2)
};

/**
 * The palette the pad editor offers - the standard Strudel/GM abbreviations, in a
 * sensible reading order. It is the DEFAULT_DRUM_MAP's words plus a handful more that
 * players reach for (extra hats and toms), so the drag-from-the-side palette has
 * something to place even on a pad the defaults leave empty. A user's own custom word
 * (typed into a pad) is not here and does not need to be - it lives in their map.
 */
export const STANDARD_DRUM_WORDS: readonly string[] = [
	"bd", "sd", "rim", "cp", // kick / snare / rimshot / clap
	"hh", "oh", "ph", // hats: closed / open / pedal
	"lt", "mt", "ht", // toms: low / mid / high
	"cr", "rd", // crash / ride  (NB: no "cb" - it parses as the note C-flat)
];

/** Look a word up, case-insensitively. Returns null when it is not a drum. */
export function drumToMidi(word: string, map: DrumMap): number | null {
	const hit = map[word.trim().toLowerCase()];
	return typeof hit === "number" ? hit : null;
}
