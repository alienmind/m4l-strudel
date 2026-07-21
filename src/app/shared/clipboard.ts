/**
 * Copy text to the system clipboard from inside jweb's Chromium.
 *
 * This replaces "Show folder" (see doc/TODO.md item 1). Revealing a folder needs the
 * OS file manager, which only Max can ask for - and `; max launchbrowser` did not
 * deliver it on Windows: a wrong path raised a shell error dialog, a correct one
 * opened nothing at all and reported nothing. Handing the user the path to paste is
 * the same job done entirely page-side, with no Max message and nothing to verify per
 * platform.
 *
 * TWO MECHANISMS, and the modern one is the fallback here rather than the default.
 * `navigator.clipboard` is gated on a SECURE CONTEXT; the device page is loaded from
 * `file://`, which is not one, so the API is typically missing or rejects outright.
 * The old `document.execCommand("copy")` path has no such gate, needs only a
 * selection, and works in CEF - so it is tried first, and the Promise API is the
 * backstop for wherever that has been removed.
 */
export async function copyText(text: string): Promise<boolean> {
	if (execCommandCopy(text)) return true;
	try {
		await navigator.clipboard?.writeText(text);
		return true;
	} catch {
		return false;
	}
}

/** The selection-based copy, synchronous. Returns false if the command is unavailable. */
function execCommandCopy(text: string): boolean {
	try {
		const area = document.createElement("textarea");
		area.value = text;
		// Off-screen but still focusable and selectable: `display:none` or `hidden` would
		// make the selection empty, and the copy a silent no-op.
		area.style.position = "fixed";
		area.style.top = "-1000px";
		area.style.opacity = "0";
		area.setAttribute("readonly", "");
		document.body.appendChild(area);
		area.select();
		area.setSelectionRange(0, text.length);
		const ok = document.execCommand("copy");
		document.body.removeChild(area);
		return ok;
	} catch {
		return false;
	}
}
