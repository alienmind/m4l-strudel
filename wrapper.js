/**
 * wrapper.js - Max-side glue for the Strudel MIDI device (NOT the React app).
 *
 * 1. Load strudel-ui.html into [jweb] via a file:// URL from this patch path.
 * 2. write_clip: create a MIDI clip on THIS device's own track and fill it.
 * 3. read_notes: read the notes of the track's clip and send them to the UI.
 *
 * Outlets:
 * 0 - to jweb ("url ...", "notes <loopEnd> <n> <p s d> ...")
 * 1 - to print (optional)
 */

autowatch = 1;
inlets = 1;
outlets = 2;

post("wrapper.js loaded\n");

// Clip availability: polled (LiveAPI has no single observable for "any clip
// on this track"), pushed to the UI as `clip_available 0/1` on change so the
// From Clip button can disable itself when there is nothing to read.
var lastClipAvail = -1;
var clipPoll = new Task(checkClipAvailable, this);

function bang() {
	loadWebview();
	startClipPoll();
}
function loadbang() {
	loadWebview();
}
function reload() {
	loadWebview();
	startClipPoll();
}

function startClipPoll() {
	lastClipAvail = -1;
	clipPoll.cancel();
	clipPoll.interval = 1000;
	clipPoll.repeat();
}

function checkClipAvailable() {
	var avail = 0;
	try {
		avail = pickClip() ? 1 : 0;
	} catch (e) {
		avail = 0;
	}
	if (avail !== lastClipAvail) {
		lastClipAvail = avail;
		outlet(0, "clip_available", avail);
	}
}

/** UI announces it finished loading - resend current state. */
function ui_ready() {
	lastClipAvail = -1;
	checkClipAvailable();
}

function loadWebview() {
	try {
		var fp = this.patcher.filepath;
		if (!fp || !fp.length) {
			post("strudel: patcher not saved yet - UI path unknown\n");
			return;
		}
		var folder = fp.replace(/\/[^\/]*$/, "");
		var url = encodeURI("file:///" + folder + "/strudel-ui.html");
		outlet(0, "url", url);
		post("strudel: sent url " + url + "\n");
	} catch (e) {
		post("strudel: loadWebview error " + e.message + "\n");
	}
}

/** Return the LiveAPI for this device's own track. */
function ownTrack() {
	return new LiveAPI("this_device canonical_parent");
}

/**
 * write_clip <lengthBeats> <n> <p s d v> ...
 * Creates a clip in the first empty slot on this device's track.
 */
function write_clip() {
	var a = arrayfromargs(arguments);
	if (a.length < 2) return;
	var lengthBeats = a[0];
	var n = a[1];

	var slot = firstEmptySlot();
	if (!slot) {
		post("strudel: no empty clip slot on this track\n");
		return;
	}
	slot.call("create_clip", lengthBeats);
	var clip = new LiveAPI(slot.unquotedpath + " clip");

	var notes = [];
	for (var k = 0; k < n; k++) {
		var o = 2 + k * 4;
		notes.push({
			pitch: a[o],
			start_time: a[o + 1],
			duration: a[o + 2],
			velocity: a[o + 3],
			mute: 0,
		});
	}
	if (!addNotes(clip, notes)) {
		post("strudel: failed to add notes\n");
		return;
	}
	clip.set("name", "Strudel");
	post("strudel: wrote " + n + " notes over " + lengthBeats + " beats\n");
}

function firstEmptySlot() {
	try {
		var track = ownTrack();
		// Prefer the slot at the selected scene if it is empty.
		var count = parseInt(track.getcount("clip_slots"));
		for (var i = 0; i < count; i++) {
			var s = new LiveAPI(track.unquotedpath + " clip_slots " + i);
			if (parseInt(s.get("has_clip")) === 0) return s;
		}
		return null;
	} catch (e) {
		post("strudel: firstEmptySlot error " + e.message + "\n");
		return null;
	}
}

function addNotes(clip, notes) {
	try {
		clip.call("add_new_notes", { notes: notes });
		return true;
	} catch (e) {
		post("strudel: add_new_notes failed, trying legacy - " + e.message + "\n");
	}
	try {
		clip.call("set_notes");
		clip.call("notes", notes.length);
		for (var i = 0; i < notes.length; i++) {
			var nt = notes[i];
			clip.call("note", nt.pitch, nt.start_time, nt.duration, nt.velocity, nt.mute);
		}
		clip.call("done");
		return true;
	} catch (e2) {
		post("strudel: legacy set_notes failed - " + e2.message + "\n");
		return false;
	}
}

/**
 * read_notes - pick a clip on this device's track (playing clip → clip at the
 * selected scene → first clip found), read its notes, and send them to the UI.
 */
function read_notes() {
	var clip = pickClip();
	if (!clip) {
		post("strudel: no clip found on this track\n");
		outlet(0, "read_error", "no_clip");
		return;
	}
	var loopEnd = parseFloat(clip.get("loop_end"));
	var parsed = getNotes(clip, loopEnd);
	if (!parsed) return;

	var out = ["notes", loopEnd, parsed.length];
	for (var i = 0; i < parsed.length; i++) {
		out.push(parsed[i].pitch, parsed[i].start_time, parsed[i].duration);
	}
	outlet.apply(this, [0].concat(out));
	post("strudel: read " + parsed.length + " notes (loop_end " + loopEnd + ")\n");
}

function pickClip() {
	try {
		var track = ownTrack();
		var count = parseInt(track.getcount("clip_slots"));
		var firstWithClip = null;
		for (var i = 0; i < count; i++) {
			var s = new LiveAPI(track.unquotedpath + " clip_slots " + i);
			if (parseInt(s.get("has_clip")) === 1) {
				var c = new LiveAPI(s.unquotedpath + " clip");
				if (parseInt(c.get("is_playing")) === 1) return c;
				if (!firstWithClip) firstWithClip = c;
			}
		}
		return firstWithClip;
	} catch (e) {
		post("strudel: pickClip error " + e.message + "\n");
		return null;
	}
}

function getNotes(clip, loopEnd) {
	// Live 11+: get_notes_extended returns a JSON string.
	try {
		var d = clip.call("get_notes_extended", 0, 128, 0, loopEnd);
		var obj = typeof d === "string" ? JSON.parse(d) : d;
		if (obj && obj.notes) return obj.notes;
	} catch (e) {
		post("strudel: get_notes_extended failed, trying legacy - " + e.message + "\n");
	}
	// Legacy get_notes path
	try {
		clip.call("select_all_notes");
		var raw = clip.call("get_notes"); // returns list: notes n then note tuples
		return parseLegacyNotes(raw);
	} catch (e2) {
		post("strudel: legacy get_notes failed - " + e2.message + "\n");
		return null;
	}
}

function parseLegacyNotes(raw) {
	// raw = ["notes", count, "note", pitch, start, dur, vel, muted, ...]
	var notes = [];
	var i = 0;
	while (i < raw.length) {
		if (raw[i] === "note") {
			notes.push({
				pitch: raw[i + 1],
				start_time: raw[i + 2],
				duration: raw[i + 3],
				velocity: raw[i + 4],
			});
			i += 6;
		} else {
			i++;
		}
	}
	return notes;
}
