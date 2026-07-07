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
	| "number";

interface Tok {
	kind: TokKind;
	value: string;
	pos: number;
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
	"~": "rest",
};

export function tokenize(src: string): { tokens: Tok[]; errors: ParseError[] } {
	const tokens: Tok[] = [];
	const errors: ParseError[] = [];
	let i = 0;
	while (i < src.length) {
		const ch = src[i];
		if (/\s/.test(ch)) {
			i++;
			continue;
		}
		if (SINGLE[ch]) {
			tokens.push({ kind: SINGLE[ch], value: ch, pos: i });
			i++;
			continue;
		}
		// number (integer or decimal, possibly negative octave handled in note)
		if (/[0-9]/.test(ch)) {
			let j = i;
			while (j < src.length && /[0-9.]/.test(src[j])) j++;
			tokens.push({ kind: "number", value: src.slice(i, j), pos: i });
			i = j;
			continue;
		}
		// note token: letter + accidentals + optional octave
		if (/[a-gA-G]/.test(ch)) {
			let j = i + 1;
			while (j < src.length && /[#sb]/.test(src[j])) j++;
			if (j < src.length && src[j] === "-") j++; // negative octave
			while (j < src.length && /[0-9]/.test(src[j])) j++;
			tokens.push({ kind: "note", value: src.slice(i, j), pos: i });
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
			const term = this.parseTerm();
			if (term) items.push(term);
			if (this.idx === before) {
				// no progress - avoid infinite loop
				this.errors.push({ pos: this.peek()!.pos, msg: "parse stalled" });
				this.next();
			}
		}
		return { kind: "seq", items };
	}

	private parseTerm(): Weighted | null {
		let node = this.parseAtom();
		if (!node) return null;
		let weight = 1;

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
			} else if (t.kind === "lparen") {
				node = this.parseEuclid(node);
			} else {
				break;
			}
		}
		return { node, weight };
	}

	private parseAtom(): Node | null {
		const t = this.peek();
		if (!t) return null;
		switch (t.kind) {
			case "note":
				this.next();
				return { kind: "note", name: t.value };
			case "number":
				this.next();
				return { kind: "note", name: t.value }; // raw MIDI number
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
