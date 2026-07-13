/**
 * The editor accepts two dialects: bare mini-notation ("c5 [e5 g5]*2"), and full
 * Strudel code, which is evaluated as JavaScript. Bare mini-notation is not valid
 * JS, so it is wrapped in note("...") - what a strudel.cc user would type.
 *
 * Before wrapping, every token is resolved to an absolute MIDI number (see
 * mini/resolve.ts): scale degrees against Live's global scale, drum words against
 * the drum map, note names against the chosen octave convention. Strudel is only
 * ever handed numbers, so Live Play and To Clip cannot disagree about pitch.
 *
 * Full Strudel code is passed through untouched - it is real JavaScript with its
 * own note names, its own `.scale()`, and Strudel's own scientific-pitch
 * convention ("c5" is MIDI 72 there). The Octave/Shift controls do not reach it.
 */
import { resolveMini } from "./mini/resolve";
import type { NoteContext } from "./mini/notes";

/**
 * True when the text is bare mini-notation rather than JavaScript.
 *
 * PARENTHESES ARE NOT A TELL, and treating them as one was a real bug: `bd(3,8)`
 * is a euclidean rhythm - the most idiomatic drum pattern Strudel has - and it was
 * being read as a JavaScript call, passed to the engine unwrapped, and killed with
 * a syntax error. Every euclid pattern in the editor was broken.
 *
 * What actually distinguishes the two dialects is that JavaScript needs a STRING
 * (every Strudel pattern starts from `note("...")`, `s("...")`, `n("...")`), or a
 * METHOD CALL, or `$:`, or an arrow. Mini-notation has none of those: its only
 * punctuation is structure (`[] <> {} () * @ ! ~ ,`) and its numbers may carry a
 * decimal point, which is why the method-call test requires a LETTER after the dot.
 */
export function isBareMini(text: string): boolean {
	return !/["'`]|\$:|=>|\.\s*[a-zA-Z]/.test(text.trim());
}

export function asStrudelCode(text: string, ctx: NoteContext): string {
	if (!isBareMini(text)) return text;
	const resolved = resolveMini(text.trim(), ctx);
	return `note("${resolved.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;
}
