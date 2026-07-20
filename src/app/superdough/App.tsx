import { useEffect, useState } from "react";
import { Play, Square, SlidersHorizontal } from "lucide-react";
import { useNativePanel, useParam, useStateSync, useWindow } from "@m4l-jweb/surface/react";
import { PatternEditor } from "../shared/PatternEditor";
import { AboutPanel } from "../shared/AboutPanel";
import { Button } from "../shared/Button";
import { HelpButton } from "../shared/HelpButton";
import { tokenAtCaret } from "@/lib/reference";
import { useSuperdoughRender } from "./useSuperdoughRender";
import surface from "./surface";

/**
 * Strudel Superdough - an instrument. Write ANY Strudel - multi-line `$:`, samples,
 * synths, orbits, superdough's real effects - and it becomes the track's audio: the
 * pattern is rendered OFFLINE with the real superdough into a WAV, and Max loops it
 * locked to Live's transport, crossfading to each fresh render at the loop boundary.
 *
 * What that buys and costs is said in the UI, not hidden: edits become audible at the
 * next loop boundary (render-ahead latency), and a random pattern cannot be honestly
 * looped - it drops to rolling mode, one realization per cycle, with a visible notice.
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
					title={
						s.live
							? "Stop pattern"
							: "Run this pattern natively with Jweb audio"
					}
				>
					{s.live ? "Stop" : "Run"}
				</Button>
				<Button
					icon={SlidersHorizontal}
					onClick={() => setShowTransport(true)}
					title="Show the native controls panel - the mappable Play/Stop and the eight slider knobs (S1..S8). The native Back switch returns."
				>
					Controls
				</Button>
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

			{s.samplesNote && !error && (
				<span className="truncate text-[10px] leading-none text-amber-500" title={s.samplesNote}>
					{s.samplesNote}
				</span>
			)}
		</div>
	);
}
