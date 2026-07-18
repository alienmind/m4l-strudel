import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FolderOpen, Play, Search, Square } from "lucide-react";
import { bindInlet, fetchToFile, loadSample, outlet, playVoice, uiReady } from "@m4l-jweb/bridge";
import { useStateSync } from "@m4l-jweb/surface/react";
import { cn } from "@/lib/utils";
import {
	DRUM_MACHINES_URL,
	banksOf,
	isPlayable,
	loadSampleMap,
	localPath,
	soundKey,
	soundToken,
	variationUrl,
	withDeadline,
	type Sound,
} from "@/lib/samples";
import { PRESET_MAPS } from "../sample-browser/banks";
import { AboutPanel } from "../shared/AboutPanel";
import { PatternEditor } from "../shared/PatternEditor";
import { useStrudelEngine, type VoiceEvent } from "../shared/useStrudelEngine";
import surface, { INITIAL_BANK, INITIAL_TEXT } from "./surface";
import { IN, OUT } from "./protocol";

/**
 * The instrument's buffer slots, as the manifest names them (loadSample takes the NAME,
 * playVoice takes the 0-based INDEX). Sixteen, matching the 16-voice [poly~] - a full
 * drum machine has 11-13 distinct sounds, so 8 would evict mid-pattern.
 */
const SLOT_NAMES = Array.from({ length: 16 }, (_, i) => `slot${i + 1}`);
const NSLOTS = SLOT_NAMES.length;

/** What a slot holds once its sample is read in. `lastUsed` drives LRU eviction. */
interface Loaded {
	slot: number;
	durationMs: number;
	channels: number;
	lastUsed: number;
}

/**
 * Strudel Sampler - a polyphonic, CODE-DRIVEN sampler over drum-machine BANKS.
 *
 * NOT a MIDI pad rack. It PROCESSES Strudel code: the CODE screen runs an `s(...)`
 * pattern through the shared engine, and each hap names a SOUND (`bd`, `hh`) that a
 * BANK - a tidal-drum-machine, strudel's `bank()` prefix - resolves to a real sample
 * (`RolandTR909_bd`). Samples are fetched from the same community repos the sample
 * browser uses, AUTOMATICALLY and in the background, the first time the pattern names
 * one. Sounds are keyed by NAME; there are no MIDI note numbers here.
 *
 * TWO SCREENS, flipped by a button:
 *   CODE (primary)   - the pattern editor, a bank picker, Run/Stop.
 *   BROWSE (secondary) - pick the drum-machine bank (or a free-form sample map) and
 *                        audition its sounds. This is the "what can I type" reference.
 *
 * The net-new machinery is a name -> slot allocator: up to 16 distinct sounds are
 * resident at once (one [buffer~] each), the 17th evicts the least-recently-used.
 */
export default function App() {
	const [view, setView] = useState<"code" | "browse">("code");
	/** Where a sound name resolves: a drum-machine bank, or a free-form sample map. */
	const [source, setSource] = useState<"bank" | "map">("bank");
	const [bank, setBank] = useStateSync(surface, "bank");
	const bankName = typeof bank === "string" && bank ? bank : INITIAL_BANK;

	const [mapUrl, setMapUrl] = useState(PRESET_MAPS[0].url);
	const [query, setQuery] = useState("");
	const [status, setStatus] = useState("Loading drum machines...");
	const [folder, setFolder] = useState<string | null>(null);
	const [downloaded, setDownloaded] = useState(false);
	const [showAbout, setShowAbout] = useState(false);

	/** The drum-machine catalog (one big map, keys `Machine_sound`), loaded once. */
	const [dmSounds, setDmSounds] = useState<Sound[]>([]);
	/** The free-form map's sounds, loaded when the user picks one on the Browse screen. */
	const [mapSounds, setMapSounds] = useState<Sound[]>([]);
	const [mapLoading, setMapLoading] = useState(false);

	/** Paths already fetched this session, so a re-reference does not re-download. */
	const onDisk = useRef(new Set<string>());
	/** key -> the slot it is loaded in. The occupancy source of truth. */
	const loadedRef = useRef<Map<string, Loaded>>(new Map());
	/** key -> in-flight load, so a repeated hap does not fire a second download. */
	const loadingRef = useRef<Set<string>>(new Set());
	/** slot index -> the key that owns it (reserved the moment a load starts, before the
	 *  buffer is ready, so two concurrent loads never grab the same slot). */
	const slotOwnerRef = useRef<(string | null)[]>(Array(NSLOTS).fill(null));
	/** A monotonic clock for LRU: each play/load stamps `lastUsed`. */
	const seq = useRef(0);
	/** Bumped whenever the loaded set changes, to repaint the Browse "loaded" dots. */
	const [, setLoadedTick] = useState(0);
	const bumpLoaded = useCallback(() => setLoadedTick((t) => t + 1), []);

	/** A brief visual flash per sounding key (Browse view). */
	const [struck, setStruck] = useState<Set<string>>(() => new Set());
	const flashTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	const flash = useCallback((key: string) => {
		setStruck((s) => new Set(s).add(key));
		const existing = flashTimers.current.get(key);
		if (existing) clearTimeout(existing);
		flashTimers.current.set(
			key,
			setTimeout(() => {
				flashTimers.current.delete(key);
				setStruck((s) => {
					const next = new Set(s);
					next.delete(key);
					return next;
				});
			}, 120),
		);
	}, []);

	// Everything the (bound-once) voiceSink reads lives in a ref, so a hap always sees the
	// current bank, source and catalogs rather than the snapshot it closed over.
	const dmByName = useMemo(() => new Map(dmSounds.map((s) => [s.name, s])), [dmSounds]);
	const ctxRef = useRef({ source, bankName, mapUrl, dmByName, mapSounds });
	ctxRef.current = { source, bankName, mapUrl, dmByName, mapSounds };

	/** Missing names the pattern asked for that no sample answers, reported once each. */
	const missingRef = useRef<Set<string>>(new Set());
	const [missing, setMissing] = useState<string[]>([]);
	const reportMissing = useCallback((label: string) => {
		if (missingRef.current.has(label)) return;
		missingRef.current.add(label);
		setMissing([...missingRef.current]);
	}, []);
	const clearMissing = useCallback(() => {
		if (missingRef.current.size === 0) return;
		missingRef.current.clear();
		setMissing([]);
	}, []);

	/**
	 * Resolve a hap's sound to a catalog entry: the bank prefixes it (`bd` -> `RolandTR909_bd`)
	 * unless the pattern is on a free-form map, where the name stands alone. Returns the
	 * unique cache KEY (folder + name, so two maps' `bd` do not collide), the Sound, and the
	 * catalog pseudo-URL its files download relative to. Null when nothing answers the name.
	 */
	const resolve = useCallback(
		(s: string, bankOverride: string | null): { key: string; sound: Sound; pseudo: string; label: string } | null => {
			const { source, bankName, mapUrl, dmByName, mapSounds } = ctxRef.current;
			const effBank = bankOverride ?? (source === "bank" ? bankName : null);
			if (effBank) {
				const name = soundKey(effBank, s);
				const sound = dmByName.get(name);
				if (!sound) return null;
				return { key: `${DRUM_MACHINES_URL}|${name}`, sound, pseudo: DRUM_MACHINES_URL, label: name };
			}
			const sound = mapSounds.find((x) => x.name === s);
			if (!sound) return null;
			return { key: `${mapUrl}|${s}`, sound, pseudo: mapUrl, label: s };
		},
		[],
	);

	/** Hand a loaded slot to a [poly~] voice. */
	const play = useCallback(
		(loaded: Loaded, key: string, velocity: number, rate: number) => {
			loaded.lastUsed = ++seq.current;
			playVoice({ slot: loaded.slot, rate, velocity, durationMs: loaded.durationMs, channels: loaded.channels });
			flash(key);
		},
		[flash],
	);

	/** Reserve a slot for `key`: a free one, or the least-recently-used loaded slot. Returns
	 *  -1 only when all 16 are reserved by in-flight loads (nothing evictable) - a rare
	 *  transient the caller drops. */
	const allocSlot = useCallback((key: string): number => {
		const free = slotOwnerRef.current.indexOf(null);
		if (free >= 0) {
			slotOwnerRef.current[free] = key;
			return free;
		}
		let lruKey: string | null = null;
		let lruUsed = Infinity;
		for (const [k, l] of loadedRef.current) {
			if (l.lastUsed < lruUsed) {
				lruUsed = l.lastUsed;
				lruKey = k;
			}
		}
		if (lruKey === null) return -1; // every slot is reserved mid-load
		const slot = loadedRef.current.get(lruKey)!.slot;
		loadedRef.current.delete(lruKey);
		slotOwnerRef.current[slot] = key;
		return slot;
	}, []);

	/**
	 * Make sure a sound's sample is on disk and read into a slot; return the loaded slot.
	 * Downloads on first reference (the same fetchToFile path the browser uses, to the same
	 * on-disk location). Returns null while another reference is still loading it, or on a
	 * failure the status line explains.
	 */
	const ensureLoaded = useCallback(
		async (key: string, sound: Sound, pseudo: string, n: number): Promise<Loaded | null> => {
			const already = loadedRef.current.get(key);
			if (already) return already;
			if (loadingRef.current.has(key)) return null;
			loadingRef.current.add(key);
			try {
				const url = variationUrl(sound, n);
				if (!isPlayable(url)) {
					reportMissing(`${sound.name} (not WAV/AIFF)`);
					return null;
				}
				const path = localPath(sound, n, pseudo);
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
				const slot = allocSlot(key);
				if (slot < 0) return null;
				const meta = await loadSample(SLOT_NAMES[slot], path);
				const loaded: Loaded = { slot, durationMs: meta.durationMs, channels: meta.channels, lastUsed: ++seq.current };
				loadedRef.current.set(key, loaded);
				bumpLoaded();
				setStatus(`Loaded ${sound.name}`);
				return loaded;
			} catch (err) {
				// Free the slot this key reserved, so a retry can claim it.
				const i = slotOwnerRef.current.indexOf(key);
				if (i >= 0) slotOwnerRef.current[i] = null;
				setStatus(`Error loading ${sound.name}: ${message(err)}`);
				return null;
			} finally {
				loadingRef.current.delete(key);
			}
		},
		[allocSlot, bumpLoaded, reportMissing],
	);

	/**
	 * THE CODE SINK: a scheduled hap names a sound; resolve it against the bank, play it if
	 * its sample is resident, else kick off a background load (it sounds from the next cycle).
	 * An unknown name is reported once, never silent.
	 */
	const voiceSink = useCallback(
		(voice: VoiceEvent) => {
			const r = resolve(voice.s, voice.bank);
			if (!r) {
				reportMissing(voice.bank ? `${voice.bank}:${voice.s}` : voice.s);
				return;
			}
			const loaded = loadedRef.current.get(r.key);
			if (loaded) {
				play(loaded, r.key, voice.velocity, voice.rate);
				return;
			}
			void ensureLoaded(r.key, r.sound, r.pseudo, voice.n);
		},
		[resolve, reportMissing, play, ensureLoaded],
	);

	/** Audition a sound from the Browse screen: load it if needed, then play once. */
	const audition = useCallback(
		async (sound: Sound, pseudo: string, key: string) => {
			const loaded = loadedRef.current.get(key) ?? (await ensureLoaded(key, sound, pseudo, 0));
			if (loaded) play(loaded, key, 100, 1);
		},
		[ensureLoaded, play],
	);

	const engine = useStrudelEngine({ surface, initialText: INITIAL_TEXT, ctx: EMPTY_CTX, voiceSink });

	// A bank/source/map change can satisfy a name that was missing a moment ago, and stale
	// slots keep playing the old machine - so both recover on the source changing.
	useEffect(() => {
		clearMissing();
	}, [bankName, source, mapUrl, clearMissing]);

	useEffect(() => {
		bindInlet(IN.device_folder, (path) => setFolder(String(path)));
		uiReady();
	}, []);

	// Load the drum-machine catalog once. The ref guards React 18's double-mount in dev.
	const booted = useRef(false);
	useEffect(() => {
		if (booted.current) return;
		booted.current = true;
		void (async () => {
			try {
				// The catalog's `_base` still names ritchse/tidal-drum-machines, which was
				// renamed to geikha/ and only 301-redirects. Rewrite it so the download does
				// not depend on [maxurl] following the redirect.
				const found = (await loadSampleMap(DRUM_MACHINES_URL)).map((s) => ({
					...s,
					urls: s.urls.map((u) => u.replace("/ritchse/tidal-drum-machines/", "/geikha/tidal-drum-machines/")),
				}));
				setDmSounds(found);
				setStatus(`${banksOf(found).length} drum machines. Pick a bank, write s(\"bd sd\"), Run.`);
			} catch (err) {
				setStatus(`Could not load drum machines: ${message(err)}`);
			}
		})();
	}, []);

	/** Fetch a free-form map's catalog for the Browse screen (map source). */
	const loadMap = useCallback(async (url: string) => {
		setMapUrl(url);
		setMapLoading(true);
		setMapSounds([]);
		setQuery("");
		try {
			const found = await loadSampleMap(url);
			setMapSounds(found);
			setStatus(`${found.length} sounds. s(\"name\") plays one; audition below.`);
		} catch (err) {
			setStatus(`Error: ${message(err)}`);
		} finally {
			setMapLoading(false);
		}
	}, []);

	const banks = useMemo(() => banksOf(dmSounds), [dmSounds]);

	/** The sounds of the selected bank, for the Browse grid: `bd`, `sd`, ... with the
	 *  variation count, and whether that sound is resident. */
	const bankSounds = useMemo(() => {
		const prefix = `${bankName}_`;
		return dmSounds
			.filter((s) => s.name.startsWith(prefix))
			.map((s) => ({ sound: s, token: soundToken(s.name), key: `${DRUM_MACHINES_URL}|${s.name}` }));
	}, [dmSounds, bankName]);

	/** The list shown on the map source, filtered by the search box. */
	const shownMap = useMemo(() => {
		const q = query.trim().toLowerCase();
		return q ? mapSounds.filter((s) => s.name.toLowerCase().includes(q)) : mapSounds;
	}, [mapSounds, query]);

	if (showAbout) {
		return <AboutPanel amxdBuild={__APP_VERSION__} onClose={() => setShowAbout(false)} />;
	}

	const codeStatus =
		missing.length > 0
			? `No sample for ${missing.map((m) => `"${m}"`).join(", ")} - pick a bank that has it, or check the name`
			: engine.status;

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
						{/* The active bank drives every bare s("...") in the pattern. */}
						<select
							value={bankName}
							onChange={(e) => setBank(e.target.value)}
							title="The drum machine that bare s() names play from - strudel's bank()"
							className="ml-auto max-w-[38%] rounded bg-input/50 px-1 py-0.5"
						>
							{banks.map((b) => (
								<option key={b} value={b}>
									{b}
								</option>
							))}
						</select>
						<button
							onClick={() => (engine.live ? engine.hush() : engine.run())}
							className={cn(
								"flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5",
								engine.live ? "bg-primary/30 hover:bg-primary/40" : "bg-input/50 hover:bg-input",
							)}
							title={engine.live ? "Stop the pattern" : "Run the pattern"}
						>
							{engine.live ? <Square className="size-3" /> : <Play className="size-3" />}
							{engine.live ? "Stop" : "Run"}
						</button>
						<button
							onClick={() => setView("browse")}
							className="shrink-0 rounded bg-input/50 px-1.5 py-0.5 hover:bg-input"
							title="Browse the bank's sounds, or pick a different source"
						>
							Sounds
						</button>
					</>
				) : (
					<button
						onClick={() => setView("code")}
						className="ml-auto shrink-0 rounded bg-input/50 px-1.5 py-0.5 hover:bg-input"
						title="Back to the code screen"
					>
						Back
					</button>
				)}
			</div>

			{view === "code" ? (
				/* THE CODE SCREEN: write an s() pattern; the bank resolves each sound. */
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
				/* THE BROWSE SCREEN: pick a source and audition sounds. */
				<div className="flex min-h-0 flex-1 flex-col gap-1.5">
					<div className="flex items-center gap-1 text-[11px]">
						{/* Source tabs: drum-machine banks, or a free-form sample map. */}
						<div className="flex shrink-0 overflow-hidden rounded bg-input/40">
							<button
								onClick={() => setSource("bank")}
								className={cn("px-2 py-0.5", source === "bank" ? "bg-primary/30" : "hover:bg-input")}
							>
								Drum machines
							</button>
							<button
								onClick={() => {
									setSource("map");
									if (mapSounds.length === 0 && !mapLoading) void loadMap(mapUrl);
								}}
								className={cn("px-2 py-0.5", source === "map" ? "bg-primary/30" : "hover:bg-input")}
							>
								Sample maps
							</button>
						</div>
						{source === "bank" ? (
							<select
								value={bankName}
								onChange={(e) => setBank(e.target.value)}
								className="ml-auto flex-1 rounded bg-input/50 px-1 py-0.5"
							>
								{banks.map((b) => (
									<option key={b} value={b}>
										{b}
									</option>
								))}
							</select>
						) : (
							<select
								value={mapUrl}
								onChange={(e) => void loadMap(e.target.value)}
								disabled={mapLoading}
								className="ml-auto flex-1 rounded bg-input/50 px-1 py-0.5 disabled:opacity-60"
							>
								{PRESET_MAPS.map((p) => (
									<option key={p.url} value={p.url}>
										{p.label}
									</option>
								))}
							</select>
						)}
					</div>

					{source === "bank" ? (
						/* The bank's sounds as a grid of tokens - the words you type in s("..."). */
						<div className="min-h-0 flex-1 overflow-y-auto rounded-md bg-input/20 p-1">
							<div className="grid grid-cols-4 gap-1">
								{bankSounds.map(({ sound, token, key }) => (
									<button
										key={token}
										onClick={() => void audition(sound, DRUM_MACHINES_URL, key)}
										className={cn(
											"flex h-10 flex-col items-start justify-center rounded-sm border px-1.5 transition-colors",
											struck.has(key)
												? "border-primary bg-primary/40"
												: loadedRef.current.has(key)
													? "border-primary/50 bg-primary/15"
													: "border-input bg-input/30 hover:bg-input/50",
										)}
										title={`s("${token}") - ${sound.urls.length} variation${sound.urls.length === 1 ? "" : "s"} - click to audition`}
									>
										<span className="font-mono text-[11px] font-semibold">{token}</span>
										<span className="font-mono text-[8px] text-muted-foreground">{sound.urls.length}</span>
									</button>
								))}
								{bankSounds.length === 0 && (
									<div className="col-span-4 p-2 text-[11px] text-muted-foreground">
										{dmSounds.length === 0 ? "Loading drum machines..." : "No sounds in this bank."}
									</div>
								)}
							</div>
						</div>
					) : (
						/* The free-form map: a searchable list, each row auditions. s("name") plays it. */
						<>
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
								{mapSounds.length === 0 ? (
									<div className="p-2 text-[11px] text-muted-foreground">{mapLoading ? "Loading..." : "No sounds in this map."}</div>
								) : shownMap.length === 0 ? (
									<div className="p-2 text-[11px] text-muted-foreground">Nothing matches "{query}".</div>
								) : (
									<table className="w-full text-[11px]">
										<tbody>
											{shownMap.map((sound) => {
												const playable = isPlayable(variationUrl(sound, 0));
												const key = `${mapUrl}|${sound.name}`;
												return (
													<tr
														key={sound.name}
														onClick={() => playable && void audition(sound, mapUrl, key)}
														className={cn(
															"cursor-pointer border-b border-input/30 last:border-0 hover:bg-input/40",
															struck.has(key) && "bg-primary/30",
															!playable && "cursor-default opacity-40",
														)}
														title={playable ? `s("${sound.name}") - click to audition` : "[buffer~] reads WAV/AIFF only"}
													>
														<td className="px-1.5 py-1 font-mono">{sound.name}</td>
													</tr>
												);
											})}
										</tbody>
									</table>
								)}
							</div>
						</>
					)}
				</div>
			)}

			<div className="flex items-center gap-2">
				<span
					className={cn("flex-1 truncate text-[10px]", missing.length > 0 ? "text-amber-500" : "text-muted-foreground")}
					title={view === "code" ? codeStatus : status}
				>
					{view === "code" ? codeStatus : status}
				</span>
				<button
					onClick={() => outlet(OUT.reveal_folder)}
					disabled={!downloaded || !folder}
					className="flex shrink-0 items-center gap-1 rounded bg-input/50 px-1.5 py-0.5 text-[10px] hover:brightness-110 disabled:opacity-40"
					title={downloaded ? "Show the samples folder in Finder/Explorer" : "Play or audition a sound first"}
				>
					<FolderOpen className="size-3" />
					Show folder
				</button>
			</div>
		</div>
	);
}

/** The engine's NoteContext is empty here: sounds are named by `s()`, not resolved to
 *  pitches, so there is no scale or drum map. Stable, so the engine does not recompile. */
const EMPTY_CTX = {} as const;

function message(err: unknown): string {
	return err instanceof Error ? err.message : String(err);
}
