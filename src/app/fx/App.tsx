import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { uiReady } from "@m4l-jweb/bridge";
import { useParam } from "@m4l-jweb/surface/react";
import { cn } from "@/lib/utils";
import { parseFxChain, formatFxChain, unsupportedMessage, type FxParams } from "@/lib/fx";
import surface from "./surface";
import { AddEffectPanel } from "./AddEffectPanel";
import { AboutPanel } from "../shared/AboutPanel";

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
	const [text, setText] = useState("");
	const [isFocused, setIsFocused] = useState(false);
	const [showAdd, setShowAdd] = useState(false);
	const [showAbout, setShowAbout] = useState(false);
	
	const [cutoff, setCutoff] = useParam(surface, "cutoff");
	const [drive, setDrive] = useParam(surface, "drive");
	const [delay, setDelay] = useParam(surface, "delay");
	const [delaytime, setDelaytime] = useParam(surface, "delaytime");
	const [delayfeedback, setDelayfeedback] = useParam(surface, "delayfeedback");
	const [room, setRoom] = useParam(surface, "room");
	const [gain, setGain] = useParam(surface, "gain");

	useEffect(() => {
		uiReady();
	}, []);

	const fx = useMemo(() => parseFxChain(text), [text]);

	// Auto-sync text expression when physical knobs or sliders are moved
	useEffect(() => {
		if (isFocused) return;
		const currentText = formatFxChain({ cutoff, drive, delay, delaytime, delayfeedback, room, gain }, fx.used);
		if (currentText !== text) {
			setText(currentText);
		}
	}, [cutoff, drive, delay, delaytime, delayfeedback, room, gain, isFocused, fx.used, text]);

	/** Apply the line: write the real Live parameters. */
	const apply = () => {
		if (fx.error) return;
		setCutoff(fx.params.cutoff);
		setDrive(fx.params.drive);
		setDelay(fx.params.delay);
		setDelaytime(fx.params.delaytime);
		setDelayfeedback(fx.params.delayfeedback);
		setRoom(fx.params.room);
		setGain(fx.params.gain);
	};

	const note = fx.error ?? (fx.unsupported.length ? unsupportedMessage(fx.unsupported) : null);

	const allParams: (keyof FxParams)[] = ["cutoff", "drive", "delay", "delaytime", "delayfeedback", "room", "gain"];
	const unusedParams = allParams.filter(p => !fx.used.includes(p));

	if (showAdd) {
		return (
			<AddEffectPanel 
				unused={unusedParams} 
				onClose={() => setShowAdd(false)} 
				onSelect={(param) => {
					setShowAdd(false);
					const currentVals = { cutoff, drive, delay, delaytime, delayfeedback, room, gain };
					setText(formatFxChain(currentVals, [...fx.used, param]));
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
				<button 
					onClick={() => setShowAbout(true)}
					className="text-xs font-semibold tracking-tight hover:text-primary transition-colors cursor-pointer text-left"
				>
					Strudel Audio FX
				</button>
				<span className="text-[10px] text-muted-foreground">audio effect</span>
			</div>

			<div className="flex items-center gap-1">
				<input
					value={text}
					onChange={(e) => setText(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onBlur={() => {
						setIsFocused(false);
						// When blurring, force an update from current state so formatting is normalized
						setText(formatFxChain({ cutoff, drive, delay, delaytime, delayfeedback, room, gain }, fx.used));
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							apply();
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
				<span className={cn("truncate text-[10px] leading-none", fx.error ? "text-destructive" : "text-amber-500")} title={note}>
					{note}
				</span>
			)}

			{/* The live parameters, as Live sees them. Not a copy of the text above:
			    these follow automation and Push too. */}
			<div className="mt-auto grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] leading-none">
				{fx.used.length === 0 ? (
					<div className="col-span-2 text-center text-muted-foreground py-2 text-xs">
						Type an effect or use (+) to add one.
					</div>
				) : (
					fx.used.map(param => {
						const value = { cutoff, drive, delay, delaytime, delayfeedback, room, gain }[param];
						const setters: Record<keyof typeof surface.params, (v: number) => void> = { 
							cutoff: setCutoff, drive: setDrive, delay: setDelay, delaytime: setDelaytime, 
							delayfeedback: setDelayfeedback, room: setRoom, gain: setGain 
						};
						const setter = setters[param];
						return <ParamSlider key={param} param={param} value={value} setter={setter} />;
					})
				)}
			</div>
		</div>
	);
}

function ParamSlider({ param, value, setter }: { param: keyof typeof surface.params; value: number; setter: (v: number) => void }) {
	const def = surface.params[param];
	const [min, max] = def.range;
	const exp = def.exponent ?? 1;

	// Calculate a 0-1 linear position from the value
	const normValue = Math.max(0, Math.min(1, (value - min) / (max - min)));
	const linearPos = Math.pow(normValue, 1 / exp);
	
	// Map 0-1000 integer to range for the HTML slider
	const sliderVal = Math.round(linearPos * 1000);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newPos = Number(e.target.value) / 1000;
		const newValue = min + Math.pow(newPos, exp) * (max - min);
		setter(newValue);
	};

	return (
		<div className="flex flex-col gap-1 rounded bg-input/40 px-1.5 py-1">
			<div className="flex items-center justify-between">
				<span className="text-muted-foreground">{def.short ?? param}</span>
				<span className="font-mono">{def.format ? def.format(value) : value.toFixed(2)}</span>
			</div>
			<input 
				type="range" 
				min="0" 
				max="1000" 
				value={sliderVal} 
				onChange={handleChange}
				className="w-full accent-primary h-1 bg-background/50 rounded-lg appearance-none cursor-pointer"
			/>
		</div>
	);
}
