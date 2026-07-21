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
var MODES = ["midi", "sample-browser", "drums-sampler", "audio", "superdough"];
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
/** The superdough render device: an instrument with no clips, no pitches (the code goes
 *  to superdough verbatim, so Live's scale means nothing to it) and no samples folder of
 *  its own. It wants NONE of the observers below - running the midi defaults on it was
 *  what produced the "no valid object set" noise in the Max console. */
var IS_SUPERDOUGH = STRUDEL_MODE === "superdough";
/**
 * The devices that put files in the device folder, and therefore need to tell the page
 * where that folder is and to reveal it on request.
 *
 * It is no longer only about SAMPLES. The browser saves each auditioned file (a file on
 * disk is what makes a row draggable into a track), and both pattern devices write WAV
 * bounces with Export. Anything that writes needs the `download` chain for [maxurl] and
 * belongs in here - the two travel together.
 */
var HAS_DEVICE_FOLDER = IS_SAMPLE_BROWSER || IS_DRUMS_SAMPLER || IS_SUPERDOUGH;

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
	// The superdough device never resolves a pitch - its code is full Strudel that goes
	// to superdough verbatim - so Live's scale is not its business.
	if (IS_SUPERDOUGH) return;
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

/**
 * Reveal the samples folder in the OS file manager - the app cannot. This is the shipping
 * answer, not a stopgap: the drag-into-Live alternative was tried and failed for good
 * (doc/DRAWER_OF_FAILED_IDEAS.md - CEF strips the DownloadURL payload, and LOM has no
 * create-audio-clip).
 *
 * `messnamed("max", ...)` is the JS equivalent of a `; max ...` message box: it addresses
 * the Max APPLICATION. `launchbrowser` hands its argument to the OS default handler, and
 * the default handler for a DIRECTORY is the native file manager - Finder on macOS,
 * Explorer on Windows - not a web browser, despite the message name.
 *
 * WHAT IT WANTS DIFFERS PER PLATFORM, measured in Live on Windows 11:
 *   - A `file:///C:/...%20...` URL reaches the shell (a wrong path raised a real
 *     "cannot find the file" dialog naming it) but a CORRECT one opens nothing at all.
 *     Windows' ShellExecute does not treat a percent-encoded file:// directory URL as a
 *     folder to browse, and fails silently rather than reporting it.
 *   - A native path with backslashes (`C:\Music\...\m4l-strudel`) is the form
 *     ShellExecute does open in Explorer.
 * macOS keeps the `file://` URL, which is what `open` expects there.
 *
 * A subfolder only exists once something has been written into it; before then the OS
 * reports a missing file rather than opening anything. Every app only offers the button
 * once it has put a file on disk, so by the time it is clicked the folder is there.
 */
function reveal_folder(): void {
	if (!HAS_DEVICE_FOLDER) return;
	var folder = deviceFolder();
	if (!folder) {
		post("strudel: cannot reveal folder - the patcher is unsaved, so it has no path yet\n");
		return;
	}
	// WHICH folder depends on what the device writes, and getting this wrong is not a
	// cosmetic miss - the OS reports "cannot find the file" on a folder that was never
	// created. The sample browser downloads into a `samples/` subfolder (localPath());
	// superdough and the drums sampler export their WAVs to the device folder ITSELF.
	var target = IS_SAMPLE_BROWSER ? folder + "/samples" : folder;

	// A Windows path out of [js] is POSIX-shaped with a drive letter ("C:/Music/...").
	var isWindows = /^[A-Za-z]:/.test(target);
	// No trailing slash on either form: Explorer wants the folder itself, and a POSIX
	// path is stripped of its leading slash so "/Users/x" becomes "file:///Users/x".
	var arg = isWindows ? target.replace(/\//g, "\\") : encodeURI("file:///" + target.replace(/^\/+/, ""));

	messnamed("max", "launchbrowser", arg);
	// The exact string, because a silent no-op is the failure mode here: if nothing
	// opens, this line in the Max console is what says which form was tried.
	post("strudel: reveal " + arg + "\n");
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

function knob_label(): void {
	if (!IS_SUPERDOUGH) return;
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
		var after = obj.getattr("_parameter_shortname");
		post("strudel: knob_label " + varname + " '" + before + "' -> '" + after + "'" + (String(after) === label ? "" : " (rename did NOT take)") + "\n");
	} catch (e) {
		post("strudel: knob_label " + varname + " error: " + (e as Error).message + "\n");
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
}

/** The UI announced itself; the packaged core has already sent mode/build/tempo. */
function onUiReady(): void {
	outlet(0, "mode", STRUDEL_MODE); // the real mode, not the packaged default
	if (!IS_SUPERDOUGH) sendScale(); // the observers fired before this page existed
	sendQuant(); // ...same: the page cannot have heard the first one
	sendFolder();
	lastClipAvail = -1;
	// The Sampler is an instrument with no clips, so it does not poll for them (it shares
	// the browser's samples-folder paths, not the MIDI devices' clip paths). The superdough
	// device is an instrument with no clips either - probing one throws LiveAPI noise.
	if (!HAS_DEVICE_FOLDER && !IS_SUPERDOUGH) checkClipAvailable();
}
