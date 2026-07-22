import { useEffect, useState } from "react";
import { bindInlet, uiReady } from "@m4l-jweb/bridge";
import { useWindow } from "@m4l-jweb/surface/react";
import surface from "./surface";

/**
 * The DEVICE VIEW of the spike device: two buttons and a readout.
 *
 * It makes no sound of its own - deliberately. Everything audible comes from the
 * window's page, so anything on the track meter is the answer to spike 1 and
 * nothing else. The readout mirrors the window's heartbeat, which is how the
 * device view knows the page is alive while the window is shut.
 */
export default function App() {
	const tone = useWindow(surface, "tone");
	const [heard, setHeard] = useState("no heartbeat yet");

	useEffect(() => {
		// The window's page emits `tone_state`; the patcher tags it `window tone` and
		// the wrapper hands it back to whoever asks. Not wired for the spike - the Max
		// console is the primary evidence - but bound so the view says something if it
		// ever arrives.
		bindInlet("tone_state", (s: unknown) => setHeard(`window says: ${String(s)}`));
		uiReady();
	}, []);

	return (
		<div className="device flex h-full w-full flex-col gap-2 bg-background p-2 text-foreground">
			<div className="text-xs font-semibold tracking-tight">Spike: audio window</div>
			<div className="flex gap-2">
				<button className="rounded border border-border px-2 py-1 text-xs hover:text-primary" onClick={tone.open}>
					Open window
				</button>
				<button className="rounded border border-border px-2 py-1 text-xs hover:text-primary" onClick={tone.close}>
					Close window
				</button>
			</div>
			<div className="text-[11px] opacity-70">{heard}</div>
			<div className="text-[11px] opacity-60">
				Expect the 220 Hz tone on the track WITHOUT opening the window, and after closing it.
			</div>
		</div>
	);
}
