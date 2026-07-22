/**
 * build-repl.mjs - build the strudel.cc submodule into an OFFLINE, file://-safe
 * static site at dist/repl-site/.
 *
 * WHY A SCRIPT AND NOT A FORK. The Studio window is meant to be the REAL local
 * strudel.cc - its scheduler, its superdough, its visualisers, its hydra - not a
 * lookalike of ours. So the submodule is built with its own Astro build, untouched,
 * and everything this repo needs is an OVERLAY pass over the OUTPUT: nothing here
 * writes inside strudel/, and a submodule bump costs a rebuild, not a re-merge.
 *
 * WHAT file:// BREAKS, and what each pass below is for:
 *
 *   - Root-absolute URLs (`/_astro/x.js`) resolve against the drive root, not the
 *     bundle. Astro is built with an empty base and the HTML is rewritten relative.
 *   - A service worker cannot register on file:// (no secure context, no scope).
 *     The PWA plugin injects one; registration would throw during startup, so the
 *     registration and the worker files both go.
 *   - hydra loads hydra-synth from unpkg by DEFAULT (strudel/packages/hydra/hydra.mjs).
 *     With no network that is a hang followed by a dead visual, so the CDN URL is
 *     rewritten to a vendored copy.
 *
 * The result is a folder, not a file - too big for the base64-in-[js] payload every
 * other window uses, which is why it ships next to the .amxd as a sidecar (see
 * doc/TODO.md item 1).
 *
 * Usage:
 *   node scripts/build-repl.mjs              full build (slow - it is Astro)
 *   node scripts/build-repl.mjs --no-build   overlay pass only, reuse strudel/website/dist
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { root } from "./devices.mjs";

const submodule = path.join(root, "strudel");
const site = path.join(submodule, "website");
const siteDist = path.join(site, "dist");
const out = path.join(root, "dist", "repl-site");
const shim = path.join(root, "src", "app", "strudel", "repl-shim", "m4l-shim.js");

/**
 * What the REPL page needs, by DIRECTORY. The docs tree (learn/, workshop/, blog/,
 * recipes/ ...) is most of the site's weight and none of its function here: the
 * Studio opens the REPL, and this repo's own help window is the reference.
 *
 * Root-level FILES are all kept - they are small, and index.html references several
 * of them by name (`make-scrollable-code-focusable.js`, the favicon, sample maps).
 * Guessing which ones is how a page ends up with one silent 404.
 */
const KEEP_DIRS = new Set(["_astro", "fonts", "icons", "img", "vendor"]);

/** Dropped even though they are root files: a service worker cannot register from
 *  file://, so shipping one only invites a confusing console error. */
const DROP_FILES = /^(sw\.js|workbox-.*\.js|registerSW\.js|manifest\.webmanifest|manifest\.json|CNAME|robots\.txt)$/;

const walk = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
		e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)],
	);
const bytes = (dir) => walk(dir).reduce((n, f) => n + statSync(f).size, 0);

if (!existsSync(path.join(site, "package.json"))) {
	throw new Error(
		`the strudel submodule is not checked out (${path.relative(root, site)} is missing) - run: git submodule update --init --recursive`,
	);
}

/**
 * --shim-only: refresh JUST our injected script in an already-built bundle.
 *
 * This exists because of a bug it shipped. `pnpm build` packages whatever is in
 * dist/repl-site, and nothing in that path rebuilds the shim - so an edit to
 * m4l-shim.js typechecked, passed its tests, and then went to Live as the PREVIOUS
 * version, silently. The device looked broken in a way no error explained.
 *
 * It is a file copy, so the main build now always does it.
 */
if (process.argv.includes("--shim-only")) {
	if (!existsSync(out)) {
		console.log("m4l-repl: no dist/repl-site yet - run `pnpm build:repl` once");
		process.exit(0);
	}
	cpSync(shim, path.join(out, "m4l-shim.js"));
	const index = path.join(out, "index.html");
	const html = readFileSync(index, "utf8");
	if (!html.includes("m4l-shim.js")) {
		writeFileSync(index, html.replace("</body>", '<script src="./m4l-shim.js"></script></body>'));
	}
	console.log("m4l-repl: shim refreshed in dist/repl-site");
	process.exit(0);
}

if (!process.argv.includes("--no-build")) {
	if (!existsSync(path.join(submodule, "node_modules"))) {
		throw new Error(`the strudel submodule has no node_modules - run: pnpm --dir strudel install`);
	}
	// From the submodule ROOT, not from website/: the root's `build` runs the jsdoc
	// pass first, and the site imports its output (doc.json) for the reference pane.
	// Building website/ directly fails on exactly that missing file.
	//
	// BASE_PATH empty: the bundle is opened from a folder, so there is no site root
	// to be based on. The rewrite below turns what that leaves into relative URLs.
	execSync("pnpm build", { cwd: submodule, stdio: "inherit", env: { ...process.env, BASE_PATH: "" } });
}

if (!existsSync(siteDist)) {
	throw new Error(`no astro output at ${path.relative(root, siteDist)} - drop --no-build and let it build`);
}

rmSync(out, { recursive: true, force: true });
cpSync(siteDist, out, { recursive: true });

const before = bytes(out);
for (const entry of readdirSync(out, { withFileTypes: true })) {
	const drop = entry.isDirectory() ? !KEEP_DIRS.has(entry.name) : DROP_FILES.test(entry.name);
	if (drop) rmSync(path.join(out, entry.name), { recursive: true, force: true });
}

// hydra's own default. Rewritten, not removed: a missing hydra-synth is a broken
// visual, a vendored one is an offline visual.
const CDN_HYDRA = /https?:\/\/unpkg\.com\/hydra-synth[^"'`\s]*/g;
let rewritten = 0;
let hydraHits = 0;
for (const file of walk(out)) {
	if (!/\.(html|js|css)$/.test(file)) continue;
	const text = readFileSync(file, "utf8");
	let next = text;
	if (file.endsWith(".html")) {
		next = next
			// The ordinary attributes...
			.replace(/(href|src)="\//g, '$1="./')
			// ...and Astro's ISLAND attributes, which are what actually load the REPL.
			// `component-url="/_astro/Repl.js"` is not an `src`, and missing it means a
			// page that renders its shell and hydrates nothing - blank, no error.
			.replace(/(component-url|renderer-url|before-hydration-url)="\//g, '$1="./')
			// Inline <style> carries the @font-face rules, root-absolute.
			.replace(/url\(\/(?!\/)/g, "url(./")
			.replace(/<link[^>]+rel="manifest"[^>]*>/g, "");
	}
	if (file.endsWith(".css")) {
		next = next.replace(/url\(\/(?!\/)/g, "url(./");
	}
	// Deliberately NOT rewritten: .js. A blind `"/` pass there corrupts regex
	// literals and string data, and Astro's own chunk imports are already relative.
	// What remains root-absolute in the chunks is the service-worker registration
	// (`/sw.js`), which simply fails to find a worker - see DROP_FILES.
	const hydraFixed = next.replace(CDN_HYDRA, "./vendor/hydra-synth.js");
	if (hydraFixed !== next) hydraHits += 1;
	next = hydraFixed;
	if (next !== text) {
		writeFileSync(file, next);
		rewritten += 1;
	}
}

// The worker files themselves, now that nothing registers them.
for (const f of readdirSync(out)) {
	if (/^(sw\.js|workbox-.*\.js|registerSW\.js|manifest\.webmanifest)$/.test(f)) rmSync(path.join(out, f), { force: true });
}

// Vendor hydra-synth from wherever the submodule's install put it.
const hydraCandidates = [
	path.join(root, "strudel", "node_modules", "hydra-synth", "dist", "hydra-synth.js"),
	path.join(root, "strudel", "packages", "hydra", "node_modules", "hydra-synth", "dist", "hydra-synth.js"),
	path.join(root, "node_modules", "hydra-synth", "dist", "hydra-synth.js"),
];
const hydraSrc = hydraCandidates.find((p) => existsSync(p));
if (hydraSrc) {
	cpSync(hydraSrc, path.join(out, "vendor", "hydra-synth.js"));
} else if (hydraHits) {
	// Only a problem if something actually asked for it.
	console.warn("m4l-repl: hydra-synth not found to vendor - hydra visuals will not work offline");
}

// The shim: additive, and the only line of ours in the page.
const index = path.join(out, "index.html");
if (!existsSync(index)) throw new Error(`the built site has no index.html at ${path.relative(root, index)}`);
cpSync(shim, path.join(out, "m4l-shim.js"));
const html = readFileSync(index, "utf8");
if (!html.includes("m4l-shim.js")) {
	writeFileSync(index, html.replace("</body>", '<script src="./m4l-shim.js"></script>\n</body>'));
}

const after = bytes(out);
const mb = (n) => (n / 1e6).toFixed(1);
console.log(`m4l-repl: dist/repl-site ${mb(after)} MB (pruned from ${mb(before)} MB), ${rewritten} file(s) rewritten`);
console.log(`m4l-repl: open dist/repl-site/index.html in a browser WITH THE NETWORK OFF to verify`);
