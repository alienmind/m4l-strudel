import { beforeAll, describe, expect, test } from "vitest";
import { bootScope, compile, queryWindow, hapToNote, hapToVoice } from "../shared/engine.mjs";

test("4 onsets/cycle, midichan carried", async () => {
	await bootScope();
	const pat = await compile('$: note("c3 e3 g3 b3").midichan(2)\n$: note("c1*2")');
	const haps = queryWindow(pat, 0, 1, 0.5);
	expect(haps.length).toBe(6);
	const notes = haps.map((h) => hapToNote(h, 0.5));
	expect(notes.filter((n) => n.chan === 2).length).toBe(4);
});

describe("the drum map, and what outranks it", () => {
	const ctx = { drumMap: { bd: 36, sd: 38, hh: 42 } };
	const pitches = async (code) => {
		const pat = await compile(code);
		return queryWindow(pat, 0, 1, 0.5).map((h) => hapToNote(h, 0.5, ctx)?.pitch ?? null);
	};

	beforeAll(() => bootScope());

	test("a sample name plays its Drum Rack pad", async () => {
		expect(await pitches('s("bd sd hh")')).toEqual([36, 38, 42]);
	});

	test("a sample INDEX still plays the pad, not the index", async () => {
		// s("bd:3") is {s:"bd", n:3} - the fourth bd sample, not MIDI note 3. Reading
		// `n` ahead of the map sounded this an octave below the piano's bottom key.
		expect(await pitches('s("bd:3 sd:1")')).toEqual([36, 38]);
		expect(await pitches('n("1 2").s("bd")')).toEqual([36, 36]);
	});

	test("an explicit note outranks the map", async () => {
		// 48, not 60: the engine speaks Strudel's scientific pitch, where c5 is 72.
		expect(await pitches('note("c3").s("bd")')).toEqual([48]);
	});

	test("an unmapped name stays silent, as it must", async () => {
		expect(await pitches('s("tabla")')).toEqual([null]);
	});

	test("without a drum map, n is a pitch again", async () => {
		const pat = await compile('n("60 62")');
		expect(queryWindow(pat, 0, 1, 0.5).map((h) => hapToNote(h, 0.5).pitch)).toEqual([60, 62]);
	});
});

describe("the sampler voice sink: haps keyed by sample name, no pitch", () => {
	beforeAll(() => bootScope());
	const voices = async (code) => {
		const pat = await compile(code);
		return queryWindow(pat, 0, 1, 0.5).map((h) => hapToVoice(h, 0.5));
	};

	test("s() names survive with no drum map - the pitchless path", async () => {
		// hapToNote would DROP these (no pitch); hapToVoice keeps them by name. Commas
		// layer, so bd/hh/sd all land in one cycle - the polyphony the [poly~] gives free.
		const got = await voices('s("bd sd, hh*2")');
		expect(got.map((v) => v.s).sort()).toEqual(["bd", "hh", "hh", "sd"]);
	});

	test("n is the variation index, speed is the rate, gain is the velocity", async () => {
		const [v] = await voices('s("bd:2").speed(2).gain(0.5)');
		expect(v.s).toBe("bd");
		expect(v.n).toBe(2);
		expect(v.rate).toBe(2);
		expect(v.velocity).toBe(Math.round(0.5 * 127));
	});

	test("a drum pad defaults to rate 1", async () => {
		const [v] = await voices('s("bd")');
		expect(v.rate).toBe(1);
	});

	test("a hap that names no sample is null, not a voice", async () => {
		expect(await voices('note("c3")')).toEqual([null]);
	});
});
