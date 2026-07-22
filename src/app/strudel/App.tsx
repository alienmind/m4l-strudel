import { useEffect, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { useNativePanel, useParam, useStateSync, useWindow } from "@m4l-jweb/surface/react";
import { PatternEditor } from "../shared/PatternEditor";
import { AboutPanel } from "../shared/AboutPanel";
import { Button } from "../shared/Button";
import { ControlsButton, ExportButton, RunButton } from "../shared/DeviceButtons";
import { HelpButton } from "../shared/HelpButton";
import { tokenAtCaret } from "@/lib/reference";
import { FaderBank } from "./FaderBank";
import { Visualizer } from "./Visualizer";
import { useReplKnobs } from "./useReplKnobs";
import { useReplRemote } from "./useReplRemote";
import { useStrudelRender } from "./useStrudelRender";
import surface from "./surface";

/**
 * The device view's three faces. The VISUALIZER is the default because it answers
 * the question a device whose Studio window is shut cannot otherwise answer - is
 * this playing, and what is it doing.
 */
const VIEWS = [
	{ id: "visual", short: "~", title: "Visualizer: what the Studio is playing" },
	{ id: "knobs", short: "|||", title: "Controls: the pattern's faders, full size" },
	{ id: "code", short: "{}", title: "Code: a scratchpad for seeing and controlling" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];

/**
 * Strudel - THE device of this repo, and an instrument. Write ANY Strudel - multi-line `$:`, samples,
 * synths, orbits, superdough's real effects - and it becomes the track's audio: the
 * real superdough runs LIVE in this page and jweb~ routes its Web Audio output
 * straight into the track's signal path. Edits are audible immediately; there is no
 * render, no loop boundary to wait for, and a random pattern is simply random.
 *
 * EXPORT is the one place the offline renderer survives: it bounces the pattern to a
 * WAV next to the device (see useStrudelRender's exportAudio). The old
 * render-and-loop pipeline it descends from is parked in doc/DRAWER_OF_FAILED_IDEAS.md.
 *
 * Same 169px budget as every device: header (14) + editor (flex) + notice rows +
 * bottom status row.
 */
export default function App() {
	const s = useStrudelRender();
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
	/** The local strudel.cc, which owns its own engine and its own audio (item 1). */
	const replWindow = useWindow(surface, "repl");

	const [view, setView] = useState<ViewId>("visual");
	/** Once the user picks a view by hand, stop moving it under them. */
	const [viewPinned, setViewPinned] = useState(false);
	const { faders, declared } = useReplKnobs();

	// A fader appearing in the code means there is now something to GRAB, and
	// hunting for the view to grab it in is the friction this removes.
	useEffect(() => {
		if (declared && !viewPinned) setView("knobs");
	}, [declared, viewPinned]);
	// Live's transport and the eight native dials reach the DEVICE, never a floating
	// window - so the device view passes them on to the REPL's page.
	useReplRemote();

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
					Strudel
				</button>
				<RunButton className="ml-auto" live={s.live} onRun={s.run} onStop={s.hush} />
				{/* Allowed while playing: the bounce takes superdough's context over for its
				    duration, so playback goes quiet and resumes (useStrudelRender). */}
				<ExportButton onExport={s.exportAudio} busy={s.exporting} />
				{/* SPIKE 2 (doc/TODO.md item 1): the local strudel.cc in its own window,
				    playing straight into the track. Temporary placement - once it has
				    parity it REPLACES the hand-rolled Studio instead of sitting beside it. */}
				<button
					onClick={replWindow.open}
					title="Open the local strudel.cc - the full REPL, playing into this track"
					className="shrink-0 rounded px-1 text-[10px] leading-none text-muted-foreground transition-colors hover:text-primary cursor-pointer"
				>
					REPL
				</button>
				<ControlsButton
					onShow={() => setShowTransport(true)}
					title="Controls: the native panel with the mappable Play/Stop and the eight slider knobs (S1..S8). Its Back switch returns."
				/>
				<HelpButton onOpen={helpWindow.open} />
			</div>

			{/* THREE VIEWS, and a strip to pick one. The device view is 169 px tall and
			    does not scroll, so only one of them can be up at a time and the strip is
			    icons rather than tabs. */}
			<div className="flex min-h-0 flex-1 gap-1">
				<div className="flex shrink-0 flex-col gap-0.5">
					{VIEWS.map((v) => (
						<button
							key={v.id}
							onClick={() => {
								setView(v.id);
								setViewPinned(true);
							}}
							title={v.title}
							className={`rounded px-1 py-0.5 text-[9px] leading-none transition-colors cursor-pointer ${
								view === v.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"
							}`}
						>
							{v.short}
						</button>
					))}
				</div>

				<div className="min-w-0 flex-1">
					{view === "visual" && <Visualizer />}
					{view === "knobs" && <FaderBank faders={faders.length ? faders : s.sliders} />}
					{view === "code" && (
						<PatternEditor
							value={s.text}
							onChange={s.setText}
							onCaret={(caret) => setHelpQuery(tokenAtCaret(s.text, caret))}
							onRun={s.run}
							spans={[]}
							invalid={Boolean(error)}
						/>
					)}
				</div>
			</div>

			{error && <span className="truncate text-[10px] leading-none text-destructive">{error}</span>}

			{s.exportNote && (
				<div className="flex items-center gap-2">
					<span className="flex-1 truncate text-[10px] leading-none text-muted-foreground" title={s.exportNote}>
						{s.exportNote}
					</span>
					{/* Only once something has been written - the folder may not exist before
					    the first Export, and offering a path to nothing is worse than no button. */}
					<Button
						icon={ClipboardCopy}
						onClick={s.copyFolder}
						disabled={!s.folder}
						title="Copy the device folder path to the clipboard, to paste into Explorer/Finder"
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
