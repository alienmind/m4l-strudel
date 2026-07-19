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
		// RENDER HEALTH, debug-only: the conductor's phase and loop geometry, then the
		// transport. Instantly shows which hop is dead - stuck "saving" is the bridge, stuck
		// "loading" is buffer~, "armed" with a stopped transport is just waiting. Lives here,
		// not in the device view, since it is for debugging only.
		const phase = s.status.phase === "idle" && !s.live ? "Ready - Run renders the pattern" : s.status.message;
		const debug =
			`${phase}\n` +
			`${s.status.phase}${s.status.slot ? ` ${s.status.slot}` : ""}` +
			`${s.sliders.length > 0 ? ` / ${s.sliders.length} knob${s.sliders.length === 1 ? "" : "s"}` : ""}` +
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
							? "Stop and fade out the rendered loop"
							: "Render this pattern with superdough and loop it on the track (Ctrl+Enter)"
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

			{/* THE DETERMINISM NOTICE (acceptance G.6: what cannot be pre-rendered says so).
			    Rolling mode = a random pattern rendered one cycle ahead; each audible cycle
			    is one frozen roll of the dice, advanced at every loop boundary. */}
			{s.status.mode === "rolling" && (
				<span className="truncate text-[10px] leading-none text-amber-500">
					random pattern: rendering ahead, each loop is one realization
				</span>
			)}
			{s.samplesNote && !error && s.status.mode !== "rolling" && (
				<span className="truncate text-[10px] leading-none text-amber-500" title={s.samplesNote}>
					{s.samplesNote}
				</span>
			)}

			{/* THE SLIDERS (H.7's React zone): every slider() in the code, live. Each one
			    writes the native knob it is bound to (S1..S8 - reveal them under About >
			    Advanced > Controls to macro-map), and a drag re-renders at the next boundary. */}
			{s.sliders.length > 0 && (
				<div className="flex items-center gap-2 overflow-x-auto text-[10px] leading-none text-muted-foreground">
					{s.sliders.map((sl, i) => (
						<label
							key={i}
							className="flex shrink-0 items-center gap-1"
							title={`slider(${sl.min}..${sl.max}) - bound to native knob S${i + 1} (macro-mappable via About > Advanced > Controls)`}
						>
							{sl.label}
							<input
								type="range"
								min={0}
								max={1}
								step={0.001}
								value={sl.norm}
								onChange={(e) => sl.set(Number(e.target.value))}
								className="h-1 w-16 accent-primary"
							/>
							<span className="font-mono text-[9px] text-muted-foreground/70">
								{sl.raw.toFixed(Math.abs(sl.max - sl.min) > 10 ? 0 : 2)}
							</span>
						</label>
					))}
				</div>
			)}

		</div>
	);
}
