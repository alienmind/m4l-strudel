/**
 * ast.ts - node types for the Strudel mini-notation parser.
 *
 * A pattern is a tree. Scheduling (schedule.ts) walks the tree for a given cycle
 * index and produces timed note events in cycle-relative units (0..1 per cycle).
 */

export interface Weighted {
	node: Node;
	weight: number; // from '@'; default 1
}

export type Node =
	/** `pos`/`len` locate the token in the source, so a rewrite pass can replace
	 *  it in place (see resolve.ts) without re-printing the whole pattern. */
	| { kind: "note"; name: string; pos: number; len: number }
	| { kind: "rest" }
	| { kind: "seq"; items: Weighted[] } // whitespace-separated sequence
	| { kind: "stack"; layers: Node[] } // "," inside [ ] or { } → parallel
	| { kind: "alt"; items: Node[] } // <a b c> - one per cycle
	| { kind: "poly"; layers: Node[]; steps: number } // {a, b}%n polymeter
	| { kind: "repeat"; node: Node; factor: number } // a*2
	| { kind: "euclid"; node: Node; pulses: number; steps: number; rotation: number };

export interface ParseError {
	pos: number;
	msg: string;
}
