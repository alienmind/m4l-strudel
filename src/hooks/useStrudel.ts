import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bindInlet, inJweb, outlet } from "@/lib/maxBridge";
import { renderPattern, toFlatList } from "@/lib/mini/render";
import { eventsToMini, type RawNote } from "@/lib/mini/unparse";
import type { OctaveConvention } from "@/lib/mini/notes";
import type { DeviceMode } from "@/hooks/useDeviceMode";
import EngineWorker from "@/workers/engine.worker.js?worker&inline";

interface EngineNote {
	pitch: number;
	velocity: number;
	durMs: number;
	chan: number;
	delayMs: number;
	vel01: number;
	wave: string;
	cutoff: number;
	gain: number;
}

type EngineMessage =
	| { t: "ready" }
	| { t: "evalok" }
	| { t: "evalerr"; message: string }
	| { t: "notes"; notes: EngineNote[] }
	| { t: "flush" };

export interface StrudelState {
	text: string;
	setText: (t: string) => void;
	bars: number;
	setBars: (n: number) => void;
	grid: number;
	setGrid: (n: number) => void;
	conv: OctaveConvention;
	setConv: (c: OctaveConvention) => void;
	octaveOffset: number;
	setOctaveOffset: (n: number) => void;
	noteCount: number;
	errors: { pos: number; msg: string }[];
	status: string;
	/** Whether the device's track has a clip that From Clip could read. */
	clipAvailable: boolean;
	toMidi: () => void;
	fromMidi: () => void;
	/** Live evaluation (midi/audio devices): real Strudel engine in a Web Worker. */
	live: boolean;
	evalError: string | null;
	run: () => void;
	hush: () => void;
	/** One-line health readout: engine state, ticks received, notes sent. */
	debug: string;
	/** BUILD_STAMP of the .amxd wrapper driving this page ("?" until reported).
	 *  Differing from __APP_VERSION__ means a mixed/stale install. */
	amxdBuild: string;
}

export function useStrudel(mode: DeviceMode = "midi"): StrudelState {
	const [text, setText] = useState("c5 [e5 g5]*2 ~ <a5 b5>");
	const [bars, setBars] = useState(1);
	const [grid, setGrid] = useState(16);
	const [conv, setConv] = useState<OctaveConvention>("strudel");
	const [octaveOffset, setOctaveOffset] = useState(0);
	const [status, setStatus] = useState("Ready");
	// Outside Max (browser dev) there is no wrapper to report availability, so
	// default to enabled there and let the wrapper drive it inside Live.
	const [clipAvailable, setClipAvailable] = useState(!inJweb);

	const [amxdBuild, setAmxdBuild] = useState("?");

	useEffect(() => {
		// The [js] side pushes `clip_available 0/1` (polled once a second).
		bindInlet("clip_available", (avail) => {
			setClipAvailable(Number(avail) === 1);
		});
		bindInlet("build", (stamp) => setAmxdBuild(String(stamp).split(" ")[0]));
		outlet("ui_ready");
	}, []);

	const { noteCount, errors } = useMemo(() => {
		const r = renderPattern(text, { bars, conv, octaveOffset });
		return { noteCount: r.notes.length, errors: r.errors };
	}, [text, bars, conv, octaveOffset]);

	// From MIDI: the [js] side replies `notes <loopEndBeats> <n> <p s d> ...`
	useEffect(() => {
		bindInlet("notes", (...args) => {
			const loopEnd = Number(args[0]);
			const n = Number(args[1]);
			const raw: RawNote[] = [];
			for (let k = 0; k < n; k++) {
				const o = 2 + k * 3;
				raw.push({
					pitch: Number(args[o]),
					start: Number(args[o + 1]),
					duration: Number(args[o + 2]),
				});
			}
			const beatsPerBar = 4;
			const barsRead = Math.max(1, Math.round(loopEnd / beatsPerBar));
			const mini = eventsToMini(raw, { bars: barsRead, grid, conv, octaveOffset });
			setText(mini);
			setStatus(`Read ${n} notes → ${barsRead} bar(s)`);
		});
		bindInlet("read_error", () => {
			setStatus("No clip found on this track - create or play a MIDI clip first");
		});
	}, [grid, conv, octaveOffset]);

	const toMidi = useCallback(() => {
		const { notes, lengthBeats, errors: errs } = renderPattern(text, {
			bars,
			conv,
			octaveOffset,
		});
		if (errs.length > 0) {
			setStatus(`Parse error at ${errs[0].pos}: ${errs[0].msg}`);
			return;
		}
		outlet("write_clip", ...toFlatList(notes, lengthBeats));
		setStatus(`Wrote ${notes.length} notes over ${lengthBeats} beats`);
	}, [text, bars, conv, octaveOffset]);

	const fromMidi = useCallback(() => {
		outlet("read_notes");
		setStatus("Reading the playing/first clip on this track…");
	}, []);

	const [live, setLive] = useState(false);
	const [evalError, setEvalError] = useState<string | null>(null);
	const [debug, setDebug] = useState("");
	const workerRef = useRef<Worker | null>(null);

	// The Strudel engine runs in a Web Worker inside jweb (the sampler device
	// has no live-eval engine). Max feeds transport ticks in as messages; the
	// worker replies with scheduled note events that we forward to the patcher
	// in the shape the device's output chain expects.
	useEffect(() => {
		if (mode === "sampler") return;
		const counters = { engine: "booting", ticks: 0, sent: 0, playing: 0, beats: 0, bpm: 120 };
		const worker: Worker = new EngineWorker();
		workerRef.current = worker;
		worker.onmessage = (e: MessageEvent<EngineMessage>) => {
			const m = e.data;
			if (m.t === "ready") {
				counters.engine = "ready";
				setStatus("Strudel engine ready");
			} else if (m.t === "evalok") {
				setEvalError(null);
				setStatus("Pattern running");
			} else if (m.t === "evalerr") {
				counters.engine = "error";
				setEvalError(m.message);
				setStatus("Eval error");
			} else if (m.t === "notes") {
				counters.sent += m.notes.length;
				for (const n of m.notes) {
					if (mode === "audio") outlet("voice", n.pitch, n.vel01, n.durMs, n.wave, n.cutoff, n.gain, n.delayMs);
					else outlet("midinote", n.pitch, n.velocity, n.durMs, n.chan, n.delayMs);
				}
			} else if (m.t === "flush") {
				outlet(mode === "audio" ? "allnotesoff" : "flush");
			}
		};
		bindInlet("tick", (playing, beats) => {
			counters.ticks++;
			counters.playing = Number(playing);
			counters.beats = Number(beats);
			worker.postMessage({ t: "tick", playing: Number(playing), beats: Number(beats) });
		});
		// BPM comes from the wrapper's LiveAPI tempo observer, not plugsync~
		// (which only reports samples-per-beat).
		bindInlet("tempo", (bpm) => {
			counters.bpm = Number(bpm);
			worker.postMessage({ t: "tempo", bpm: Number(bpm) });
		});
		// Health readout, refreshed 1x/s: instantly shows which hop is dead.
		// ticks stay 0 -> the plugsync~ chain or jweb inbound messages are
		// broken (ticks flow even with the transport stopped); beats frozen /
		// playing 0 while Live plays -> plugsync~ outlet mapping; sent stays
		// 0 while playing -> engine/pattern side; sent counts up but silence
		// -> the Max-side pipe/makenote chain.
		const iv = setInterval(
			() =>
				setDebug(
					`${counters.engine} / t ${counters.ticks} / play ${counters.playing} ` +
						`/ beat ${counters.beats.toFixed(1)} / bpm ${Math.round(counters.bpm)} / sent ${counters.sent}`,
				),
			1000,
		);
		return () => {
			clearInterval(iv);
			worker.terminate();
			workerRef.current = null;
		};
	}, [mode]);

	const run = useCallback(() => {
		workerRef.current?.postMessage({ t: "code", code: text });
		setLive(true);
	}, [text]);

	const hush = useCallback(() => {
		workerRef.current?.postMessage({ t: "hush" });
		setLive(false);
	}, []);

	return {
		text,
		setText,
		bars,
		setBars,
		grid,
		setGrid,
		conv,
		setConv,
		octaveOffset,
		setOctaveOffset,
		noteCount,
		errors,
		status,
		clipAvailable,
		toMidi,
		fromMidi,
		live,
		evalError,
		run,
		hush,
		debug,
		amxdBuild,
	};
}
