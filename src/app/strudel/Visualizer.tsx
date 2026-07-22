import { useEffect, useRef, useState } from "react";
import { bindInlet } from "@m4l-jweb/bridge";

/**
 * What the device is playing, drawn from the Studio's level.
 *
 * WHY A LEVEL AND NOT A WAVEFORM. `[jweb~]` is "Web browser with audio output" -
 * one control inlet, no signal inlet - so no page can be handed audio. The Studio
 * makes the sound in its own Chromium context, and the only thing that crosses is
 * what the patcher measures: a `[peakamp~]` on the window's outlets, arriving as
 * `level_repl <l> <r>` a few dozen times a second.
 *
 * So this is a scrolling peak trail rather than an oscilloscope, and it is the
 * honest thing to draw at that rate. It exists to answer the question a device
 * with its Studio window shut cannot otherwise answer: is this thing playing, and
 * what is it doing.
 */
export function Visualizer({ windowId = "repl" }: { windowId?: string }) {
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const history = useRef<number[]>([]);
	const level = useRef<[number, number]>([0, 0]);
	const [silent, setSilent] = useState(true);

	useEffect(() => {
		bindInlet(`level_${windowId}`, (l: unknown, r: unknown) => {
			level.current = [Number(l) || 0, Number(r) || 0];
		});
	}, [windowId]);

	useEffect(() => {
		let raf = 0;
		let quiet = 0;

		const draw = () => {
			raf = requestAnimationFrame(draw);
			const canvas = canvasRef.current;
			if (!canvas) return;

			// The device view is a fixed size but the page is not told what it is, so
			// the backing store follows the element rather than a constant.
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			if (canvas.width !== w || canvas.height !== h) {
				canvas.width = w;
				canvas.height = h;
			}

			const [l, r] = level.current;
			const peak = Math.max(l, r);
			// One column per frame at the display's rate, so the trace advances at a
			// steady speed and a few seconds of sound fill the view - the reading a
			// scope gives you. The feed arrives faster than this (10 ms), so no
			// transient is missed between columns; it is peak-held, not sampled.
			history.current.push(peak);
			if (history.current.length > w) history.current.splice(0, history.current.length - w);

			// A few seconds of silence is worth SAYING, because the alternative is a
			// flat line that looks identical to a broken feed.
			quiet = peak > 0.001 ? 0 : quiet + 1;
			setSilent(quiet > 120);

			const ctx = canvas.getContext("2d");
			if (!ctx) return;
			ctx.clearRect(0, 0, w, h);

			const style = getComputedStyle(canvas);
			ctx.strokeStyle = style.getPropertyValue("color") || "#7dd3fc";
			ctx.lineWidth = 1;

			// The trace, mirrored around the middle so it reads like a scope: filled
			// body for the amplitude, a bright edge on top of it.
			const mid = h / 2;
			const trace = history.current;
			ctx.globalAlpha = 0.35;
			ctx.beginPath();
			for (let x = 0; x < trace.length; x++) {
				const v = Math.min(1, trace[x]) * (h / 2 - 1);
				ctx.moveTo(x + 0.5, mid - v);
				ctx.lineTo(x + 0.5, mid + v);
			}
			ctx.stroke();

			ctx.globalAlpha = 1;
			ctx.beginPath();
			for (let x = 0; x < trace.length; x++) {
				const v = Math.min(1, trace[x]) * (h / 2 - 1);
				if (x === 0) ctx.moveTo(x + 0.5, mid - v);
				else ctx.lineTo(x + 0.5, mid - v);
			}
			ctx.stroke();

			// The zero line, so silence is a line and not an absence.
			ctx.globalAlpha = 0.25;
			ctx.beginPath();
			ctx.moveTo(0, mid + 0.5);
			ctx.lineTo(w, mid + 0.5);
			ctx.stroke();
			ctx.globalAlpha = 1;

			// The instantaneous pair, as two bars on the right: L over R.
			const barW = 3;
			ctx.fillStyle = ctx.strokeStyle;
			ctx.fillRect(w - barW * 2 - 2, h - Math.min(1, l) * h, barW, Math.min(1, l) * h);
			ctx.fillRect(w - barW, h - Math.min(1, r) * h, barW, Math.min(1, r) * h);
		};

		raf = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(raf);
	}, []);

	return (
		<div className="relative h-full w-full">
			<canvas ref={canvasRef} className="h-full w-full text-primary" />
			{silent && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
					silent - press Play, or evaluate a pattern in the Studio
				</div>
			)}
		</div>
	);
}
