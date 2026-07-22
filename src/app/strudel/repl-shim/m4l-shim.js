/**
 * m4l-shim.js - the ONLY thing this repo adds to the stock strudel.cc page.
 *
 * scripts/build-repl.mjs injects it into the built site with a <script> tag. The
 * submodule is never patched: the app stays the app, with its own engine, its own
 * scheduler and all its visualisers, and this file drives it from outside through
 * two globals that already exist -
 *
 *   window.max            injected by jweb into every page it loads (bindInlet/outlet)
 *   window.strudelMirror  the StrudelMirror editor (website/src/repl/useReplContext.jsx)
 *
 * It is plain ES5-ish JavaScript with no imports on purpose: it is copied into a
 * built site, not bundled with it, so it can depend on nothing but the page.
 *
 * WHAT IT DOES, and why each one is not optional:
 *
 *   1. ARMS THE AUDIO. The REPL waits for a `mousedown` on the document before it
 *      creates an AudioContext (initAudioOnFirstClick, superdough.mjs). A window
 *      that loads hidden at device load never gets one, so the device would be
 *      silent until the user opened the Studio and clicked in it.
 *
 *   2. PINS THE OUTPUT DEVICE. `initAudio({ audioDeviceName })` calls `setSinkId`
 *      for any device that is not the default - which would steer the sound to a
 *      sound card and AWAY from the [jweb~] outlets that are the track. A setting
 *      left over from a browser session would silently take the device off the
 *      track, so the saved value is forced back to the default.
 *
 *   3. PERSISTS THE PATTERN into the device's `code` state slot, so it saves with
 *      the LIVE SET rather than in this page's localStorage. The Live set is what
 *      a musician backs up, moves between machines and expects to reopen intact.
 *
 *   4. TAKES PLAY/STOP AND THE KNOBS from the device view, which is where Live's
 *      transport, Push and the automation lanes reach.
 */
(function () {
	"use strict";

	var TAG = "[m4l-shim]";
	var SETTINGS_PREFIX = "strudel-settings"; // website/src/settings.mjs, nanostores persistentMap
	var DEFAULT_DEVICE = "System Standard"; // superdough.mjs DEFAULT_AUDIO_DEVICE_NAME
	var LOADING = "// LOADING"; // the REPL's placeholder buffer while it boots

	/* -------------------------------------------------------------- *
	 * 2. The output device, BEFORE the app reads its settings.
	 * -------------------------------------------------------------- */
	try {
		// A persistentMap stores one localStorage entry per key, prefixed.
		localStorage.setItem(SETTINGS_PREFIX + "audioDeviceName", DEFAULT_DEVICE);
	} catch (e) {
		// Never let this file be the reason a page fails to load.
		console.warn(TAG, "could not pin the audio device:", e && e.message);
	}

	var max = null; // set once jweb has injected it
	var editor = null;
	var lastSentCode = null;
	var knobs = [0, 0, 0, 0, 0, 0, 0, 0];

	/**
	 * The eight native dials, readable from a pattern as `m4lKnob(1)`..`m4lKnob(8)`.
	 *
	 * Defined before the REPL evaluates anything, so a pattern that opens with a
	 * knob reference works on the first evaluation rather than the second.
	 */
	window.m4lKnob = function (n) {
		var v = knobs[(n | 0) - 1];
		return typeof v === "number" ? v : 0;
	};

	function ready(fn) {
		var tries = 0;
		var poll = setInterval(function () {
			tries += 1;
			if (window.max && window.strudelMirror) {
				clearInterval(poll);
				fn(window.strudelMirror, window.max);
			} else if (tries > 300) {
				clearInterval(poll);
				console.warn(TAG, "gave up waiting for", window.max ? "the REPL" : "window.max");
			}
		}, 100);
	}

	ready(function (mirror, m) {
		editor = mirror;
		max = m;

		/* ------------------------------------------------------------ *
		 * 1. Arm the audio with no click.
		 * ------------------------------------------------------------ */
		try {
			document.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
		} catch (e) {
			console.warn(TAG, "could not arm the audio:", e && e.message);
		}

		/* ------------------------------------------------------------ *
		 * 3. The pattern, from and to the Live set.
		 *
		 * The REPL loads its own last buffer asynchronously (initCode, from the URL
		 * hash or its localStorage), so writing ours immediately would be overwritten
		 * a moment later. Wait until its own load has settled - the buffer stops
		 * being the "// LOADING" placeholder - and only then apply the set's pattern.
		 * ------------------------------------------------------------ */
		var restored = false;
		var pending = null;

		function applyRestore() {
			if (restored || pending === null) return;
			if (!editor.code || editor.code.indexOf(LOADING) === 0) return; // still booting
			restored = true;
			if (pending.length && pending !== editor.code) {
				editor.setCode(pending);
				console.log(TAG, "restored the pattern from the Live set");
			}
			lastSentCode = editor.code;
		}

		max.bindInlet("state_code", function (json) {
			try {
				var code = JSON.parse(json);
				if (typeof code !== "string") return;
				if (restored) {
					// A later write is another view editing the same slot (the mini
					// device, the old Studio). Follow it, unless it is our own echo.
					if (code !== editor.code) editor.setCode(code);
					lastSentCode = code;
					return;
				}
				pending = code;
				applyRestore();
			} catch (e) {
				console.warn(TAG, "bad code slot:", e && e.message);
			}
		});
		max.outlet("get_state", "code");

		/**
		 * Write the buffer back whenever it changes.
		 *
		 * A poll rather than a hook on `evaluate`, deliberately: the REPL has several
		 * paths that change the buffer (evaluate, its own pattern browser, a paste),
		 * and typing that has not been evaluated yet is still work the musician would
		 * expect to survive a save. One string comparison a second costs nothing.
		 */
		setInterval(function () {
			applyRestore(); // in case the REPL was still booting when the slot arrived
			if (!restored) return;
			var code = editor.code;
			if (typeof code !== "string" || code === lastSentCode) return;
			lastSentCode = code;
			try {
				max.outlet("sync_state", "code", JSON.stringify(code));
			} catch (e) {
				console.warn(TAG, "could not persist the pattern:", e && e.message);
			}
		}, 1000);

		/* ------------------------------------------------------------ *
		 * 4. Transport and knobs, forwarded by the device view.
		 * ------------------------------------------------------------ */
		max.bindInlet("set_play", function (v) {
			try {
				if (Number(v)) editor.evaluate();
				else editor.stop();
			} catch (e) {
				console.warn(TAG, "transport failed:", e && e.message);
			}
		});

		for (var i = 1; i <= 8; i++) {
			(function (n) {
				max.bindInlet("set_s" + n, function (v) {
					knobs[n - 1] = Number(v) || 0;
				});
			})(i);
		}

		max.outlet("shim_ready", 1);
		console.log(TAG, "ready - pattern persists to the Live set, transport and knobs are live");
	});
})();
