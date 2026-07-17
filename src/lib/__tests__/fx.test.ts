import { describe, it, expect } from "vitest";
import {
	formatFxChain,
	NEUTRAL,
	patternSources,
	queryFxPattern,
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
		const r = parseFxChain(".lpf(500).phaser(0.5)");
		expect(r.error).toBeNull();
		expect(r.unsupported).toEqual(["phaser"]);
		// The rest of the line still applies - one unbuilt effect does not throw the
		// whole chain away.
		expect(r.params.cutoff).toBe(500);
		expect(unsupportedMessage(r.unsupported)).toContain("no Max chain yet");
	});

	it("tells an unbuilt effect apart from a typo", () => {
		expect(unsupportedMessage(["phaser"])).toContain("no Max chain yet");
		expect(unsupportedMessage(["lpff"])).toContain("not an effect this device knows");
	});

	it("reads .hpf() and .crush() - the rack really has them now", () => {
		// Both used to be named-and-refused; they are static chains as of R1b, so the
		// line must APPLY them rather than report them.
		const r = parseFxChain(".hpf(200).crush(4)");
		expect(r.error).toBeNull();
		expect(r.unsupported).toEqual([]);
		expect(r.params).toEqual({ ...NEUTRAL, hpfreq: 200, crush: 4 });
	});

	it("takes hcutoff as a synonym for hpf, the way Strudel does", () => {
		expect(parseFxChain(".hcutoff(300)").params.hpfreq).toBe(300);
	});

	it("rests hpf at 0 Hz and crush at full depth - the settings where they are wires", () => {
		// The frozen-graph law: every stage is always in the signal path, so a line
		// that never mentions these two must still be silent about them. 0 Hz is where
		// the hpf's subtracted low end is nothing; 24 bits is degrade~ untouched.
		// NOT Strudel's crush(16), which still quantises - see RACK in fx.ts.
		expect(NEUTRAL.hpfreq).toBe(0);
		expect(NEUTRAL.crush).toBe(24);
		expect(formatFxChain(NEUTRAL, [])).toBe("");
	});

	it("puts hpf and crush in the frozen order, next to the stage each belongs to", () => {
		// filter -> dirt -> sends -> level, and the line reads back that way whatever
		// order it was typed in (the patcher is composed in this same order).
		const r = parseFxChain(".gain(2).crush(8).room(0.3).hpf(100).lpf(900)");
		expect(r.used).toEqual(["cutoff", "hpfreq", "crush", "room", "gain"]);
		expect(formatFxChain(r.params, r.used)).toBe(".lpf(900).hpf(100).crush(8).room(0.3).gain(2)");
	});

	it("rejects a line that is not a chain", () => {
		expect(parseFxChain("lpf(800)").error).toMatch(/starts with a dot/);
	});

	it("takes a modulated value - a signal is a stage the `remote` chain drives", () => {
		// This used to be refused ("v1 takes constant values only"). It is the whole of
		// R3: the arg is a Strudel signal, so the stage is MODULATED rather than set,
		// and the parameter is left alone for live.remote~ to drive.
		const r = parseFxChain(".lpf(sine.range(200, 2000))");
		expect(r.error).toBeNull();
		expect(r.patterned.map((p) => p.param)).toEqual(["cutoff"]);
		// The parameter keeps its neutral: the pattern is not a value, and nothing here
		// should pretend to know where the modulation will put it.
		expect(r.params.cutoff).toBe(NEUTRAL.cutoff);
		// ...but the stage IS named, so the UI shows it.
		expect(r.used).toEqual(["cutoff"]);
	});

	it("keeps the SOURCE of a modulated stage - it cannot be read back off a Pattern", () => {
		// The line is normally a projection of the parameters. A pattern is not in a
		// parameter, so its text is the only record of what the user asked for - print
		// the parameter instead and `.lpf(sine.range(...))` silently becomes `.lpf(1372)`.
		const r = parseFxChain(".lpf(sine.range(200, 2000)).gain(1.5)");
		expect(r.patterned[0].source).toBe("sine.range(200, 2000)");
		expect(formatFxChain(r.params, r.used, patternSources(r.patterned))).toBe(".lpf(sine.range(200, 2000)).gain(1.5)");
	});

	it("queries a modulated stage at a moment on the transport", () => {
		const r = parseFxChain(".lpf(sine.range(200, 2000))");
		const stage = r.patterned[0];
		// sine peaks a quarter of the way through its cycle and rests mid-range at 0.
		expect(queryFxPattern(stage, 0.25)).toBe(2000);
		expect(queryFxPattern(stage, 0)).toBe(1100);
		// ...and the value is quantized to what the line can say, exactly as a dial is.
		expect(Number.isInteger(queryFxPattern(stage, 0.1) as number)).toBe(true);
	});

	it("the last call still wins across the two kinds", () => {
		// `.lpf(sine).lpf(800)` is a plain 800: a stage that takes a new value drops the
		// modulation it had, or the two would fight over one parameter forever.
		const r = parseFxChain(".lpf(sine.range(200, 2000)).lpf(800)");
		expect(r.patterned).toEqual([]);
		expect(r.params.cutoff).toBe(800);
	});

	it("a name that is nothing at all is still a ReferenceError, and says what IS allowed", () => {
		expect(parseFxChain(".lpf(wobble)").error).toMatch(/is not defined/);
		expect(parseFxChain(".lpf(wobble)").error).toMatch(/signals/);
	});

	it("a global that is neither a number nor a pattern is refused, not applied", () => {
		// This is NOT a sandbox - a `new Function` body sees the global scope, so `fetch`
		// resolves here. What makes that harmless is that nothing CALLS what it is
		// handed: an argument is recorded, checked, and rejected unless it is a number
		// or a pattern. If that check ever loosens, this is the test that fails.
		const r = parseFxChain(".lpf(fetch)");
		expect(r.error).toMatch(/needs a number or a signal/);
		expect(r.params.cutoff).toBe(NEUTRAL.cutoff);
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
		// Every stage off its neutral, so the round trip actually exercises each one -
		// a neutral value would be skipped by formatFxChain and prove nothing.
		const p: FxParams = {
			cutoff: 4021,
			hpfreq: 200,
			drive: 2.5,
			crush: 8,
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
