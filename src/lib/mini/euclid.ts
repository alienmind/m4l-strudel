/**
 * euclid.ts - Bjorklund's algorithm for Euclidean rhythms.
 * bjorklund(3, 8) → [true,false,false,true,false,false,true,false]
 */
export function bjorklund(pulses: number, steps: number): boolean[] {
	if (steps <= 0) return [];
	pulses = Math.max(0, Math.min(pulses, steps));
	if (pulses === 0) return new Array(steps).fill(false);
	if (pulses === steps) return new Array(steps).fill(true);

	let groups: boolean[][] = [];
	for (let i = 0; i < pulses; i++) groups.push([true]);
	let remainders: boolean[][] = [];
	for (let i = 0; i < steps - pulses; i++) remainders.push([false]);

	while (remainders.length > 1) {
		const n = Math.min(groups.length, remainders.length);
		const newGroups: boolean[][] = [];
		for (let i = 0; i < n; i++) newGroups.push(groups[i].concat(remainders[i]));
		const newRemainders: boolean[][] =
			groups.length > remainders.length
				? groups.slice(n)
				: remainders.slice(n);
		groups = newGroups;
		remainders = newRemainders;
	}

	const pattern: boolean[] = [];
	for (const g of groups.concat(remainders)) for (const b of g) pattern.push(b);
	return pattern;
}

/** Rotate a boolean pattern left by `rotation` steps. */
export function rotate(pattern: boolean[], rotation: number): boolean[] {
	if (pattern.length === 0) return pattern;
	const r = ((rotation % pattern.length) + pattern.length) % pattern.length;
	return pattern.slice(r).concat(pattern.slice(0, r));
}
