import { Plus, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import type { DrumMap } from "@/lib/mini/drums";

/**
 * The Drum Map editor: which word plays which pad.
 *
 * It REPLACES the editor area rather than adding a row - Live's device view is a
 * fixed ~169px and every row is already spoken for. Scrolls internally, because
 * a kit can have more pads than fit.
 */
export function DrumMapPanel({
	map,
	onChange,
	onReset,
	onClose,
}: {
	map: DrumMap;
	onChange: (m: DrumMap) => void;
	onReset: () => void;
	onClose: () => void;
}) {
	const [word, setWord] = useState("");

	const rows = Object.entries(map).sort((a, b) => a[1] - b[1]);

	const setNote = (k: string, midi: number) => {
		onChange({ ...map, [k]: Math.max(0, Math.min(127, midi)) });
	};
	const remove = (k: string) => {
		const next = { ...map };
		delete next[k];
		onChange(next);
	};
	const add = () => {
		const k = word.trim().toLowerCase();
		if (!k || map[k] !== undefined) return;
		onChange({ ...map, [k]: 36 });
		setWord("");
	};

	return (
		<div className="flex min-h-12 flex-1 flex-col gap-1 overflow-hidden rounded-md bg-input/40 p-1.5">
			<div className="flex items-center justify-between text-[10px] leading-none text-muted-foreground">
				<span>Drum Map - word → MIDI note (a Live Drum Rack starts at 36)</span>
				<button onClick={onClose} title="Back to the pattern" className="hover:text-foreground">
					<X className="size-3" />
				</button>
			</div>

			<div className="grid flex-1 grid-cols-3 content-start gap-1 overflow-y-auto text-[10px]">
				{rows.map(([k, midi]) => (
					<div key={k} className="flex items-center gap-1">
						<span className="w-8 shrink-0 truncate font-mono">{k}</span>
						<input
							type="number"
							min={0}
							max={127}
							value={midi}
							onChange={(e) => setNote(k, Number(e.target.value))}
							className="w-10 rounded bg-input/60 px-1 py-0.5"
						/>
						<button onClick={() => remove(k)} title={`Remove ${k}`} className="text-muted-foreground hover:text-destructive">
							<X className="size-2.5" />
						</button>
					</div>
				))}
			</div>

			<div className="flex items-center gap-1 text-[10px]">
				<input
					value={word}
					onChange={(e) => setWord(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && add()}
					placeholder="new word"
					className="w-16 rounded bg-input/60 px-1 py-0.5 font-mono"
				/>
				<button onClick={add} className="flex items-center gap-0.5 rounded bg-accent px-1 py-0.5 hover:brightness-110">
					<Plus className="size-2.5" />
					Add
				</button>
				<button
					onClick={onReset}
					className="ml-auto flex items-center gap-0.5 rounded bg-accent px-1 py-0.5 hover:brightness-110"
					title="Back to the General MIDI defaults"
				>
					<RotateCcw className="size-2.5" />
					Reset
				</button>
			</div>
		</div>
	);
}
