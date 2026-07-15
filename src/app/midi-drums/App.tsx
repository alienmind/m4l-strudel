import { useState } from "react";
import { Drum, FolderOpen, Play, Square, ChevronLeft, Maximize2, RotateCcw } from "lucide-react";
import { useWindow } from "@m4l-jweb/surface/react";
import { isBareMini } from "@/lib/strudelCode";
import surface from "./surface";
import { DrumRack } from "./DrumRack";
import { PatternEditor } from "../shared/PatternEditor";
import { AboutPanel } from "../shared/AboutPanel";
import { ClipPanel } from "../shared/ClipPanel";
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
	const editorWindow = useWindow(surface, "editor");
	const [showDrums, setShowDrums] = useState(false);
	// The bottom-left note of the mini rack's 16-pad window (C1 = 36, like Live).
	const [drumBase, setDrumBase] = useState(36);
	const [showAbout, setShowAbout] = useState(false);
	const [showClip, setShowClip] = useState(false);
	
	// Full Strudel code is real JavaScript: the local parser errors and note
	// counter only apply to bare mini-notation. Both dialects export to a clip -
	// the Strudel engine renders it either way.
	const codeMode = !isBareMini(s.text);

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

	if (showDrums) {
		return (
			<div className="device flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
				<div className="flex items-center gap-2 leading-none pb-1 mb-1 border-b border-input">
					<button 
						onClick={() => setShowDrums(false)} 
						className="flex items-center justify-center p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
						title="Back to Sequencer"
					>
						<ChevronLeft className="size-4" />
					</button>
					<span className="text-xs font-semibold tracking-tight">Drum Rack</span>
					<div className="ml-auto flex items-center gap-1">
						<button
							onClick={s.resetDrumMap}
							className="flex items-center gap-1 rounded p-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
							title="Back to the General MIDI defaults"
						>
							<RotateCcw className="size-3" />
							Reset
						</button>
						<button
							onClick={() => editorWindow.open()}
							className="flex items-center gap-1 rounded p-0.5 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
							title="Open the drum rack in a larger floating window (C1 to C6)"
						>
							<Maximize2 className="size-3" />
							Expand
						</button>
					</div>
				</div>
				<DrumRack
					map={s.drumMap}
					onChange={s.setDrumMap}
					lowNote={drumBase}
					highNote={drumBase + 15}
					stripe={{ base: drumBase, setBase: setDrumBase, pageSize: 16 }}
				/>
			</div>
		);
	}

	return (
		<div className="device flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center justify-between leading-none bg-input/20 px-1 py-0.5 rounded">
				<button 
					onClick={() => setShowAbout(true)}
					className="text-xs font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer"
				>
					Strudel MIDI Drums
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
				</div>
			</div>

			<PatternEditor
				value={s.text}
				onChange={s.setText}
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
				<button
					onClick={() => setShowDrums(true)}
					className="flex items-center justify-center gap-1 rounded-md bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground hover:brightness-110"
					title="Map drum words (bd, sd, hh) onto Drum Rack pads"
				>
					<Drum className="size-3.5" />
					Kit
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
					<span>{codeMode ? "code" : `${s.noteCount} notes`}</span>
				</span>
				
				<span className="truncate text-[10px] text-muted-foreground">{s.status}</span>
				<span className="shrink-0 font-mono text-[9px] text-muted-foreground/70">{s.debug}</span>
			</div>
		</div>
	);
}
