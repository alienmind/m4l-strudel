import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { TOKEN_CLASS, tokenize } from "@/lib/highlight";
import type { Span } from "@/lib/mini/playhead";
import type { TokenKind } from "@/lib/highlight";

/**
 * The pattern editor, with the sounding step highlighted - the thing strudel.cc
 * does that makes a running pattern legible.
 *
 * A <textarea> cannot style a range of its own text, so this is the usual two-layer
 * trick: a copy of the pattern sits BEHIND a transparent-background textarea and
 * paints both the highlight boxes and the SYNTAX COLOURS. The two layers must agree
 * on font, size, padding, wrapping and line height to the pixel, or the boxes drift
 * off the characters - which is why every one of those is set in one place, on
 * `layout`.
 *
 * The textarea's own text is transparent (its caret is not), so what the user reads
 * is the painted layer. That is what lets a plain textarea show colour while keeping
 * every editing behaviour a textarea has for free - selection, undo, IME, the lot.
 */
const layout = "min-h-12 flex-1 whitespace-pre-wrap break-words rounded-md p-1.5 font-mono text-sm";

export function PatternEditor({
	value,
	onChange,
	onRun,
	spans,
	invalid,
	onCaret,
}: {
	value: string;
	onChange: (v: string) => void;
	onRun: () => void;
	/** Source ranges sounding right now. Empty for code, which has no mapping. */
	spans: Span[];
	invalid: boolean;
	/**
	 * Where the caret is, on every move. The device reports it so the floating help
	 * window can show what you are typing about - see the `helpQuery` slot.
	 */
	onCaret?: (caret: number) => void;
}) {
	const scroller = useRef<HTMLPreElement>(null);
	// Two independent cuts of the same text - the sounding spans and the syntax runs -
	// resolved into one list of runs that carries both.
	const painted = useMemo(() => paint(value, spans), [value, spans]);

	return (
		<div className={cn("relative flex min-h-12 flex-1", invalid && "rounded-md ring-1 ring-destructive")}>
			<pre
				ref={scroller}
				aria-hidden
				className={cn(layout, "pointer-events-none absolute inset-0 overflow-hidden bg-input/40")}
			>
				{painted.map((run, i) =>
					run.on ? (
						<mark key={i} className={cn("rounded-sm bg-primary/35", TOKEN_CLASS[run.kind])}>
							{run.text}
						</mark>
					) : (
						<span key={i} className={TOKEN_CLASS[run.kind]}>
							{run.text}
						</span>
					),
				)}
			</pre>
			<textarea
				value={value}
				onChange={(e) => {
					onChange(e.target.value);
					onCaret?.(e.target.selectionStart ?? 0);
				}}
				// Every way the caret can move without the text changing - arrows, a click,
				// a drag-select. The help window follows the caret, not the keystrokes.
				onKeyUp={(e) => onCaret?.(e.currentTarget.selectionStart ?? 0)}
				onClick={(e) => onCaret?.(e.currentTarget.selectionStart ?? 0)}
				onSelect={(e) => onCaret?.(e.currentTarget.selectionStart ?? 0)}
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
				// The text is invisible here and painted by the layer behind; the caret and
				// the selection are not, or there would be no sign of where you are typing.
				className={cn(
					layout,
					"relative w-full resize-none bg-transparent text-transparent caret-foreground outline-none selection:bg-primary/30",
				)}
				placeholder='ie: note("c3 e3 g3 b3").midichan(1)'
			/>
		</div>
	);
}

/**
 * Cut the text once for the sounding highlight and once for syntax, then reconcile
 * the two into a single list of runs.
 *
 * They are independent range sets over the same characters and either can start or
 * end mid-token, so a token is split wherever a highlight boundary falls inside it.
 */
function paint(text: string, spans: Span[]): { text: string; on: boolean; kind: TokenKind }[] {
	const out: { text: string; on: boolean; kind: TokenKind }[] = [];
	let at = 0;
	for (const token of tokenize(text)) {
		const start = at;
		const end = at + token.text.length;
		at = end;
		// Where this token is sounding, if anywhere.
		for (const piece of segment(text.slice(start, end), shift(spans, start, end))) {
			out.push({ text: piece.text, on: piece.on, kind: token.kind });
		}
	}
	return out;
}

/** The sounding spans that touch [start, end), rebased to the start of the token. */
function shift(spans: Span[], start: number, end: number): Span[] {
	const out: Span[] = [];
	for (const [a, b] of spans) {
		if (b <= start || a >= end) continue;
		out.push([Math.max(a, start) - start, Math.min(b, end) - start]);
	}
	return out;
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
