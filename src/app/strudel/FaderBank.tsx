import type { SliderKnob } from "../shared/useSliderKnobs";

/**
 * The pattern's controls, as vertical faders, filling the device view.
 *
 * VERTICAL and not the horizontal row that lives under the editor: this is the
 * whole view rather than a strip beside something else, and a fader you grab
 * during a take wants travel. Eight of them across 420 px is about 40 px each,
 * which is enough to hit and not enough to be precise - the native dials behind
 * the Controls button are there for precision, and they are the same parameters.
 *
 * Every fader here writes a real Live parameter, so it, the native dial, a Push
 * encoder and an automation lane are four views of one value and cannot disagree.
 */
export function FaderBank({ faders }: { faders: SliderKnob[] }) {
	if (!faders.length) {
		return (
			<div className="flex h-[80%] items-center justify-center text-center text-[10px] leading-tight text-muted-foreground">
				No controls yet. Put a <span className="mx-1 font-mono">slider()</span> or
				<span className="mx-1 font-mono">m4lKnob(1)</span> in the pattern.
			</div>
		);
	}

	return (
		// LEFT ALIGNED and column-width, not stretched across the view: the faders sit
		// under the same slots the native dials occupy in the panel, so the two read as
		// one control surface rather than two arrangements of the same eight things.
		// 80% tall leaves the row breathing room in a 169 px view.
		<div className="flex h-[80%] items-stretch justify-start gap-1 px-0.5">
			{faders.map((f) => (
				<label
					key={f.knob}
					className="flex w-11 min-w-0 shrink-0 flex-col items-center gap-0.5"
					title={`${f.label} (${f.min}..${f.max}) - native knob S${f.knob}, so it automates and maps to Push`}
				>
					<span className="w-full truncate text-center text-[9px] leading-none text-muted-foreground">{f.label}</span>
					<input
						type="range"
						min={0}
						max={1}
						step={0.001}
						value={f.norm}
						onChange={(e) => f.set(Number(e.target.value))}
						// A range input is horizontal by nature; this is the standard way to
						// stand one on end without a custom control that would lose keyboard
						// and accessibility behaviour for free.
						className="min-h-0 flex-1 accent-primary"
						style={{ writingMode: "vertical-lr", direction: "rtl", width: "100%" }}
					/>
					<span className="w-full truncate text-center font-mono text-[9px] leading-none text-muted-foreground/70">
						{f.raw.toFixed(Math.abs(f.max - f.min) > 10 ? 0 : 2)}
					</span>
				</label>
			))}
		</div>
	);
}
