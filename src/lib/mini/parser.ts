/**
 * parser.ts - tokenizer + recursive-descent parser for Strudel mini-notation.
 *
 * Grammar:
 * sequence := term+
 * term := atom modifier*
 * atom := NOTE | "~" | "[" seqList "]" | "<" sequence ">" | "{" seqList "}" ("%" INT)?
 * seqList := sequence ("," sequence)*
 * modifier := "*" factor | "@" number | "(" INT "," INT ("," INT)? ")"
 * factor := number
 *
 * "," inside [ ] produces a stack (parallel); inside { } produces polymeter.
 */

import type { Node, ParseError, Weighted } from "./ast";

type TokKind =
	| "note"
	| "rest"
	| "lbracket"
	| "rbracket"
	| "langle"
	| "rangle"
	| "lbrace"
	| "rbrace"
	| "lparen"
	| "rparen"
	| "comma"
	| "star"
	| "at"
	| "percent"
	| "excl"
	| "number";

interface Tok {
	kind: TokKind;
	value: string;
	pos: number;
	/** Whitespace immediately before this token. It is the ONLY thing separating a
	 *  modifier from a step: "bd!3" replicates bd three times, while "bd ! !" is
	 *  three steps, the second and third repeating the first. */
	sp: boolean;
}

const SINGLE: Record<string, TokKind> = {
	"[": "lbracket",
	"]": "rbracket",
	"<": "langle",
	">": "rangle",
	"{": "lbrace",
	"}": "rbrace",
	"(": "lparen",
	")": "rparen",
	",": "comma",
	"*": "star",
	"@": "at",
	"%": "percent",
	"!": "excl",
	"~": "rest",
};

export function tokenize(src: string): { tokens: Tok[]; errors: ParseError[] } {
	const tokens: Tok[] = [];
	const errors: ParseError[] = [];
	let i = 0;
	let sp = true; // the first token counts as preceded by whitespace
	const push = (kind: TokKind, value: string, pos: number) => {
		tokens.push({ kind, value, pos, sp });
		sp = false;
	};
	while (i < src.length) {
		const ch = src[i];
		if (/\s/.test(ch)) {
			sp = true;
			i++;
			continue;
		}
		if (SINGLE[ch]) {
			push(SINGLE[ch], ch, i);
			i++;
			continue;
		}
		// Number (integer or decimal). A leading "-" is part of the number: bare
		// mini-notation uses negative scale degrees ("[-1 ~] -1"), and rejecting
		// them here is what forced users to write n("...") by hand.
		if (/[0-9]/.test(ch) || (ch === "-" && /[0-9]/.test(src[i + 1] ?? ""))) {
			let j = ch === "-" ? i + 1 : i;
			while (j < src.length && /[0-9.]/.test(src[j])) j++;
			push("number", src.slice(i, j), i);
			i = j;
			continue;
		}
		// Word token: a note name ("c", "eb4", "f#2") or a drum name ("bd", "hh").
		// Deliberately greedy over letters - stopping at the first non-accidental
		// would tokenize "bd" as the note B followed by the note D.
		if (/[a-zA-Z]/.test(ch)) {
			let j = i;
			while (j < src.length && /[a-zA-Z#]/.test(src[j])) j++;
			if (j < src.length && src[j] === "-") j++; // negative octave
			while (j < src.length && /[0-9]/.test(src[j])) j++;
			push("note", src.slice(i, j), i);
			i = j;
			continue;
		}
		errors.push({ pos: i, msg: `unexpected character "${ch}"` });
		i++;
	}
	return { tokens, errors };
}

export interface ParseResult {
	ast: Node;
	errors: ParseError[];
}

export function parseMini(src: string): ParseResult {
	const { tokens, errors } = tokenize(src);
	const parser = new Parser(tokens, errors);
	const ast = parser.parseSequence(["EOF"]);
	if (parser.peek()) {
		errors.push({ pos: parser.peek()!.pos, msg: `unexpected "${parser.peek()!.value}"` });
	}
	return { ast, errors };
}

type Terminator = "rbracket" | "rangle" | "rbrace" | "EOF";

class Parser {
	private idx = 0;
	constructor(
		private toks: Tok[],
		private errors: ParseError[],
	) {}

	peek(): Tok | undefined {
		return this.toks[this.idx];
	}
	private next(): Tok | undefined {
		return this.toks[this.idx++];
	}
	private atTerminator(terms: Terminator[]): boolean {
		const t = this.peek();
		if (!t) return terms.includes("EOF");
		return (
			(t.kind === "rbracket" && terms.includes("rbracket")) ||
			(t.kind === "rangle" && terms.includes("rangle")) ||
			(t.kind === "rbrace" && terms.includes("rbrace")) ||
			t.kind === "comma"
		);
	}

	/** Parse a whitespace-separated sequence until a terminator or comma. */
	parseSequence(terms: Terminator[]): Node {
		const items: Weighted[] = [];
		while (this.peek() && !this.atTerminator(terms)) {
			const before = this.idx;

			// A bare "!" repeats the previous step: "a ! !" is "a a a".
			if (this.peek()!.kind === "excl") {
				this.next();
				const prev = items[items.length - 1];
				if (prev) items.push(prev);
				else this.errors.push({ pos: this.toks[this.idx - 1].pos, msg: '"!" with nothing to repeat' });
				continue;
			}

			const term = this.parseTerm();
			if (term) {
				// "a!3" occupies THREE steps of this sequence - unlike "a*3", which
				// subdivides one. Pushing the same node repeatedly is what makes that
				// true; resolve.ts dedupes by source position so the rewrite only
				// touches each token once.
				for (let i = 0; i < term.replicate; i++) items.push({ node: term.node, weight: term.weight });
			}
			if (this.idx === before) {
				// no progress - avoid infinite loop
				this.errors.push({ pos: this.peek()!.pos, msg: "parse stalled" });
				this.next();
			}
		}
		return { kind: "seq", items };
	}

	private parseTerm(): (Weighted & { replicate: number }) | null {
		let node = this.parseAtom();
		if (!node) return null;
		let weight = 1;
		let replicate = 1;

		// modifiers
		for (;;) {
			const t = this.peek();
			if (!t) break;
			if (t.kind === "star") {
				this.next();
				const f = this.parseNumber() ?? 1;
				node = { kind: "repeat", node, factor: f };
			} else if (t.kind === "at") {
				this.next();
				weight = this.parseNumber() ?? 1;
			} else if (t.kind === "excl" && !t.sp) {
				// Attached: "a!3" is three copies, a bare "a!" is two. A SPACED "!" is a
				// step of its own ("a ! !"), handled by parseSequence - so leave it.
				this.next();
				replicate = Math.max(1, Math.round(this.parseNumber() ?? 2));
			} else if (t.kind === "lparen") {
				node = this.parseEuclid(node);
			} else {
				break;
			}
		}
		return { node, weight, replicate };
	}

	private parseAtom(): Node | null {
		const t = this.peek();
		if (!t) return null;
		switch (t.kind) {
			case "note":
				this.next();
				return { kind: "note", name: t.value, pos: t.pos, len: t.value.length };
			case "number":
				this.next();
				// A bare number is a scale degree, not a raw MIDI pitch - notes.ts
				// resolves it against Live's global scale.
				return { kind: "note", name: t.value, pos: t.pos, len: t.value.length };
			case "rest":
				this.next();
				return { kind: "rest" };
			case "lbracket":
				return this.parseGroup();
			case "langle":
				return this.parseAlt();
			case "lbrace":
				return this.parsePoly();
			default:
				this.errors.push({ pos: t.pos, msg: `unexpected "${t.value}"` });
				return null;
		}
	}

	/** "[" seqList "]" - comma → stack. */
	private parseGroup(): Node {
		this.next(); // consume [
		const layers = this.parseSeqList("rbracket");
		this.expect("rbracket");
		return layers.length === 1 ? layers[0] : { kind: "stack", layers };
	}

	/** "<" sequence ">" - one item per cycle. */
	private parseAlt(): Node {
		this.next(); // consume <
		const seq = this.parseSequence(["rangle"]);
		this.expect("rangle");
		// Alternation cycles through the top-level items of the inner sequence.
		const items =
			seq.kind === "seq" ? seq.items.map((w) => w.node) : [seq];
		return { kind: "alt", items };
	}

	/** "{" seqList "}" ("%" INT)? - polymeter. */
	private parsePoly(): Node {
		this.next(); // consume {
		const layers = this.parseSeqList("rbrace");
		this.expect("rbrace");
		let steps = seqLength(layers[0]);
		if (this.peek()?.kind === "percent") {
			this.next();
			steps = this.parseNumber() ?? steps;
		}
		return { kind: "poly", layers, steps: Math.max(1, steps) };
	}

	private parseSeqList(term: Terminator): Node[] {
		const layers: Node[] = [];
		layers.push(this.parseSequence([term]));
		while (this.peek()?.kind === "comma") {
			this.next();
			layers.push(this.parseSequence([term]));
		}
		return layers;
	}

	private parseEuclid(node: Node): Node {
		this.next(); // consume (
		const pulses = this.parseNumber() ?? 1;
		this.expectComma();
		const steps = this.parseNumber() ?? 1;
		let rotation = 0;
		if (this.peek()?.kind === "comma") {
			this.next();
			rotation = this.parseNumber() ?? 0;
		}
		this.expect("rparen");
		return { kind: "euclid", node, pulses, steps, rotation };
	}

	private parseNumber(): number | null {
		const t = this.peek();
		if (t?.kind === "number") {
			this.next();
			return parseFloat(t.value);
		}
		return null;
	}

	private expect(kind: TokKind): void {
		const t = this.peek();
		if (t?.kind === kind) this.next();
		else if (t) this.errors.push({ pos: t.pos, msg: `expected ${kind}, got "${t.value}"` });
		else this.errors.push({ pos: -1, msg: `expected ${kind}, got end of input` });
	}

	private expectComma(): void {
		const t = this.peek();
		if (t?.kind === "comma") this.next();
		else if (t) this.errors.push({ pos: t.pos, msg: `expected "," got "${t.value}"` });
	}
}

function seqLength(node: Node): number {
	return node.kind === "seq" ? node.items.length : 1;
}
