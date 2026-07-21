import type { SliderKnob } from "./useSliderKnobs";

/**
 * The web half of the knob pool: one slider per `slider()` the code declares.
 *
 * It is a VIEW of the native dial, not a second control - dragging it writes the same
 * Live parameter a Push encoder or an automation lane writes, so the two can never
 * disagree. It exists because the native dials live behind a view switch (a frozen
 * device cannot reposition objects, so the panel is a separate screen), and a value you
 * are tuning by ear should be reachable without leaving the pattern you are tuning.
 *
 * Shared by the Superdough and FX devices so the interaction is the same in both.
 */
export function SliderRow({ sliders }: { sliders: SliderKnob[] }) {
	if (!sliders.length) return null;
	return (
		<div className="no-scrollbar flex shrink-0 items-center gap-2 overflow-x-auto text-[10px] leading-none text-muted-foreground">
			{sliders.map((s, i) => (
				<label
					key={i}
					className="flex shrink-0 items-center gap-1"
					title={`${s.label}(${s.min}..${s.max}) - native knob S${s.knob}, so it automates and maps to Push`}
				>
					{s.label}
					<input
						type="range"
						min={0}
						max={1}
						step={0.001}
						value={s.norm}
						onChange={(e) => s.set(Number(e.target.value))}
						className="h-1 w-16 accent-primary"
					/>
					<span className="font-mono text-[9px] text-muted-foreground/70">
						{s.raw.toFixed(Math.abs(s.max - s.min) > 10 ? 0 : 2)}
					</span>
				</label>
			))}
		</div>
	);
}
