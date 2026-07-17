import { useState } from "react";
import { FolderOpen, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { isBareMini } from "@/lib/strudelCode";
import { useStateSync, useWindow } from "@m4l-jweb/surface/react";
import { PatternEditor } from "../shared/PatternEditor";
import { AboutPanel } from "../shared/AboutPanel";
import { ClipPanel } from "../shared/ClipPanel";
import { HelpButton } from "../shared/HelpButton";
import { tokenAtCaret } from "@/lib/reference";
import { scaleLabel, useStrudel } from "./useStrudel";
import surface from "./surface";

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
	// Full Strudel code is real JavaScript: the local parser errors and note
	// counter only apply to bare mini-notation. Both dialects export to a clip -
	// the Strudel engine renders it either way.
	const codeMode = !isBareMini(s.text);
	const scale = scaleLabel(s.scale);

	const [showAbout, setShowAbout] = useState(false);
	const [showClip, setShowClip] = useState(false);
	const helpWindow = useWindow(surface, "help");
	// The floating reference follows the caret. It is a different Chromium context, so a
	// state slot is the only way to tell it what you are typing about.
	const [, setHelpQuery] = useStateSync(surface, "helpQuery");
	const studioWindow = useWindow(surface, "studio");

	if (showAbout) {
		return <AboutPanel amxdBuild={s.amxdBuild} onClose={() => setShowAbout(false)} />;
	}

	if (showClip) {
		return (
			<ClipPanel
				beatsPerCycle={s.beatsPerCycle} setBeatsPerCycle={s.setBeatsPerCycle}
				bpcAuto={s.bpcAuto} resetBeatsPerCycle={s.resetBeatsPerCycle}
				beatsPerBar={s.beatsPerBar} setBeatsPerBar={s.setBeatsPerBar}
				grid={s.grid} setGrid={s.setGrid}
				toMidi={s.toMidi} fromMidi={s.fromMidi}
				clipAvailable={s.clipAvailable}
				onClose={() => setShowClip(false)}
			/>
		);
	}

	return (
		<div className="device flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center justify-between leading-none bg-input/20 px-1 py-0.5 rounded">
				<button 
					onClick={() => setShowAbout(true)}
					className="text-xs font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer"
				>
					Strudel MIDI
				</button>
				
				<div className="flex items-center gap-1.5 text-[10px] leading-none">
					<label className="flex items-center gap-1">
						<select
							value={s.conv}
							onChange={(e) => s.setConv(e.target.value as "strudel" | "scientific")}
							className="rounded bg-input/50 px-1 py-0.5 outline-none"
						>
							<option value="strudel">c5=60</option>
							<option value="scientific">c4=60</option>
						</select>
					</label>
					<label className="flex items-center gap-0.5">
						Shift
						<input
							type="number"
							min={-4}
							max={4}
							value={s.octaveOffset}
							onChange={(e) => s.setOctaveOffset(Number(e.target.value))}
							className="w-8 rounded bg-input/50 px-1 py-0.5 outline-none"
						/>
					</label>
					<label
						className="flex items-center gap-1"
						title="Read bare numbers as degrees of Live's global scale. Off: a number is a raw MIDI pitch."
					>
						<input
							type="checkbox"
							checked={s.liveScale}
							onChange={(e) => s.setLiveScale(e.target.checked)}
							className="size-3 accent-primary"
						/>
						Scale
					</label>
					{/* Room to write. The window edits the same `code` slot this view binds -
					    it does NOT run an engine, so the transport stays here. */}
					<button
						onClick={studioWindow.open}
						title="Open the Full Studio - a bigger editor for the same pattern"
						className="rounded bg-input/50 px-1 py-0.5 hover:bg-input"
					>
						Studio
					</button>
					<HelpButton onOpen={helpWindow.open} />
				</div>
			</div>

			<PatternEditor
				value={s.text}
				onChange={s.setText}
				onCaret={(caret) => setHelpQuery(tokenAtCaret(s.text, caret))}
				onRun={s.run}
				spans={s.playing}
				invalid={Boolean(s.evalError || (!codeMode && s.errors.length > 0))}
			/>

			{(s.evalError || (!codeMode && s.errors.length > 0)) && (
				<span className="truncate text-[10px] leading-none text-destructive">
					{s.evalError ?? `${s.errors[0].msg} (at ${s.errors[0].pos})`}
				</span>
			)}

			<div className="flex items-center gap-1.5">
				{s.live ? (
					<button
						className="flex flex-1 items-center justify-center gap-1 rounded-md bg-destructive px-2 py-1 text-sm font-semibold text-destructive-foreground hover:brightness-110"
						onClick={s.hush}
						title="Stop the running pattern"
					>
						<Square className="size-3.5" />
						Stop
					</button>
				) : (
					<button
						className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground hover:brightness-110"
						onClick={s.run}
						title="Evaluate and run this pattern, locked to Live's transport (Ctrl+Enter)"
					>
						<Play className="size-3.5" />
						Run
					</button>
				)}
				<button
					className="flex items-center justify-center gap-1 rounded-md bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground hover:brightness-110"
					onClick={() => setShowClip(true)}
					title="Open Clip Import/Export controls"
				>
					<FolderOpen className="size-3.5" />
					Clip
				</button>
			</div>

			{s.warning && (
				<span
					className="truncate text-[10px] leading-none text-amber-500"
					title={s.warning}
				>
					{s.warning}
				</span>
			)}

			<div className="flex items-center justify-between gap-2 leading-none">
				<span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
					<span
						className={cn(!scale.known && "text-destructive")}
						title={
							scale.known
								? "Live's global scale - bare numbers in the pattern are degrees of it"
								: `Live's scale "${s.scale.name}" is not one this device knows - degrees fall back to Major`
						}
					>
						{scale.text}
					</span>
					<span>{codeMode ? "code" : `${s.noteCount} notes`}</span>
				</span>
				
				<span className="truncate text-[10px] text-muted-foreground">{s.status}</span>
				<span className="shrink-0 font-mono text-[9px] text-muted-foreground/70">{s.debug}</span>
			</div>
		</div>
	);
}
