/**
 * reference.ts - WHICH STRUDEL FEATURES THIS DEVICE COLLECTION SUPPORTS, as data.
 *
 * That framing is the whole thing, and it is not the same as "what this device can do".
 * Strudel is the language; these devices implement a SUBSET of it. The question a user
 * has, mid-pattern, is "will this work here?" - and the answer is per device.
 *
 * WHY IT IS HERE AND NOT A LINK TO strudel.cc. Two reasons, and the second is the one
 * that matters:
 *
 *   1. A Live set is often open with no internet, and a help button that needs a
 *      network is a help button that fails when you are working.
 *   2. **strudel.cc documents Strudel. This documents what WE support of it**, and the
 *      two are not the same list. `.crush()` is real here as of R1b; `.vowel()` is real
 *      on strudel.cc and silently does nothing here; a bare number is a SCALE DEGREE in
 *      our mini-notation and a raw MIDI pitch in full Strudel code. A reference that
 *      told you what strudel.cc says would be wrong in exactly the places a user gets
 *      stuck - which is the whole reason they opened it.
 *
 * So `status` is not decoration. It is the difference between "you typed it wrong" and
 * "this device cannot do that yet", and those are very different messages to someone
 * who cannot hear what they expected.
 *
 * EVERY ENTRY DECLARES ITS DEVICES. There is no "applies to all" default any more: it
 * put mini-notation in front of the FX device, whose line is `.lpf(800)` - not a
 * pattern, and never was. An entry with no `only` is now a build error waiting to
 * happen rather than a silent superset, because the wrong help is worse than none.
 */

/** What this device does with an effect, honestly. */
export type Status =
	/** A real Max chain is behind it: it makes a sound. */
	| "live"
	/** Strudel has it; this device names it and refuses it. See fx.ts KNOWN_UNBUILT. */
	| "unbuilt"
	/** Mini-notation syntax rather than a method. */
	| "syntax";

/** The UI folders, which are what a help window is opened from. */
export type Device = "fx" | "midi" | "midi-drums" | "drums-sampler" | "strudel" | "synth";

/** The devices that take a pattern. They support the same mini-notation and code. The
 *  sampler is one - its tokens are sample names rather than pitches, but the STRUCTURE
 *  (`*`, `!`, `[]`, `<>`, `,`, `.slow`, ...) is identical. */
export const PATTERN_DEVICES: Device[] = ["midi", "midi-drums", "drums-sampler"];

export interface RefEntry {
	/** What you type: ".lpf(800)", "<a b>", "sine". */
	name: string;
	category: string;
	/** One line. What it does, not how it is implemented. */
	summary: string;
	/** Something that can be typed into the device as-is. */
	example: string;
	status: Status;
	/**
	 * The devices this applies to - REQUIRED, and not a filter but a fact.
	 *
	 * It used to be optional, meaning "all", and that is exactly how mini-notation
	 * ended up listed on the FX device: its line is `.lpf(800).gain(1.2)`, a method
	 * chain, and `<a b>` has never meant anything there. Making it required means a new
	 * entry cannot be added without answering the only question the list is for.
	 */
	only: Device[];
	/** The trap, when there is one worth the space. */
	note?: string;
}

export const REFERENCE: RefEntry[] = [
	/* ---- Sounds: what a superdough voice IS -------------------------- */
	{
		name: 's("sawtooth")',
		category: "Sounds",
		summary: "The oscillator (or sample) the voice is made of. sawtooth, square, triangle, sine.",
		example: 's("sawtooth")',
		status: "live",
		only: ["synth"],
		note: "This is the whole spec on its own - every other line here hangs off it.",
	},
	{
		name: 's("supersaw")',
		category: "Sounds",
		summary: "A detuned stack of saws. .spread() widens it, .unison(n) sets how many.",
		example: 's("supersaw").spread(0.8).unison(5)',
		status: "live",
		only: ["synth"],
	},
	{
		name: 's("piano")',
		category: "Sounds",
		summary: "A SAMPLED instrument instead of an oscillator - anything in the loaded sample maps.",
		example: 's("piano")',
		status: "live",
		only: ["synth"],
		note: "Needs its sample map, so it needs the network once. After that the page cache plays it offline.",
	},
	{
		name: ".attack(s) / .decay(s)",
		category: "Sounds",
		summary: "The front of the amplitude envelope, in seconds. A slow attack is a pad.",
		example: 's("sawtooth").attack(0.2).decay(0.3)',
		status: "live",
		only: ["synth"],
	},
	{
		name: ".sustain(s)",
		category: "Sounds",
		summary: "HOW LONG A NOTE LASTS here, in seconds - not a level.",
		example: 's("sawtooth").sustain(2)',
		status: "live",
		only: ["synth"],
		note: "The Synth decides a note's length WHEN IT STARTS (superdough schedules the whole envelope up front), so holding a key does not hold the note. Default 0.6s.",
	},
	{
		name: ".release(s)",
		category: "Sounds",
		summary: "The tail after the note ends. Long releases overlap into the next note.",
		example: 's("sawtooth").release(0.5)',
		status: "live",
		only: ["synth"],
	},
	{
		name: ".lpenv(x) / .lpattack(s)",
		category: "Sounds",
		summary: "A filter envelope: how far the cutoff moves, and how fast. Needs .lpf() to move.",
		example: 's("sawtooth").lpf(400).lpenv(4).lpattack(0.1)',
		status: "live",
		only: ["synth"],
	},
	{
		name: ".vib(hz) / .vibmod(semis)",
		category: "Sounds",
		summary: "Pitch vibrato: its speed, and how far it swings.",
		example: 's("sawtooth").vib(6).vibmod(0.3)',
		status: "live",
		only: ["synth"],
	},
	{
		name: ".detune(x) / .fm(x)",
		category: "Sounds",
		summary: "Detune the voice, or FM it. Small numbers are movement; large ones are noise.",
		example: 's("sawtooth").fm(3)',
		status: "live",
		only: ["synth"],
	},

	/* ---- The FX line ------------------------------------------------ */
	{
		name: ".lpf(hz)",
		category: "Effects",
		summary: "Low-pass filter. Takes the top end away as you sweep it down.",
		example: ".lpf(800)",
		status: "live",
		only: ["fx", "synth"],
		note: "Also spelled .cutoff(). 18000 is off - there is nothing above it left to remove.",
	},
	{
		name: ".hpf(hz)",
		category: "Effects",
		summary: "High-pass filter. Takes the bottom end away as you sweep it up.",
		example: ".hpf(200)",
		status: "live",
		only: ["fx", "synth"],
		note: "Also spelled .hcutoff(). 0 is off, and off means a true wire - not a quiet filter.",
	},
	{
		name: ".drive(x)",
		category: "Effects",
		summary: "Soft-clipping overdrive. 1 is clean, 10 is filthy.",
		example: ".drive(3)",
		status: "live",
		only: ["fx", "synth"],
	},
	{
		name: ".crush(bits)",
		category: "Effects",
		summary: "Bit-depth reduction. Low numbers are crunchy.",
		example: ".crush(4)",
		status: "live",
		only: ["fx", "synth"],
		note: "24 is off. Strudel calls 16 'minimum crush', and 16 here still quantises - it is a quiet crush, not a bypass.",
	},
	{
		name: ".delay(mix)",
		category: "Effects",
		summary: "Send to the delay line, 0 to 1.",
		example: ".delay(0.3)",
		status: "live",
		only: ["fx", "synth"],
	},
	{
		name: ".delaytime(ms)",
		category: "Effects",
		summary: "How long the delay tap waits.",
		example: ".delaytime(125)",
		status: "live",
		only: ["fx", "synth"],
	},
	{
		name: ".delayfeedback(x)",
		category: "Effects",
		summary: "How much of the tap goes back in, 0 to 1.",
		example: ".delayfeedback(0.6)",
		status: "live",
		only: ["fx", "synth"],
	},
	{
		name: ".room(mix)",
		category: "Effects",
		summary: "Send to the reverb, 0 to 1.",
		example: ".room(0.4)",
		status: "live",
		only: ["fx", "synth"],
	},
	{
		name: ".gain(x)",
		category: "Effects",
		summary: "Level. 1 is unity, 2 is +6 dB.",
		example: ".gain(1.2)",
		status: "live",
		only: ["fx", "synth"],
		note: "A linear multiplier, as in Strudel - not dB.",
	},
	{
		name: ".vowel(a)",
		category: "Effects",
		summary: "Formant filter. Strudel has it; this device has no Max chain for it.",
		example: '.vowel("a")',
		status: "unbuilt",
		only: ["fx"],
		note: "Named and refused on purpose, so you get 'not yet' rather than 'unknown effect'.",
	},
	{
		name: ".pan(x)",
		category: "Effects",
		summary: "Stereo position. No Max chain here yet.",
		example: ".pan(0.2)",
		status: "unbuilt",
		only: ["fx"],
	},
	{
		name: ".coarse(n)",
		category: "Effects",
		summary: "Sample-rate reduction. Not .crush() - that is bit depth. No chain yet.",
		example: ".coarse(4)",
		status: "unbuilt",
		only: ["fx"],
	},

	/* ---- Modulation ------------------------------------------------- */
	{
		name: "sine",
		category: "Modulation",
		summary: "A smooth sweep, one cycle long. Use .range() to give it real units.",
		example: ".lpf(sine.range(200, 2000))",
		status: "live",
		only: ["fx"],
		note: "A signal is not a number: the stage is MODULATED, and the dial follows it rather than being set once.",
	},
	{
		name: "saw / isaw",
		category: "Modulation",
		summary: "A ramp up (saw) or down (isaw), one cycle long.",
		example: ".lpf(saw.range(200, 4000))",
		status: "live",
		only: ["fx"],
	},
	{
		name: "tri / square",
		category: "Modulation",
		summary: "A triangle, or a hard on/off square.",
		example: ".gain(square.range(0.5, 1))",
		status: "live",
		only: ["fx"],
	},
	{
		name: "rand / perlin",
		category: "Modulation",
		summary: "Random values: rand jumps, perlin drifts smoothly.",
		example: ".lpf(perlin.range(400, 3000))",
		status: "live",
		only: ["fx"],
	},
	{
		name: ".range(lo, hi)",
		category: "Modulation",
		summary: "Maps a signal's 0..1 travel onto real units.",
		example: "sine.range(200, 2000)",
		status: "live",
		only: ["fx"],
		note: "Without it a signal is 0..1, which is a closed filter.",
	},

	/* ---- Mini-notation ---------------------------------------------- */
	{
		name: "a b c",
		category: "Mini-notation",
		summary: "A sequence: the cycle is split evenly between them.",
		example: "c e g",
		status: "syntax",
		only: PATTERN_DEVICES,
	},
	{
		name: "[a b]",
		category: "Mini-notation",
		summary: "A subdivision - fits a whole sequence into one step.",
		example: "c [e g]",
		status: "syntax",
		only: PATTERN_DEVICES,
	},
	{
		name: "<a b>",
		category: "Mini-notation",
		summary: "Alternation - one per cycle, in turn.",
		example: "<c e g>",
		status: "syntax",
		only: PATTERN_DEVICES,
		note: "From Clip flattens this: reading MIDI back gives the expanded note list.",
	},
	{
		name: "a*n",
		category: "Mini-notation",
		summary: "Repeat a step n times inside its slot.",
		example: "c*4 e",
		status: "syntax",
		only: PATTERN_DEVICES,
	},
	{
		name: "a!n",
		category: "Mini-notation",
		summary: "Replicate a step n times as separate steps.",
		example: "c!3 e",
		status: "syntax",
		only: PATTERN_DEVICES,
	},
	{
		name: "~",
		category: "Mini-notation",
		summary: "A rest.",
		example: "c ~ e ~",
		status: "syntax",
		only: PATTERN_DEVICES,
	},
	{
		name: "a(3,8)",
		category: "Mini-notation",
		summary: "Euclidean rhythm: 3 hits spread over 8 steps.",
		example: "bd(3,8)",
		status: "syntax",
		only: PATTERN_DEVICES,
	},
	{
		name: "a,b",
		category: "Mini-notation",
		summary: "Stack - play both at once.",
		example: "c,e,g",
		status: "syntax",
		only: PATTERN_DEVICES,
	},

	/* ---- Patterns ---------------------------------------------------- */
	{
		name: 's("bd sd")',
		category: "Patterns",
		summary:
			"Sample names. On MIDI they resolve through the drum map; on the Sampler they play the selected bank's samples.",
		example: 's("bd sd, hh*8")',
		status: "live",
		only: PATTERN_DEVICES,
		note: "Sampler: a name with no sample in the bank reports itself. On MIDI, an unmapped name stays silent.",
	},
	{
		name: '.bank("RolandTR909")',
		category: "Patterns",
		summary: "Pick the drum machine a sample name plays from (strudel's bank prefix).",
		example: 's("bd sd").bank("AkaiLinn")',
		status: "live",
		only: ["drums-sampler"],
		note: "Overrides the Sampler's bank dropdown, per-hap. `bd` with bank RolandTR909 is the sample RolandTR909_bd.",
	},
	{
		name: 'note("c e g")',
		category: "Patterns",
		summary: "Explicit notes.",
		example: 'note("c4 e4 g4")',
		status: "live",
		only: PATTERN_DEVICES,
		note: "In FULL Strudel code note('c5') is MIDI 72 (scientific). Bare mini-notation follows the device's octave convention - the two differ.",
	},
	{
		name: ".slow(n) / .fast(n)",
		category: "Patterns",
		summary: "Stretch or compress the pattern in time.",
		example: 'note("c e g").slow(2)',
		status: "live",
		only: PATTERN_DEVICES,
	},
	{
		name: ".every(n, f)",
		category: "Patterns",
		summary: "Apply a function every n cycles.",
		example: 'note("c e g").every(3, x => x.fast(2))',
		status: "live",
		only: PATTERN_DEVICES,
	},
];

export const CATEGORIES = ["Sounds", "Effects", "Modulation", "Mini-notation", "Patterns"] as const;

/** What each device's help is ABOUT, in its own words. Shown under the title. */
export const DEVICE_BLURB: Record<Device, string> = {
	fx: "Strudel's effect vocabulary, as a one-line chain. No patterns here - this device shapes audio that is already playing.",
	midi: "Strudel patterns, out as MIDI. Mini-notation and full Strudel code both work.",
	"midi-drums": "Strudel patterns, out as MIDI, with sample names resolved through the drum map.",
	"drums-sampler":
		"Strudel s() patterns, played from a drum-machine bank. Sample names, not pitches; commas layer for polyphony.",
	strudel:
		"ALL of Strudel, rendered with the real superdough into the track's audio. Everything strudel.cc plays - multi-line $:, samples, synths, effects.",
	synth:
		'ONE superdough sound, played by the track\'s MIDI. Write a value (s("sawtooth").lpf(800)), not a pattern - the notes come from Live.',
};

/** The entries that apply to a device. Every entry declares its own, so this is a fact, not a guess. */
export function referenceFor(device: string): RefEntry[] {
	// The main Strudel device is not a subset: the code goes to the real superdough
	// verbatim, so the honest reference is the whole list - the per-device `only`
	// filter answers "which subset", and here the answer is "all of it".
	if (device === "strudel") return REFERENCE;
	// The Synth device takes a superdough VALUE, so the sound and effect vocabulary all
	// applies to it - what does not is pattern STRUCTURE, which it collapses (see
	// app/synth/useSynth.ts). Its help is the effect and modulation half of the list.
	if (device === "synth")
		return REFERENCE.filter((e) => e.category === "Effects" || e.category === "Modulation");
	return REFERENCE.filter((e) => e.only.includes(device as Device));
}

/** Free-text search across what a user would actually type or look for. */
export function searchReference(entries: RefEntry[], q: string): RefEntry[] {
	const needle = q.trim().toLowerCase();
	if (!needle) return entries;
	return entries.filter((e) =>
		`${e.name} ${e.summary} ${e.example} ${e.note ?? ""}`.toLowerCase().includes(needle),
	);
}

/**
 * What the caret is sitting on, as something to look up - the Studio's contextual help.
 *
 * DELIBERATELY A HEURISTIC, NOT A PARSER. It reads BACKWARDS from the caret for the
 * nearest word, because that is the thing you are in the middle of typing and it costs
 * nothing to be wrong: the worst outcome is the panel showing a list you did not ask
 * for, which is what it was showing anyway. A real parser here would be a second
 * dialect to keep in step with the engine's (the lesson from src/lib/mini), and it
 * would still be wrong mid-token - which is precisely when help is wanted, because
 * half-typed code does not parse.
 *
 * `.lpf(8|` looks up `lpf`; `sin|` looks up `sin` and finds `sine` by substring. An
 * empty result means "show everything", which is the honest default for a caret sitting
 * on a bracket.
 */
export function tokenAtCaret(text: string, caret: number): string {
	const before = text.slice(0, Math.max(0, caret));
	// Inside a call - `.lpf(800` or `.lpf(` - the FUNCTION is what you want explained,
	// not the number you are typing into it.
	const inCall = /\.(\w+)\([^()]*$/.exec(before);
	if (inCall) return inCall[1];
	// Otherwise: the word being typed, with or without its leading dot.
	const word = /\.?(\w+)$/.exec(before);
	return word ? word[1] : "";
}
