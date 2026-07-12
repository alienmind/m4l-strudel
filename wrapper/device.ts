/**
 * device.ts - the Strudel-specific half of the [js] glue.
 *
 * @m4l-jweb/wrapper already provides the lifecycle (bang/loadbang, the
 * anything() guard), the self-extracting UI payload, the LiveAPI transport poll,
 * the tempo observer and clip I/O. This file is compiled and concatenated after
 * those, as one ES5 script, so it can see and extend them.
 *
 * What is genuinely ours:
 *   1. The device mode (midi | sampler), and the fan-out to outlet 1 that the
 *      sampler's [node.script] needs.
 *   2. clip_available: a poll, because LiveAPI has no observer for "any clip on
 *      this track", so the UI can disable From Clip when there is nothing to read.
 *   3. Live 12's global root_note/scale_name, forwarded to the UI and to node.
 *   4. The [node.script] bootstrap (sampler only).
 *
 * Everything here is ES5 and gated by acorn, same as the packaged sources.
 */

/**
 * Device mode. Set from the object box by the manifest's `mode` field.
 *
 * TRAP: jsarguments[0] is the SCRIPT NAME, not the first argument. Reading index
 * 0 sets the mode to "wrapper.js", and every `MODE === "sampler"` test is then
 * silently false forever - which is exactly the bug this project shipped for
 * months. Scan for a known token rather than trusting an index.
 */
var MODES = ["midi", "sampler"];
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
var IS_SAMPLER = STRUDEL_MODE === "sampler";

post("strudel: mode " + STRUDEL_MODE + "\n");

/**
 * The sampler runs a [node.script] on outlet 1 that needs the same clock and
 * tempo the UI gets. The packaged wrapper only sends them to jweb (outlet 0), so
 * mirror them here.
 *
 * onTick and onTempoChange are hooks the packaged wrapper calls; see max.d.ts.
 */
function onTick(playing: number, beats: number): void {
	if (IS_SAMPLER) outlet(1, "tick", playing, beats);
}

function onTempoChange(bpm: number): void {
	if (IS_SAMPLER) outlet(1, "tempo", bpm);
}

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
	// The sampler is an audio effect with no MIDI notes of its own.
	if (IS_SAMPLER) return;
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
 * Live 12 global scale (sampler only)
 *
 * Forwarded to the UI (which filters the catalog by key) and to node.
 * ------------------------------------------------------------------ */

var rootObs: LiveAPI | null = null;
var scaleObs: LiveAPI | null = null;
var liveRoot: unknown = 0;
var liveScale = "Major";

function setupScaleObservers(): void {
	if (!IS_SAMPLER) return;
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
	outlet(0, "scale", liveRoot, liveScale); // -> jweb (catalog filter)
	outlet(1, "scale", liveRoot, liveScale); // -> node
}

/* ------------------------------------------------------------------ *
 * [node.script] bootstrap (sampler only)
 *
 * The rest of this project deliberately avoids node.script - Node for Max is
 * unstable in Live, from silently ignoring `script start` to crashing the host,
 * which is why the engine lives in a Web Worker instead. The sampler is the one
 * device that genuinely needs the OS (fetch + filesystem), so it pays that cost.
 *
 * The patcher creates it with @autostart 0 and [js] owns the start sequence.
 * node.script resolves its script filename when the OBJECT INSTANTIATES, before
 * this script could have extracted anything - which is why the .cjs also ships
 * loose next to the .amxd (manifest `looseFiles`). The embedded payload
 * (manifest `payloads`) is the fallback for a bare .amxd copied on its own.
 * ------------------------------------------------------------------ */

var nodeStarted = false;
var nodeStartTask = new Task(startNodeScript, this);
var nodeProbeTask = new Task(probeNodeScript, this);

function bootNodeScript(): void {
	if (!IS_SAMPLER || nodeStarted) return;
	// The packaged core already extracted every manifest payload, including the
	// .cjs bundle, so by here the file is on disk.
	nodeStartTask.schedule(300);
}

function startNodeScript(): void {
	if (nodeStarted) return;
	nodeStarted = true;
	outlet(1, "script", "start");
	post("strudel: node.script start requested\n");
	nodeProbeTask.schedule(2000);
}

/**
 * Status probe, 2s after start. node.script answers "script running" on its right
 * (dump) outlet, which the patcher wires to [print n4m]. If the console shows NO
 * n4m line after this post, the js -> node.script message path is dead (object
 * missing or patchline dropped). If it shows "running 0", node got the message
 * but the script did not start.
 */
function probeNodeScript(): void {
	outlet(1, "script", "running");
	post("strudel: node.script status probe sent (expect an 'n4m:' console line)\n");
}

/* ------------------------------------------------------------------ *
 * Hooks called by the packaged wrapper
 * ------------------------------------------------------------------ */

/** live.thisdevice bang, after the packaged core has done its own work. */
function onDeviceReady(): void {
	bootNodeScript();
	startClipPoll();
	setupScaleObservers();
}

/** The UI announced itself; the packaged core has already sent mode/build/tempo. */
function onUiReady(): void {
	outlet(0, "mode", STRUDEL_MODE); // the real mode, not the packaged default
	lastClipAvail = -1;
	if (!IS_SAMPLER) checkClipAvailable();
}
