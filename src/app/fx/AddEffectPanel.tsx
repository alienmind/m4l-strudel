import { ChevronLeft } from "lucide-react";
import type { FxParam } from "@/lib/fx";
import surface from "./surface";

export function AddEffectPanel({
	unused,
	onSelect,
	onClose,
}: {
	unused: FxParam[];
	onSelect: (param: FxParam) => void;
	onClose: () => void;
}) {
	return (
		<div className="flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="flex items-center gap-2 border-b border-input pb-1 mb-1 leading-none">
				<button
					onClick={onClose}
					className="flex items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
					title="Back to FX Editor"
				>
					<ChevronLeft className="size-4" />
				</button>
				<span className="text-xs font-semibold tracking-tight">Add Effect</span>
			</div>
			<div className="flex-1 overflow-y-auto pr-1">
				{unused.length === 0 ? (
					<div className="text-center text-[10px] text-muted-foreground mt-4">
						All available effects are already in the chain.
					</div>
				) : (
					<div className="grid grid-cols-2 gap-1.5">
						{unused.map((param) => {
							const def = surface.params[param];
							return (
								<button
									key={param}
									onClick={() => onSelect(param)}
									className="flex items-center justify-between rounded bg-input/40 px-2 py-1.5 text-left text-[10px] hover:bg-primary/20"
								>
									<span className="font-semibold">{def.short ?? param}</span>
								</button>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
}
