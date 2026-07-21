/**
 * recompile.test.ts - what may, and may not, re-evaluate a playing pattern.
 *
 * THE BUG THIS PINS. `useStrudelEngine` deliberately keeps `text` OUT of the recompile
 * effect's dependencies and reads it from a ref, so typing never re-evaluates - that is
 * what Ctrl+Enter is for. But the effect depends on `noteCtx`, and `noteCtx` was
 * memoized on the ctx object's IDENTITY. The Superdough device passed an inline
 * `ctx={{}}`, so every render produced a new object, so every keystroke (which sets
 * `text` state, which re-renders) recompiled the pattern mid-phrase.
 *
 * The memo is keyed on the ctx's CONTENTS now. This pins the rule that fixed it: two
 * ctx objects that describe the same thing must produce the same key, whoever allocated
 * them. `noteCtxKey` mirrors the hook's derivation; the hook needs React, the rule does
 * not, and the rule is the part that was wrong.
 */
import { describe, expect, it } from "vitest";

/** The hook's key: what actually decides whether a recompile fires. */
function noteCtxKey(ctx: unknown): string {
	return JSON.stringify(ctx ?? {});
}

describe("a playing pattern re-evaluates only when it should", () => {
	it("an inline empty ctx does not change between renders", () => {
		// The exact Superdough call site: `ctx: {}` written fresh each render.
		const renderOne = noteCtxKey({});
		const renderTwo = noteCtxKey({});
		expect(renderTwo).toBe(renderOne);
	});

	it("a rebuilt ctx with identical contents does not change", () => {
		// The MIDI devices rebuild their context from state on every render. Same scale,
		// same map, same octave: no recompile, however many times it is reallocated.
		const build = () => ({ scale: "C:major", drumMap: { bd: 36, sd: 38 }, octaveOffset: 0 });
		expect(noteCtxKey(build())).toBe(noteCtxKey(build()));
	});

	it("a REAL change still recompiles - the feature this must not break", () => {
		const before = noteCtxKey({ scale: "C:major", drumMap: { bd: 36 } });
		expect(noteCtxKey({ scale: "D:minor", drumMap: { bd: 36 } })).not.toBe(before);
		expect(noteCtxKey({ scale: "C:major", drumMap: { bd: 38 } })).not.toBe(before);
		// A scale toggled off is absent, not empty - and that is a change too.
		expect(noteCtxKey({ drumMap: { bd: 36 } })).not.toBe(before);
	});

	it("a missing ctx is the same as an empty one", () => {
		expect(noteCtxKey(undefined)).toBe(noteCtxKey({}));
	});
});
