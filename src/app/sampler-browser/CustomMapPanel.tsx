import { useState } from "react";
import { ChevronLeft } from "lucide-react";

/**
 * The "custom sample map" screen - a SECONDARY SCREEN, the pattern this repo uses
 * everywhere a device needs more than its ~169 px view holds (AboutPanel, ClipPanel,
 * DrumMapPanel). The device view is a single component that early-returns one of these
 * full-height panels; each has a back chevron in the top-left that returns to the main
 * screen, exactly as this one does.
 *
 * It replaces an inline text box that never worked well: a free-text URL sitting next to
 * two presets was ambiguous (which one is live?), and there was nowhere to put a "load
 * this" that did not also mean "reload the preset". Here the intent is unmistakable -
 * paste a link, Load, or Cancel back out.
 */
export function CustomMapPanel({
	initial,
	onLoad,
	onClose,
}: {
	/** Whatever URL was last active, so re-opening the screen does not lose it. */
	initial: string;
	onLoad: (url: string) => void;
	onClose: () => void;
}) {
	const [url, setUrl] = useState(initial);
	const trimmed = url.trim();

	const submit = () => {
		if (trimmed) onLoad(trimmed);
	};

	return (
		<div className="device flex h-full w-full flex-col gap-1 overflow-hidden bg-background p-1.5 text-foreground">
			<div className="mb-2 flex items-center gap-2 border-b border-input pb-1 leading-none">
				<button
					onClick={onClose}
					className="flex items-center justify-center rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
					title="Back"
				>
					<ChevronLeft className="size-4" />
				</button>
				<span className="text-xs font-semibold tracking-tight">Custom sample map</span>
			</div>

			<div className="flex flex-1 flex-col justify-center gap-2 px-2">
				<label className="text-[11px] text-muted-foreground">
					Paste a Strudel sample map:
					<input
						autoFocus
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") submit();
							if (e.key === "Escape") onClose();
						}}
						placeholder="github:user/repo   or   shabda:query   or   https://.../strudel.json"
						className="mt-1 w-full rounded bg-input/40 px-1.5 py-1 font-mono text-[11px] outline-none"
					/>
				</label>
				<p className="text-[10px] text-muted-foreground">
					A <span className="font-mono">github:</span> repo with a{" "}
					<span className="font-mono">strudel.json</span>, a <span className="font-mono">shabda:</span>{" "}
					search, or a direct URL to one.
				</p>
			</div>

			<div className="flex items-center justify-end gap-1 text-[11px]">
				<button
					onClick={onClose}
					className="rounded-md bg-input/50 px-2 py-1 font-semibold hover:brightness-110"
				>
					Cancel
				</button>
				<button
					onClick={submit}
					disabled={!trimmed}
					className="rounded-md bg-primary px-2 py-1 font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-40"
				>
					Load
				</button>
			</div>
		</div>
	);
}
