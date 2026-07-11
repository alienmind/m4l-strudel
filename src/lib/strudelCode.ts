/**
 * The editor accepts two dialects: bare mini-notation ("c5 [e5 g5]*2"), which
 * the clip converter parses directly, and full Strudel code, which the live
 * engine evaluates as JavaScript. Bare mini-notation is not valid JS, so Run
 * wraps it in note("...") - exactly what a strudel.cc user would type.
 */
export function asStrudelCode(text: string): string {
	const t = text.trim();
	// Any quote, call, arrow function or $: line means it is already code.
	const looksLikeCode = /["'`()]|\$:|=>/.test(t);
	if (looksLikeCode) return text;
	return `note("${t.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}
