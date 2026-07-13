import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { Span } from "@/lib/mini/playhead";

/**
 * The pattern editor, with the sounding step highlighted - the thing strudel.cc
 * does that makes a running pattern legible.
 *
 * A <textarea> cannot style a range of its own text, so this is the usual two-layer
 * trick: an invisible-text copy of the pattern sits BEHIND a transparent-background
 * textarea and paints the highlight boxes. The two layers must agree on font,
 * size, padding, wrapping and line height to the pixel, or the boxes drift off the
 * characters - which is why every one of those is set in one place, on `layout`.
 */
const layout = "min-h-12 flex-1 whitespace-pre-wrap break-words rounded-md p-1.5 font-mono text-sm";

export function PatternEditor({
	value,
	onChange,
	onRun,
	spans,
	invalid,
}: {
	value: string;
	onChange: (v: string) => void;
	onRun: () => void;
	/** Source ranges sounding right now. Empty for code, which has no mapping. */
	spans: Span[];
	invalid: boolean;
}) {
	const scroller = useRef<HTMLPreElement>(null);

	return (
		<div className={cn("relative flex min-h-12 flex-1", invalid && "rounded-md ring-1 ring-destructive")}>
			<pre
				ref={scroller}
				aria-hidden
				className={cn(layout, "pointer-events-none absolute inset-0 overflow-hidden bg-input/40 text-transparent")}
			>
				{segment(value, spans).map((s, i) =>
					s.on ? (
						<mark key={i} className="rounded-sm bg-primary/35 text-transparent">
							{s.text}
						</mark>
					) : (
						<span key={i}>{s.text}</span>
					),
				)}
			</pre>
			<textarea
				value={value}
				onChange={(e) => onChange(e.target.value)}
				// Keep the highlight layer aligned when the text is long enough to scroll.
				onScroll={(e) => {
					if (scroller.current) scroller.current.scrollTop = e.currentTarget.scrollTop;
				}}
				onKeyDown={(e) => {
					// Ctrl/Cmd+Enter re-evaluates without restarting the cycle, the way
					// strudel.cc does - the transport keeps running underneath.
					if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
						e.preventDefault();
						onRun();
					}
				}}
				spellCheck={false}
				className={cn(layout, "relative w-full resize-none bg-transparent outline-none")}
				placeholder='note("c3 e3 g3 b3").midichan(1)'
			/>
		</div>
	);
}

/** Cut the text into highlighted and plain runs. */
function segment(text: string, spans: Span[]): { text: string; on: boolean }[] {
	if (spans.length === 0) return [{ text, on: false }];

	// A chord ("[c5,e5]") sounds several tokens at once, and they can overlap or
	// arrive out of order - merge before cutting, so no character is emitted twice.
	const sorted = [...spans].sort((a, b) => a[0] - b[0]);
	const merged: Span[] = [];
	for (const [start, end] of sorted) {
		const last = merged[merged.length - 1];
		if (last && start <= last[1]) last[1] = Math.max(last[1], end);
		else merged.push([start, end]);
	}

	const out: { text: string; on: boolean }[] = [];
	let cursor = 0;
	for (const [start, end] of merged) {
		if (start > cursor) out.push({ text: text.slice(cursor, start), on: false });
		out.push({ text: text.slice(start, end), on: true });
		cursor = end;
	}
	if (cursor < text.length) out.push({ text: text.slice(cursor), on: false });
	return out;
}
