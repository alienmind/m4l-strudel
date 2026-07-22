/**
 * A tokenizer for the device view's code editor - just enough JavaScript to make a
 * Strudel pattern legible at a glance.
 *
 * NOT a parser, and deliberately not CodeMirror. The editor is a `<textarea>` with a
 * painted layer behind it in a view 169 px tall; what it needs is for strings,
 * numbers, comments and the method chain to be told apart, which a single pass of
 * regexes does honestly. Anything that needs a real grammar - bracket matching,
 * scope-aware completion - is a reason to move that view to CodeMirror rather than to
 * grow this.
 *
 * It never throws and never drops characters: every branch either consumes at least
 * one character or falls through to the plain-text one, and the concatenation of all
 * runs equals the input. `highlight.test.ts` pins exactly that, because a tokenizer
 * that loses a character silently corrupts what the user sees they typed.
 */

export type TokenKind = "plain" | "comment" | "string" | "number" | "method" | "keyword" | "punct";

export interface Token {
	text: string;
	kind: TokenKind;
}

/** The words that are control flow rather than pattern vocabulary. */
const KEYWORDS = new Set([
	"const",
	"let",
	"var",
	"function",
	"return",
	"if",
	"else",
	"for",
	"while",
	"await",
	"async",
	"new",
	"true",
	"false",
	"null",
	"undefined",
]);

const PUNCT = new Set([..."(){}[],;:.+-*/%<>=!&|?"]);

export function tokenize(code: string): Token[] {
	const out: Token[] = [];
	const push = (text: string, kind: TokenKind) => {
		if (!text) return;
		const last = out[out.length - 1];
		// Merge runs of the same kind, so the DOM gets a handful of spans rather than
		// one per character on a line of punctuation.
		if (last && last.kind === kind) last.text += text;
		else out.push({ text, kind });
	};

	let i = 0;
	while (i < code.length) {
		const c = code[i];
		const next = code[i + 1];

		// Comments, to end of line or to the closing pair. An unterminated block
		// comment runs to the end of the text, which is what an editor should show.
		if (c === "/" && next === "/") {
			const end = code.indexOf("\n", i);
			push(code.slice(i, end < 0 ? code.length : end), "comment");
			i = end < 0 ? code.length : end;
			continue;
		}
		if (c === "/" && next === "*") {
			const end = code.indexOf("*/", i + 2);
			push(code.slice(i, end < 0 ? code.length : end + 2), "comment");
			i = end < 0 ? code.length : end + 2;
			continue;
		}

		// Strings. In Strudel a double-quoted string is MINI NOTATION - the pattern
		// itself - so it earns the strongest colour in the theme, not the muted one a
		// general-purpose editor would give it.
		if (c === '"' || c === "'" || c === "`") {
			let j = i + 1;
			while (j < code.length && code[j] !== c) {
				if (code[j] === "\\") j++; // an escaped quote does not close the string
				j++;
			}
			push(code.slice(i, Math.min(j + 1, code.length)), "string");
			i = j + 1;
			continue;
		}

		if (c >= "0" && c <= "9") {
			let j = i;
			while (j < code.length && /[0-9._]/.test(code[j])) j++;
			push(code.slice(i, j), "number");
			i = j;
			continue;
		}

		if (/[A-Za-z_$]/.test(c)) {
			let j = i;
			while (j < code.length && /[A-Za-z0-9_$]/.test(code[j])) j++;
			const word = code.slice(i, j);
			// A name followed by "(" is being CALLED, which in a pattern is almost
			// always the thing worth finding - `.lpf(`, `slider(`, `note(`.
			const called = /^\s*\(/.test(code.slice(j));
			push(word, KEYWORDS.has(word) ? "keyword" : called ? "method" : "plain");
			i = j;
			continue;
		}

		if (PUNCT.has(c)) {
			push(c, "punct");
			i++;
			continue;
		}

		push(c, "plain");
		i++;
	}

	return out;
}

/** What each kind looks like. Restrained on purpose - this sits in a 169 px device. */
export const TOKEN_CLASS: Record<TokenKind, string> = {
	plain: "",
	comment: "text-muted-foreground/60 italic",
	string: "text-primary",
	number: "text-accent",
	method: "text-foreground font-semibold",
	keyword: "text-accent/80",
	punct: "text-muted-foreground",
};
