import { ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStrudel } from "@/hooks/useStrudel";

export default function App() {
	const s = useStrudel();

	return (
		<div className="flex h-full w-full flex-col gap-2 bg-background p-2 text-foreground">
			<div className="flex items-center justify-between">
				<span className="text-xs font-semibold tracking-tight">Strudel MIDI</span>
				<span className="text-[10px] text-muted-foreground">
					{s.noteCount} notes
				</span>
			</div>

			<textarea
				value={s.text}
				onChange={(e) => s.setText(e.target.value)}
				spellCheck={false}
				className={cn(
					"min-h-16 flex-1 resize-none rounded-md bg-input/40 p-2 font-mono text-sm outline-none",
					s.errors.length > 0 && "ring-1 ring-destructive",
				)}
				placeholder='c5 [e5 g5]*2 ~ <a5 b5>'
			/>

			{s.errors.length > 0 && (
				<span className="text-[10px] text-destructive">
					{s.errors[0].msg} (at {s.errors[0].pos})
				</span>
			)}

			{/* Controls */}
			<div className="flex flex-wrap items-center gap-2 text-[11px]">
				<label className="flex items-center gap-1">
					Bars
					<input
						type="number"
						min={1}
						max={8}
						value={s.bars}
						onChange={(e) => s.setBars(Math.max(1, Math.min(8, Number(e.target.value))))}
						className="w-10 rounded bg-input/50 px-1 py-0.5"
					/>
				</label>
				<label className="flex items-center gap-1">
					Grid
					<select
						value={s.grid}
						onChange={(e) => s.setGrid(Number(e.target.value))}
						className="rounded bg-input/50 px-1 py-0.5"
					>
						<option value={8}>8</option>
						<option value={16}>16</option>
						<option value={32}>32</option>
					</select>
				</label>
				<label className="flex items-center gap-1">
					Octave
					<select
						value={s.conv}
						onChange={(e) => s.setConv(e.target.value as "strudel" | "scientific")}
						className="rounded bg-input/50 px-1 py-0.5"
					>
						<option value="strudel">Strudel (c5=60)</option>
						<option value="scientific">Scientific (c4=60)</option>
					</select>
				</label>
				<label className="flex items-center gap-1">
					Shift
					<input
						type="number"
						min={-4}
						max={4}
						value={s.octaveOffset}
						onChange={(e) => s.setOctaveOffset(Number(e.target.value))}
						className="w-10 rounded bg-input/50 px-1 py-0.5"
					/>
				</label>
			</div>

			{/* Actions */}
			<div className="flex items-center gap-2">
				<button
					className="flex flex-1 items-center justify-center gap-1 rounded-md bg-accent px-2 py-1.5 text-sm font-semibold text-accent-foreground hover:brightness-110"
					onClick={s.toMidi}
					title="Write the pattern as a MIDI clip on this track"
				>
					<ArrowDownToLine className="size-3.5" />
					To Clip
				</button>
				<button
					className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1.5 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40"
					onClick={s.fromMidi}
					disabled={!s.clipAvailable}
					title={
						s.clipAvailable
							? "Read the playing (or first) clip on this track into mini-notation"
							: "No clip on this track - create one first (e.g. with To Clip)"
					}
				>
					<ArrowUpFromLine className="size-3.5" />
					From Clip
				</button>
			</div>

			<span className="truncate text-[10px] text-muted-foreground">{s.status}</span>
		</div>
	);
}
