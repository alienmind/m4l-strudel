import { ArrowDownToLine, ArrowUpFromLine, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { isBareMini } from "@/lib/strudelCode";
import { useStrudel } from "./useStrudel";

/**
 * Strudel MIDI - a MIDI effect. Sits on a MIDI track, before an instrument,
 * and streams live MIDI generated from a Strudel pattern.
 *
 * Live's device view is a FIXED ~169px tall - every row here is budgeted.
 * Layout: header (14) + editor (flex, min 48) + controls (22) + one button
 * row (30) + footer (14) + gaps/padding ~= 160px. Never add a row without
 * removing one.
 */
export default function App() {
	const s = useStrudel();
	// Full Strudel code is for the live engine only; the clip converter (and
	// its parser errors / note counter) apply to bare mini-notation.
	const codeMode = !isBareMini(s.text);

	return (
		<div className="device flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center justify-between leading-none">
				<span className="text-xs font-semibold tracking-tight">
					Strudel MIDI
					<span
						className={cn(
							"ml-1 font-normal",
							s.amxdBuild !== "?" && s.amxdBuild !== __APP_VERSION__
								? "text-destructive"
								: "text-muted-foreground/60",
						)}
						title="ui version / amxd wrapper version - a mismatch means a mixed or stale install"
					>
						ui {__APP_VERSION__} / amxd {s.amxdBuild}
					</span>
				</span>
				<span className="text-[10px] text-muted-foreground">{codeMode ? "code" : `${s.noteCount} notes`}</span>
			</div>

			<textarea
				value={s.text}
				onChange={(e) => s.setText(e.target.value)}
				spellCheck={false}
				className={cn(
					"min-h-12 flex-1 resize-none rounded-md bg-input/40 p-1.5 font-mono text-sm outline-none",
					(s.evalError || (!codeMode && s.errors.length > 0)) && "ring-1 ring-destructive",
				)}
				placeholder='note("c3 e3 g3 b3").midichan(1)'
			/>

			{(s.evalError || (!codeMode && s.errors.length > 0)) && (
				<span className="truncate text-[10px] leading-none text-destructive">
					{s.evalError ?? `${s.errors[0].msg} (at ${s.errors[0].pos})`}
				</span>
			)}

			{/* Clip-converter controls */}
			<div className="flex flex-wrap items-center gap-1.5 text-[10px] leading-none">
				<label className="flex items-center gap-1">
					Bars
					<input
						type="number"
						min={1}
						max={8}
						value={s.bars}
						onChange={(e) => s.setBars(Math.max(1, Math.min(8, Number(e.target.value))))}
						className="w-9 rounded bg-input/50 px-1 py-0.5"
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
						className="w-9 rounded bg-input/50 px-1 py-0.5"
					/>
				</label>
			</div>

			{/* Single action row: live eval + clip I/O */}
			<div className="flex items-center gap-1.5">
				{s.live ? (
					<button
						className="flex flex-1 items-center justify-center gap-1 rounded-md bg-destructive px-2 py-1 text-sm font-semibold text-destructive-foreground hover:brightness-110"
						onClick={s.hush}
						title="Stop the running pattern"
					>
						<Square className="size-3.5" />
						Hush
					</button>
				) : (
					<button
						className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground hover:brightness-110"
						onClick={s.run}
						title="Evaluate and run this pattern, locked to Live's transport"
					>
						<Play className="size-3.5" />
						Run
					</button>
				)}
				<button
					className="flex items-center justify-center gap-1 rounded-md bg-accent px-2 py-1 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-40"
					onClick={s.toMidi}
					disabled={codeMode}
					title={
						codeMode
							? "The clip converter needs bare mini-notation (e.g. c5 [e5 g5]*2) - full Strudel code is Run-only"
							: "Write the pattern as a MIDI clip on this track"
					}
				>
					<ArrowDownToLine className="size-3.5" />
					To Clip
				</button>
				<button
					className="flex items-center justify-center gap-1 rounded-md bg-accent px-2 py-1 text-sm font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-40"
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

			<div className="flex items-center justify-between gap-2 leading-none">
				<span className="truncate text-[10px] text-muted-foreground">{s.status}</span>
				<span className="shrink-0 font-mono text-[9px] text-muted-foreground/70">{s.debug}</span>
			</div>
		</div>
	);
}
