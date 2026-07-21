/**
 * devices.mjs - the device manifest. Read by @m4l-jweb/build, which generates a
 * patcher per entry and writes the .amxd.
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
		/**
		 * The sample browser - an instrument that browses Strudel's sample-map
		 * universe, downloads what you pick, and previews it through the track.
		 *
		 * `webaudio` is the preview: the page decodes and plays the sample, jweb~
		 * sums it into the track's signal path. `download` remains for saveToFile,
		 * which writes the auditioned file next to the device as the drag-out handle.
		 *
		 * type "instrument": the browser ORIGINATES sound (the preview) and
		 * processes nothing, so it fills a track's instrument slot rather than
		 * posing as an effect on audio it never touches.
		 */
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
		/**
		 * Strudel Drums Sampler - polyphonic, code-driven sampler over drum-machine
		 * banks. Samples are fetched and decoded IN THE PAGE and played through the
		 * `webaudio` chain; `midiin` keeps the instrument's MIDI input so a sequencer
		 * in front drives the same bank. The old [poly~]/[buffer~] slots are gone
		 * (doc/DRAWER_OF_FAILED_IDEAS.md).
		 */
		name: "alienmind-strudel-drums-sampler",
		ui: "drums-sampler",
		type: "instrument",
		mode: "drums-sampler",
		chains: ["webaudio", "midiin"],
		unmatchedTo: "js",
	},
	{
		/**
		 * Strudel Superdough - ALL of Strudel, as the track's real audio. The page
		 * runs the real superdough engine LIVE (synths, samples, orbits, effects -
		 * everything strudel.cc plays, because it IS superdough) and jweb~ routes
		 * its Web Audio output into the track. The offline WAV render pipeline this
		 * device used to need is parked in doc/DRAWER_OF_FAILED_IDEAS.md.
		 *
		 * type "instrument": it fills the Rack's instrument slot - the sound source
		 * of the track, not an effect on one.
		 */
		name: "alienmind-strudel-superdough",
		ui: "superdough",
		type: "instrument",
		mode: "superdough",
		// `download` is NOT about downloading here: it owns the [maxurl] object, and
		// saveToFile's last phase places the verified .part over the destination with a
		// file:// GET through it. Drop the chain and Export writes a .part that is never
		// renamed, with no reply - so the promise never settles and the UI hangs on
		// "Rendering...". Anything that writes a file needs this chain.
		chains: ["webaudio", "download"],
		unmatchedTo: "js",
	},
];
