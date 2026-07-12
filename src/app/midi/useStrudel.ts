import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bindInlet, flushNotes, inJweb, outlet, sendNote, uiReady } from "@m4l-jweb/bridge";
import { renderPattern, toFlatList } from "@/lib/mini/render";
import { eventsToMini, type RawNote } from "@/lib/mini/unparse";
import type { OctaveConvention } from "@/lib/mini/notes";
import EngineWorker from "./engine.worker.js?worker&inline";
import { IN, OUT } from "./protocol";

interface EngineNote {
	pitch: number;
	velocity: number;
	durMs: number;
	chan: number;
	delayMs: number;
}

type EngineMessage =
	| { t: "ready" }
	| { t: "evalok" }
	| { t: "evalerr"; message: string }
	| { t: "notes"; notes: EngineNote[] }
	| { t: "flush" }
	| { t: "clock"; free: boolean };

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
	/** Real Strudel engine, running live in a Web Worker. */
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

export function useStrudel(): StrudelState {
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
	const tempoRef = useRef(120);
	const workerRef = useRef<Worker | null>(null);

	useEffect(() => {
		// The [js] side pushes `clip_available 0/1` (polled once a second).
		bindInlet(IN.clip_available, (avail) => {
			setClipAvailable(Number(avail) === 1);
		});
		bindInlet(IN.build, (stamp) => setAmxdBuild(String(stamp).split(" ")[0]));
		// Tempo must be bound BEFORE ui_ready goes out - the wrapper replies
		// with the current tempo immediately, and the worker effect below runs
		// after this one. The ref carries the value across that gap.
		bindInlet(IN.tempo, (bpm) => {
			if (Number(bpm) > 0) {
				tempoRef.current = Number(bpm);
				workerRef.current?.postMessage({ t: "tempo", bpm: Number(bpm) });
			}
		});
		uiReady();
	}, []);

	const { noteCount, errors } = useMemo(() => {
		const r = renderPattern(text, { bars, conv, octaveOffset });
		return { noteCount: r.notes.length, errors: r.errors };
	}, [text, bars, conv, octaveOffset]);

	// From MIDI: the [js] side replies `notes <loopEndBeats> <n> <p s d> ...`
	useEffect(() => {
		bindInlet(IN.notes, (...args) => {
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
		bindInlet(IN.read_error, () => {
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
		outlet(OUT.write_clip, ...toFlatList(notes, lengthBeats));
		setStatus(`Wrote ${notes.length} notes over ${lengthBeats} beats`);
	}, [text, bars, conv, octaveOffset]);

	const fromMidi = useCallback(() => {
		outlet(OUT.read_notes);
		setStatus("Reading the playing/first clip on this track…");
	}, []);

	const [live, setLive] = useState(false);
	const [evalError, setEvalError] = useState<string | null>(null);
	const [debug, setDebug] = useState("");

	// The Strudel engine runs in a Web Worker inside jweb. Max feeds transport
	// ticks in as messages; the worker replies with scheduled note events that
	// we forward to the packaged `midiout` chain via sendNote().
	useEffect(() => {
		const counters = { engine: "booting", ticks: 0, sent: 0, playing: 0, beats: 0, clock: "stop" };
		const worker: Worker = new EngineWorker();
		workerRef.current = worker;
		// Deliver whatever tempo already arrived before this worker existed.
		worker.postMessage({ t: "tempo", bpm: tempoRef.current });
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
					sendNote({ pitch: n.pitch, velocity: n.velocity, durationMs: n.durMs, channel: n.chan, delayMs: n.delayMs });
				}
			} else if (m.t === "flush") {
				flushNotes();
			} else if (m.t === "clock") {
				counters.clock = m.free ? "free" : "live";
				if (m.free) setStatus("Running on the free clock - press Play in Live to lock to the grid");
				else setStatus("Pattern running (locked to Live)");
			}
		};
		bindInlet(IN.tick, (playing, beats) => {
			counters.ticks++;
			counters.playing = Number(playing);
			counters.beats = Number(beats);
			worker.postMessage({ t: "tick", playing: Number(playing), beats: Number(beats) });
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
					`${counters.engine} / t ${counters.ticks} / play ${counters.playing} / clk ${counters.clock} ` +
						`/ beat ${counters.beats.toFixed(1)} / bpm ${Math.round(tempoRef.current)} / sent ${counters.sent}`,
				),
			1000,
		);
		return () => {
			clearInterval(iv);
			worker.terminate();
			workerRef.current = null;
		};
	}, []);

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
