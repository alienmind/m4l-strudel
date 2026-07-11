import { expect, test } from "vitest";
import { bootScope, compile, queryWindow, hapToNote } from "../shared/engine.mjs";

test("4 onsets/cycle, midichan carried", async () => {
	await bootScope();
	const pat = await compile('$: note("c3 e3 g3 b3").midichan(2)\n$: note("c1*2")');
	const haps = queryWindow(pat, 0, 1, 0.5);
	expect(haps.length).toBe(6);
	const notes = haps.map((h) => hapToNote(h, 0.5));
	expect(notes.filter((n) => n.chan === 2).length).toBe(4);
});
