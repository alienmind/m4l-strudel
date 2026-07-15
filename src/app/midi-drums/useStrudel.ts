import { useCallback, useMemo } from "react";
import { useStateSync } from "@m4l-jweb/surface/react";
import { DEFAULT_DRUM_MAP, type DrumMap } from "@/lib/mini/drums";
import { useStrudelEngine, type EngineState } from "../shared/useStrudelEngine";
import surface from "./surface";

/**
 * The drums device: the shared engine, plus the one idea that is its own - the DRUM
 * MAP, which is what turns `bd` into a Drum Rack pad.
 *
 * The map lives in the LIVE SET now (surface.ts declares it as a state slot), where
 * it used to live in the page's localStorage. That is a real behaviour change and a
 * deliberate one: a map now travels with the set - to another machine, and to whoever
 * you send it to - and each INSTANCE of the device has its own, so two drum tracks
 * with two different kits are two different maps. localStorage could do neither: it
 * was one map per machine, shared by every copy of the device, and it stayed behind
 * when the set left.
 */
export interface StrudelState extends EngineState {
	/** Drum words ("bd", "hh") -> MIDI notes, for Drum Rack patterns. */
	drumMap: DrumMap;
	setDrumMap: (m: DrumMap) => void;
	resetDrumMap: () => void;
}

export function useStrudel(): StrudelState {
	const [savedMap, setDrumMap] = useStateSync(surface, "drumMap");

	// An unconfigured instance persists an EMPTY [dict] on the Max side, and the
	// library seeds no default into it - so on load Max hands back `{}`, which the
	// state store parses and uses to overwrite the app's declared default. The result
	// is a device whose pads are all empty and whose `s("bd sd")` resolves to nothing.
	// Treat an empty map as "not configured yet" and fall back to the standard kit, so
	// a fresh device shows AND plays the defaults. The first edit (or Reset) writes the
	// whole map back through setDrumMap, which persists it and ends the fallback.
	const drumMap = useMemo(
		() => (Object.keys(savedMap).length > 0 ? savedMap : DEFAULT_DRUM_MAP),
		[savedMap],
	);

	const ctx = useMemo(() => ({ drumMap }), [drumMap]);

	const engine = useStrudelEngine({
		surface,
		initialText: 's("bd hh sd hh")',
		ctx,
	});

	const resetDrumMap = useCallback(() => setDrumMap({ ...DEFAULT_DRUM_MAP }), [setDrumMap]);

	return { ...engine, drumMap, setDrumMap, resetDrumMap };
}
