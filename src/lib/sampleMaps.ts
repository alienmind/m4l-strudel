/**
 * sampleMaps.ts - the sample maps strudel.cc prebakes, and the best-effort loader.
 *
 * Lifted out of the Superdough device when the Synth device grew the same need: both
 * devices register the same universe of sounds, and a list that lived in one of them
 * would drift the moment either changed. See strudel/packages/repl/prebake.mjs for
 * the upstream original.
 *
 * BEST EFFORT, always. Synths (registerSynthSounds) need no network; these do. One
 * dead map must not sink the others, and none of them may block synth playback - so
 * the loader settles rather than races, and reports how many failed instead of
 * throwing. Bytes fetched here go through the persistent cache (lib/sampleCache.ts),
 * so a second session offline still has whatever the first one pulled.
 */
const DOUGH = "https://raw.githubusercontent.com/felixroos/dough-samples/main";
const UZU = "https://raw.githubusercontent.com/tidalcycles/uzu-drumkit/main";

export const SAMPLE_MAPS = [
	`${DOUGH}/tidal-drum-machines.json`,
	`${DOUGH}/piano.json`,
	`${DOUGH}/Dirt-Samples.json`,
	`${DOUGH}/vcsl.json`,
	`${DOUGH}/mridangam.json`,
	`${UZU}/strudel.json`,
];

/** Register every map; resolves with how many failed (0 = all present). */
export async function loadSampleMaps(register: (url: string) => Promise<unknown>): Promise<number> {
	const results = await Promise.allSettled(SAMPLE_MAPS.map((m) => register(m)));
	return results.filter((r) => r.status === "rejected").length;
}
