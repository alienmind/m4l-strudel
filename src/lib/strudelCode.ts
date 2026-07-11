/**
 * The editor accepts two dialects: bare mini-notation ("c5 [e5 g5]*2"), which
 * the clip converter parses directly, and full Strudel code, which the live
 * engine evaluates as JavaScript. Bare mini-notation is not valid JS, so Run
 * wraps it in note("...") - exactly what a strudel.cc user would type.
 */
/** True when the text is bare mini-notation (the clip converter's dialect)
 *  rather than JavaScript. Any quote, call, arrow function or $: line means
 *  it is already code. */
export function isBareMini(text: string): boolean {
	return !/["'`()]|\$:|=>/.test(text.trim());
}

export function asStrudelCode(text: string): string {
	if (!isBareMini(text)) return text;
	return `note("${text.trim().replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}
