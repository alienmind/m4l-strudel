/**
 * device.ts - the Strudel-specific half of the [js] glue.
 *
 * @m4l-jweb/wrapper already provides the lifecycle (bang/loadbang, the
 * anything() guard), the self-extracting UI payload, the LiveAPI transport poll,
 * the tempo observer and clip I/O. This file is compiled and concatenated after
 * those, as one ES5 script, so it can see and extend them.
 *
 * What is genuinely ours:
 *   1. The device mode (midi | sample-browser), which gates the two below.
 *   2. clip_available: a poll, because LiveAPI has no observer for "any clip on
 *      this track", so the UI can disable From Clip when there is nothing to read.
 *   3. Live 12's global root_note/scale_name, forwarded to the UI.
 *
 * WHAT IS NO LONGER OURS: the [node.script] bootstrap, and the fan-out of tick and
 * tempo to outlet 1 that fed it. The sample browser has no process of its own since
 * m4l-jweb 0.6.0 - it fetches its catalog in the page, plays previews in the page
 * (0.9.9, through the `webaudio` chain) and writes the file through the `download`
 * chain - and outlet 1 now belongs to the packaged wrapper, which answers
 * `fetch_to_file` and the `save_*` requests on it. Writing to it by hand from here
 * would be talking over the library.
 *
 * Everything here is ES5 and gated by acorn, same as the packaged sources.
 */

/**
 * Device mode. Set from the object box by the manifest's `mode` field.
 *
 * TRAP: jsarguments[0] is the SCRIPT NAME, not the first argument. Reading index
 * 0 sets the mode to "wrapper.js", and every `MODE === "sample-browser"` test is then
 * silently false forever - which is exactly the bug this project shipped for
 * months. Scan for a known token rather than trusting an index.
 */
// "audio" is the fx device: the wrapper defaults a device's mode to its container
// type, and the fx entry declares none of its own. Before it was listed here every
// fx instance warned "no device mode" and fell back to midi - harmless but noisy,
// and it ran the midi-only clip poll on a device with no clips to read.
var MODES = ["midi", "sample-browser", "drums-sampler", "audio", "strudel", "synth"];
function resolveStrudelMode(): string {
	for (var i = 0; i < jsarguments.length; i++) {
		var a = String(jsarguments[i]);
		for (var j = 0; j < MODES.length; j++) {
			if (a === MODES[j]) return a;
		}
	}
	post("strudel: WARNING - no device mode in jsarguments, defaulting to midi\n");
	return "midi";
}

/** The packaged core also computes a MODE; ours is the authoritative one. */
var STRUDEL_MODE = resolveStrudelMode();
var IS_SAMPLE_BROWSER = STRUDEL_MODE === "sample-browser";
/** The code-driven Sampler: an instrument that decodes and plays its samples IN THE
 *  PAGE (0.9.9), so it touches no disk and needs no folder paths. It does not poll for
 *  clips either - it is an instrument with none. */
var IS_DRUMS_SAMPLER = STRUDEL_MODE === "drums-sampler";
/** The main Strudel device: an instrument with no clips, no pitches (the code goes
 *  to superdough verbatim, so Live's scale means nothing to it) and no samples folder of
 *  its own. It wants NONE of the observers below - running the midi defaults on it was
 *  what produced the "no valid object set" noise in the Max console. */
var IS_STRUDEL = STRUDEL_MODE === "strudel";
/** The Synth: a superdough VALUE played by incoming MIDI. No clips, no pitches to resolve
 *  (the value goes to superdough verbatim), no files, and nothing to start or stop - the
 *  notes are the trigger. It wants none of the observers below either. */
var IS_SYNTH = STRUDEL_MODE === "synth";
/**
 * The devices that put files in the device folder, and therefore need to tell the page
 * where that folder is and to reveal it on request.
 *
 * It is no longer only about SAMPLES. The browser saves each auditioned file (a file on
 * disk is what makes a row draggable into a track), and both pattern devices write WAV
 * bounces with Export. Anything that writes needs the `download` chain for [maxurl] and
 * belongs in here - the two travel together.
 */
var HAS_DEVICE_FOLDER = IS_SAMPLE_BROWSER || IS_DRUMS_SAMPLER || IS_STRUDEL;

post("strudel: mode " + STRUDEL_MODE + "\n");

/* ------------------------------------------------------------------ *
 * Clip availability
 *
 * There is no LiveAPI observer for "does this track have any clip", so it is
 * polled once a second and pushed to the UI only when it changes. The From Clip
 * button disables itself when there is nothing to read.
 * ------------------------------------------------------------------ */

var lastClipAvail = -1;
var clipPoll = new Task(checkClipAvailable, this);

function startClipPoll(): void {
	// Clips are the MIDI devices' business: the sample browser auditions, the fx
	// device filters - neither reads notes, so neither should poll for them.
	if (STRUDEL_MODE !== "midi") return;
	lastClipAvail = -1;
	clipPoll.cancel();
	clipPoll.interval = 1000;
	clipPoll.repeat();
}

function checkClipAvailable(): void {
	var avail = 0;
	try {
		avail = pickClip() ? 1 : 0; // pickClip() comes from the packaged liveapi.ts
	} catch (e) {
		avail = 0;
	}
	if (avail !== lastClipAvail) {
		lastClipAvail = avail;
		outlet(0, "clip_available", avail);
	}
}

/* ------------------------------------------------------------------ *
 * Live 12 global scale (BOTH modes)
 *
 * The strudel-sample-browser filters its catalog by key. The MIDI device needs it for a
 * different reason: a bare number in mini-notation is a SCALE DEGREE, and
 * without the song's root and scale it can only be read as a raw MIDI pitch -
 * which is why `2 3` used to come out as a pair of notes near the bottom of the
 * keyboard instead of the second and third degrees of the current key.
 * ------------------------------------------------------------------ */

var rootObs: LiveAPI | null = null;
var scaleObs: LiveAPI | null = null;
var liveRoot: unknown = 0;
var liveScale = "Major";

function setupScaleObservers(): void {
	// The main Strudel device never resolves a pitch - its code is full Strudel that goes
	// to superdough verbatim - so Live's scale is not its business.
	if (IS_STRUDEL || IS_SYNTH) return;
	// Recreate unconditionally: an observer built in a loading context is dead,
	// and a `if (obs) return` guard would make that permanent.
	try {
		rootObs = new LiveAPI(onRoot, "live_set");
		rootObs.property = "root_note";
		scaleObs = new LiveAPI(onScale, "live_set");
		scaleObs.property = "scale_name";
		post("strudel: scale observers ready\n");
	} catch (e) {
		post("strudel: scale observers unavailable (pre-Live-12?) " + (e as Error).message + "\n");
	}
}

function onRoot(a: unknown[]): void {
	if (a && a[0] == "root_note") {
		liveRoot = a[1];
		sendScale();
	}
}

function onScale(a: unknown[]): void {
	if (a && a[0] == "scale_name") {
		liveScale = a.slice(1).join(" ");
		sendScale();
	}
}

function sendScale(): void {
	outlet(0, "scale", liveRoot, liveScale); // -> jweb (scale degrees)
}

/* ------------------------------------------------------------------ *
 * The sample browser's two facts about the world
 *
 * 1. WHERE THE DEVICE LIVES. The browser saves an auditioned sample to a path RELATIVE
 *    to the device's folder, and that is the right thing for Max - the wrapper resolves
 *    it, and a relative path cannot be split into atoms by the spaces in "Ableton
 *    Library". But the USER has to be able to get at the file: to drag it into a
 *    Simpler, to find it in Places. A page cannot know its own device's folder, so the
 *    wrapper tells it - once, at ui_ready.
 *
 *    deviceFolder() is the packaged core's, and it is the SAME resolution the
 *    save used, which is what makes the path we hand the page the real one.
 *
 * 2. LIVE'S GLOBAL QUANTIZATION. The preview starts on a beat, and WHICH beat is not
 *    ours to decide - the user already told Live, in the transport bar. `1 Bar` means
 *    a preview waits for the downbeat; `None` means it plays now. Anything else is a
 *    device inventing its own timing rules next to the ones the set already has.
 * ------------------------------------------------------------------ */

var quantObs: LiveAPI | null = null;
var liveQuant: unknown = 4; // Live's default: 1 Bar

function setupBrowserObservers(): void {
	if (!IS_SAMPLE_BROWSER) return;
	try {
		quantObs = new LiveAPI(onQuant, "live_set");
		quantObs.property = "clip_trigger_quantization";
		post("strudel: quantization observer ready\n");
	} catch (e) {
		post("strudel: quantization observer unavailable " + (e as Error).message + "\n");
	}
}

function onQuant(a: unknown[]): void {
	if (a && a[0] == "clip_trigger_quantization") {
		liveQuant = a[1];
		sendQuant();
	}
}

function sendQuant(): void {
	if (IS_SAMPLE_BROWSER) outlet(0, "quantization", liveQuant);
}

/**
 * The device's own folder, as an absolute path.
 *
 * It goes out as ONE symbol. A real install has spaces in this path ("Ableton
 * Library"), and a path that travels through a patcher as message text would split
 * there into atoms - which is exactly why the download itself never sends one. Out
 * of [js] it stays whole.
 */
function sendFolder(): void {
	if (!HAS_DEVICE_FOLDER) return;
	var folder = deviceFolder(); // the packaged core's - the same resolution the download used
	if (folder) outlet(0, "device_folder", folder);
	else post("strudel: no device folder yet (unsaved patcher?) - the sample links will be off\n");
}

/*
 * NO reveal_folder HERE ANY MORE - "Show folder" became "Copy folder path".
 *
 * `; max launchbrowser <folder>` was the only way a device could ask for the OS file
 * manager, and two rounds of testing in Live on Windows 11 showed it does not do the
 * job: a percent-encoded `file:///C:/...` URL reaches the shell (a WRONG path raised a
 * real "cannot find the file" dialog naming it) but a correct one opened nothing and
 * reported nothing, and a native backslash path fared no better. Max has no other
 * reveal, and [js] cannot shell out.
 *
 * So the page does the whole job instead: `device_folder` already tells it where the
 * files are, and it copies that path to the clipboard (src/app/shared/clipboard.ts).
 * One less Max message, and nothing platform-specific left to verify.
 */

/* ------------------------------------------------------------------ *
 * Transport follow (TODO item 0)
 *
 * A sequencing device should start when the music starts. Until now the page's Play
 * parameter was the only way in: pressing Play in Live, or launching a clip on the
 * device's track, left the pattern silent until somebody also clicked the device.
 *
 * WHAT COUNTS AS "PLAYING" is the UNION of the two signals Live offers, because there
 * is no single LOM property for it:
 *
 *   - `playing_slot_index >= 0` - a session clip is running on this device's track.
 *   - `live_set is_playing` - the global transport is running.
 *
 * Either one starts the device; it stops when BOTH are false.
 *
 * The first version was cleverer and worse. It asked whether the track held any clip
 * and, if it did, followed ONLY the clips - so a Drums Sampler on a track that merely
 * HAD a clip in some slot sat silent when you pressed Play, because nothing had been
 * launched. "Press Play, hear the instrument" is the rule every other device in Live
 * has already taught the user, and quietly opting out of it reads as broken.
 *
 * The cost is the other direction: stopping a clip while the transport keeps running
 * leaves the device playing. That is the honest reading of "the transport is running",
 * and the Play parameter is still there to stop it by hand.
 *
 * Both are observed, never polled. The page receives `transport_play <0|1>` and
 * writes its Play parameter, so an automation lane or a Rack macro still overrides
 * it - the follow only acts on the EDGES of Live's own state.
 * ------------------------------------------------------------------ */

/** The devices that SEQUENCE, and therefore have something to start: everything except
 *  the browser (auditions), fx (filters audio it is given) and the synth (its notes are
 *  its trigger - there is no pattern to run). */
var FOLLOWS_TRANSPORT =
	STRUDEL_MODE !== "sample-browser" && STRUDEL_MODE !== "audio" && STRUDEL_MODE !== "synth";

var songPlayObs: LiveAPI | null = null;
var slotObs: LiveAPI | null = null;
var songPlaying = 0;
var playingSlot = -1;
var lastFollow = -1;

function setupTransportFollow(): void {
	if (!FOLLOWS_TRANSPORT) return;
	try {
		songPlayObs = new LiveAPI(onSongPlaying, "live_set");
		songPlayObs.property = "is_playing";
		var track = ownTrack();
		if (track && track.id) {
			slotObs = new LiveAPI(onPlayingSlot, track.unquotedpath);
			slotObs.property = "playing_slot_index";
		}
		post("strudel: transport follow on\n");
	} catch (e) {
		post("strudel: transport follow unavailable " + (e as Error).message + "\n");
	}
}

function onSongPlaying(a: unknown[]): void {
	if (a && a[0] == "is_playing") {
		songPlaying = Number(a[1]) ? 1 : 0;
		sendFollow(false);
	}
}

function onPlayingSlot(a: unknown[]): void {
	if (a && a[0] == "playing_slot_index") {
		playingSlot = Number(a[1]);
		sendFollow(false);
	}
}

/**
 * Push the follow state to the page, on change only (or unconditionally at ui_ready,
 * where the page has heard nothing yet and "no change" would leave it uninitialised).
 */
function sendFollow(force: boolean): void {
	if (!FOLLOWS_TRANSPORT) return;
	var value = playingSlot >= 0 || songPlaying === 1 ? 1 : 0;
	if (!force && value === lastFollow) return;
	lastFollow = value;
	outlet(0, "transport_play", value);
}

/* ------------------------------------------------------------------ *
 * Knob renaming (superdough, H.7 "dynamic renaming") - SPIKE
 *
 * The superdough device's eight native dials are a GENERIC pool ("S1".."S8"); the
 * code's slider() occurrences bind to them by order. The app sends
 * `knob_label <index> <name>` after each compile so the dial can carry the semantic
 * name ("lpf", "trancegate") on the panel, in a Rack macro picker and on Push.
 *
 * UNVERIFIED Max claim, deliberately spike-shaped: whether a live.dial's shortname
 * can be changed at runtime in a frozen M4L device. We reach the box the same way
 * the packaged wrapper's native_hide does (this.patcher.getnamed("param-s<n>")) and
 * try the two write forms; the Max console logs which (if either) took. If neither
 * does, the dials stay "S1".."S8" - cosmetic only, nothing else rides on this.
 * ------------------------------------------------------------------ */

// The parameters are declared for the type checker only - Max dispatches
// positionally, and a label with a space in it arrives as several arguments,
// which is what the join below puts back together.
function knob_label(_index?: number, ..._label: unknown[]): void {
	if (!IS_STRUDEL) return;
	var index = Number(arguments[0]);
	var label = Array.prototype.slice.call(arguments, 1).join(" ");
	if (!(index >= 0 && index < 8) || !label) return;
	var varname = "param-s" + (index + 1);
	try {
		var obj = this.patcher.getnamed(varname);
		if (!obj) {
			post("strudel: knob_label " + varname + " -> getnamed() null\n");
			return;
		}
		var before = obj.getattr("_parameter_shortname");
		if (String(before) === label) return; // already carries this name
		if (typeof obj.setattr === "function") {
			obj.setattr("_parameter_shortname", label);
		} else {
			obj.message("_parameter_shortname", label);
		}
		// The DEVICE VIEW wants this too: its fader bank shows the pattern's own
		// names, and a fader appearing is what makes it the visible view. The dial
		// itself is Live's; this is the same fact told to our own page.
		outlet(0, "knob_desc", index, label);
		var after = obj.getattr("_parameter_shortname");
		post(
			"strudel: knob_label " +
				varname +
				" '" +
				before +
				"' -> '" +
				after +
				"'" +
				(String(after) === label ? "" : " (rename did NOT take)") +
				"\n",
		);
	} catch (e) {
		post("strudel: knob_label " + varname + " error: " + (e as Error).message + "\n");
	}
}

/**
 * How Live PRINTS a dial's value - the same unit styles the build stamps into a
 * declared parameter, applied at runtime to a dial a pattern just described.
 *
 * It is not decoration and it is not the name: the name says WHICH parameter, the
 * unit style is what makes the readout say "600 Hz" rather than "600". They go to
 * different attributes, so they arrive as different messages.
 *
 * The order is Max's own list. 9 is Custom, which takes the string itself, so an
 * unknown unit still prints - "12 Bogons" - instead of being dropped.
 */
var UNITSTYLE: { [name: string]: number } = { int: 0, float: 1, ms: 2, Hz: 3, dB: 4, "%": 5, pan: 6, st: 7, midi: 8 };
var UNITSTYLE_CUSTOM = 9;

/**
 * Give a dial the pattern's OWN travel, so it reads 600 Hz and not 0.44.
 *
 * ------------------------------------------------------------------------------
 * THIS WAS TRIED BEFORE AND REVERTED, and the difference this time is the reply.
 *
 * `_parameter_range` takes. What broke it was the consequence: the dial then
 * reports its value IN THE NEW DOMAIN, and the page was still normalizing 0..1 on
 * the way in and out, so the two scalings fought and the knob sat at its minimum.
 *
 * So the range is not applied blind. Whether it took is answered back to the page
 * that asked (`knob_range_ok` / `knob_range_failed`), and the shim stops scaling
 * that dial when it did - one scaling, wherever it ends up living.
 *
 * KNOWN, while the old mini-view engine is still here: `useSliderKnobs` in the
 * device page normalizes the same eight parameters and does NOT hear this reply,
 * so a dial given a real range reads oddly THERE until that engine is retired
 * (doc/TODO.md item 1, the mini rebuild). Nothing else rides on it.
 */
function knob_range(_index?: number, _lo?: number, _hi?: number): void {
	if (!IS_STRUDEL) return;
	var index = Number(arguments[0]);
	var lo = Number(arguments[1]);
	var hi = Number(arguments[2]);
	if (!(index >= 0 && index < 8) || !(hi > lo)) return;
	var varname = "param-s" + (index + 1);
	try {
		var obj = this.patcher.getnamed(varname);
		if (!obj) {
			post("strudel: knob_range " + varname + " -> getnamed() null\n");
			return;
		}
		if (typeof obj.setattr === "function") {
			obj.setattr("_parameter_range", lo, hi);
		} else {
			obj.message("_parameter_range", lo, hi);
		}
		var after = obj.getattr("_parameter_range");
		var took = !!after && Number(after[0]) === lo && Number(after[1]) === hi;
		// The device view's faders need the same two numbers, and whether the dial
		// itself now carries them - the same question the shim asked.
		outlet(0, "knob_desc_range", index, lo, hi, took ? 1 : 0);
		post("strudel: knob_range " + varname + " -> " + String(after) + (took ? "" : " (did NOT take)") + "\n");
		// The page has to know which domain its values are now in. reply() goes back
		// to whichever window asked, which is the Studio (see core.ts).
		reply(took ? "knob_range_ok" : "knob_range_failed", index);
	} catch (e) {
		post("strudel: knob_range " + varname + " error: " + (e as Error).message + "\n");
	}
}

function knob_unit(_index?: number, ..._unit: unknown[]): void {
	if (!IS_STRUDEL) return;
	var index = Number(arguments[0]);
	var unit = Array.prototype.slice.call(arguments, 1).join(" ");
	if (!(index >= 0 && index < 8) || !unit) return;
	var varname = "param-s" + (index + 1);
	try {
		var obj = this.patcher.getnamed(varname);
		if (!obj) {
			post("strudel: knob_unit " + varname + " -> getnamed() null\n");
			return;
		}
		var known = UNITSTYLE[unit];
		var style = known === undefined ? UNITSTYLE_CUSTOM : known;
		if (typeof obj.setattr === "function") {
			obj.setattr("_parameter_unitstyle", style);
			if (style === UNITSTYLE_CUSTOM) obj.setattr("_parameter_units", unit);
		} else {
			obj.message("_parameter_unitstyle", style);
			if (style === UNITSTYLE_CUSTOM) obj.message("_parameter_units", unit);
		}
		var after = Number(obj.getattr("_parameter_unitstyle"));
		post(
			"strudel: knob_unit " + varname + " '" + unit + "' -> style " + after + (after === style ? "" : " (did NOT take)") + "\n",
		);
	} catch (e) {
		post("strudel: knob_unit " + varname + " error: " + (e as Error).message + "\n");
	}
}

/* ------------------------------------------------------------------ *
 * Hooks called by the packaged wrapper
 * ------------------------------------------------------------------ */

/** live.thisdevice bang, after the packaged core has done its own work. */
function onDeviceReady(): void {
	startClipPoll();
	setupScaleObservers();
	setupBrowserObservers();
	setupTransportFollow();
}

/**
 * A message from a WINDOW's page - which for this device means the local
 * strudel.cc in the Studio, running the shim.
 *
 * Without this hook the library logs every one as "unhandled", so two things live
 * here: the shim's `knob_label` (a pattern saying what a dial IS - see m4lKnob in
 * repl-shim/m4l-shim.js), and silence for the traffic [jweb] generates on its own.
 * `onloadstart`/`onloadend`/`url`/`title` are the browser object reporting page
 * loads; they are not ours and nothing acts on them, but a 17 MB site produces a
 * steady stream of them and it drowns the console.
 */
function onWindowMessage(): void {
	var selector = String(arguments[1]);
	var args = Array.prototype.slice.call(arguments, 2);

	if (selector === "knob_label") {
		// A PLAIN call, not .apply(this, ...). In Max's [js] the global object IS the
		// jsthis, so a plainly-called function sees `this.patcher`; passing the `this`
		// of a message handler instead hands it something that has no patcher, and
		// the handler dies with "this.patcher is undefined".
		knob_label(Number(args[0]), Array.prototype.slice.call(args, 1).join(" "));
		return;
	}
	if (selector === "knob_unit") {
		knob_unit(Number(args[0]), Array.prototype.slice.call(args, 1).join(" "));
		return;
	}
	if (selector === "knob_range") {
		knob_range(Number(args[0]), Number(args[1]), Number(args[2]));
		return;
	}
	if (selector === "shim_ready") {
		post("strudel: the Studio's shim is up\n");
		return;
	}
	// [jweb]'s own page-load chatter. Known, uninteresting, and loud.
	if (selector === "onloadstart" || selector === "onloadend" || selector === "url" || selector === "title") return;

	post("strudel: window " + String(arguments[0]) + " sent unhandled '" + selector + "'\n");
}

/** The UI announced itself; the packaged core has already sent mode/build/tempo. */
function onUiReady(): void {
	outlet(0, "mode", STRUDEL_MODE); // the real mode, not the packaged default
	if (!IS_STRUDEL && !IS_SYNTH) sendScale(); // the observers fired before this page existed
	sendQuant(); // ...same: the page cannot have heard the first one
	sendFolder();
	// The observers fired before this page existed, and "no change" would leave the
	// page's Play parameter guessing - so this one is forced.
	sendFollow(true);
	lastClipAvail = -1;
	// The Sampler is an instrument with no clips, so it does not poll for them (it shares
	// the browser's samples-folder paths, not the MIDI devices' clip paths). The superdough
	// device is an instrument with no clips either - probing one throws LiveAPI noise.
	if (!HAS_DEVICE_FOLDER && !IS_STRUDEL && !IS_SYNTH) checkClipAvailable();
}
