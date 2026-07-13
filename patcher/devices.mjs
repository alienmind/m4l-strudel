/**
 * devices.mjs - the device manifest. Read by @m4l-jweb/build, which generates a
 * patcher per entry and writes the .amxd. Patch cords are code review.
 *
 * `type` is the container tag Live sees; `mode` is what the wrapper is told it
 * is; `ui` is the folder under src/app/ holding the device's UI (defaults to
 * `name`, which is why the two devices here set it - `alienmind-strudel-midi`
 * would otherwise look for a folder of that exact name).
 *
 * Two devices today. The third ("Strudel Audio", an instrument built around a
 * hand-rolled poly~ oscillator synth) was removed - it never made musical
 * sense: it replicated the MIDI device's note editor instead of being an
 * actual audio effect, and its voice patch was never confirmed to work in the
 * real Max editor. See doc/TODO.md for the direction its replacement is
 * headed: a genuine Strudel audio-effects-chain device, not an instrument.
 */
export default [
	{
		name: "alienmind-strudel-midi",
		ui: "midi",
		type: "midi", // 'mmmm' MIDI effect
		chains: ["midiout"], // packaged chain: the engine's note stream -> MIDI out
		unmatchedTo: "js", // ui_ready / write_clip / read_notes reach the wrapper
	},
	{
		name: "alienmind-strudel-midi-drums",
		ui: "midi-drums",
		type: "midi", // 'mmmm' MIDI effect
		chains: ["midiout"],
		unmatchedTo: "js",
	},
	{
		name: "alienmind-strudel-sampler-browser",
		ui: "sampler-browser",
		type: "audio",
		mode: "sampler-browser",
		chains: ["strudel-sample-browser"],
		payloads: ["dist/node/strudel-node-sampler-browser.cjs"],
		looseFiles: ["dist/node/strudel-node-sampler-browser.cjs"],
		unmatchedTo: "js",
	},
	{
		/**
		 * Strudel Audio FX - write one line of Strudel's effect vocabulary
		 * (`.lpf(800).gain(1.2)`) and it applies to whatever audio is already coming
		 * into the track, the way you would reach for Auto Filter.
		 *
		 * An audio EFFECT, not an instrument and not a sequencer: no pattern editor,
		 * no To Clip, no notes. It replaces the removed "Strudel Audio" instrument,
		 * which reinvented a crude oscillator synth and copied the MIDI device's note
		 * editor wholesale - see doc/TODO.md for why that shape was wrong.
		 *
		 * Its parameters are declared in src/app/fx/surface.ts, and the build
		 * generates the live.* objects and their wiring from that one declaration.
		 * There is no `parameters` field here any more - @m4l-jweb 0.4.0 removed it.
		 */
		name: "alienmind-strudel-fx",
		ui: "fx",
		type: "audio", // 'aaaa' audio effect: it sits anywhere in an audio chain
		chains: ["lowpass", "drive", "strudel-delay", "strudel-room", "gain"],
		unmatchedTo: "js",
	},
];
