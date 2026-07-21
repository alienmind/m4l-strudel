import { inJweb } from "@m4l-jweb/bridge";

/**
 * Put a path on the clipboard from inside jweb's Chromium - or, failing that, let the
 * user do it in one keystroke.
 *
 * This replaces "Show folder" (doc/TODO.md item 1). Revealing a folder needs the OS file
 * manager, which only Max can ask for, and `; max launchbrowser` does not deliver it on
 * Windows: a wrong path raised a shell error dialog, a correct one opened nothing and
 * reported nothing.
 *
 * WHAT WENT WRONG WITH THE FIRST ATTEMPT, and why this file now looks like it does:
 * `document.execCommand("copy")` RETURNED TRUE in the device page and put nothing on the
 * system clipboard. That is the worst possible outcome - the status line said "Path
 * copied" and the paste was empty - and it is not something the page can detect, because
 * there is no read-back: `navigator.clipboard.readText()` needs the secure context this
 * `file://` page does not have, so a copy can be CLAIMED but never CONFIRMED.
 *
 * So the rule here is: inside jweb, never trust a claim. Try the programmatic copy
 * anyway (it costs nothing and does work in some builds), then hand the user a focused,
 * pre-selected field and wait for the browser's own `copy` event. That event fires only
 * when the copy actually happens, which makes it the one honest confirmation available -
 * and "press Ctrl+C" is a keystroke, not a dead end.
 */

export type CopyResult =
	/** The programmatic copy was made AND could be trusted (outside jweb). */
	| "copied"
	/** The user pressed Ctrl+C on the field we showed - the browser confirmed it. */
	| "manual"
	/** The field was dismissed without a copy. The caller still shows the path. */
	| "cancelled";

/**
 * Copy `text`, falling back to the user's own Ctrl+C, and report what really happened.
 *
 * Resolves as soon as the outcome is known: immediately outside jweb, and on the copy
 * event (or dismissal) inside it.
 */
export async function copyPath(text: string): Promise<CopyResult> {
	const claimed = await attemptCopy(text);
	// Outside Max (browser dev) the APIs are trustworthy: a secure context, a real
	// clipboard, and a `writeText` that rejects when it fails.
	if (claimed && !inJweb) return "copied";
	return promptCopy(text);
}

/** The programmatic attempt, both mechanisms. Its `true` is a CLAIM, not a fact. */
async function attemptCopy(text: string): Promise<boolean> {
	if (execCommandCopy(text)) return true;
	try {
		// NOT `navigator.clipboard?.writeText(...)`: optional chaining on a MISSING API
		// yields undefined, `await undefined` resolves, and this reported success on
		// exactly the page where there is no clipboard API at all.
		if (!navigator.clipboard?.writeText) return false;
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		return false;
	}
}

/** The selection-based copy, synchronous. Must run inside the click's user gesture. */
function execCommandCopy(text: string): boolean {
	const previous = document.activeElement as HTMLElement | null;
	const area = document.createElement("textarea");
	try {
		area.value = text;
		// IN the viewport, not off at -1000px: an element scrolled out of view can fail to
		// take focus, and a selection nothing owns copies nothing. Invisible is enough.
		area.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;padding:0;border:0";
		area.setAttribute("readonly", "");
		document.body.appendChild(area);
		// focus() BEFORE select(): select() alone leaves the selection unowned in CEF.
		area.focus();
		area.select();
		area.setSelectionRange(0, text.length);
		return document.execCommand("copy");
	} catch {
		return false;
	} finally {
		area.remove();
		previous?.focus?.();
	}
}

const PROMPT_ID = "m4l-copy-prompt";

/**
 * Show the path in a focused, pre-selected field and wait for the user to copy it.
 *
 * Resolves "manual" on the browser's `copy` event - the only confirmation this page can
 * get - and "cancelled" on Escape, on the close button, or on a click outside. It does
 * NOT dismiss on blur: focus can be lost to Max itself, and a field that vanishes when
 * you look away is a field you cannot use.
 */
export function promptCopy(text: string): Promise<CopyResult> {
	return new Promise((resolve) => {
		try {
			document.getElementById(PROMPT_ID)?.remove();

			const box = document.createElement("div");
			box.id = PROMPT_ID;
			box.style.cssText =
				"position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;gap:4px;" +
				"justify-content:center;padding:8px;background:rgba(0,0,0,.92);color:#fff;font:11px system-ui";

			const label = document.createElement("div");
			label.textContent = "Press Ctrl+C (Cmd+C) to copy this path";
			label.style.cssText = "opacity:.7";

			const input = document.createElement("input");
			input.readOnly = true;
			input.value = text;
			input.style.cssText =
				"width:100%;background:#111;color:#fff;border:1px solid #444;border-radius:3px;" +
				"padding:3px 4px;font:10px monospace";

			const close = document.createElement("button");
			close.textContent = "Close";
			close.style.cssText =
				"align-self:flex-end;background:#222;color:#fff;border:1px solid #444;border-radius:3px;" +
				"padding:2px 8px;font:10px system-ui;cursor:pointer";

			let done = false;
			const finish = (r: CopyResult) => {
				if (done) return;
				done = true;
				box.remove();
				resolve(r);
			};

			// The one honest confirmation: the browser only fires this when a copy happens.
			input.addEventListener("copy", () => finish("manual"));
			input.addEventListener("keydown", (e) => {
				if (e.key === "Escape") finish("cancelled");
			});
			close.addEventListener("click", () => finish("cancelled"));
			box.addEventListener("mousedown", (e) => {
				if (e.target === box) finish("cancelled");
			});

			box.append(label, input, close);
			document.body.appendChild(box);
			input.focus();
			input.select();
		} catch {
			resolve("cancelled");
		}
	});
}

/** What to tell the user, per outcome. One wording, three devices - the status line is
 *  the only place any of this is visible, and it must never claim a copy that did not
 *  happen (which is the bug this whole file exists to stop). */
export function copyMessage(result: CopyResult, path: string): string {
	if (result === "copied" || result === "manual") return `Path copied: ${path}`;
	return `Not copied - the folder is ${path}`;
}
