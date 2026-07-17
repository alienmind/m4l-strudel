import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { uiReady } from "@m4l-jweb/bridge";
import { useNativePanel, useParam, useStateSync, useWindow } from "@m4l-jweb/surface/react";
import { HelpButton } from "../shared/HelpButton";
import { tokenAtCaret } from "@/lib/reference";
import { cn } from "@/lib/utils";
import {
	formatFxChain,
	NEUTRAL,
	parseFxChain,
	RACK,
	unsupportedMessage,
	type FxParam,
	type FxParams,
} from "@/lib/fx";
import surface from "./surface";
import { AddEffectPanel } from "./AddEffectPanel";
import { AboutPanel } from "../shared/AboutPanel";

/**
 * Strudel Audio FX - an audio effect. Sits anywhere in an audio chain and applies
 * a Strudel effects line to whatever audio is already coming into the track.
 *
 * The whole interface is ONE LINE plus the sliders for whatever that line names.
 * There is no pattern editor, no Bars/Grid/Octave, no To Clip - none of the MIDI
 * device's UI belongs here, because this device sequences nothing.
 *
 * THE PARAMETERS ARE THE TRUTH, and the line is a VIEW OF THEM. This is the whole
 * design of the screen, and getting it the other way round is what makes these
 * devices misbehave: if the text box were also authoritative, then a Push encoder,
 * an automation lane and a keystroke would each be writing a value the other two
 * would immediately overwrite. So:
 *
 *   - the dials/automation/Push write the parameters, and the line REDRAWS from
 *     them, always, for free - there is no sync to run and nothing to keep in step;
 *   - typing edits a DRAFT, which is the user's alone until they commit it with
 *     Enter (or leave the box). Committing writes the parameters; the draft is then
 *     dropped and the line goes back to being a view.
 *
 * It works because format and parse are exact inverses over quantized values (see
 * lib/fx.ts): the line a slider redraws is the same line that would set it.
 *
 * Live's device view is a FIXED ~169px tall. Every row here is budgeted.
 */
export default function App() {
	/** Non-null only while the user is editing. Their text, nobody else's. */
	const [draft, setDraft] = useState<string | null>(null);
	const [showAdd, setShowAdd] = useState(false);
	const [showAbout, setShowAbout] = useState(false);
	const helpWindow = useWindow(surface, "help");
	// The floating reference follows the caret: type `.del` here and the window narrows
	// to `.delay`. It is a different Chromium context, so a state slot is the only way to
	// tell it what you are typing about.
	const [, setHelpQuery] = useStateSync(surface, "helpQuery");
	const trackCaret = (value: string, caret: number) => setHelpQuery(tokenAtCaret(value, caret));

	// The view switch: on = native knob panel, off = this web UI. A native toggle,
	// so it stays visible in the panel as the way back.
	const [knobs, setKnobs] = useParam(surface, "knobs");

	const [cutoff, setCutoff] = useParam(surface, "cutoff");
	const [hpfreq, setHpfreq] = useParam(surface, "hpfreq");
	const [drive, setDrive] = useParam(surface, "drive");
	const [crush, setCrush] = useParam(surface, "crush");
	const [delay, setDelay] = useParam(surface, "delay");
	const [delaytime, setDelaytime] = useParam(surface, "delaytime");
	const [delayfeedback, setDelayfeedback] = useParam(surface, "delayfeedback");
	const [room, setRoom] = useParam(surface, "room");
	const [gain, setGain] = useParam(surface, "gain");

	const params: FxParams = useMemo(
		() => ({ cutoff, hpfreq, drive, crush, delay, delaytime, delayfeedback, room, gain }),
		[cutoff, hpfreq, drive, crush, delay, delaytime, delayfeedback, room, gain],
	);
	const setters: Record<FxParam, (v: number) => void> = {
		cutoff: setCutoff,
		hpfreq: setHpfreq,
		drive: setDrive,
		crush: setCrush,
		delay: setDelay,
		delaytime: setDelaytime,
		delayfeedback: setDelayfeedback,
		room: setRoom,
		gain: setGain,
	};

	/** The stages on screen: the ones the committed line named, plus any a knob or
	 *  an automation lane has moved off neutral - those are audible, so they show.
	 *
	 *  Persisted in the Live set (surface.ts), because it is the only part of the line
	 *  the parameters cannot reconstruct: a stage sitting at its neutral value was
	 *  either typed on purpose or never touched, and Live has no way to tell. */
	const [namedState, setNamed] = useStateSync(surface, "named");
	// This slot came back `{}` on EVERY load, and it was written off as the
	// state-default seeding gap. It was not: a Max [dict] is a key/value map and cannot
	// hold a top-level ARRAY, so `named` never persisted at all - the write had nowhere
	// to land. Fixed upstream (every value now travels in an envelope; see the state
	// store in @m4l-jweb/surface).
	//
	// The coercion stays, because the black screen it prevents is worse than the line
	// it costs: `named.includes(...)` throws a few ms after mount on anything that is
	// not an array, and React unmounts the whole device.
	const named = useMemo(() => (Array.isArray(namedState) ? namedState : []), [namedState]);
	const shown = useMemo(
		() => RACK.map((s) => s.param).filter((p) => named.includes(p) || params[p] !== NEUTRAL[p]),
		[named, params],
	);

	useEffect(() => {
		uiReady();
	}, []);

	// THE TWO SCREENS. Runtime reflow/resize of native objects does not work in a
	// frozen M4L device (measured) - only hide/show does - so instead of packing
	// dials we LAYER two views and flip between them: the web UI, or the native knob
	// panel with every dial. `knobs` (a native toggle) drives it and stays visible in
	// both, as the way back from the panel.
	const applyPanel = useNativePanel(surface);
	useEffect(() => {
		applyPanel(knobs ? "native" : "web");
	}, [knobs, applyPanel]);

	const text = draft ?? formatFxChain(params, named);
	const fx = useMemo(() => parseFxChain(text), [text]);

	/** Commit the draft: the line becomes the parameters, and stops being the truth. */
	const commit = () => {
		if (draft === null) return;
		const parsed = parseFxChain(draft);
		if (parsed.error) return; // stay in the draft, with the error showing
		for (const { param } of RACK) setters[param](parsed.params[param]);
		setNamed(parsed.used);
		setDraft(null);
	};

	const note = fx.error ?? (fx.unsupported.length ? unsupportedMessage(fx.unsupported) : null);
	const unusedParams = RACK.map((s) => s.param).filter((p) => !shown.includes(p));

	if (showAdd) {
		return (
			<AddEffectPanel
				unused={unusedParams}
				onClose={() => setShowAdd(false)}
				onSelect={(param) => {
					setShowAdd(false);
					// Added at its neutral value: putting a stage on screen must not change
					// the sound until its slider is moved.
					setNamed([...named, param]);
					setDraft(null);
				}}
			/>
		);
	}

	if (showAbout) {
		return <AboutPanel amxdBuild={__APP_VERSION__} onClose={() => setShowAbout(false)} />;
	}

	return (
		<div className="device flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center justify-between leading-none">
				<div className="flex items-baseline gap-1.5">
					<button
						onClick={() => setShowAbout(true)}
						className="text-xs font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer text-left"
					>
						Strudel Audio FX
					</button>
					<span className="text-[10px] text-muted-foreground">audio effect</span>
					<HelpButton onOpen={helpWindow.open} />
				</div>
				{/* Top-right, over the native "knobs" switch (surface.ts pins it to the
				    same spot) so the control stays put when the views flip. Clicking it
				    hides this web UI and shows the native knob panel; the native toggle
				    there flips back. */}
				<button
					onClick={() => setKnobs(true)}
					className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground hover:brightness-110"
					title="Show the native knob panel"
				>
					Knobs
				</button>
			</div>

			<div className="flex items-center gap-1">
				<input
					value={text}
					onChange={(e) => {
						setDraft(e.target.value);
						trackCaret(e.target.value, e.target.selectionStart ?? 0);
					}}
					// Every way the caret moves without the text changing.
					onKeyUp={(e) => trackCaret(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
					onClick={(e) => trackCaret(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
					onSelect={(e) => trackCaret(e.currentTarget.value, e.currentTarget.selectionStart ?? 0)}
					onBlur={commit}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							commit();
							e.currentTarget.blur();
						}
						// Abandon the edit: the line snaps back to what the parameters say.
						if (e.key === "Escape") {
							setDraft(null);
							e.currentTarget.blur();
						}
					}}
					spellCheck={false}
					placeholder="ie: .lpf(800).gain(1.2)"
					className={cn(
						"flex-1 rounded-md bg-input/40 p-1.5 font-mono text-sm outline-none w-0",
						fx.error && "ring-1 ring-destructive",
					)}
				/>
				<button
					onClick={() => setShowAdd(true)}
					disabled={unusedParams.length === 0}
					className="flex items-center justify-center rounded-md bg-accent p-1.5 text-accent-foreground hover:brightness-110 disabled:opacity-40"
					title="Add another effect to the chain"
				>
					<Plus className="size-4" />
				</button>
			</div>

			{note && (
				<span
					className={cn(
						"truncate text-[10px] leading-none",
						fx.error ? "text-destructive" : "text-amber-500",
					)}
					title={note}
				>
					{note}
				</span>
			)}

			{/* No HTML sliders here any more: the seven parameters render as native
			    live.dial objects in the device view (surface.ts `layout.native`),
			    beside this [jweb]. They follow automation and Push, and a dial turn
			    still reaches the app - so the line above redraws from them, for free.
			    An empty line is the only hint the user needs. */}
			{shown.length === 0 && (
				<div className="mt-auto text-center text-muted-foreground py-2 text-xs">
					Turn a dial, type an effect, or use (+) to add one.
				</div>
			)}
		</div>
	);
}
