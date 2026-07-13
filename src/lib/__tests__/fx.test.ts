import { describe, it, expect } from "vitest";
import { NEUTRAL, parseFxChain, unsupportedMessage } from "../fx";

describe("parseFxChain", () => {
	it("reads a chain into parameter values", () => {
		const r = parseFxChain(".lpf(800).gain(1.2)");
		expect(r.error).toBeNull();
		expect(r.params).toEqual({ cutoff: 800, gain: 1.2 });
	});

	it("an empty line is the chain that does nothing", () => {
		expect(parseFxChain("").params).toEqual(NEUTRAL);
		expect(parseFxChain("   ").params).toEqual(NEUTRAL);
	});

	it("leaves the effects the line does not mention at their neutral value", () => {
		// .gain() alone must not also slam the filter shut.
		expect(parseFxChain(".gain(0.5)").params).toEqual({ cutoff: 18000, gain: 0.5 });
	});

	it("takes cutoff as a synonym for lpf, the way Strudel does", () => {
		expect(parseFxChain(".cutoff(440)").params.cutoff).toBe(440);
	});

	it("the last call wins, as it does in Strudel", () => {
		expect(parseFxChain(".gain(1).gain(2)").params.gain).toBe(2);
	});

	it("takes the cutoff in Hz - no hidden 0-1 mapping", () => {
		// The parameter carries real Hz (see surface.ts), so the number the user
		// types is the number the filter gets. A normalised dial with the curve in
		// the chain would make .lpf(800) mean nothing at all.
		expect(parseFxChain(".lpf(800)").params.cutoff).toBe(800);
	});

	it("names an effect Strudel has but this device cannot make a sound with", () => {
		const r = parseFxChain(".lpf(500).room(0.3)");
		expect(r.error).toBeNull();
		expect(r.unsupported).toEqual(["room"]);
		// The rest of the line still applies - one unbuilt effect does not throw the
		// whole chain away.
		expect(r.params.cutoff).toBe(500);
		expect(unsupportedMessage(r.unsupported)).toContain("no Max chain yet");
	});

	it("tells an unbuilt effect apart from a typo", () => {
		expect(unsupportedMessage(["room"])).toContain("no Max chain yet");
		expect(unsupportedMessage(["lpff"])).toContain("not an effect this device knows");
	});

	it("rejects a line that is not a chain", () => {
		expect(parseFxChain("lpf(800)").error).toMatch(/starts with a dot/);
	});

	it("rejects a modulated value, which is v2 - and says why", () => {
		// .lpf(sine.range(200, 2000)) needs the parameter re-written on every tick.
		// It must fail loudly, not silently apply some nonsense number.
		const r = parseFxChain(".lpf(sine.range(200, 2000))");
		expect(r.error).toMatch(/constant values only/);
		expect(r.params).toEqual(NEUTRAL);
	});

	it("rejects a non-numeric argument", () => {
		expect(parseFxChain('.gain("loud")').error).toMatch(/needs a number/);
	});

	it("does not evaluate anything but the chain", () => {
		// The recorder is the only name in scope, so a line reaching for the outside
		// world throws rather than resolving to something.
		expect(parseFxChain(".lpf(globalThis)").error).not.toBeNull();
	});
});
