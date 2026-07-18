import { useMemo, useState } from "react";
import { STANDARD_DRUM_WORDS, type DrumMap } from "@/lib/mini/drums";

/**
 * DrumRack - the drum map drawn as an Ableton Drum Rack: a 4-wide grid of pads,
 * chromatic and BOTTOM-UP (C1 = MIDI 36 at the bottom-left, like Live's own rack).
 *
 * The map is words -> MIDI notes; a pad IS a note. So a pad shows its note name and
 * the drum word (if any) that plays it, and there are three ways to map a word onto a
 * pad: type it into the pad, or drag one of the abbreviations from the palette on the
 * right onto the pad. A note holds at most one word here - the drum-rack mental model
 * (one pad, one sound) - so re-typing or dropping replaces what was there.
 *
 * ONE component, two views. The mini device view passes a 16-note window and a scroll
 * stripe (`stripe`); the expanded floating window passes a wide range (C1..C6) and no
 * stripe. Same pads, same interactions - the expanded view just shows more at once.
 */

const PC = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Live's Drum Rack convention: MIDI 36 is C1 (C-2 = 0). Matches the pad labels in Live. */
export function padNoteName(midi: number): string {
	return `${PC[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 2}`;
}

/** The one word (if any) currently mapped to a note. */
function wordAt(map: DrumMap, note: number): string | undefined {
	return Object.keys(map).find((k) => map[k] === note);
}

const PAD_MIN = 0;
const PAD_MAX = 127;

export interface DrumRackProps {
	map: DrumMap;
	onChange: (m: DrumMap) => void;
	/** Lowest and highest MIDI note to draw, inclusive. Bottom-left pad is `lowNote`. */
	lowNote: number;
	highNote: number;
	/** Present only in the mini view: the scroll mini-map down the left edge. */
	stripe?: { base: number; setBase: (n: number) => void; pageSize: number };
	/** Roomier pads in the expanded window. */
	size?: "sm" | "lg";
}

export function DrumRack({ map, onChange, lowNote, highNote, stripe, size = "sm" }: DrumRackProps) {
	// Words are draggable from the palette; a pad accepts a drop or a typed word.
	const setPad = (note: number, raw: string) => {
		const word = raw.trim().toLowerCase();
		const prev = wordAt(map, note);
		const next = { ...map };
		if (prev) delete next[prev]; // the pad holds one word
		if (word) {
			delete next[word]; // ...and a word lives on one pad: move it here
			next[word] = note;
		}
		onChange(next);
	};

	// Rows are drawn top (highest notes) to bottom, four to a row - Live's layout.
	const rows = useMemo(() => {
		const out: number[][] = [];
		for (let n = lowNote; n <= highNote; n += 4) {
			out.push([n, n + 1, n + 2, n + 3].filter((x) => x <= highNote && x <= PAD_MAX));
		}
		return out.reverse();
	}, [lowNote, highNote]);

	const padH = size === "lg" ? "h-16" : "h-9";

	return (
		<div className="flex min-h-0 flex-1 gap-1.5">
			{stripe && <ScrollStripe {...stripe} />}

			<div className="grid min-h-0 flex-1 auto-rows-min gap-1 overflow-y-auto pr-0.5">
				{rows.map((row, ri) => (
					<div key={ri} className="grid grid-cols-4 gap-1">
						{row.map((note) => (
							<Pad key={note} note={note} word={wordAt(map, note)} height={padH} onCommit={(w) => setPad(note, w)} size={size} />
						))}
					</div>
				))}
			</div>

			<Palette map={map} size={size} />
		</div>
	);
}

/**
 * One pad. Shows the note name and, centered, the word that plays it - which is an
 * input, so clicking the pad and typing maps a word onto the note. It is also a drop
 * target for a dragged palette chip.
 */
function Pad({
	note,
	word,
	height,
	onCommit,
	size,
}: {
	note: number;
	word: string | undefined;
	height: string;
	onCommit: (word: string) => void;
	size: "sm" | "lg";
}) {
	// Edit mode is entered by CLICKING a pad. Only then is there an <input>, so a
	// drag-and-drop lands on the plain div's onDrop and assigns cleanly - a text input
	// would otherwise swallow the drop natively and try to insert the text instead.
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState("");
	const [over, setOver] = useState(false);

	const startEdit = () => {
		setDraft(word ?? "");
		setEditing(true);
	};

	return (
		<div
			onDragOver={(e) => {
				e.preventDefault();
				setOver(true);
			}}
			onDragLeave={() => setOver(false)}
			onDrop={(e) => {
				e.preventDefault();
				setOver(false);
				const w = e.dataTransfer.getData("text/plain");
				if (w) onCommit(w);
			}}
			onClick={() => !editing && startEdit()}
			className={`relative flex ${height} cursor-text flex-col justify-between rounded-sm border p-1 transition-colors ${
				over
					? "border-primary bg-primary/20"
					: word
						? "border-primary/40 bg-primary/10"
						: "border-input bg-input/30"
			}`}
			title={`${padNoteName(note)} (MIDI ${note}) - click to type, or drag a word here`}
		>
			<span className={`pointer-events-none font-mono leading-none text-muted-foreground ${size === "lg" ? "text-[10px]" : "text-[8px]"}`}>
				{padNoteName(note)}
			</span>
			{editing ? (
				<input
					autoFocus
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onBlur={() => {
						onCommit(draft);
						setEditing(false);
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter") e.currentTarget.blur();
						if (e.key === "Escape") {
							setDraft(word ?? "");
							setEditing(false);
						}
					}}
					spellCheck={false}
					className={`w-full min-w-0 truncate bg-transparent text-center font-semibold text-foreground outline-none ${
						size === "lg" ? "text-sm" : "text-[11px]"
					}`}
				/>
			) : (
				<span
					className={`pointer-events-none w-full truncate text-center font-semibold ${word ? "text-foreground" : "text-muted-foreground/40"} ${
						size === "lg" ? "text-sm" : "text-[11px]"
					}`}
				>
					{word ?? "-"}
				</span>
			)}
		</div>
	);
}

/**
 * The palette down the right edge: the standard abbreviations, each a drag source.
 * Drag one onto a pad to map it there. A chip already placed still shows (dimmed with
 * its note) so it can be dragged to a new pad; an unplaced one is ready to drop in.
 */
function Palette({ map, size }: { map: DrumMap; size: "sm" | "lg" }) {
	const placed = new Set(Object.keys(map));
	const words = [...new Set([...STANDARD_DRUM_WORDS, ...Object.keys(map)])];

	return (
		<div className={`flex shrink-0 flex-col gap-1 overflow-y-auto rounded-md bg-input/20 p-1 ${size === "lg" ? "w-24" : "w-14"}`}>
			<span className="text-center text-[8px] leading-none text-muted-foreground">drag &rarr; pad</span>
			<div className={`grid gap-1 ${size === "lg" ? "grid-cols-2" : "grid-cols-1"}`}>
				{words.map((w) => (
					<div
						key={w}
						draggable
						onDragStart={(e) => e.dataTransfer.setData("text/plain", w)}
						className={`cursor-grab rounded border px-1 py-0.5 text-center font-mono leading-none active:cursor-grabbing ${
							size === "lg" ? "text-[11px]" : "text-[10px]"
						} ${placed.has(w) ? "border-primary/30 bg-primary/10 text-foreground" : "border-input bg-input/40 text-muted-foreground"}`}
						title={placed.has(w) ? `${w} -> ${padNoteName(map[w])} (drag to move)` : `${w} (drag onto a pad)`}
					>
						{w}
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * The scroll mini-map, mimicking Live's - a compact 4-wide picture of the whole drum
 * range with the visible window lit. Click anywhere in it to bring that region into
 * view. Only the mini device view uses it; the expanded window shows everything.
 */
function ScrollStripe({ base, setBase, pageSize }: { base: number; setBase: (n: number) => void; pageSize: number }) {
	// The range the stripe covers - the musically useful span, not all 128.
	const LOW = 24; // C0
	const HIGH = 107; // B7
	const rows: number[] = [];
	for (let n = HIGH; n >= LOW; n -= 4) rows.push(n - 3);

	const clampBase = (n: number) => Math.max(PAD_MIN, Math.min(PAD_MAX - pageSize + 1, n));

	return (
		<div className="flex w-5 shrink-0 flex-col gap-px overflow-hidden rounded-sm bg-input/30 p-0.5" title="Click to scroll the pad view">
			{rows.map((rowLow) => {
				const inView = rowLow >= base && rowLow < base + pageSize;
				return (
					<div key={rowLow} className="grid grid-cols-4 gap-px">
						{[0, 1, 2, 3].map((c) => (
							<button
								key={c}
								onClick={() => setBase(clampBase(rowLow - Math.floor(pageSize / 2)))}
								className={`h-1 rounded-[1px] ${inView ? "bg-primary" : "bg-muted-foreground/25 hover:bg-muted-foreground/50"}`}
							/>
						))}
					</div>
				);
			})}
		</div>
	);
}
