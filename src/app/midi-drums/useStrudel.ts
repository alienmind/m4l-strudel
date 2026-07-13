import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bindInlet, flushNotes, inJweb, outlet, sendNote, uiReady } from "@m4l-jweb/bridge";
import { renderPattern, toFlatList, type NoteEvent } from "@/lib/mini/render";
import { eventsToMini, type RawNote } from "@/lib/mini/unparse";
import type { NoteContext, OctaveConvention } from "@/lib/mini/notes";
import { isBareMini } from "@/lib/strudelCode";
import { activeSpans, parseForPlayhead, type Span } from "@/lib/mini/playhead";
import { DEFAULT_DRUM_MAP, loadDrumMap, saveDrumMap, type DrumMap } from "@/lib/mini/drums";
import { useParam } from "@m4l-jweb/surface/react";
import surface from "../shared/surface";
import EngineWorker from "../shared/engine.worker.js?worker&inline";
import { IN, OUT } from "../shared/protocol";

interface EngineNote {
	pitch: number;
	velocity: number;
	durMs: number;
	chan: number;
	delayMs: number;
}

/** A clip note, in cycles - the exporter's units (see engine.mjs). */
interface ClipNote {
	pitch: number;
	velocity: number;
	start: number;
	duration: number;
}

type EngineMessage =
	| { t: "ready" }
	| { t: "evalok" }
	| { t: "evalerr"; message: string }
	| { t: "notes"; notes: EngineNote[] }
	| { t: "clip"; notes: ClipNote[]; cycles: number }
	| { t: "exporterr"; message: string }
	| { t: "phase"; cycle: number }
	| { t: "flush" }
	| { t: "clock"; free: boolean };

const BEATS_PER_BAR = 4;

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
	/** An amber note about the two scale implementations, or null. */
	warning: string | null;
	/** Source ranges of the step(s) sounding right now, for the editor highlight.
	 *  Empty for full Strudel code, which has no link back to the typed text. */
	playing: Span[];
	/** Drum words ("bd", "hh") -> MIDI notes, for Drum Rack patterns. */
	drumMap: DrumMap;
	setDrumMap: (m: DrumMap) => void;
	resetDrumMap: () => void;
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
	const [playParam, setPlayParam] = useParam(surface, "play");
	const [text, setText] = useState('s("bd hh sd hh")');
	const [bars, setBars] = useState(1);
	const [grid, setGrid] = useState(16);
	const [conv, setConv] = useState<OctaveConvention>("strudel");
	const [octaveOffset, setOctaveOffset] = useState(0);
	const [status, setStatus] = useState("Ready");
	const [drumMap, setDrumMapState] = useState<DrumMap>(() => loadDrumMap());
	// Outside Max (browser dev) there is no wrapper to report availability, so
	// default to enabled there and let the wrapper drive it inside Live.
	const [clipAvailable, setClipAvailable] = useState(!inJweb);

	const [amxdBuild, setAmxdBuild] = useState("?");
	const tempoRef = useRef(120);
	const workerRef = useRef<Worker | null>(null);

	/** Everything a mini-notation token needs to become a pitch. Both paths - the
	 *  live engine and the clip exporter - resolve tokens through this, which is
	 *  what keeps them agreeing.
	 *
	 *  `scale` is omitted entirely when the toggle is off: no scale, no degrees. */
	const noteCtx = useMemo<NoteContext>(
		() => ({ conv, octaveOffset, drumMap }),
		[conv, octaveOffset, drumMap],
	);
	// The clip exporter reads these inside a worker callback; a ref keeps that
	// callback from having to be rebuilt (and the worker restarted) on every edit.
	const exportRef = useRef({ bars, text: "" });
	exportRef.current.bars = bars;

	useEffect(() => {
		// The [js] side pushes `clip_available 0/1` (polled once a second).
		bindInlet(IN.clip_available, (avail) => {
			setClipAvailable(Number(avail) === 1);
		});
		bindInlet(IN.build, (stamp) => setAmxdBuild(String(stamp).split(" ")[0]));
		// Scale updates from Max are ignored in drum device
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

	// The note-count readout while typing: local, instant, bare-mini only. The
	// engine is what actually renders the clip (toMidi below).
	const { noteCount, errors, capped } = useMemo(() => {
		const r = renderPattern(text, { bars, ...noteCtx });
		return { noteCount: r.notes.length, errors: r.errors, capped: r.capped };
	}, [text, bars, noteCtx]);

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
			const barsRead = Math.max(1, Math.round(loopEnd / BEATS_PER_BAR));
			const mini = eventsToMini(raw, { bars: barsRead, grid, conv, octaveOffset });
			setText(mini);
			setStatus(`Read ${n} notes → ${barsRead} bar(s) (Structure is flattened)`);
		});
		bindInlet(IN.read_error, () => {
			setStatus("No clip found on this track - create or play a MIDI clip first");
		});
	}, [grid, conv, octaveOffset]);

	/**
	 * To Clip. The pattern is rendered by the Strudel engine, not by the local
	 * mini parser, so everything Strudel can do - .transpose(), .scale(), .arp(),
	 * .jux(), full JS chains - exports to MIDI exactly as it plays. The engine
	 * also measures the pattern's true loop length, so `<a b>` writes both cycles
	 * instead of being cut off after the first.
	 */
	const toMidi = useCallback(() => {
		if (isBareMini(text) && errors.length > 0) {
			setStatus(`Parse error at ${errors[0].pos}: ${errors[0].msg}`);
			return;
		}
		exportRef.current.text = text;
		workerRef.current?.postMessage({
			t: "export",
			code: text,
			ctx: noteCtx,
			bars,
		});
		setStatus("Rendering the pattern…");
	}, [text, noteCtx, bars, errors]);

	const fromMidi = useCallback(() => {
		outlet(OUT.read_notes);
		setStatus("Reading the playing/first clip on this track…");
	}, []);

	// The playhead. The worker posts a cycle position ~20x a second; the AST is
	// parsed once per edit, and only the (cheap) schedule lookup runs per frame.
	const [phase, setPhase] = useState(-1);
	const playAst = useMemo(() => parseForPlayhead(text), [text]);
	const warning = useMemo(() => {
		if (capped) return "Pattern loop length exceeds MAX_CYCLES (64). Export will be truncated.";
		return null;
	}, [capped]);
	const playing = useMemo<Span[]>(
		() => (playAst && phase >= 0 ? activeSpans(playAst, phase) : []),
		[playAst, phase],
	);

	const setDrumMap = useCallback((m: DrumMap) => {
		setDrumMapState(m);
		saveDrumMap(m);
	}, []);

	const resetDrumMap = useCallback(() => {
		setDrumMapState({ ...DEFAULT_DRUM_MAP });
		saveDrumMap({ ...DEFAULT_DRUM_MAP });
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
			} else if (m.t === "clip") {
				// Cycles -> beats. One cycle is `bars` bars, which is the only thing
				// the UI gets to decide about the clip's shape.
				const beatsPerCycle = exportRef.current.bars * BEATS_PER_BAR;
				const notes: NoteEvent[] = m.notes.map((n) => ({
					pitch: n.pitch,
					velocity: n.velocity,
					start: n.start * beatsPerCycle,
					duration: n.duration * beatsPerCycle,
				}));
				const lengthBeats = m.cycles * beatsPerCycle;
				outlet(OUT.write_clip, ...toFlatList(notes, lengthBeats));
				setStatus(
					`Wrote ${notes.length} notes over ${lengthBeats} beats (${m.cycles} cycle${m.cycles === 1 ? "" : "s"})`,
				);
			} else if (m.t === "exporterr") {
				setStatus(`Cannot export: ${m.message}`);
			} else if (m.t === "phase") {
				setPhase(m.cycle);
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

	/**
	 * Re-evaluate, keeping the transport where it is. The worker swaps the pattern
	 * object and leaves its clock alone, so the new pattern is picked up at the
	 * point in the cycle we are already at - it does not restart from zero. That is
	 * what makes Ctrl+Enter feel like strudel.cc, and it is also what lets the
	 * effect below re-evaluate on a scale change without a stutter.
	 */
	const run = useCallback(() => {
		// Refuse a bare pattern that does not parse. The rewrite resolves the tokens
		// it DID understand and leaves the rest, which turns a typo into a pattern
		// that plays something else entirely - "bd!4" once became "36!67", 67 kicks
		// a cycle. A red error the user can ignore is not enough; do not run it.
		if (!isBareMini(text) || errors.length === 0) {
			workerRef.current?.postMessage({ t: "code", code: text, ctx: noteCtx });
			setLive(true);
			setPlayParam(true);
			return;
		}
		setStatus(`Parse error at ${errors[0].pos}: ${errors[0].msg}`);
	}, [text, noteCtx, errors, setPlayParam]);

	// Live 12's scale (and the octave/shift/kit controls) must reach a pattern that
	// is ALREADY PLAYING. They are baked into the code the worker compiled, so a
	// change to any of them means recompiling - otherwise the pattern keeps playing
	// in the key it was started in until the user stops and starts again.
	//
	// `text` is deliberately NOT a dependency: re-evaluating on every keystroke is
	// not what a live coder wants (that is what Ctrl+Enter is for), so the current
	// text is read from a ref.
	const textRef = useRef(text);
	textRef.current = text;
	const firstEval = useRef(true);
	useEffect(() => {
		if (firstEval.current) {
			firstEval.current = false;
			return;
		}
		if (!live) return;
		workerRef.current?.postMessage({
			t: "code",
			code: textRef.current,
			ctx: noteCtx,
		});
	}, [noteCtx, live]);

	const hush = useCallback(() => {
		workerRef.current?.postMessage({ t: "hush" });
		setLive(false);
		setPlayParam(false);
	}, [setPlayParam]);

	useEffect(() => {
		if (playParam && !live) run();
		else if (!playParam && live) hush();
	}, [playParam, live, run, hush]);

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
		warning,
		playing,
		drumMap,
		setDrumMap,
		resetDrumMap,
		live,
		evalError,
		run,
		hush,
		debug,
		amxdBuild,
	};
}

