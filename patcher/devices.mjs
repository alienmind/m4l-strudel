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
		/**
		 * The sample browser - an audio effect that browses Strudel's sample-map
		 * universe, downloads what you pick, and previews it THROUGH THE TRACK.
		 *
		 * Two library chains and no process of our own. It used to host a
		 * [node.script] for the three things jweb could not do; every one of them has
		 * a first-class answer since m4l-jweb 0.6.0:
		 *
		 *   the catalog     fetch() in the app. [jweb] is Chromium; it always had it.
		 *   the download    `download` - [maxurl] writes the file, and the bytes never
		 *                   cross the bridge.
		 *   the preview     `samples` - [buffer~] + [groove~], SUMMED into the track's
		 *                   signal path. A page that plays audio itself is heard past
		 *                   the fader and the monitor cue: [jweb] has no signal outlets.
		 *
		 * `slots` names the [buffer~]s. One is right for a preview - it is one voice,
		 * auditioning one sample at a time. A drum rack is what would want eight.
		 */
		name: "alienmind-strudel-sample-browser",
		ui: "sample-browser",
		type: "audio",
		mode: "sample-browser",
		chains: ["samples", "download"],
		slots: ["preview"],
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
		// THE FROZEN ORDER (ARCHITECTURE.md §3c). Each stage is always in the path, so
		// this list is the signal path itself, not a set of options: hpf sits with the
		// filter it complements, crush with the dirt it belongs to, and the send/level
		// tail is last. Changing the order changes every user's sound - it is frozen,
		// and src/lib/fx.ts's RACK must read back in the same order.
		chains: ["lowpass", "hpf", "drive", "crush", "delay", "reverb", "gain", "remote"],
		// One live.remote~ slot per rack stage, mapped by RACK index (src/lib/fx.ts) -
		// slot 0 is cutoff, slot 8 is gain, forever. `remote` is not a stage: it touches
		// no audio, it only lets a pattern in the line modulate this device's own
		// parameters (.lpf(sine.range(200, 2000))). Keep this count equal to RACK's
		// length or the last stages silently lose their modulation.
		remotes: 9,
		unmatchedTo: "js",
	},
	{
		/**
		 * Strudel Sampler - a polyphonic, CODE-DRIVEN sampler over drum-machine BANKS.
		 *
		 * Not a MIDI pad rack: it PROCESSES Strudel code. `s("bd sd, hh*8")` names sounds,
		 * a BANK (a tidal-drum-machine, the strudel `bank()` prefix) picks which machine's
		 * `bd`/`sd`/`hh` play, and the samples are fetched from the same community repos the
		 * sample browser uses - automatically, in the background, on first reference. Sounds
		 * are keyed by NAME, never by a MIDI note number.
		 *
		 * type "instrument" keeps the MIDI input ports the audio devices drop, and the
		 * `instrument` chain builds a [poly~] of sample voices over a KEYMAP of named
		 * [buffer~]s. A voice names its sample by slot INDEX and Max allocates a free voice,
		 * so overlapping sounds never cut each other - the polyphony a sampler needs.
		 *
		 * Chains, and why each is here:
		 *   instrument  the [poly~] voices, the [buffer~]/info~ slots, and the voice_play /
		 *               buffer_load / buffer_ready plumbing the app calls through playVoice()
		 *               / loadSample().
		 *   midiin      inbound MIDI as `notein <pitch> <velocity>`. type "instrument" keeps
		 *               the ports; the chain routes them to the app.
		 *   download    [maxurl] writes a referenced sample to disk (fetchToFile), the same
		 *               acquire path the sample browser uses - here fired automatically when
		 *               the pattern first names a sound.
		 *
		 * SIXTEEN slots (with a matching 16-voice [poly~]): a full drum machine has 11-13
		 * distinct sounds, so 8 forced eviction mid-pattern. `slots` are `---`-scoped per
		 * device so two instances keep their own buffers. The app owns which sound occupies
		 * which slot (a small name -> slot allocator, LRU past 16).
		 */
		name: "alienmind-strudel-sampler",
		ui: "sampler",
		type: "instrument",
		mode: "sampler",
		chains: ["instrument", "midiin", "download"],
		slots: [
			"slot1", "slot2", "slot3", "slot4", "slot5", "slot6", "slot7", "slot8",
			"slot9", "slot10", "slot11", "slot12", "slot13", "slot14", "slot15", "slot16",
		],
		voices: 16,
		unmatchedTo: "js",
	},
];
