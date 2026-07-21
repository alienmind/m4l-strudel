/**
 * Headless Strudel engine.
 * - bootScope(): register @strudel/{core,mini,tonal} into globalThis (once).
 * - compile(code): code string -> Pattern ($:-aware, mirrors core/repl.mjs).
 * - queryWindow(pat, from, to, cps): onset haps in a cycle window.
 * - hapToNote(hap, cps, ctx): normalized MIDI-ish event or null (live play).
 * - hapToClipNote(hap, ctx): the same event in CYCLES, not ms (clip export).
 * - patternCycles(pat, cps, ctx): how many cycles before the pattern repeats.
 */
import { evalScope, evaluate, silence, stack, Pattern, isPattern, noteToMidi, createParams } from "@strudel/core";
import { transpiler } from "@strudel/transpiler";

let pPatterns = {};
let anonymousIndex = 0;

/** Mirrors repl.mjs injectPatternMethods (core/repl.mjs:352-383). */
export function installDollarCollector() {
	Pattern.prototype.p = function (id) {
		if (typeof id === "string" && (id.startsWith("_") || id.endsWith("_"))) return silence; // x_ / _x mutes a line
		if (String(id).includes("$")) id = `${id}${anonymousIndex++}`;
		pPatterns[id] = this;
		return this;
	};
	Pattern.prototype.q = function () {
		return silence;
	};
	for (let i = 1; i < 10; ++i) {
		Object.defineProperty(Pattern.prototype, `d${i}`, {
			get() {
				return this.p(i);
			},
			configurable: true,
		});
		Object.defineProperty(Pattern.prototype, `p${i}`, {
			get() {
				return this.p(i);
			},
			configurable: true,
		});
		Pattern.prototype[`q${i}`] = silence;
	}
}

/**
 * Publish Live's global scale into the pattern scope as `liveScale`, so code can
 * opt into STRUDEL's own scale implementation explicitly:
 *
 *   n("0 2 4").scale(liveScale)
 *
 * Deliberately a global rather than an injected `.scale()` call: appending one
 * would silently override a `.scale()` the user wrote, and could not be appended
 * to a multi-line `$:` pattern at all. Note that Strudel's implementation does not
 * always agree with Ableton's - see strudelAgrees() - which is what the UI warns
 * about when a pattern reaches for this.
 */
export function setLiveScale(name) {
	globalThis.liveScale = name;
}

/**
 * The repl-only helpers strudel.cc injects that a headless compile does not have.
 *
 * A pattern written on strudel.cc reaches for setcps() (the site's scheduler owns
 * tempo), slider() (a codemirror widget), and _scope()/.fill() (canvas visualisers).
 * Compiled here they throw `X is not defined` and the whole pattern fails to evaluate.
 * None of them drive anything in this engine - Live owns tempo, native dials own any
 * slider, there is no canvas - so they become the smallest shims that let the code
 * evaluate to a Pattern:
 *
 *   setCps/setCpm (+ lowercase) : return silence, a valid no-op statement.
 *   slider / sliderWithID       : return the numeric default, so `.lpf(slider(500))`
 *                                 bakes 500 into the control. The DEVICE's knob binding
 *                                 (src/lib/render/scope.ts installRenderScope) later
 *                                 OVERRIDES these globals with capturing versions - it
 *                                 runs after bootScope, so last-writer-wins is intended.
 *   _scope/_pianoroll/...       : pass the pattern through unchanged.
 *   draw visual params          : registered as real controls so `.fill()` etc. exist
 *                                 without pulling @strudel/draw (canvas) into the bundle.
 *
 * Core-only, so this stays loadable under node (the engine unit tests) as well as in
 * jweb's Chromium worker.
 */
/**
 * SLIDERS ARE THE DEVICE'S KNOBS. strudel.cc's `slider()` is a codemirror widget; here
 * the same role is played by native live.dial parameters (S1..S8). Each compile records
 * every slider the code declares, IN SOURCE ORDER, and the device maps slider N to knob
 * N. `setSliderOverrides()` feeds the knob values back into the NEXT compile, so turning
 * a dial re-evaluates the pattern with the new value.
 *
 * This lives here, next to the shim that defines `slider`, because compiling happens in
 * the WORKER - and the worker is a separate module instance from anything on the page.
 * (src/lib/render/scope.ts carries the same capture for the main-thread export renderer,
 * which compiles in its own scope.)
 */
let captured = [];
let overrides = [];

/** Reset the capture. Call immediately before each compile. */
export function beginSliderCapture() {
	captured = [];
}

/** The sliders the last compile declared, in source order. */
export function getSliderSpecs() {
	return captured;
}

/** Values to substitute for the code's own defaults on the NEXT compile, by capture
 *  order. `null` keeps the code's value - an untouched knob. */
export function setSliderOverrides(values) {
	overrides = Array.isArray(values) ? values : [];
}

function sliderValue(id, value, min, max) {
	const v = Number(value);
	// Deduped by id: a slider inside a register()'d combinator is called once per use,
	// and it is still ONE slider.
	let index = captured.findIndex((s) => s.id === id);
	if (index < 0) {
		index = captured.length;
		captured.push({
			id,
			value: Number.isFinite(v) ? v : 0,
			min: Number.isFinite(Number(min)) ? Number(min) : 0,
			max: Number.isFinite(Number(max)) ? Number(max) : 1,
		});
	}
	const override = overrides[index];
	return override ?? (Number.isFinite(v) ? v : 0);
}

export function installReplShims() {
	const g = globalThis;
	const setCps = () => silence;
	g.setCps = setCps;
	g.setcps = setCps;
	g.setCpm = setCps;
	g.setcpm = setCps;
	g.setGainCurve = g.setGainCurve ?? (() => {}); // real one is injected on the audio thread
	// slider(value, min?, max?, step?); the transpiler rewrites the bare call to
	// sliderWithID(id, value, ...), so the id-prefixed form is the one compiled code hits.
	g.slider = (value, min, max) => sliderValue(`plain-${captured.length}`, value, min, max);
	g.sliderWithID = (id, value, min, max) => sliderValue(String(id), value, min, max);
	const passthrough = function () {
		return this;
	};
	const proto = Pattern.prototype;
	for (const name of ["_scope", "_pianoroll", "_spectrum", "_punchcard", "_pitchwheel"]) {
		if (typeof proto[name] !== "function") proto[name] = passthrough;
	}
	createParams("x", "y", "w", "h", "angle", "r", "fill", "smear");
}

let booted = false;
export async function bootScope() {
	if (booted) return;
	await evalScope(import("@strudel/core"), import("@strudel/mini"), import("@strudel/tonal"));
	installDollarCollector();
	installReplShims();
	booted = true;
}

export async function compile(code) {
	pPatterns = {};
	anonymousIndex = 0;
	const { pattern } = await evaluate(code, transpiler);
	const named = Object.values(pPatterns);
	const pat = named.length ? stack(...named) : pattern; // repl.mjs:231-253 semantics
	if (!isPattern(pat)) throw new Error("Code did not evaluate to a pattern");
	return pat;
}

export function queryWindow(pat, fromCycle, toCycle, cps) {
	return pat.queryArc(fromCycle, toCycle, { _cps: cps }).filter((h) => h.hasOnset());
}

export function hapToNote(hap, cps, ctx) {
	const p = hapPitch(hap, ctx);
	if (p === null) return null;
	const v = hap.value ?? {};
	const durCycles = hap.duration.valueOf(); // Fraction → number (cycles)
	return {
		pitch: p,
		velocity: hapVelocity(hap),
		durMs: Math.max(5, (durCycles / cps) * 1000),
		chan: Math.max(1, Math.min(16, Math.round(v.midichan ?? 1))),
		beginCycle: hap.whole.begin.valueOf(),
		value: v, // raw params (audio device)
	};
}

/**
 * A hap as a SAMPLE VOICE - keyed on the sample name `s`, NOT on a pitch.
 *
 * The code-driven Sampler plays pads by name (`s("bd sd, hh*8")`), so this path never
 * asks hapPitch for a MIDI number: a plain `s("bd")` has none, and hapToNote would drop
 * it. Returns null when the hap names no sample. `n` is the sample variation index,
 * `speed` the playback rate (a drum pad leaves it at 1), `gain` becomes the velocity.
 */
export function hapToVoice(hap, cps) {
	const v = hap.value ?? {};
	if (v.s === undefined || v.s === null || v.s === "") return null;
	const durCycles = hap.duration.valueOf();
	return {
		s: String(v.s),
		// The strudel `bank()` prefix, when the pattern set one (`s("bd").bank("RolandTR909")`).
		// The app falls back to its bank dropdown when this is absent; together they resolve
		// the sound to a `<bank>_<s>` sample name.
		bank: v.bank !== undefined && v.bank !== null && v.bank !== "" ? String(v.bank) : null,
		n: typeof v.n === "number" ? Math.round(v.n) : 0,
		velocity: hapVelocity(hap),
		rate: typeof v.speed === "number" && v.speed !== 0 ? v.speed : 1,
		durMs: Math.max(5, (durCycles / cps) * 1000),
		beginCycle: hap.whole.begin.valueOf(),
	};
}

/**
 * The clip exporter's view of a hap: times in CYCLES, because a clip is written
 * in beats, not milliseconds - one cycle is however many bars the user picked,
 * and nothing here needs to know the tempo.
 */
export function hapToClipNote(hap, ctx) {
	const p = hapPitch(hap, ctx);
	if (p === null) return null;
	return {
		pitch: p,
		velocity: hapVelocity(hap),
		start: hap.whole.begin.valueOf(),
		duration: hap.duration.valueOf(),
	};
}

/**
 * The pitch of a hap, in three tiers.
 *
 * `note` first: `note("c3").s("bd")` names a pitch outright, and no drum map may
 * overrule it.
 *
 * Then the drum map, on the sample name - BEFORE `n`. This ordering is the whole
 * point: `s("bd:3")` picks the fourth bd sample and comes through as
 * `{ s: "bd", n: 3 }`, so reading `n` first would sound a bd as MIDI note 3
 * rather than as its Drum Rack pad. `n` is a sample INDEX whenever `s` carries a
 * mapped name; it is a pitch only in the absence of one.
 */
function hapPitch(hap, ctx) {
	const v = hap.value ?? {};
	let note = v.note;
	if (note === undefined && v.s && ctx?.drumMap) {
		const mapped = ctx.drumMap[v.s];
		if (mapped !== undefined) return mapped;
	}
	if (note === undefined) note = v.n;
	if (typeof note === "string") note = noteToMidi(note);
	if (typeof note !== "number" || Number.isNaN(note)) return null;
	return Math.max(0, Math.min(127, Math.round(note)));
}

function hapVelocity(hap) {
	const v = hap.value ?? {};
	return Math.max(1, Math.min(127, Math.round((v.velocity ?? v.gain ?? 0.75) * 127)));
}

/**
 * How many cycles before the pattern repeats itself.
 *
 * `<a b>` alternates per cycle, so exporting one cycle of it - which is what To
 * Clip did - threw half the pattern away. The length is measured, not derived:
 * query the first `probe` cycles and find the shortest period they are consistent
 * with. That works for full Strudel code too, whose loop length no parser of ours
 * could compute, and it costs a handful of stateless queries.
 *
 * A period is only trusted if it survives the whole probe window, so a pattern
 * that repeats every 3 cycles is not mistaken for one that repeats every 6.
 */
export function patternCycles(pat, cps, ctx, maxCycles = 16) {
	const probe = maxCycles * 2;
	const sigs = [];
	for (let c = 0; c < probe; c++) {
		const events = queryWindow(pat, c, c + 1, cps)
			.map((h) => {
				const n = hapToClipNote(h, ctx);
				if (!n) return null;
				// Relative to this cycle's start, so cycle k looks like cycle 0 when
				// the pattern has come back around.
				return `${n.pitch}@${(n.start - c).toFixed(6)}+${n.duration.toFixed(6)}v${n.velocity}`;
			})
			.filter(Boolean)
			.sort();
		sigs.push(events.join("|"));
	}
	for (let p = 1; p <= maxCycles; p++) {
		let ok = true;
		for (let c = 0; c < probe && ok; c++) {
			if (sigs[c] !== sigs[c % p]) ok = false;
		}
		if (ok) return p;
	}
	return maxCycles;
}

/**
 * Every note of `cycles` cycles, at once. Strudel patterns are pure functions of
 * time, so the whole clip can be queried instantly - no transport, no real-time
 * wait - and querying it does not disturb a pattern that is currently playing.
 */
export function exportNotes(pat, cycles, cps, ctx) {
	return queryWindow(pat, 0, cycles, cps)
		.map(h => hapToClipNote(h, ctx))
		.filter(Boolean);
}
