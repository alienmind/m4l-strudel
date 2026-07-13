/**
 * playhead.ts - which tokens of the pattern are sounding right now.
 *
 * strudel.cc highlights the step it is playing, and the feedback is most of what
 * makes a pattern legible while it runs. This is the same idea, computed from OUR
 * AST rather than from Strudel's hap locations: the tokens carry their source
 * positions (parser.ts), and schedule() already knows when each one sounds.
 *
 * It follows that only BARE MINI-NOTATION can be highlighted. Full Strudel code is
 * real JavaScript - its events come out of the engine with no link back to the
 * characters the user typed, so it simply gets no highlight.
 */

import { parseMini } from "./parser";
import { schedule } from "./schedule";
import type { Node } from "./ast";

/** A [start, end) range of the source text. */
export type Span = [number, number];

/**
 * The tokens sounding at `cycle` (an absolute cycle position, fractional - the
 * whole part picks the cycle, the fraction is the position within it).
 *
 * The cycle index is absolute, not reduced modulo the loop length, because that is
 * exactly what schedule() and Strudel both use to pick an alternation's item - so
 * a `<a b>` highlights the half that is really playing.
 */
export function activeSpans(ast: Node, cycle: number): Span[] {
	if (!Number.isFinite(cycle) || cycle < 0) return [];
	const c = Math.floor(cycle);
	const phase = cycle - c;
	const out: Span[] = [];
	for (const ev of schedule(ast, c)) {
		if (phase >= ev.start && phase < ev.start + ev.duration) {
			out.push([ev.pos, ev.pos + ev.len]);
		}
	}
	return out;
}

/** Cache the parse: the playhead re-asks ~20x a second, and the text rarely moves. */
export function parseForPlayhead(src: string): Node | null {
	const { ast, errors } = parseMini(src);
	return errors.length ? null : ast;
}
