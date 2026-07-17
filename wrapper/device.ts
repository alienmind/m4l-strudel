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
var MODES = ["midi", "sampler-browser"];
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
	// The strudel-sample-browser is an audio effect with no MIDI notes of its own.
	if (IS_SAMPLER_BROWSER) return;
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
 * SPIKE R2 - can a device populate the user's rack?  THROWAWAY.
 *
 * doc/TODO.md R2, and m4l-jweb's TODO item 1. This whole block exists to answer ONE
 * question and then be DELETED: can `[js]` reach Live's Browser and instantiate a real
 * Ableton device? If it can, `.lpf(800)` can populate an Auto Filter in the user's rack
 * (Translate mode) and the reconciler gets built. If it cannot, the documented fallback
 * is ADOPT-don't-create, and most of the value survives.
 *
 * IT IS NOT A FEATURE AND MUST NOT BECOME ONE. It ships on no device: run it, write
 * what it says into the TODO, delete it. Nothing calls it - send `spike_rack` to the
 * [js] object by hand.
 *
 * WHAT IS KNOWN vs WHAT IS THE GATE. `Chain.delete_device` / `Song.move_device` /
 * `live.remote~` are all documented against the LOM. INSTANTIATION is not: the Browser
 * (`load_item`, hotswap) is documented for CONTROL SURFACE Python scripts, and whether
 * any of it is reachable through `new LiveAPI("live_app browser")` from [js] is exactly
 * the unknown. So this probes rather than asserts, and REPORTS what it finds - a
 * question that cannot fail is not a spike.
 *
 * HOW TO RUN IT (an afternoon, per the TODO):
 *   1. Put any Strudel device on a track, in a rack, and open the Max editor on it.
 *   2. Add a message box `spike_rack` and wire it to the [js] object's inlet.
 *   3. Open the Max console, click the message, read the numbered answers.
 *   4. Q4 and Q5 need YOUR EARS AND EYES - the console cannot hear a click or count
 *      undo steps. It prints what to do and what to look for.
 *
 * Answer in order, STOP AT THE FIRST NO.
 * ------------------------------------------------------------------ */

/** Say it in the console the same way every time, so the answers can be read off. */
function spikeSay(q: string, verdict: string, detail: string): void {
	post("SPIKE-R2 " + q + ": " + verdict + (detail ? " - " + detail : "") + "\n");
}

/**
 * Walk a BrowserItem tree looking for a device by name, depth-first, bounded.
 *
 * BOUNDED ON PURPOSE. The browser tree includes the user's whole library and every
 * pack they own; an unbounded walk in [js] is how you hang Live's main thread and
 * learn nothing. If Auto Filter is not within a few levels of `audio_effects`, the
 * shape of the tree is itself the finding - so report the depth rather than dig.
 */
function spikeFindItem(item: LiveAPI, want: string, depth: number, trail: string): LiveAPI | null {
	if (depth < 0) return null;
	var kids: unknown[];
	try {
		kids = item.get("children") as unknown[];
	} catch (e) {
		return null;
	}
	if (!kids) return null;
	// LiveAPI returns a flat list: "id 1 id 2 id 3". Step by two and take the number.
	for (var i = 0; i < kids.length; i++) {
		if (String(kids[i]) !== "id") continue;
		var child: LiveAPI;
		try {
			child = new LiveAPI("id " + kids[i + 1]);
		} catch (e2) {
			continue;
		}
		if (!child || !child.id) continue;
		var name = String(child.get("name"));
		if (name === want) {
			post("SPIKE-R2   found at: " + trail + "/" + name + "\n");
			return child;
		}
		var found = spikeFindItem(child, want, depth - 1, trail + "/" + name);
		if (found) return found;
	}
	return null;
}

function spike_rack(): void {
	post("\nSPIKE-R2 ---- can a device populate the user's rack? ----\n");

	/* Q1 - is the Browser reachable from [js] at all? ---------------- */
	var browser: LiveAPI;
	try {
		browser = new LiveAPI("live_app browser");
	} catch (e) {
		spikeSay("Q1 browser reachable", "NO", "constructor threw: " + (e as Error).message);
		return;
	}
	if (!browser || !browser.id || String(browser.id) === "0") {
		spikeSay("Q1 browser reachable", "NO", "id is 0 - the path does not resolve from [js]. STOP: Translate mode is adopt-only.");
		return;
	}
	spikeSay("Q1 browser reachable", "YES", "id " + browser.id + ", type " + browser.type);
	post("SPIKE-R2   browser info follows - this is the map we do not have:\n" + browser.info + "\n");

	/* Q2 - can a factory device be reached, and is load_item callable? */
	var roots = ["audio_effects", "instruments", "midi_effects"];
	var root: LiveAPI | null = null;
	for (var i = 0; i < roots.length; i++) {
		try {
			var r = new LiveAPI("live_app browser " + roots[i]);
			if (r && r.id && String(r.id) !== "0") {
				root = r;
				post("SPIKE-R2   " + roots[i] + " resolves: id " + r.id + "\n");
				if (roots[i] === "audio_effects") break;
			}
		} catch (e3) {
			post("SPIKE-R2   " + roots[i] + " threw: " + (e3 as Error).message + "\n");
		}
	}
	if (!root) {
		spikeSay("Q2 factory device reachable", "NO", "no browser root resolved. STOP.");
		return;
	}

	var item = spikeFindItem(root, "Auto Filter", 3, "audio_effects");
	if (!item) {
		spikeSay("Q2 factory device reachable", "NO", "Auto Filter not found within 3 levels - see the tree dump above. STOP.");
		return;
	}
	// `is_loadable` is what the browser itself thinks; if this is false the rest is moot.
	post("SPIKE-R2   Auto Filter: id " + item.id + ", is_loadable " + item.get("is_loadable") + ", uri " + item.get("uri") + "\n");
	// Does the METHOD exist? api.info lists what the object actually has - which is the
	// only honest way to ask, since calling it blind cannot tell "no such method" from
	// "method failed".
	var hasLoad = String(browser.info).indexOf("load_item") >= 0;
	spikeSay("Q2 load_item exists on browser", hasLoad ? "YES" : "NO", hasLoad ? "" : "not listed in browser.info. STOP: nothing can instantiate.");
	if (!hasLoad) return;

	/* Q3 - WHERE does it land, and can that be steered? -------------- */
	// Steer FIRST, then load: the browser loads onto the selected track, so the only
	// control we have is what is selected when we call. Record where we are, so the
	// answer is a comparison and not a guess.
	var before = "";
	try {
		var sel = new LiveAPI("live_set view selected_track");
		before = String(sel.get("name")) + " (" + sel.getcount("devices") + " devices)";
		post("SPIKE-R2   selected track before: " + before + "\n");
	} catch (e4) {
		post("SPIKE-R2   could not read selected_track: " + (e4 as Error).message + "\n");
	}

	try {
		browser.call("load_item", "id", item.id);
		spikeSay("Q3 load_item called", "YES", "it did not throw - now LOOK at the set");
	} catch (e5) {
		spikeSay("Q3 load_item called", "NO", "threw: " + (e5 as Error).message + ". STOP: reachable but not callable from [js].");
		return;
	}

	try {
		var after = new LiveAPI("live_set view selected_track");
		post("SPIKE-R2   selected track after: " + String(after.get("name")) + " (" + after.getcount("devices") + " devices)\n");
		post("SPIKE-R2   -> did the count go up, and is the Auto Filter WHERE you wanted it?\n");
		post("SPIKE-R2   -> if it landed in the wrong place: Song.move_device(device, target, position) is documented since Live 11.\n");
	} catch (e6) {
		post("SPIKE-R2   could not re-read selected_track: " + (e6 as Error).message + "\n");
	}

	/* Q4/Q5 - the ones a console cannot answer ----------------------- */
	post("SPIKE-R2 Q4 playback: start the transport, play a pad, click `spike_rack` again.\n");
	post("SPIKE-R2    -> LISTEN. A click or a dropout means insertion cannot happen mid-pattern,\n");
	post("SPIKE-R2       so Translate mode must batch its changes or apply them on stop.\n");
	post("SPIKE-R2 Q5 undo: press Cmd/Ctrl-Z ONCE.\n");
	post("SPIKE-R2    -> ONE press should remove the whole insertion. If it takes twelve,\n");
	post("SPIKE-R2       the reconciler needs its own undo grouping - or it is unusable.\n");
	post("SPIKE-R2 ---- write the answers into doc/TODO.md R2, then DELETE this block ----\n\n");
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
