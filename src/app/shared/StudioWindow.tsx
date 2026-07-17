import { useMemo, useRef, useState } from "react";
import { CircleAlert } from "lucide-react";
import { isBareMini } from "@/lib/strudelCode";
import { tokenAtCaret } from "@/lib/reference";
import { ReferencePanel } from "./ReferencePanel";

/**
 * THE FULL STUDIO - room to write, for a device view that is 169 px tall.
 *
 * AN EDITOR, NOT AN ENGINE. This is the whole design, and it is what the window does
 * NOT do that matters:
 *
 *   - It runs no engine. It binds the `code` state slot and stops there. The DEVICE
 *     VIEW receives `tick` (a window never does - the library sends transport to the
 *     device view only) and does all the scheduling, so Live's quantization and scale
 *     are enforced for free and there is exactly ONE scheduler however many views are
 *     open. A window with an engine of its own would double every note, and the second
 *     copy would be the one ignoring the transport.
 *   - It makes no sound, ever. [jweb] has no `~` outlets, so audio a page plays cannot
 *     reach the track - measured, and the reason the sample browser downloads before it
 *     previews. The window edits; the track hears the device.
 *
 * So there is no Play button and no note counter: this window has no idea whether
 * anything is sounding, and inventing a readout for it would be a lie that drifts.
 *
 * THE HELP PANEL FOLLOWS THE CARET, the way an IDE's does. It is the same
 * `ReferencePanel` the `?` window is made of - same data, same badges - so the two can
 * never disagree about whether `.crush()` works. The search box stays live: the caret
 * proposes, the user can always overrule it by typing.
 *
 * PRESENTATIONAL, and it takes the pattern rather than reaching for it. The two MIDI
 * devices' surfaces are not the same TYPE (one declares a drum map) and a surface is
 * invariant in its params, so a component accepting "any surface with a `code` slot"
 * would either be one device's or be `any`. The binding is one line in each device's
 * entry file, which already holds that device's concrete surface.
 */
export function StudioWindow({ text, onChange, device }: { text: string; onChange: (t: string) => void; device: string }) {
	const editor = useRef<HTMLTextAreaElement>(null);
	const [caret, setCaret] = useState(0);

	// Full Strudel code is real JavaScript - the mini-notation warnings do not apply to
	// it, and saying so is the honest thing a bigger editor can do (doc/TODO.md backlog
	// 1: this window invites more full-code use, which is where the octave convention
	// differs and nothing here can fix it).
	const codeMode = !isBareMini(text);
	const query = useMemo(() => tokenAtCaret(text, caret), [text, caret]);

	const track = () => setCaret(editor.current?.selectionStart ?? 0);

	return (
		<main className="flex h-screen w-screen flex-col gap-3 overflow-hidden bg-background p-4 text-foreground">
			<header className="flex shrink-0 items-baseline justify-between border-b border-input pb-2">
				<h1 className="text-sm font-semibold tracking-tight">Strudel Studio</h1>
				<span className="text-[11px] text-muted-foreground">the device plays this - transport, scale and quantization stay with the device view</span>
			</header>

			<div className="flex min-h-0 flex-1 gap-3">
				<div className="flex min-h-0 flex-1 flex-col gap-2">
					<textarea
						ref={editor}
						value={text}
						onChange={(e) => {
							onChange(e.target.value);
							track();
						}}
						onKeyUp={track}
						onClick={track}
						onSelect={track}
						spellCheck={false}
						placeholder="Write a pattern. The device view is playing whatever is here."
						className="min-h-0 flex-1 resize-none rounded-md bg-input/40 p-3 font-mono text-sm leading-relaxed outline-none focus:ring-1 focus:ring-accent"
					/>

					{codeMode && (
						<div className="flex shrink-0 items-start gap-2 rounded-md bg-input/30 px-3 py-2 text-[11px] text-muted-foreground">
							<CircleAlert className="mt-0.5 size-3.5 shrink-0" />
							<span>
								Full Strudel code is passed through untouched - the device's Octave, Shift and Scale controls do not reach it, and{" "}
								<code className="text-foreground">note("c5")</code> here is MIDI 72 (scientific).
							</span>
						</div>
					)}
				</div>

				<aside className="flex w-72 shrink-0 flex-col border-l border-input pl-3">
					<h2 className="shrink-0 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Reference</h2>
					<ReferencePanel device={device} query={query} emptyHint={`Nothing here matches "${query}" - it may be Strudel this device does not support.`} />
				</aside>
			</div>
		</main>
	);
}
