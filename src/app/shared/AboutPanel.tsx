import { ChevronLeft, Maximize2 } from "lucide-react";
import { Button } from "./Button";

export function AboutPanel({
	amxdBuild,
	onOpenStudio,
	onClose,
}: {
	amxdBuild: string;
	/** Opens the Full Studio - a bigger editor for the same pattern. An ADVANCED feature,
	 *  so it lives here rather than cluttering every device's top bar. Omitted (undefined)
	 *  on devices that have no studio window (FX, the sample browser), which hide the row. */
	onOpenStudio?: () => void;
	onClose: () => void;
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
			
			<div className="flex flex-col flex-1 items-center justify-center gap-4 text-center px-4">
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

				{onOpenStudio && (
					<div className="flex w-full max-w-[200px] flex-col gap-1">
						<span className="text-[9px] uppercase tracking-wide text-muted-foreground/70">Advanced</span>
						<Button icon={Maximize2} onClick={onOpenStudio} title="Open the Full Studio - a bigger editor for the same pattern">
							Full Studio
						</Button>
					</div>
				)}

				<div className="text-[10px] text-muted-foreground mt-auto pb-2">
					Copyright Alienmind, 2026
				</div>
			</div>
		</div>
	);
}
