import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, Search } from "lucide-react";
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
import { PRESET_MAPS } from "../sampler-browser/banks";
import { AboutPanel } from "../shared/AboutPanel";
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

interface PadState {
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

const EMPTY_PAD: PadState = { name: null, path: null, durationMs: null, channels: null, loading: false };

/**
 * Strudel Sampler - a polyphonic drum-rack instrument.
 *
 * Eight pads, one dedicated sample per pad, played by MIDI notes coming into the
 * track. The substrate is the `instrument` chain's [poly~]: a note names its sample
 * by slot index and Max allocates a free voice, so overlapping hits never cut each
 * other - which is the whole reason this is a [poly~] and not eight [groove~]s.
 *
 * The interaction is two-sided. To BUILD the kit, pick a pad and click a sound in the
 * browser on the right; it is fetched to disk and read into that pad's buffer (the
 * same acquire-by-audition path the sample browser uses - previewing IS downloading).
 * To PLAY it, send MIDI notes 36..43 into the track, or click a loaded pad to audition
 * it. v1 responds to external MIDI only; a Strudel pattern driving the pads is a
 * later pass (doc/TODO.md).
 */
export default function App() {
	const [pads, setPads] = useState<PadState[]>(() => SLOTS.map(() => ({ ...EMPTY_PAD })));
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
	 * The pads, in a ref, so the MIDI handler (bound ONCE) always reads the current kit
	 * rather than the snapshot it closed over. A note that arrives after a pad is loaded
	 * must see that load; a stale closure would play silence.
	 */
	const padsRef = useRef(pads);
	padsRef.current = pads;

	/** Strike a pad: hand its voice to [poly~]. Shared by an incoming note and a click. */
	const strike = useCallback((idx: number, velocity: number) => {
		const pad = padsRef.current[idx];
		if (!pad || pad.path === null || pad.durationMs === null) return;
		playVoice({
			slot: idx,
			rate: 1, // a drum pad plays its sample at its own pitch - no repitching
			velocity,
			durationMs: pad.durationMs, // hold the whole sample, so a one-shot plays out
			channels: pad.channels ?? 2,
		});
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

	useEffect(() => {
		bindInlet(IN.device_folder, (path) => setFolder(String(path)));
		// External MIDI into the instrument: pitch picks a pad, velocity carries through.
		// Bound once; it reads padsRef, so a later load is visible to an earlier binding.
		onNote((pitch, velocity) => {
			const idx = pitch - PAD_BASE;
			if (idx >= 0 && idx < SLOTS.length) strike(idx, velocity);
		});
		uiReady();
	}, [strike]);

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
	 * folds to both ears from the channel count). This is also the download - there is no
	 * separate one, the same as the sample browser.
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
							? { name: sound.name, path, durationMs: s.durationMs, channels: s.channels, loading: false }
							: pad,
					),
				);
				setStatus(
					`${padNoteName(PAD_BASE + idx)} = ${sound.name} - ${fmtMs(s.durationMs)}, ${s.channels === 1 ? "mono" : `${s.channels} ch`}`,
				);
			} catch (err) {
				setPads((p) => p.map((pad, i) => (i === idx ? { ...pad, loading: false } : pad)));
				setStatus(`Error: ${message(err)}`);
			}
		},
		[selected, mapUrl],
	);

	if (showAbout) {
		return <AboutPanel amxdBuild={__APP_VERSION__} onClose={() => setShowAbout(false)} />;
	}

	return (
		<div className="device flex h-full w-full flex-col gap-1.5 bg-background p-2 text-foreground">
			<div className="flex items-center gap-1 text-[11px]">
				<button
					onClick={() => setShowAbout(true)}
					className="shrink-0 text-xs font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer"
				>
					Strudel Sampler
				</button>
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
			</div>

			<div className="flex min-h-0 flex-1 gap-1.5">
				{/* The pads: a 4-wide grid, bottom-up like Live's Drum Rack. Click selects a
				    pad (where the next picked sound loads); a loaded pad also auditions. */}
				<div className="grid min-h-0 shrink-0 auto-rows-min content-start gap-1">
					{PAD_ROWS.map((row, ri) => (
						<div key={ri} className="grid grid-cols-4 gap-1">
							{row.map((idx) => {
								const pad = pads[idx];
								return (
									<button
										key={idx}
										onClick={() => {
											setSelected(idx);
											if (pad.path) strike(idx, 100);
										}}
										className={cn(
											"relative flex h-11 w-16 flex-col justify-between rounded-sm border p-1 text-left transition-colors",
											struck.has(idx)
												? "border-primary bg-primary/40"
												: selected === idx
													? "border-primary bg-primary/15"
													: pad.name
														? "border-primary/40 bg-primary/10"
														: "border-input bg-input/30",
										)}
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

			<div className="flex items-center gap-2">
				<span className="flex-1 truncate text-[10px] text-muted-foreground" title={status}>
					{status}
				</span>
				<button
					onClick={() => outlet(OUT.reveal_folder)}
					disabled={!downloaded || !folder}
					className="flex shrink-0 items-center gap-1 rounded bg-input/50 px-1.5 py-0.5 text-[10px] hover:brightness-110 disabled:opacity-40"
					title={downloaded ? "Show the samples folder in Finder/Explorer" : "Load a sample first"}
				>
					<FolderOpen className="size-3" />
					Show folder
				</button>
			</div>
		</div>
	);
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
