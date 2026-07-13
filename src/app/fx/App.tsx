import { useEffect, useMemo, useState } from "react";
import { uiReady } from "@m4l-jweb/bridge";
import { useParam } from "@m4l-jweb/surface/react";
import { cn } from "@/lib/utils";
import { parseFxChain, unsupportedMessage } from "@/lib/fx";
import surface from "./surface";

/**
 * Strudel Audio FX - an audio effect. Sits anywhere in an audio chain and applies
 * a Strudel effects line to whatever is already coming into the track.
 *
 * The whole interface is ONE LINE plus a readout of what it did. There is no
 * pattern editor, no Bars/Grid/Octave, no To Clip - none of the MIDI device's UI
 * belongs here, because this device sequences nothing.
 *
 * The readouts are LIVE PARAMETERS, not app state: turn the Cutoff dial in Live,
 * automate it, or move a Push encoder, and these numbers follow. Type in the line
 * and the dial, the automation lane and the filter all follow instead. One
 * control, several faces - which is what useParam() buys.
 *
 * Live's device view is a FIXED ~169px tall. Every row here is budgeted.
 */
export default function App() {
	const [text, setText] = useState(".lpf(2000).gain(1)");
	const [cutoff, setCutoff] = useParam(surface, "cutoff");
	const [gain, setGain] = useParam(surface, "gain");

	useEffect(() => {
		uiReady();
	}, []);

	const fx = useMemo(() => parseFxChain(text), [text]);

	/** Apply the line: write the real Live parameters. */
	const apply = () => {
		if (fx.error) return;
		setCutoff(fx.params.cutoff);
		setGain(fx.params.gain);
	};

	const note = fx.error ?? (fx.unsupported.length ? unsupportedMessage(fx.unsupported) : null);

	return (
		<div className="device flex h-full w-full flex-col gap-1.5 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center justify-between leading-none">
				<span className="text-xs font-semibold tracking-tight">
					Strudel Audio FX
					<span className="ml-1 font-normal text-muted-foreground/60">ui {__APP_VERSION__}</span>
				</span>
				<span className="text-[10px] text-muted-foreground">audio effect</span>
			</div>

			<input
				value={text}
				onChange={(e) => setText(e.target.value)}
				onKeyDown={(e) => {
					// Ctrl/Cmd+Enter applies, like the MIDI device's editor. Plain Enter
					// too: this is one line, so there is nothing else Enter could mean.
					if (e.key === "Enter") {
						e.preventDefault();
						apply();
					}
				}}
				spellCheck={false}
				placeholder=".lpf(800).gain(1.2)"
				className={cn(
					"rounded-md bg-input/40 p-1.5 font-mono text-sm outline-none",
					fx.error && "ring-1 ring-destructive",
				)}
			/>

			{note && (
				<span className={cn("truncate text-[10px] leading-none", fx.error ? "text-destructive" : "text-amber-500")} title={note}>
					{note}
				</span>
			)}

			<button
				onClick={apply}
				disabled={Boolean(fx.error)}
				className="rounded-md bg-primary px-2 py-1 text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40"
				title="Write these values to the device's Live parameters (Enter)"
			>
				Apply
			</button>

			{/* The live parameters, as Live sees them. Not a copy of the text above:
			    these follow automation and Push too. */}
			<div className="mt-auto grid grid-cols-2 gap-1.5 text-[10px] leading-none">
				<Readout label="Cutoff" value={surface.params.cutoff.format!(cutoff)} />
				<Readout label="Gain" value={surface.params.gain.format!(gain)} />
			</div>
		</div>
	);
}

function Readout({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between rounded bg-input/40 px-1.5 py-1">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-mono">{value}</span>
		</div>
	);
}
