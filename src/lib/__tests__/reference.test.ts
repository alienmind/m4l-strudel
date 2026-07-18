import { describe, expect, it } from "vitest";
import { RACK, unsupportedMessage } from "@/lib/fx";
import { CATEGORIES, DEVICE_BLURB, REFERENCE, referenceFor, searchReference, tokenAtCaret } from "@/lib/reference";

/**
 * The reference is DATA ABOUT THE DEVICES, so it can be wrong in the one way docs are
 * always wrong: by describing what used to be true. These tests tie it to the code it
 * describes - `.crush()` moved from "not yet" to "works" in R1b, and a reference that
 * still said "not yet" would be worse than no reference, because it would be believed.
 */
describe("the reference describes THESE devices", () => {
	it("every effect the rack really has is listed as working", () => {
		// RACK is the fx device's actual signal path. If a stage is in it, the help
		// cannot be telling people it does nothing.
		for (const stage of RACK) {
			const entry = REFERENCE.find((e) => e.name.startsWith(`.${stage.call}(`));
			expect(entry, `.${stage.call}() is in the RACK but missing from the reference`).toBeDefined();
			expect(entry!.status, `.${stage.call}() has a Max chain but the reference says "${entry!.status}"`).toBe("live");
		}
	});

	it("nothing is advertised as working that the device would refuse", () => {
		// The mirror of the above: an entry marked `live` whose effect the parser calls
		// unsupported would send a user to type something that makes no sound.
		for (const e of REFERENCE) {
			if (e.status !== "live") continue;
			const call = /^\.(\w+)\(/.exec(e.name)?.[1];
			if (!call) continue; // a signal (sine) or syntax, not an effect call
			const msg = unsupportedMessage([call]);
			// unsupportedMessage only speaks about effects the parser did NOT apply.
			expect(msg, `the reference says .${call}() works, but the parser reports: ${msg}`).not.toContain("no Max chain yet");
		}
	});

	it("an unbuilt effect is named as such, not as a typo", () => {
		const vowel = REFERENCE.find((e) => e.name.startsWith(".vowel("));
		expect(vowel?.status).toBe("unbuilt");
		// ...and the parser agrees it is known-but-unbuilt rather than unknown.
		expect(unsupportedMessage(["vowel"])).toContain("no Max chain yet");
	});

	it("every entry has an example and lands in a known category", () => {
		for (const e of REFERENCE) {
			expect(e.example.length, `${e.name} has no example`).toBeGreaterThan(0);
			expect(CATEGORIES, `${e.name} is in category "${e.category}"`).toContain(e.category);
		}
	});

	it("a device only sees the vocabulary that applies to it", () => {
		// Signals are the fx device's: a MIDI device has no live.remote~ to drive.
		const fx = referenceFor("fx").map((e) => e.name);
		const midi = referenceFor("midi").map((e) => e.name);
		expect(fx).toContain("sine");
		expect(midi).not.toContain("sine");
		// ...and s("bd sd") is the MIDI devices', since the drum map is what resolves it.
		expect(midi).toContain('s("bd sd")');
		expect(fx).not.toContain('s("bd sd")');
	});

	it("MINI-NOTATION IS NOT ON THE FX DEVICE - its line is a method chain", () => {
		// This is the bug that shipped: every entry without an `only` was shown on every
		// device, so `<a b>` turned up on a device whose line is `.lpf(800).gain(1.2)`.
		// It has never meant anything there. `only` is now required for exactly this.
		const fx = referenceFor("fx");
		expect(fx.map((e) => e.name)).not.toContain("<a b>");
		expect(fx.every((e) => e.category === "Effects" || e.category === "Modulation")).toBe(true);

		// ...and it IS on the devices that take a pattern.
		expect(referenceFor("midi").map((e) => e.name)).toContain("<a b>");
		expect(referenceFor("midi-drums").map((e) => e.name)).toContain("<a b>");
	});

	it("every device's help is non-empty and about that device", () => {
		// A device whose `only` nobody wrote would show a blank window - the failure
		// that a required field makes impossible to reach by accident.
		for (const d of ["fx", "midi", "midi-drums", "drums-sampler"] as const) {
			expect(referenceFor(d).length, `${d} has no reference entries at all`).toBeGreaterThan(0);
			expect(DEVICE_BLURB[d], `${d} has no blurb`).toBeTruthy();
		}
		// The sample browser has NO reference and no `?` button: it takes no Strudel at
		// all, so "which features are supported" is a question it cannot be asked. Help
		// there answered nothing and implied a box to type into that does not exist.
		expect(referenceFor("sample-browser")).toEqual([]);
	});

	it("every entry declares its devices - the field that stops help from leaking", () => {
		for (const e of REFERENCE) {
			expect(e.only.length, `${e.name} declares no devices, so it would show everywhere or nowhere`).toBeGreaterThan(0);
		}
	});

	it("the caret's token is what gets looked up, mid-typing", () => {
		// Half-typed code does not parse, which is exactly when help is wanted - so this
		// reads backwards for a word rather than parsing.
		expect(tokenAtCaret(".lpf(80", 7)).toBe("lpf"); // inside the call: the FUNCTION, not the number
		expect(tokenAtCaret(".lpf(", 5)).toBe("lpf");
		expect(tokenAtCaret(".cru", 4)).toBe("cru"); // mid-word
		expect(tokenAtCaret("sin", 3)).toBe("sin");
		expect(tokenAtCaret("", 0)).toBe("");
		// A caret on a bracket has nothing to look up - which means "show everything".
		expect(tokenAtCaret("[a b] ", 6)).toBe("");
		// ...and a partial name still finds the entry, by substring.
		expect(searchReference(referenceFor("fx"), tokenAtCaret(".cru", 4)).map((e) => e.name)).toContain(".crush(bits)");
	});

	it("search looks where a stuck user would type", () => {
		const all = referenceFor("fx");
		expect(searchReference(all, "lpf").map((e) => e.name)).toContain(".lpf(hz)");
		// ...by what it DOES, not just by its name
		expect(searchReference(all, "bit").map((e) => e.name)).toContain(".crush(bits)");
		expect(searchReference(all, "").length).toBe(all.length);
		expect(searchReference(all, "zzzz")).toEqual([]);
	});
});
