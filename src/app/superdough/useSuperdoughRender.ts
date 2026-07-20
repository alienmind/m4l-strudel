import { useEffect, useRef, useState } from "react";
import { registerSynthSounds, superdough, initAudio } from "superdough";
import { getAudioContext } from "@strudel/webaudio";
import { useStrudelEngine } from "../shared/useStrudelEngine";
import surface, { INITIAL_TEXT } from "./surface";

export function useSuperdoughRender() {
	const [samplesNote, setSamplesNote] = useState<string | null>("Loading samples...");
	const initialized = useRef(false);

	useEffect(() => {
		if (initialized.current) return;
		initialized.current = true;
		Promise.all([
			initAudio(),
			registerSynthSounds(),
		]).then(() => {
			setSamplesNote(null);
		}).catch(e => {
			setSamplesNote("Failed to load sounds: " + e.message);
		});
	}, []);

	const engine = useStrudelEngine({
		surface: surface as any,
		initialText: INITIAL_TEXT,
		ctx: {},
		liveScale: "C4:major",
		superdoughSink: (ev) => {
			if (!initialized.current) return;
			const ctx = getAudioContext();
			const t = ctx.currentTime + ev.delayMs / 1000;
			superdough(ev.value, t, ev.durMs / 1000);
		}
	});

	// Compatibility shim for App.tsx which expects these properties from the old conductor
	return {
		...engine,
		samplesNote,
		sliders: [],
		status: { phase: engine.status, message: engine.debug },
		beats: 0,
		tempo: 120,
		beatsPerCycle: engine.beatsPerCycle,
		playing: engine.live,
	};
}
