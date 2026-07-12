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
		name: "alienmind-strudel-sampler",
		ui: "sampler",
		type: "audio", // 'aaaa' audio effect. Deliberate: a MIDI-effect device has no
		// audio output path, so its BPM-synced preview (sfplay~ -> plugout~) would
		// be silent. It sits anywhere in an audio chain and passes input through,
		// like Splice's Bridge.
		mode: "sampler", // ... but the wrapper must know it is the sampler
		chains: ["sampler"], // ours: node.script + sfplay~ preview + passthrough
		// The .cjs is read by node.script, which is NOT a Max-native object, so it
		// cannot see the frozen filesystem and needs a real file:
		//   payloads   - embedded in wrapper.js, extracted on load (self-contained
		//                .amxd, e.g. one copied on its own)
		//   looseFiles - also shipped next to the .amxd, because node.script
		//                resolves its script name when the OBJECT INSTANTIATES,
		//                which is before the wrapper has run at all.
		payloads: ["dist/node/strudel-node-sampler.cjs"],
		looseFiles: ["dist/node/strudel-node-sampler.cjs"],
		unmatchedTo: "js",
	},
];
