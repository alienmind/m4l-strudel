/**
 * devices.mjs - the device manifest. Read by @m4l-jweb/build, which generates a
 * patcher per entry and writes the .amxd. Patch cords are code review.
 *
 * `type` is the container tag Live sees; `mode` is what the wrapper is told it
 * is; `ui` is the folder under src/app/ holding the device's UI (defaults to
 * `name`, which is why the two devices here set it - `alienmind-strudel-midi`
 * would otherwise look for a folder of that exact name).
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
		name: "alienmind-strudel-drums-midi",
		ui: "drums-midi",
		type: "midi", // 'mmmm' MIDI effect
		chains: ["midiout"],
		unmatchedTo: "js",
	},
	{
		name: "alienmind-strudel-sample-browser",
		ui: "sample-browser",
		type: "instrument",
		mode: "sample-browser",
		chains: ["webaudio", "download"],
		unmatchedTo: "js",
	},
	{
		name: "alienmind-strudel-fx",
		ui: "fx",
		type: "audio",
		chains: ["lowpass", "hpf", "drive", "crush", "delay", "reverb", "gain", "remote"],
		remotes: 9,
		unmatchedTo: "js",
	},
	{
		name: "alienmind-strudel-drums-sampler",
		ui: "drums-sampler",
		type: "instrument",
		mode: "drums-sampler",
		chains: ["webaudio", "midiin"],
		unmatchedTo: "js",
	},
	{
		name: "alienmind-strudel-superdough",
		ui: "superdough",
		type: "instrument",
		mode: "superdough",
		chains: ["webaudio"],
		unmatchedTo: "js",
	},
];
