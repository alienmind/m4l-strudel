/**
 * repl-shim.test.ts - what the shim does to a page it does not own.
 *
 * The shim is the only code of ours inside the local strudel.cc, it runs in a
 * window nobody may ever look at, and everything it does is a side effect on two
 * globals it did not create. That combination is exactly what goes wrong silently
 * in Live: a mis-sent selector, a restore that fires before the REPL has finished
 * booting, a knob that never arrives - none of them raise anything, they just
 * leave the device quiet or the pattern lost.
 *
 * So the page is faked here and the shim is run against it: the file is loaded as
 * source and evaluated with `window`, `document` and `localStorage` stubbed, which
 * is what a browser would hand it.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SHIM = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "repl-shim", "m4l-shim.js");
const source = readFileSync(SHIM, "utf8");

/** The REPL's placeholder buffer, before its own load has settled. */
const LOADING = "// LOADING";

type Handler = (...args: unknown[]) => void;

function makePage() {
	const outlets: unknown[][] = [];
	const inlets: Record<string, Handler> = {};
	const store: Record<string, string> = {};
	const dispatched: string[] = [];

	const editor = {
		code: LOADING,
		setCode: vi.fn((c: string) => {
			editor.code = c;
		}),
		evaluate: vi.fn(),
		stop: vi.fn(),
	};

	const max = {
		outlet: (...args: unknown[]) => outlets.push(args),
		bindInlet: (selector: string, fn: Handler) => {
			inlets[selector] = fn;
		},
	};

	const g = globalThis as Record<string, unknown>;
	g.window = { max: undefined, strudelMirror: undefined };
	g.document = { dispatchEvent: (e: { type: string }) => dispatched.push(e.type) };
	g.localStorage = {
		getItem: (k: string) => store[k] ?? null,
		setItem: (k: string, v: string) => {
			store[k] = v;
		},
	};
	g.MouseEvent = class {
		type: string;
		constructor(type: string) {
			this.type = type;
		}
	};

	return { outlets, inlets, store, dispatched, editor, max, win: g.window as Record<string, unknown> };
}

/** Everything the shim sent, by selector. */
const sent = (outlets: unknown[][], selector: string) => outlets.filter((o) => o[0] === selector);

describe("m4l-shim", () => {
	let page: ReturnType<typeof makePage>;

	beforeEach(() => {
		vi.useFakeTimers();
		page = makePage();
		// The page loads the shim BEFORE the REPL has mounted - that is the real
		// order, and the reason the shim waits rather than reading the editor now.
		new Function(source)();
	});

	afterEach(() => {
		vi.useRealTimers();
		for (const k of ["window", "document", "localStorage", "MouseEvent"]) delete (globalThis as Record<string, unknown>)[k];
	});

	/** Hand the shim the two globals it waits for, and let its poll notice. */
	function mount() {
		page.win.max = page.max;
		page.win.strudelMirror = page.editor;
		vi.advanceTimersByTime(200);
	}

	it("pins the audio output device before the app can read the setting", () => {
		// A leftover device name makes initAudio call setSinkId, which would steer the
		// sound to a sound card and away from the jweb~ outlets that ARE the track.
		expect(page.store["strudel-settingsaudioDeviceName"]).toBe("System Standard");
	});

	it("arms the audio with no click, because a hidden window never gets one", () => {
		mount();
		expect(page.dispatched).toContain("mousedown");
	});

	it("asks for the pattern the Live set is holding", () => {
		mount();
		expect(sent(page.outlets, "get_state")).toEqual([["get_state", "code"]]);
	});

	it("waits for the REPL's own load to settle before restoring the set's pattern", () => {
		mount();
		page.inlets.state_code(JSON.stringify('note("c3")'));

		// The REPL is still showing its placeholder: writing now would be overwritten
		// a moment later by its own initCode(), and the set's pattern would be lost.
		expect(page.editor.setCode).not.toHaveBeenCalled();

		page.editor.code = "// whatever the REPL loaded itself";
		vi.advanceTimersByTime(1000);
		expect(page.editor.setCode).toHaveBeenCalledWith('note("c3")');
	});

	it("persists the buffer to the code slot when it changes, evaluated or not", () => {
		mount();
		page.inlets.state_code(JSON.stringify("old"));
		page.editor.code = "old";
		vi.advanceTimersByTime(1000);

		// Typing that has not been evaluated is still work a musician expects to
		// survive a save, so the poll follows the buffer rather than the evaluate.
		page.editor.code = 'note("e3")';
		vi.advanceTimersByTime(1000);
		expect(sent(page.outlets, "sync_state").pop()).toEqual(["sync_state", "code", JSON.stringify('note("e3")')]);
	});

	it("does not write the slot again when nothing changed", () => {
		mount();
		page.inlets.state_code(JSON.stringify("same"));
		page.editor.code = "same";
		vi.advanceTimersByTime(5000);
		expect(sent(page.outlets, "sync_state")).toHaveLength(0);
	});

	it("turns the device's Play/Stop into evaluate and stop", () => {
		mount();
		page.inlets.set_play(1);
		expect(page.editor.evaluate).toHaveBeenCalled();
		page.inlets.set_play(0);
		expect(page.editor.stop).toHaveBeenCalled();
	});

	it("exposes the native dials as a SIGNAL, so a moving knob moves the sound", () => {
		// The failure this pins, seen in Live: m4lKnob() returned a plain number, the
		// pattern read it once at evaluation and froze it, and the dial did nothing
		// until you evaluated again. A signal is queried per cycle instead.
		const queried: unknown[] = [];
		(globalThis as Record<string, unknown>).signal = (fn: () => number) => ({ query: () => queried.push(fn()) });
		mount();
		page.inlets.set_s1(0.25);

		const knob = (page.win.m4lKnob as (n: number) => { query: () => void })(1);
		knob.query();
		page.inlets.set_s1(0.9); // the hand moves AFTER the pattern was evaluated
		knob.query();
		expect(queried).toEqual([0.25, 0.9]);

		delete (globalThis as Record<string, unknown>).signal;
	});

	it("falls back to a plain number before the REPL has loaded its modules", () => {
		// `signal` only reaches globalThis when the REPL calls evalScope, which is
		// after this file runs. A number is the honest answer until then.
		mount();
		page.inlets.set_s1(0.75);
		const m4lKnob = page.win.m4lKnob as (n: number) => number;
		expect(m4lKnob(1)).toBe(0.75);
	});

	it("reads an untouched or out-of-range dial as 0, never undefined", () => {
		// A pattern doing arithmetic on it must not get NaN.
		mount();
		const raw = page.win.m4lKnobValue as (n: number) => number;
		expect(raw(8)).toBe(0);
		expect(raw(99)).toBe(0);
	});

	it("says it is ready, so the wrapper's log shows the page came up", () => {
		mount();
		expect(sent(page.outlets, "shim_ready")).toEqual([["shim_ready", 1]]);
	});
});
