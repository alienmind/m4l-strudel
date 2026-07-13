/**
 * cycles.ts - how many cycles does a pattern take to repeat?
 *
 * `<a b>` alternates per cycle, so it does not loop back to its starting state
 * until cycle 2. Rendering one cycle of it - which is what To Clip used to do -
 * silently threw the second half of the pattern away. This walks the AST and
 * returns the true loop length, so the whole thing can be exported.
 *
 * Every case mirrors exactly what schedule.ts does with the cycle index; if one
 * changes, so must the other.
 */

import type { Node } from "./ast";

/** Deeply nested alternations multiply out fast; a clip has to end somewhere. */
export const MAX_CYCLES = 64;

export function astCycleLength(node: Node): { length: number; capped: boolean } {
	const len = cycleLength(node);
	return {
		length: Math.min(MAX_CYCLES, Math.max(1, len)),
		capped: len > MAX_CYCLES,
	};
}

function cycleLength(node: Node): number {
	switch (node.kind) {
		case "note":
		case "rest":
			return 1;

		case "seq":
			// Every item is visited every cycle, so the sequence repeats when all of
			// them do at once.
			return lcmAll(node.items.map((w) => cycleLength(w.node)));

		case "stack":
			return lcmAll(node.layers.map(cycleLength));

		case "alt": {
			const m = node.items.length;
			if (m === 0) return 1;
			// Item i is visited on cycles i, i+m, i+2m..., and advances one of its own
			// cycles per visit - so an item that takes N cycles to loop takes N*m.
			return lcmAll(node.items.map((item) => cycleLength(item) * m));
		}

		case "repeat": {
			// schedule() hands the inner node `cycle * f + r`, so the inner pattern
			// advances f times per outer cycle: it realigns after N / gcd(N, f).
			const f = Math.max(1, Math.round(node.factor));
			const n = cycleLength(node.node);
			return n / gcd(n, f);
		}

		case "euclid":
			// The inner node sees the cycle index unchanged.
			return cycleLength(node.node);

		case "poly": {
			// A layer of m elements read `steps` at a time realigns after
			// m / gcd(m, steps) cycles, on top of whatever the elements themselves need.
			const steps = Math.max(1, node.steps);
			return lcmAll(
				node.layers.map((layer) => {
					const elems = layer.kind === "seq" ? layer.items.map((w) => w.node) : [layer];
					const m = elems.length;
					if (m === 0) return 1;
					return lcm(m / gcd(m, steps), lcmAll(elems.map(cycleLength)));
				}),
			);
		}
	}
}

function gcd(a: number, b: number): number {
	a = Math.abs(Math.round(a));
	b = Math.abs(Math.round(b));
	while (b) [a, b] = [b, a % b];
	return a || 1;
}

function lcm(a: number, b: number): number {
	return Math.abs(a * b) / gcd(a, b) || 1;
}

function lcmAll(ns: number[]): number {
	return ns.reduce((acc, n) => {
		// We compute the true LCM to know if we crossed the cap.
		// We'll return the true value, and astCycleLength will cap it at the very end
		// so it can accurately report if capping occurred.
		return lcm(acc, n);
	}, 1);
}
