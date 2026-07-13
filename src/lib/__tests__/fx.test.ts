import { describe, it, expect } from "vitest";
import {
	formatFxChain,
	NEUTRAL,
	parseFxChain,
	quantize,
	RACK,
	unsupportedMessage,
	type FxParams,
} from "../fx";

describe("parseFxChain", () => {
	it("reads a chain into parameter values", () => {
		const r = parseFxChain(".lpf(800).gain(1.2)");
		expect(r.error).toBeNull();
		expect(r.params).toEqual({ ...NEUTRAL, cutoff: 800, gain: 1.2 });
		expect(r.used).toEqual(["cutoff", "gain"]);
	});

	it("an empty line is the chain that does nothing", () => {
		expect(parseFxChain("").params).toEqual(NEUTRAL);
		expect(parseFxChain("   ").params).toEqual(NEUTRAL);
		expect(parseFxChain("").used).toEqual([]);
	});

	it("leaves the effects the line does not mention at their neutral value", () => {
		// .gain() alone must not also slam the filter shut.
		expect(parseFxChain(".gain(0.5)").params).toEqual({
			...NEUTRAL,
			gain: 0.5,
		});
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

	it("reads the delay and reverb stages the rack now really has", () => {
		const r = parseFxChain(".room(0.4).delay(0.3).delaytime(125).delayfeedback(0.6).drive(2)");
		expect(r.error).toBeNull();
		expect(r.unsupported).toEqual([]);
		expect(r.params).toEqual({
			...NEUTRAL,
			room: 0.4,
			delay: 0.3,
			delaytime: 125,
			delayfeedback: 0.6,
			drive: 2,
		});
	});

	it("names the used effects in rack order, not typing order", () => {
		// .gain(2).lpf(800) and .lpf(800).gain(2) are the same signal path - the
		// graph is frozen (ARCHITECTURE §3c) - so they must read back the same.
		expect(parseFxChain(".gain(2).lpf(800)").used).toEqual(["cutoff", "gain"]);
		expect(parseFxChain(".lpf(800).gain(2)").used).toEqual(["cutoff", "gain"]);
	});

	it("names an effect Strudel has but this device cannot make a sound with", () => {
		const r = parseFxChain(".lpf(500).crush(4)");
		expect(r.error).toBeNull();
		expect(r.unsupported).toEqual(["crush"]);
		// The rest of the line still applies - one unbuilt effect does not throw the
		// whole chain away.
		expect(r.params.cutoff).toBe(500);
		expect(unsupportedMessage(r.unsupported)).toContain("no Max chain yet");
	});

	it("tells an unbuilt effect apart from a typo", () => {
		expect(unsupportedMessage(["crush"])).toContain("no Max chain yet");
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

describe("formatFxChain", () => {
	it("writes the line that would set these parameters", () => {
		expect(formatFxChain({ ...NEUTRAL, cutoff: 800, gain: 1.2 }, ["cutoff", "gain"])).toBe(
			".lpf(800).gain(1.2)",
		);
	});

	it("says nothing about a chain that does nothing", () => {
		expect(formatFxChain(NEUTRAL, [])).toBe("");
	});

	it("writes a stage the user named even at its neutral value", () => {
		// Added from the (+) panel: it is on screen, so it belongs in the line, even
		// though it is not yet doing anything to the sound.
		expect(formatFxChain(NEUTRAL, ["room"])).toBe(".room(0)");
	});

	it("writes a stage nobody named but something moved", () => {
		// An automation lane opened the filter. The line has to admit it.
		expect(formatFxChain({ ...NEUTRAL, cutoff: 400 }, [])).toBe(".lpf(400)");
	});

	it("emits in rack order whatever order it is given", () => {
		expect(formatFxChain({ ...NEUTRAL, cutoff: 800, gain: 2 }, ["gain", "cutoff"])).toBe(".lpf(800).gain(2)");
	});

	it("rounds a dial to what the line can say", () => {
		// A slider travels continuously; .lpf(4021.3287654321) is unreadable and
		// makes the text box rewrite itself on every pixel of travel.
		expect(formatFxChain({ ...NEUTRAL, cutoff: 4021.3287654321, gain: 1.23456 }, [])).toBe(
			".lpf(4021).gain(1.23)",
		);
	});
});

describe("the line and the dials are the same control", () => {
	// The Audio FX screen only works because these two are exact inverses over
	// quantized values: the parameters are the truth and the line is drawn from
	// them (src/app/fx/App.tsx). If a round trip drifted by a decimal, the text box
	// would fight every knob in the device.
	it("parse(format(p)) === p, for every stage in the rack", () => {
		const p: FxParams = {
			cutoff: 4021,
			drive: 2.5,
			delay: 0.3,
			delaytime: 125,
			delayfeedback: 0.66,
			room: 0.4,
			gain: 1.2,
		};
		expect(parseFxChain(formatFxChain(p, [])).params).toEqual(p);
	});

	it("format(parse(line)) === line, once the line is quantized", () => {
		const line = ".lpf(800).drive(2).delay(0.3).delaytime(125).delayfeedback(0.6).room(0.4).gain(1.2)";
		const r = parseFxChain(line);
		expect(formatFxChain(r.params, r.used)).toBe(line);
	});

	it("a value the line cannot say is snapped on the way in, not silently kept", () => {
		expect(parseFxChain(".lpf(800.7)").params.cutoff).toBe(801);
		expect(quantize("gain", 1.23456)).toBe(1.23);
	});
});

describe("the rack table", () => {
	it("is the one place a stage is declared", () => {
		// NEUTRAL is derived from it, so the two cannot drift apart.
		expect(Object.keys(NEUTRAL).sort()).toEqual(RACK.map((s) => s.param).sort());
	});
});
