/**
 * m4l-shim.js - the ONLY thing this repo adds to the stock strudel.cc page.
 *
 * scripts/build-repl.mjs injects it into the built site with a <script> tag. The
 * submodule is never patched: the app stays the app, with its own engine, its own
 * scheduler and all its visualisers, and this file talks to it from outside
 * through two globals that already exist -
 *
 *   window.max            injected by jweb into every page it loads (bindInlet/outlet)
 *   window.strudelMirror  set by the REPL itself (website/src/repl/useReplContext.jsx)
 *
 * STUB, deliberately. doc/TODO.md item 1 lands the real behaviour in spike 4:
 * arming the audio without a click, persisting the evaluated code to the device's
 * `code` slot, mirroring it to the device view, and mapping Play/Stop and the eight
 * native dials onto the REPL. Until then the site is expected to boot and play with
 * this file doing nothing, which is exactly what spikes 0 to 2 measure - so it
 * announces itself and stops.
 */
(function () {
	"use strict";

	var tag = "[m4l-shim]";

	function ready() {
		if (!window.max) return; // opened in a plain browser: nothing to say
		try {
			window.max.outlet("shim_ready", window.strudelMirror ? 1 : 0);
		} catch (e) {
			/* the page must never fail to load because of this file */
		}
	}

	// The REPL mounts asynchronously, so `strudelMirror` is not there at parse time.
	// Give it a bounded chance to appear, then report either way.
	var tries = 0;
	var poll = setInterval(function () {
		tries += 1;
		if (window.strudelMirror || tries > 100) {
			clearInterval(poll);
			console.log(tag, window.strudelMirror ? "REPL found" : "REPL NOT found after 10 s");
			ready();
		}
	}, 100);
})();
