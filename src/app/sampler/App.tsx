import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, Play, Search, Square } from "lucide-react";
import { bindInlet, fetchToFile, loadSample, onNote, outlet, playVoice, uiReady } from "@m4l-jweb/bridge";
import { cn } from "@/lib/utils";
import { padNoteName } from "../midi-drums/DrumRack";
import {
	isPlayable,
	loadSampleMap,
	localPath,
	variationUrl,
	withDeadline,
	type Sound,
} from "@/lib/samples";
import { PRESET_MAPS } from "../sample-browser/banks";
import { AboutPanel } from "../shared/AboutPanel";
import { PatternEditor } from "../shared/PatternEditor";
import { useStrudelEngine, type VoiceEvent } from "../shared/useStrudelEngine";
import surface, { INITIAL_TEXT } from "./surface";
import { IN, OUT } from "./protocol";

/**
 * The eight pads, as the manifest names them. The name is what loadSample() targets
 * ([buffer~ ...pad1]); the INDEX is what playVoice() names ([poly~]'s keymap is
 * 0-based). Both are this array's order, so they never drift apart.
 */
const SLOTS = ["pad1", "pad2", "pad3", "pad4", "pad5", "pad6", "pad7", "pad8"] as const;

/** Live's Drum Rack starts at C1 = MIDI 36 (bottom-left). Pad i is note 36 + i, so an
 *  external note 36..43 played into the track strikes pad 0..7 - the same map a stock
 *  Drum Rack uses, which is why a `bd ~ sd ~` pattern from the MIDI device lands right. */
const PAD_BASE = 36;

/** How the four-wide grid is drawn: BOTTOM-UP like Live's rack. Bottom row is the low
 *  notes (36..39), the row above it the next four (40..43). Top-to-bottom for rendering. */
const PAD_ROWS: number[][] = [
	[4, 5, 6, 7],
	[0, 1, 2, 3],
];

/** The `s()` tokens a fresh kit answers to, one per pad. `s("bd sd, hh*8")` - the opening
 *  pattern - names bd, sd and hh, so the default kit already has somewhere to send them. */
const DEFAULT_NAMES = ["bd", "sd", "hh", "oh", "cp", "rim", "lt", "mt"] as const;

interface PadState {
	/** The `s()` token that triggers this pad from the CODE screen, and the label. Defaults
	 *  from the loaded sample (`bd:3` -> `bd`); editable on the KIT screen. */
	padName: string;
	/** The sound assigned to this pad, for the label. Null until one is dropped in. */
	name: string | null;
	/** Where the sample is on disk, once fetched. */
	path: string | null;
	/** What [info~] measured. The voice HOLDS for this long, so a one-shot plays out. */
	durationMs: number | null;
	channels: number | null;
	/** A fetch/load is in flight - the pad shows it, and a strike is a no-op until done. */
	loading: boolean;
}

const emptyPad = (i: number): PadState => ({
	padName: DEFAULT_NAMES[i] ?? `pad${i + 1}`,
	name: null,
	path: null,
	durationMs: null,
	channels: null,
	loading: false,
});

/**
 * Strudel Sampler - a polyphonic drum-rack instrument, played by CODE.
 *
 * Eight pads, one dedicated sample per pad, over the `instrument` chain's [poly~]: a
 * voice names its sample by slot index and Max allocates a free voice, so overlapping
 * hits never cut each other.
 *
 * TWO SCREENS, flipped by a button (the same shape as the other devices, but both screens
 * are web UI, so it is an in-app switch, not native-panel codegen):
 *   CODE (primary) - a Strudel pattern editor. `s("bd sd, hh*8")` names the pads; the
 *     shared engine schedules each hap to playVoice() through a `voiceSink`. Commas layer
 *     (polyphony is free - one [poly~] voice per layered hap), `*`/`[]`/`<>` sequence.
 *   KIT (secondary) - the pad grid: load a sample per pad from any Strudel sample map,
 *     click-audition, edit the pad's `s()` NAME, Show folder.
 *
 * External MIDI (notes 36..43) still strikes the pads too, so the device works inside a
 * MIDI-driven Rack exactly as before, alongside its own pattern.
 */
export default function App() {
	const [view, setView] = useState<"code" | "kit">("code");
	const [pads, setPads] = useState<PadState[]>(() => SLOTS.map((_, i) => emptyPad(i)));
	/** Which pad a picked sound loads into. There is always a selection, so the browser's
	 *  click has an unambiguous destination. */
	const [selected, setSelected] = useState(0);
	/** The pads currently sounding, for a brief visual flash. A SET, not one pad:
	 *  overlapping notes light every pad they hit, not just the last (polyphony is the
	 *  whole point). Each pad clears on its own timer. */
	const [struck, setStruck] = useState<Set<number>>(() => new Set());

	const [mapUrl, setMapUrl] = useState(PRESET_MAPS[0].url);
	const [sounds, setSounds] = useState<Sound[]>([]);
	const [query, setQuery] = useState("");
	const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState("Loading...");
	const [folder, setFolder] = useState<string | null>(null);
	const [downloaded, setDownloaded] = useState(false);
	const [showAbout, setShowAbout] = useState(false);

	/** Paths already fetched this session, so re-assigning does not re-download. */
	const onDisk = useRef(new Set<string>());
	/** One flash timer PER pad, so a pad re-struck while lit restarts its own flash and
	 *  never cancels another pad's. */
	const flashTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

	/**
	 * The pads, in a ref, so the MIDI handler and the engine's voiceSink (both bound
	 * ONCE) always read the current kit rather than the snapshot they closed over. A
	 * voice that arrives after a pad is loaded, or renamed, must see that change.
	 */
	const padsRef = useRef(pads);
	padsRef.current = pads;

	const flash = useCallback((idx: number) => {
		setStruck((s) => new Set(s).add(idx));
		const existing = flashTimers.current.get(idx);
		if (existing) clearTimeout(existing);
		flashTimers.current.set(
			idx,
			setTimeout(() => {
				flashTimers.current.delete(idx);
				setStruck((s) => {
					const next = new Set(s);
					next.delete(idx);
					return next;
				});
			}, 120),
		);
	}, []);

	/** Play a loaded pad on a [poly~] voice. Shared by an incoming note, a click, and the
	 *  pattern's voiceSink. `rate` repitches (1 for a drum pad); the voice HOLDS the whole
	 *  sample so a one-shot plays out. Returns false when the pad has no sample yet. */
	const playPad = useCallback((idx: number, velocity: number, rate: number): boolean => {
		const pad = padsRef.current[idx];
		if (!pad || pad.path === null || pad.durationMs === null) return false;
		playVoice({
			slot: idx,
			rate,
			velocity,
			durationMs: pad.durationMs,
			channels: pad.channels ?? 2,
		});
		flash(idx);
		return true;
	}, [flash]);

	/**
	 * THE CODE SINK: a scheduled hap names a sample; find the pad answering to that name
	 * and play it. `gain` arrived as velocity, `speed` as rate. An unknown name is reported
	 * (once), never silent - the same "say what is missing" rule the FX adopt hint used.
	 */
	const missingRef = useRef<Set<string>>(new Set());
	const [missing, setMissing] = useState<string[]>([]);
	const voiceSink = useCallback((voice: VoiceEvent) => {
		const idx = padsRef.current.findIndex((p) => p.padName === voice.s);
		if (idx < 0 || !playPad(idx, voice.velocity, voice.rate)) {
			// No pad of that name, or one with no sample loaded: name it once.
			if (!missingRef.current.has(voice.s)) {
				missingRef.current.add(voice.s);
				setMissing([...missingRef.current]);
			}
		}
	}, [playPad]);

	const engine = useStrudelEngine({
		surface,
		initialText: INITIAL_TEXT,
		ctx: EMPTY_CTX,
		voiceSink,
	});

	// A pad loaded or renamed can satisfy a name that was missing a moment ago. Clearing on
	// the kit changing lets the report recover instead of accusing a name that now plays.
	useEffect(() => {
		if (missingRef.current.size === 0) return;
		missingRef.current.clear();
		setMissing([]);
	}, [pads]);

	useEffect(() => {
		bindInlet(IN.device_folder, (path) => setFolder(String(path)));
		// External MIDI into the instrument: pitch picks a pad, velocity carries through.
		// Bound once; it reads padsRef, so a later load is visible to an earlier binding.
		onNote((pitch, velocity) => {
			const idx = pitch - PAD_BASE;
			if (idx >= 0 && idx < SLOTS.length) playPad(idx, velocity, 1);
		});
		uiReady();
	}, [playPad]);

	/** The list on screen: the map, filtered by the search box. */
	const shown = useMemo(() => {
		const q = query.trim().toLowerCase();
		return q ? sounds.filter((s) => s.name.toLowerCase().includes(q)) : sounds;
	}, [sounds, query]);

	/** Fetch a map and show its sounds. Picking one from the dropdown loads it at once. */
	const load = useCallback(async (url: string) => {
		setMapUrl(url);
		setLoading(true);
		setSounds([]);
		setQuery("");
		setStatus(`Loading ${url}...`);
		try {
			const found = await loadSampleMap(url);
			setSounds(found);
			const playable = found.filter((s) => s.urls.some(isPlayable)).length;
			setStatus(
				playable === found.length
					? `${found.length} sounds. Pick a pad, then click a sound to load it.`
					: `${found.length} sounds - ${found.length - playable} cannot be loaded (not WAV/AIFF)`,
			);
		} catch (err) {
			setStatus(`Error: ${message(err)}`);
		} finally {
			setLoading(false);
		}
	}, []);

	// Load the default map on open. Once - the ref guards React 18's double-mount in dev.
	const booted = useRef(false);
	useEffect(() => {
		if (booted.current) return;
		booted.current = true;
		void load(PRESET_MAPS[0].url);
	}, [load]);

	/**
	 * Assign a sound to the selected pad: fetch it if new, read it into that pad's buffer,
	 * and remember what [info~] measured (the voice holds for the duration; a mono sample
	 * folds to both ears from the channel count). Loading defaults the pad's `s()` NAME
	 * from the sample (`bd:3` -> `bd`), unless the user has already typed one.
	 */
	const assign = useCallback(
		async (sound: Sound) => {
			const idx = selected;
			const slot = SLOTS[idx];
			const url = variationUrl(sound, 0);
			if (!isPlayable(url)) {
				setStatus(`Cannot load ${sound.name}: [buffer~] reads WAV/AIFF, not ${extLabel(url)}`);
				return;
			}
			const path = localPath(sound, 0, mapUrl);
			setPads((p) => p.map((pad, i) => (i === idx ? { ...pad, loading: true } : pad)));
			try {
				if (!onDisk.current.has(path)) {
					setStatus(`Fetching ${sound.name}...`);
					await withDeadline(
						fetchToFile(url, path, (done, total) =>
							setStatus(
								total > 0
									? `Fetching ${sound.name} - ${Math.round((done / total) * 100)}%`
									: `Fetching ${sound.name} - ${Math.round(done / 1024)} kB`,
							),
						),
						30_000,
						`Download of ${sound.name}`,
					);
					onDisk.current.add(path);
					setDownloaded(true);
				}
				const s = await loadSample(slot, path);
				setPads((p) =>
					p.map((pad, i) =>
						i === idx
							? {
									...pad,
									name: sound.name,
									padName: deriveName(sound.name),
									path,
									durationMs: s.durationMs,
									channels: s.channels,
									loading: false,
								}
							: pad,
					),
				);
				setStatus(
					`${deriveName(sound.name)} = ${sound.name} - ${fmtMs(s.durationMs)}, ${s.channels === 1 ? "mono" : `${s.channels} ch`}`,
				);
			} catch (err) {
				setPads((p) => p.map((pad, i) => (i === idx ? { ...pad, loading: false } : pad)));
				setStatus(`Error: ${message(err)}`);
			}
		},
		[selected, mapUrl],
	);

	const rename = useCallback((idx: number, padName: string) => {
		setPads((p) => p.map((pad, i) => (i === idx ? { ...pad, padName } : pad)));
	}, []);

	if (showAbout) {
		return <AboutPanel amxdBuild={__APP_VERSION__} onClose={() => setShowAbout(false)} />;
	}

	// The one-line note under both screens: the missing-name report outranks the engine's
	// own status, since a silent pad is the first thing to explain.
	const codeStatus =
		missing.length > 0 ? `No pad named ${missing.map((m) => `"${m}"`).join(", ")} - load or rename one on the Kit screen` : engine.status;

	return (
		<div className="device flex h-full w-full flex-col gap-1.5 bg-background p-2 text-foreground">
			<div className="flex items-center gap-1 text-[11px]">
				<button
					onClick={() => setShowAbout(true)}
					className="shrink-0 text-xs font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer"
				>
					Strudel Sampler
				</button>
				{view === "code" ? (
					<>
						{/* Run/Stop the pattern - the shared engine's transport, also the mappable Play param. */}
						<button
							onClick={() => (engine.live ? engine.hush() : engine.run())}
							className={cn(
								"ml-auto flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5",
								engine.live ? "bg-primary/30 hover:bg-primary/40" : "bg-input/50 hover:bg-input",
							)}
							title={engine.live ? "Stop the pattern" : "Run the pattern"}
						>
							{engine.live ? <Square className="size-3" /> : <Play className="size-3" />}
							{engine.live ? "Stop" : "Run"}
						</button>
						<button
							onClick={() => setView("kit")}
							className="shrink-0 rounded bg-input/50 px-1.5 py-0.5 hover:bg-input"
							title="Build the kit: load samples and name the pads"
						>
							Kit
						</button>
					</>
				) : (
					<>
						<select
							value={mapUrl}
							onChange={(e) => void load(e.target.value)}
							disabled={loading}
							className="ml-auto flex-1 rounded bg-input/50 px-1 py-0.5 disabled:opacity-60"
						>
							{PRESET_MAPS.map((p) => (
								<option key={p.url} value={p.url}>
									{p.label}
								</option>
							))}
						</select>
						<button
							onClick={() => setView("code")}
							className="shrink-0 rounded bg-input/50 px-1.5 py-0.5 hover:bg-input"
							title="Back to the code screen"
						>
							Back
						</button>
					</>
				)}
			</div>

			{view === "code" ? (
				/* THE CODE SCREEN: write an s() pattern; the engine plays the pads. */
				<div className="flex min-h-0 flex-1 flex-col gap-1.5">
					<PatternEditor
						value={engine.text}
						onChange={engine.setText}
						onRun={engine.run}
						spans={engine.playing}
						invalid={engine.evalError !== null}
					/>
					{engine.evalError && (
						<span className="shrink-0 truncate text-[10px] text-destructive" title={engine.evalError}>
							{engine.evalError}
						</span>
					)}
				</div>
			) : (
				/* THE KIT SCREEN: load a sample per pad, name it, audition it. */
				<div className="flex min-h-0 flex-1 gap-1.5">
					{/* The pads: a 4-wide grid, bottom-up like Live's Drum Rack. Click selects a
					    pad (where the next picked sound loads); a loaded pad also auditions. The
					    name field is the s() token the code screen triggers it by. */}
					<div className="grid min-h-0 shrink-0 auto-rows-min content-start gap-1">
						{PAD_ROWS.map((row, ri) => (
							<div key={ri} className="grid grid-cols-4 gap-1">
								{row.map((idx) => {
									const pad = pads[idx];
									return (
										<div
											key={idx}
											className={cn(
												"relative flex h-14 w-16 flex-col justify-between rounded-sm border p-1 transition-colors",
												struck.has(idx)
													? "border-primary bg-primary/40"
													: selected === idx
														? "border-primary bg-primary/15"
														: pad.name
															? "border-primary/40 bg-primary/10"
															: "border-input bg-input/30",
											)}
										>
											<button
												onClick={() => {
													setSelected(idx);
													if (pad.path) playPad(idx, 100, 1);
												}}
												className="flex flex-col text-left"
												title={
													pad.name
														? `${padNoteName(PAD_BASE + idx)} = ${pad.name} - click to audition`
														: `${padNoteName(PAD_BASE + idx)} (MIDI ${PAD_BASE + idx}) - select, then click a sound`
												}
											>
												<span className="pointer-events-none font-mono text-[8px] leading-none text-muted-foreground">
													{padNoteName(PAD_BASE + idx)}
												</span>
												<span
													className={cn(
														"pointer-events-none w-full truncate text-[10px] font-semibold",
														pad.loading ? "text-muted-foreground" : pad.name ? "text-foreground" : "text-muted-foreground/40",
													)}
												>
													{pad.loading ? "..." : (pad.name ?? "-")}
												</span>
											</button>
											{/* The s() name. Editable, so `s("kick")` can point at whatever loaded. */}
											<input
												value={pad.padName}
												onChange={(e) => rename(idx, e.target.value)}
												onClick={() => setSelected(idx)}
												spellCheck={false}
												className="w-full rounded-sm bg-background/60 px-1 font-mono text-[9px] leading-tight outline-none focus:bg-background"
												title="The s() token that triggers this pad from the code screen"
											/>
										</div>
									);
								})}
							</div>
						))}
					</div>

					{/* The browser: a sound loads into the SELECTED pad. */}
					<div className="flex min-h-0 flex-1 flex-col gap-1">
						<div className="flex items-center gap-1 rounded bg-input/40 px-1.5 text-[11px]">
							<Search className="size-3 shrink-0 text-muted-foreground" />
							<input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search sounds"
								className="w-full bg-transparent py-0.5 outline-none"
							/>
						</div>
						<div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-input/20">
							{sounds.length === 0 ? (
								<div className="p-2 text-[11px] text-muted-foreground">{loading ? "Loading..." : "No sounds in this map."}</div>
							) : shown.length === 0 ? (
								<div className="p-2 text-[11px] text-muted-foreground">Nothing matches "{query}".</div>
							) : (
								<table className="w-full text-[11px]">
									<tbody>
										{shown.map((sound) => {
											const playable = isPlayable(variationUrl(sound, 0));
											return (
												<tr
													key={sound.name}
													onClick={() => playable && void assign(sound)}
													className={cn(
														"cursor-pointer border-b border-input/30 last:border-0 hover:bg-input/40",
														!playable && "cursor-default opacity-40",
													)}
													title={
														playable
															? `Load into ${padNoteName(PAD_BASE + selected)}`
															: "[buffer~] reads WAV/AIFF only"
													}
												>
													<td className="px-1.5 py-1 font-mono">{sound.name}</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							)}
						</div>
					</div>
				</div>
			)}

			<div className="flex items-center gap-2">
				<span
					className={cn("flex-1 truncate text-[10px]", missing.length > 0 ? "text-amber-500" : "text-muted-foreground")}
					title={view === "code" ? codeStatus : status}
				>
					{view === "code" ? codeStatus : status}
				</span>
				{view === "kit" && (
					<button
						onClick={() => outlet(OUT.reveal_folder)}
						disabled={!downloaded || !folder}
						className="flex shrink-0 items-center gap-1 rounded bg-input/50 px-1.5 py-0.5 text-[10px] hover:brightness-110 disabled:opacity-40"
						title={downloaded ? "Show the samples folder in Finder/Explorer" : "Load a sample first"}
					>
						<FolderOpen className="size-3" />
						Show folder
					</button>
				)}
			</div>
		</div>
	);
}

/** The engine's NoteContext is empty here: pads are named by `s()`, not resolved to
 *  pitches, so there is no scale or drum map. Stable, so the engine does not recompile. */
const EMPTY_CTX = {} as const;

/** A pad's default `s()` token from a sample name: the head before any `:` variation
 *  (`bd:3` -> `bd`) and before any path, so `s("bd")` finds it. */
function deriveName(sampleName: string): string {
	return sampleName.split(/[\\/]/).pop()!.split(":")[0].trim() || sampleName;
}

function fmtMs(ms: number): string {
	return ms >= 1000 ? `${(ms / 1000).toFixed(1)} s` : `${Math.round(ms)} ms`;
}

function extLabel(url: string): string {
	const dot = url.split(/[?#]/)[0].lastIndexOf(".");
	return dot < 0 ? "that format" : url.slice(dot).split(/[?#]/)[0];
}

function message(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}
