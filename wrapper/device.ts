/**
 * device.ts - the Strudel-specific half of the [js] glue.
 *
 * @m4l-jweb/wrapper already provides the lifecycle (bang/loadbang, the
 * anything() guard), the self-extracting UI payload, the LiveAPI transport poll,
 * the tempo observer and clip I/O. This file is compiled and concatenated after
 * those, as one ES5 script, so it can see and extend them.
 *
 * What is genuinely ours:
 *   1. The device mode (midi | sampler-browser), which gates the two below.
 *   2. clip_available: a poll, because LiveAPI has no observer for "any clip on
 *      this track", so the UI can disable From Clip when there is nothing to read.
 *   3. Live 12's global root_note/scale_name, forwarded to the UI.
 *
 * WHAT IS NO LONGER OURS: the [node.script] bootstrap, and the fan-out of tick and
 * tempo to outlet 1 that fed it. The sample browser has no process of its own since
 * m4l-jweb 0.6.0 - it fetches its catalog in the page, downloads through the
 * `download` chain and previews through the `samples` chain - and outlet 1 now
 * belongs to the packaged wrapper, which answers `buffer_load` and `fetch_to_file`
 * on it. Writing to it by hand from here would be talking over the library.
 *
 * Everything here is ES5 and gated by acorn, same as the packaged sources.
 */

/**
 * Device mode. Set from the object box by the manifest's `mode` field.
 *
 * TRAP: jsarguments[0] is the SCRIPT NAME, not the first argument. Reading index
 * 0 sets the mode to "wrapper.js", and every `MODE === "sampler-browser"` test is then
 * silently false forever - which is exactly the bug this project shipped for
 * months. Scan for a known token rather than trusting an index.
 */
// "audio" is the fx device: the wrapper defaults a device's mode to its container
// type, and the fx entry declares none of its own. Before it was listed here every
// fx instance warned "no device mode" and fell back to midi - harmless but noisy,
// and it ran the midi-only clip poll on a device with no clips to read.
var MODES = ["midi", "sampler-browser", "audio"];
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
var IS_SAMPLER_BROWSER = STRUDEL_MODE === "sampler-browser";

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
 * 1. WHERE THE DEVICE LIVES. The browser downloads a sample to a path RELATIVE to
 *    the device's folder, and that is the right thing for Max - `fetchToFile` and
 *    `[buffer~]` both resolve it the same way, and a relative path cannot be split
 *    into atoms by the spaces in "Ableton Library". But the USER has to be able to
 *    get at the file: to drag it into a Simpler, to find it in Places. A page cannot
 *    know its own device's folder, so the wrapper tells it - once, at ui_ready.
 *
 *    deviceFolder() is the packaged core's, and it is the SAME resolution the
 *    download used, which is what makes the path we hand the page the real one.
 *
 * 2. LIVE'S GLOBAL QUANTIZATION. The preview starts on a beat, and WHICH beat is not
 *    ours to decide - the user already told Live, in the transport bar. `1 Bar` means
 *    a preview waits for the downbeat; `None` means it plays now. Anything else is a
 *    device inventing its own timing rules next to the ones the set already has.
 * ------------------------------------------------------------------ */

var quantObs: LiveAPI | null = null;
var liveQuant: unknown = 4; // Live's default: 1 Bar

function setupBrowserObservers(): void {
	if (!IS_SAMPLER_BROWSER) return;
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
	if (IS_SAMPLER_BROWSER) outlet(0, "quantization", liveQuant);
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
	if (!IS_SAMPLER_BROWSER) return;
	var folder = deviceFolder(); // the packaged core's - the same resolution the download used
	if (folder) outlet(0, "device_folder", folder);
	else post("strudel: no device folder yet (unsaved patcher?) - the sample links will be off\n");
}

/**
 * Reveal the samples folder in the OS file manager - the app cannot, and this is the
 * stopgap until the drag-to-clip spike settles (doc/SPIKE-DRAG-TO-CLIP.md).
 *
 * `messnamed("max", ...)` is the JS equivalent of a `; max ...` message box: it addresses
 * the Max APPLICATION. `launchbrowser` hands a URL to the OS default handler, and the
 * default handler for a `file://` DIRECTORY is the native file manager - Finder on macOS,
 * Explorer on Windows - not a web browser, despite the message name. UNVERIFIED in Live;
 * if it opens a browser listing instead, that is the finding, and the fallback is to
 * reveal via a different Max object.
 *
 * The samples folder only exists once something has been downloaded (fetchToFile creates
 * it); before then this opens nothing. The app only offers the button once a sample is on
 * disk, so by the time it is clicked the folder is there.
 */
function reveal_folder(): void {
	if (!IS_SAMPLER_BROWSER) return;
	var folder = deviceFolder();
	if (!folder) {
		post("strudel: cannot reveal folder - the patcher is unsaved, so it has no path yet\n");
		return;
	}
	// file:///<path>/samples/ - encodeURI so the spaces in "Ableton Library" survive, and
	// strip a leading slash so a POSIX "/Users/x" becomes "file:///Users/x" not "////".
	var url = encodeURI("file:///" + (folder + "/samples/").replace(/^\/+/, ""));
	messnamed("max", "launchbrowser", url);
	post("strudel: reveal " + url + "\n");
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
	sendScale(); // the observers fired before this page existed
	sendQuant(); // ...same: the page cannot have heard the first one
	sendFolder();
	lastClipAvail = -1;
	if (!IS_SAMPLER_BROWSER) checkClipAvailable();
}
