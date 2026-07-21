import { useEffect, useState } from "react";
import { Download, FolderOpen, Play, Square, SlidersHorizontal } from "lucide-react";
import { outlet } from "@m4l-jweb/bridge";
import { useNativePanel, useParam, useStateSync, useWindow } from "@m4l-jweb/surface/react";
import { PatternEditor } from "../shared/PatternEditor";
import { AboutPanel } from "../shared/AboutPanel";
import { Button } from "../shared/Button";
import { HelpButton } from "../shared/HelpButton";
import { SliderRow } from "../shared/SliderRow";
import { tokenAtCaret } from "@/lib/reference";
import { useSuperdoughRender } from "./useSuperdoughRender";
import surface from "./surface";

/**
 * Strudel Superdough - an instrument. Write ANY Strudel - multi-line `$:`, samples,
 * synths, orbits, superdough's real effects - and it becomes the track's audio: the
 * real superdough runs LIVE in this page and jweb~ routes its Web Audio output
 * straight into the track's signal path. Edits are audible immediately; there is no
 * render, no loop boundary to wait for, and a random pattern is simply random.
 *
 * EXPORT is the one place the offline renderer survives: it bounces the pattern to a
 * WAV next to the device (see useSuperdoughRender's exportAudio). The old
 * render-and-loop pipeline it descends from is parked in doc/DRAWER_OF_FAILED_IDEAS.md.
 *
 * Same 169px budget as every device: header (14) + editor (flex) + notice rows +
 * bottom status row.
 */
export default function App() {
	const s = useSuperdoughRender();
	const [showAbout, setShowAbout] = useState(false);

	// The native transport panel behind the view switch - the MIDI device's mechanism.
	const [showTransport, setShowTransport] = useParam(surface, "transport");
	const applyPanel = useNativePanel(surface);
	useEffect(() => {
		applyPanel(showTransport ? "native" : "web");
	}, [showTransport, applyPanel]);

	const helpWindow = useWindow(surface, "help");
	const [, setHelpQuery] = useStateSync(surface, "helpQuery");
	const studioWindow = useWindow(surface, "studio");
	const strudelWindow = useWindow(surface, "strudel");

	if (showAbout) {
		// RENDER HEALTH, debug-only
		const phase = s.status.phase === "idle" && !s.live ? "Ready - Run plays the pattern" : s.status.message;
		const debug =
			`${phase}\n` +
			`${s.status.phase}` +
			` / ${s.beatsPerCycle} beat${s.beatsPerCycle === 1 ? "" : "s"}/cyc` +
			` / bpm ${Math.round(s.tempo)} / ${s.playing ? "play" : "stop"} @ ${s.beats.toFixed(1)}`;
		return (
			<AboutPanel
				amxdBuild={s.amxdBuild}
				onOpenStudio={studioWindow.open}
				onOpenStrudel={strudelWindow.open}
				onShowControls={() => {
					setShowTransport(true);
					setShowAbout(false);
				}}
				onClose={() => setShowAbout(false)}
				debug={debug}
			/>
		);
	}

	const error = s.status.phase === "error" ? s.status.message : null;

	return (
		<div className="device flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center gap-1 text-[11px]">
				<button
					onClick={() => setShowAbout(true)}
					className="shrink-0 text-xs font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer"
				>
					Strudel Superdough
				</button>
				<Button
					className="ml-auto"
					icon={s.live ? Square : Play}
					active={s.live}
					onClick={s.live ? s.hush : s.run}
					title={s.live ? "Stop the pattern" : "Run the pattern (Ctrl+Enter)"}
				/>
				<Button
					icon={Download}
					onClick={s.exportAudio}
					disabled={s.exporting}
					active={s.exporting}
					title="Export: render this pattern to a WAV next to the device, then drag it into a track"
				/>
				<Button
					icon={SlidersHorizontal}
					onClick={() => setShowTransport(true)}
					title="Controls: the native panel with the mappable Play/Stop and the eight slider knobs (S1..S8). Its Back switch returns."
				/>
				<HelpButton onOpen={helpWindow.open} />
			</div>

			<PatternEditor
				value={s.text}
				onChange={s.setText}
				onCaret={(caret) => setHelpQuery(tokenAtCaret(s.text, caret))}
				onRun={s.run}
				spans={[]}
				invalid={Boolean(error)}
			/>

			{error && <span className="truncate text-[10px] leading-none text-destructive">{error}</span>}

			{/* Every slider() in the pattern, live, on a native knob (S1..S8). */}
			<SliderRow sliders={s.sliders} />

			{s.exportNote && (
				<div className="flex items-center gap-2">
					<span className="flex-1 truncate text-[10px] leading-none text-muted-foreground" title={s.exportNote}>
						{s.exportNote}
					</span>
					{/* Only once something has been written - the folder may not exist before
					    the first Export, and revealing nothing is worse than no button. */}
					<Button
						icon={FolderOpen}
						onClick={() => outlet("reveal_folder")}
						title="Show the device folder in Finder/Explorer"
					/>
				</div>
			)}

			{s.samplesNote && !error && !s.exportNote && (
				<span className="truncate text-[10px] leading-none text-amber-500" title={s.samplesNote}>
					{s.samplesNote}
				</span>
			)}
		</div>
	);
}
