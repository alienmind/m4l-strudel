import { useEffect, useState } from "react";
import { outlet, uiReady } from "@m4l-jweb/bridge";

/**
 * The WINDOW page of the spike device: one oscillator, started the moment the page
 * loads, and a heartbeat that says out loud whether it is actually running.
 *
 * No button starts it. That is the point - a window the user never opens gets no
 * click, so a page that waits for one would prove nothing about the shape the
 * Studio needs. If Chromium refuses to start an AudioContext unprompted, the
 * `resume()` retry below is what recovers it, and the state readout is what tells
 * us which of the two happened.
 *
 * The heartbeat goes to the Max console (via the wrapper) as well as the page, so
 * the window can be shut and the evidence still arrives.
 */
export default function Tone() {
	const [state, setState] = useState("starting");
	const [beats, setBeats] = useState(0);

	useEffect(() => {
		const ctx = new AudioContext();
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.frequency.value = 220;
		gain.gain.value = 0.1; // quiet enough to leave running while testing
		osc.connect(gain).connect(ctx.destination);
		osc.start();

		const beat = setInterval(() => {
			// A suspended context makes no sound; ask again every second rather than
			// once at load, because the answer can change when the window opens.
			if (ctx.state !== "running") void ctx.resume();
			setState(ctx.state);
			setBeats((n) => n + 1);
			outlet("tone_state", ctx.state);
		}, 1000);

		uiReady();
		return () => {
			clearInterval(beat);
			osc.stop();
			void ctx.close();
		};
	}, []);

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-background p-4 text-foreground">
			<div className="text-lg font-semibold">220 Hz</div>
			<div className="text-sm opacity-80">AudioContext: {state}</div>
			<div className="text-xs opacity-60">beat {beats}</div>
			<div className="mt-2 text-center text-[11px] opacity-60">
				Close this window. The tone must keep playing on the track.
			</div>
		</div>
	);
}
