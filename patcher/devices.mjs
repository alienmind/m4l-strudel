/**
 * devices.mjs - the device manifest. Read by @m4l-jweb/build, which generates a
 * patcher per entry and writes the .amxd. Patch cords are code review.
 *
 * `type` is the container tag Live sees; `mode` is what the wrapper is told it
 * is. They are NOT always the same: the sampler is an AUDIO EFFECT ("aaaa") on
 * purpose, because a MIDI-effect device has no audio output path, so its
 * BPM-synced preview (sfplay~ -> plugout~) would be silent. It sits anywhere in
 * an audio chain and passes input through, like Splice's Bridge.
 */
export default [
	{
		name: "alienmind-strudel-midi",
		type: "midi", // 'mmmm' MIDI effect
		chains: ["midiout"], // packaged chain: the engine's note stream -> MIDI out
		unmatchedTo: "js", // ui_ready / write_clip / read_notes reach the wrapper
	},
	{
		name: "alienmind-strudel-instrument",
		type: "instrument", // 'iiii' MIDI in -> audio out
		mode: "instrument", // ... the wrapper's mode vocabulary is midi | sampler | instrument.
		// Was "audio" - renamed because it collided with the unrelated "audio effect"
		// container type used below by the sampler; see resolveStrudelMode().
		chains: ["poly"], // ours: message-driven poly~ synth voices
		// voice.maxpat is read by poly~, a Max-native object, so it can stay
		// FROZEN inside the container - no extraction needed.
		extraFiles: ["ableton-amxd/voice.maxpat"],
		unmatchedTo: "js",
	},
	{
		name: "alienmind-strudel-sampler",
		type: "audio", // 'aaaa' audio effect (see above)
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
