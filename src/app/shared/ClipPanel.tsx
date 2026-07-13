import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft } from "lucide-react";

export function ClipPanel({
	bars,
	setBars,
	grid,
	setGrid,
	toMidi,
	fromMidi,
	clipAvailable,
	onClose,
}: {
	bars: number;
	setBars: (v: number) => void;
	grid: number;
	setGrid: (v: number) => void;
	toMidi: () => void;
	fromMidi: () => void;
	clipAvailable: boolean;
	onClose: () => void;
}) {
	return (
		<div className="flex h-full w-full flex-col gap-2 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center gap-2 border-b border-input pb-1 mb-1 leading-none">
				<button
					onClick={onClose}
					className="flex items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
					title="Back"
				>
					<ChevronLeft className="size-4" />
				</button>
				<span className="text-xs font-semibold tracking-tight">Clip Import/Export</span>
			</div>
			
			<div className="flex-1 px-1 py-1 flex flex-col gap-4">
				<div className="flex flex-col gap-2 bg-input/20 rounded p-2 border border-input">
					<div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Configuration</div>
					<div className="flex gap-4 items-center text-[11px]">
						<label className="flex items-center gap-1.5">
							<span>Bars</span>
							<input
								type="number"
								min={1}
								max={8}
								value={bars}
								onChange={(e) => setBars(Math.max(1, Math.min(8, Number(e.target.value))))}
								className="w-10 rounded bg-input/50 px-1.5 py-0.5"
								title="Length of the exported clip (applies only to Save to Clip)"
							/>
						</label>
						<label className="flex items-center gap-1.5">
							<span>Grid</span>
							<select
								value={grid}
								onChange={(e) => setGrid(Number(e.target.value))}
								className="rounded bg-input/50 px-1.5 py-0.5"
								title="Quantization for importing notes (applies only to Load from Clip)"
							>
								<option value={8}>8</option>
								<option value={16}>16</option>
								<option value={32}>32</option>
							</select>
						</label>
					</div>
				</div>

				<div className="grid grid-cols-2 gap-2 mt-auto">
					<button
						className="flex items-center justify-center gap-2 rounded-md bg-accent px-2 py-2 text-xs font-semibold text-accent-foreground hover:brightness-110"
						onClick={toMidi}
						title="Write the pattern as a MIDI clip on this track"
					>
						<ArrowDownToLine className="size-3.5" />
						Save to Clip
					</button>
					<button
						className="flex items-center justify-center gap-2 rounded-md bg-accent px-2 py-2 text-xs font-semibold text-accent-foreground hover:brightness-110 disabled:opacity-40"
						onClick={fromMidi}
						disabled={!clipAvailable}
						title={
							clipAvailable
								? "Read the playing (or first) clip on this track into mini-notation"
								: "No clip on this track"
						}
					>
						<ArrowUpFromLine className="size-3.5" />
						Load from Clip
					</button>
				</div>
			</div>
		</div>
	);
}
