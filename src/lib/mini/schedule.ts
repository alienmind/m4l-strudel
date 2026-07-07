/**
 * schedule.ts - evaluate a mini-notation AST for a given cycle into timed
 * events. Times are in cycle-relative units: start/duration in [0,1) where 1 is
 * one full cycle.
 */

import type { Node } from "./ast";
import { bjorklund, rotate } from "./euclid";

export interface Ev {
	note: string; // note token as written (resolved to MIDI later)
	start: number; // cycle-relative
	duration: number;
}

/** Schedule a node over the unit span [0,1) for the given cycle index. */
export function schedule(node: Node, cycle: number): Ev[] {
	return scheduleSpan(node, cycle, 0, 1);
}

function scheduleSpan(
	node: Node,
	cycle: number,
	start: number,
	span: number,
): Ev[] {
	switch (node.kind) {
		case "rest":
			return [];
		case "note":
			return [{ note: node.name, start, duration: span }];

		case "seq": {
			if (node.items.length === 0) return [];
			const totalWeight = node.items.reduce((s, w) => s + w.weight, 0);
			const out: Ev[] = [];
			let cursor = start;
			for (const item of node.items) {
				const frac = (item.weight / totalWeight) * span;
				out.push(...scheduleSpan(item.node, cycle, cursor, frac));
				cursor += frac;
			}
			return out;
		}

		case "stack": {
			const out: Ev[] = [];
			for (const layer of node.layers) {
				out.push(...scheduleSpan(layer, cycle, start, span));
			}
			return out;
		}

		case "alt": {
			if (node.items.length === 0) return [];
			const chosen = node.items[((cycle % node.items.length) + node.items.length) % node.items.length];
			return scheduleSpan(chosen, cycle, start, span);
		}

		case "repeat": {
			const f = Math.max(1, Math.round(node.factor));
			const out: Ev[] = [];
			const sub = span / f;
			for (let r = 0; r < f; r++) {
				// Each repetition advances the cycle so inner <> alternations move.
				out.push(...scheduleSpan(node.node, cycle * f + r, start + r * sub, sub));
			}
			return out;
		}

		case "euclid": {
			const pattern = rotate(bjorklund(node.pulses, node.steps), node.rotation);
			const out: Ev[] = [];
			const sub = span / node.steps;
			for (let i = 0; i < node.steps; i++) {
				if (pattern[i]) {
					out.push(...scheduleSpan(node.node, cycle, start + i * sub, sub));
				}
			}
			return out;
		}

		case "poly": {
			const out: Ev[] = [];
			const steps = node.steps;
			const sub = span / steps;
			for (const layer of node.layers) {
				const elems = layer.kind === "seq" ? layer.items : [{ node: layer, weight: 1 }];
				const m = elems.length;
				if (m === 0) continue;
				for (let i = 0; i < steps; i++) {
					const elem = elems[(cycle * steps + i) % m];
					out.push(...scheduleSpan(elem.node, cycle, start + i * sub, sub));
				}
			}
			return out;
		}
	}
}
