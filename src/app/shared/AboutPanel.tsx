import { ChevronLeft, ExternalLink } from "lucide-react";
import { Button } from "./Button";

export function AboutPanel({
	amxdBuild,
	onOpenStrudel,
	onClose,
	debug,
}: {
	amxdBuild: string;
	/** Opens the Full Studio - a bigger editor for the same pattern. An ADVANCED feature,
	 *  so it lives here rather than cluttering every device's top bar. Omitted (undefined)
	 *  on devices that have no studio window (FX, the sample browser), which hide the row. */
	/** Reveals the device's NATIVE controls panel (the mappable play/stop, or knobs),
	 *  hiding the web UI - the native "Back" switch in that panel returns. Advanced, so it
	 *  lives here. Omitted on devices with no native panel (FX keeps its own Knobs button in
	 *  the top bar, where it is the primary interaction). */
	/** Opens strudel.cc in a floating window - the full web playground, beside the Full
	 *  Studio. Present on the pattern devices; omitted elsewhere. */
	onOpenStrudel?: () => void;
	onClose: () => void;
	/** Debug-only render/transport readout (superdough). Shown in a small mono block so it
	 *  is available when needed but out of the way of the device view. */
	debug?: string;
}) {
	return (
		<div className="flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center gap-2 border-b border-input pb-1 mb-2 leading-none">
				<button
					onClick={onClose}
					className="flex items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
					title="Back"
				>
					<ChevronLeft className="size-4" />
				</button>
				<span className="text-xs font-semibold tracking-tight">About this device</span>
			</div>
			
			{/* Scroll, top-aligned: the device view is ~169px and the Advanced section (Full
			    Studio / Controls) sits below the version box - centering + overflow-hidden used
			    to push it off the bottom, so it looked like the Studio button had vanished. */}
			<div className="flex flex-col flex-1 items-center justify-start gap-3 overflow-y-auto text-center px-4">
				<div>
					<h1 className="text-base font-bold text-foreground">m4l-strudel</h1>
					<a 
						href="https://github.com/alienmind/m4l-strudel" 
						target="_blank" 
						rel="noreferrer"
						className="text-xs text-primary hover:underline block mt-1"
					>
						github.com/alienmind/m4l-strudel
					</a>
				</div>
				
				<div className="flex flex-col gap-1 text-[10px] text-muted-foreground bg-input/20 rounded p-2 border border-input w-full max-w-[200px]">
					<div className="flex justify-between">
						<span>UI Version:</span>
						<span className="font-mono text-foreground">{__APP_VERSION__}</span>
					</div>
					<div className="flex justify-between">
						<span>AMXD Build:</span>
						<span className="font-mono text-foreground">{amxdBuild}</span>
					</div>
					{amxdBuild !== "?" && amxdBuild !== __APP_VERSION__ && (
						<div className="text-destructive mt-1 font-semibold">
							Version mismatch (stale install)
						</div>
					)}
				</div>

				{onOpenStrudel && (
					<div className="flex w-full max-w-[220px] flex-col gap-1">
						<span className="text-[9px] uppercase tracking-wide text-muted-foreground/70">Advanced</span>
						<div className="flex flex-wrap justify-center gap-1">
							<Button icon={ExternalLink} onClick={onOpenStrudel} title="Open strudel.cc">
								Take me to Strudel.cc
							</Button>
						</div>
					</div>
				)}

				{debug && (
					<div className="w-full max-w-[220px] whitespace-pre-wrap break-words rounded border border-input bg-input/20 p-2 text-left font-mono text-[9px] leading-tight text-muted-foreground">
						{debug}
					</div>
				)}

				<div className="text-[10px] text-muted-foreground mt-2 pb-2">
					Copyright Alienmind, 2026
				</div>
			</div>
		</div>
	);
}
