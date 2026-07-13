import { useCallback, useMemo, useState } from "react";
import { DEFAULT_DRUM_MAP, loadDrumMap, saveDrumMap, type DrumMap } from "@/lib/mini/drums";
import { useStrudelEngine, type EngineState } from "../shared/useStrudelEngine";

export interface StrudelState extends EngineState {
	/** Drum words ("bd", "hh") -> MIDI notes, for Drum Rack patterns. */
	drumMap: DrumMap;
	setDrumMap: (m: DrumMap) => void;
	resetDrumMap: () => void;
}

export function useStrudel(): StrudelState {
	const [drumMap, setDrumMapState] = useState<DrumMap>(() => loadDrumMap());

	const ctx = useMemo(() => ({ drumMap }), [drumMap]);

	const engine = useStrudelEngine({
		initialText: 's("bd hh sd hh")',
		ctx,
	});

	const setDrumMap = useCallback((m: DrumMap) => {
		setDrumMapState(m);
		saveDrumMap(m);
	}, []);

	const resetDrumMap = useCallback(() => {
		setDrumMapState({ ...DEFAULT_DRUM_MAP });
		saveDrumMap({ ...DEFAULT_DRUM_MAP });
	}, []);

	return { ...engine, drumMap, setDrumMap, resetDrumMap };
}
