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

const STORAGE_KEY = "m4l-strudel.drumMap";

/** Look a word up, case-insensitively. Returns null when it is not a drum. */
export function drumToMidi(word: string, map: DrumMap): number | null {
	const hit = map[word.trim().toLowerCase()];
	return typeof hit === "number" ? hit : null;
}

/**
 * jweb is Chromium, so localStorage is real and survives a device reload. It does
 * NOT travel with the Live set - persisting into the .amxd would need the wrapper
 * to own the state, which is a bigger change than this feature is worth today.
 */
export function loadDrumMap(): DrumMap {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { ...DEFAULT_DRUM_MAP };
		const parsed: unknown = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return { ...DEFAULT_DRUM_MAP };
		const out: DrumMap = {};
		for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
			const midi = Number(v);
			if (k && Number.isFinite(midi)) out[k.toLowerCase()] = clampMidi(midi);
		}
		return Object.keys(out).length ? out : { ...DEFAULT_DRUM_MAP };
	} catch {
		return { ...DEFAULT_DRUM_MAP };
	}
}

export function saveDrumMap(map: DrumMap): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
	} catch {
		// Private mode, or a jweb build with storage disabled: the map still works
		// for this session, it just will not be remembered.
	}
}

function clampMidi(n: number): number {
	return Math.max(0, Math.min(127, Math.round(n)));
}
