import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FolderOpen, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { bindInlet, outlet } from "@/lib/maxBridge";

const PITCH_CLASS_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const PRESET_MAPS = [
	{ label: "dirt-samples (Tidal default)", url: "github:tidalcycles/dirt-samples" },
	{ label: "dough-samples (Strudel default)", url: "github:felixroos/dough-samples" },
];

interface CatalogEntry {
	name: string;
	count: number;
	pitched: boolean;
}

interface RowState {
	n: number;
	progress: string | null;
	downloadedPath: string | null;
}

export default function SampleCatalog() {
	const [mapUrl, setMapUrl] = useState(PRESET_MAPS[0].url);
	const [loading, setLoading] = useState(false);
	const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
	const [rows, setRows] = useState<Record<string, RowState>>({});
	const [playing, setPlaying] = useState<string | null>(null);
	const [status, setStatus] = useState("Pick a sample map and Load.");
	const [liveRoot, setLiveRoot] = useState(0);
	const [liveScaleName, setLiveScaleName] = useState<string | null>(null);

	useEffect(() => {
		bindInlet("catalog", (b64) => {
			const entries = JSON.parse(atob(String(b64))) as CatalogEntry[];
			setCatalog(entries);
			setRows(Object.fromEntries(entries.map((e) => [e.name, { n: 0, progress: null, downloadedPath: null }])));
			setLoading(false);
			setStatus(`Loaded ${entries.length} sound(s)`);
		});
		bindInlet("downloaded", (b64) => {
			const file = atob(String(b64));
			setStatus(`Downloaded → ${file}`);
		});
		bindInlet("progress", (name, done, total) => {
			setRows((r) => ({
				...r,
				[String(name)]: { ...(r[String(name)] ?? { n: 0, downloadedPath: null }), progress: `${done}/${total}` },
			}));
		});
		bindInlet("fetcherr", (b64) => {
			setLoading(false);
			setStatus(`Error: ${atob(String(b64))}`);
		});
		// v1: informational only - Live's global key/scale, not used to filter yet.
		bindInlet("scale", (root, ...nameParts) => {
			setLiveRoot(Number(root));
			setLiveScaleName(nameParts.join(" "));
		});
	}, []);

	const load = () => {
		setLoading(true);
		setStatus(`Loading ${mapUrl}…`);
		outlet("load_map", mapUrl);
	};

	const setRowN = (name: string, n: number) => {
		setRows((r) => ({ ...r, [name]: { ...(r[name] ?? { progress: null, downloadedPath: null }), n } }));
	};

	const preview = (name: string, n: number) => {
		outlet("preview", name, n);
		setPlaying(name);
	};
	const stopPreview = () => {
		outlet("preview_stop");
		setPlaying(null);
	};

	return (
		<div className="flex h-full w-full flex-col gap-2 bg-background p-2 text-foreground">
			<div className="flex items-center justify-between">
				<span className="text-xs font-semibold tracking-tight">Strudel Samples</span>
				{liveScaleName && (
					<span className="rounded bg-input/50 px-1.5 py-0.5 text-[10px] text-muted-foreground">
						Live scale: {PITCH_CLASS_NAMES[liveRoot % 12]} {liveScaleName}
					</span>
				)}
			</div>

			<div className="flex items-center gap-1 text-[11px]">
				<select
					value={PRESET_MAPS.some((p) => p.url === mapUrl) ? mapUrl : ""}
					onChange={(e) => {
						if (e.target.value) setMapUrl(e.target.value);
					}}
					className="rounded bg-input/50 px-1 py-0.5"
				>
					{PRESET_MAPS.map((p) => (
						<option key={p.url} value={p.url}>
							{p.label}
						</option>
					))}
					<option value="">Custom…</option>
				</select>
				<input
					value={mapUrl}
					onChange={(e) => setMapUrl(e.target.value)}
					placeholder="github:user/repo or shabda:query"
					className="flex-1 rounded bg-input/40 px-1.5 py-0.5 font-mono"
				/>
				<button
					onClick={load}
					disabled={loading}
					className="rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40"
				>
					{loading ? "Loading…" : "Load"}
				</button>
			</div>

			<div className="min-h-16 flex-1 overflow-y-auto rounded-md bg-input/20">
				{catalog.length === 0 ? (
					<div className="p-2 text-[11px] text-muted-foreground">No sample map loaded yet.</div>
				) : (
					<table className="w-full text-[11px]">
						<tbody>
							{catalog.map((e) => {
								const row = rows[e.name] ?? { n: 0, progress: null, downloadedPath: null };
								return (
									<tr key={e.name} className="border-b border-input/30 last:border-0">
										<td className="px-1.5 py-1 font-mono">
											{e.name}
											{e.pitched && (
												<span className="ml-1 rounded bg-accent/40 px-1 text-[9px] text-accent-foreground">
													pitched
												</span>
											)}
										</td>
										<td className="px-1 py-1 text-muted-foreground">
											<button
												onClick={() => setRowN(e.name, (row.n - 1 + e.count) % e.count)}
												className="rounded px-0.5 hover:bg-input/50"
												title="Previous variation"
											>
												<ChevronLeft className="size-3" />
											</button>
											{row.n + 1}/{e.count}
											<button
												onClick={() => setRowN(e.name, (row.n + 1) % e.count)}
												className="rounded px-0.5 hover:bg-input/50"
												title="Next variation"
											>
												<ChevronRight className="size-3" />
											</button>
										</td>
										<td className="px-1 py-1 text-right">
											<div className="flex items-center justify-end gap-1">
												{playing === e.name ? (
													<button
														onClick={stopPreview}
														className="rounded p-1 hover:bg-input/50"
														title="Stop preview"
													>
														<Square className="size-3" />
													</button>
												) : (
													<button
														onClick={() => preview(e.name, row.n)}
														className="rounded p-1 hover:bg-input/50"
														title="Preview (synced to next beat)"
													>
														<Play className="size-3" />
													</button>
												)}
												<button
													onClick={() => outlet("download", e.name, row.n)}
													className="rounded p-1 hover:bg-input/50"
													title="Download this variation"
												>
													<Download className="size-3" />
												</button>
												<button
													onClick={() => outlet("download_all", e.name)}
													className={cn(
														"rounded px-1 py-0.5 hover:bg-input/50",
														row.progress && "text-accent-foreground",
													)}
													title="Download all variations"
												>
													{row.progress ?? "all"}
												</button>
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				)}
			</div>

			<div className="flex items-center justify-between gap-2">
				<span className="truncate text-[10px] text-muted-foreground">{status}</span>
				<button
					onClick={() => outlet("open_folder")}
					className="flex shrink-0 items-center gap-1 rounded-md bg-input/50 px-2 py-1 text-[11px] hover:brightness-110"
					title="Open the local samples folder"
				>
					<FolderOpen className="size-3" />
					Folder
				</button>
			</div>
		</div>
	);
}
