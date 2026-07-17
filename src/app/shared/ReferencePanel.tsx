import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, referenceFor, searchReference, type RefEntry, type Status } from "@/lib/reference";

/**
 * The searchable reference list - the help WINDOW's whole body, and the Studio
 * window's right-hand panel.
 *
 * It is its own component because those two want the same list for different reasons:
 * the help window is a thing you go and read, the Studio panel is a thing that follows
 * you while you type (`query`). Same data, same rendering, same badges - so the two can
 * never disagree about whether `.crush()` works.
 */
const STATUS_STYLE: Record<Status, { label: string; className: string }> = {
	live: { label: "works", className: "bg-accent text-accent-foreground" },
	unbuilt: { label: "not yet", className: "bg-muted text-muted-foreground" },
	syntax: { label: "syntax", className: "bg-input text-foreground" },
};

function Entry({ e }: { e: RefEntry }) {
	const s = STATUS_STYLE[e.status];
	return (
		<div className="border-b border-input py-2.5 last:border-0">
			<div className="flex items-baseline gap-2">
				<code className="text-xs font-semibold text-foreground">{e.name}</code>
				<span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${s.className}`}>{s.label}</span>
			</div>
			<p className="mt-1 text-xs text-muted-foreground">{e.summary}</p>
			<code className="mt-1 block text-[11px] text-foreground/80">{e.example}</code>
			{e.note && <p className="mt-1 text-[11px] italic text-muted-foreground">{e.note}</p>}
		</div>
	);
}

export function ReferencePanel({
	device,
	/** Typed from outside (the Studio's caret). The search box follows it, and stays editable. */
	query,
	emptyHint,
}: {
	device: string;
	query?: string;
	emptyHint?: string;
}) {
	const [typed, setTyped] = useState("");
	// `query` LEADS while it has something to say, and the user can always type over it.
	// Resetting `typed` when the caret moves is what keeps the panel following the code
	// rather than sticking on whatever was last searched by hand.
	useEffect(() => {
		if (query !== undefined) setTyped("");
	}, [query]);

	const effective = typed || query || "";
	const all = useMemo(() => referenceFor(device), [device]);
	const hits = useMemo(() => searchReference(all, effective), [all, effective]);
	const byCategory = useMemo(() => CATEGORIES.map((c) => ({ category: c, entries: hits.filter((e) => e.category === c) })).filter((g) => g.entries.length), [hits]);

	return (
		<div className="flex min-h-0 flex-1 flex-col">
			<div className="relative shrink-0 px-1 pb-2">
				<Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
				<input
					value={effective}
					onChange={(ev) => setTyped(ev.target.value)}
					placeholder="Search - lpf, euclid, sine..."
					className="w-full rounded-md border border-input bg-input/40 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-accent"
				/>
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto px-1">
				{byCategory.map((g) => (
					<section key={g.category}>
						<h2 className="sticky top-0 bg-background py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g.category}</h2>
						{g.entries.map((e) => (
							<Entry key={e.name} e={e} />
						))}
					</section>
				))}
				{!byCategory.length && <p className="py-8 text-center text-xs text-muted-foreground">{emptyHint ?? `Nothing matches "${effective}".`}</p>}
			</div>
		</div>
	);
}
