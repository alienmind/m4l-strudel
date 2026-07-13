import Max from "max-api";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const CACHE = path.join(os.homedir(), "Music", "StrudelSamples");

/** Pseudo-URL resolution, ported from strudel/packages/superdough/sampler.mjs
 *  and webaudio/supradough.mjs. Keep in sync manually; it is tiny. */
function githubPath(base, subpath = "") {
	let [, p] = base.split("github:");
	p = p.endsWith("/") ? p.slice(0, -1) : p;
	if (p.split("/").length === 2) p += "/main";
	return `https://raw.githubusercontent.com/${p}/${subpath}`;
}
async function fetchSampleMap(url) {
	if (url.startsWith("github:")) url = githubPath(url, "strudel.json");
	if (url.startsWith("shabda:")) url = `https://shabda.ndre.gr/${url.split("shabda:")[1]}.json?strudel=1`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status} loading ${url}`);
	const json = await res.json();
	const base = json._base || url.split("/").slice(0, -1).join("/") + "/";
	return [json, base];
}

/** Normalize a strudel.json map: { name: [urls] } - mirrors processSampleMap
 *  (superdough/sampler.mjs): values are arrays OR {note: url(s)} objects. */
function flattenMap(json, base) {
	const out = {};
	for (const [key, value] of Object.entries(json)) {
		if (key.startsWith("_")) continue;
		if (Array.isArray(value)) out[key] = value.map((u) => base + u);
		else if (typeof value === "string") out[key] = [base + value];
		else {
			// pitched: { "c3": "piano/c3.wav", ... }
			out[key] = Object.values(value).flat().map((u) => base + u);
			out[`${key}__pitched`] = true;
		}
	}
	return out;
}

let currentMap = {}; // name → [absolute urls]
let mapName = "";

Max.addHandler("load_map", async (pseudoUrl) => {
	try {
		const [json, base] = await fetchSampleMap(String(pseudoUrl));
		currentMap = flattenMap(json, base);
		mapName = String(pseudoUrl).replace(/[^a-z0-9-]+/gi, "_");
		const names = Object.keys(currentMap).filter((k) => !k.endsWith("__pitched"));
		// catalog as JSON-in-base64 (arbitrary chars safe through Max):
		const catalog = names.map((n) => ({
			name: n,
			count: currentMap[n].length,
			pitched: !!currentMap[`${n}__pitched`],
		}));
		Max.outlet("catalog", Buffer.from(JSON.stringify(catalog)).toString("base64"));
	} catch (e) {
		Max.outlet("fetcherr", Buffer.from(e.message).toString("base64"));
	}
});

async function localPath(name, n) {
	const urls = currentMap[name];
	if (!urls?.length) throw new Error(`unknown sound ${name}`);
	const url = urls[n % urls.length];
	const ext = path.extname(new URL(url).pathname) || ".wav";
	const file = path.join(CACHE, mapName, name, `${n % urls.length}${ext}`);
	try {
		await access(file);
		return file; // cached
	} catch {
		/* download */
	}
	await mkdir(path.dirname(file), { recursive: true });
	const res = await fetch(url);
	if (!res.ok) throw new Error(`${res.status} for ${url}`);
	await writeFile(file, Buffer.from(await res.arrayBuffer()));
	return file;
}

Max.addHandler("download", async (name, n = 0) => {
	try {
		const file = await localPath(String(name), Number(n));
		Max.outlet("downloaded", Buffer.from(file).toString("base64"));
	} catch (e) {
		Max.outlet("fetcherr", Buffer.from(e.message).toString("base64"));
	}
});

Max.addHandler("download_all", async (name) => {
	const urls = currentMap[String(name)] ?? [];
	for (let i = 0; i < urls.length; i++) {
		try {
			await localPath(String(name), i);
			Max.outlet("progress", String(name), i + 1, urls.length);
		} catch (e) {
			Max.outlet("fetcherr", Buffer.from(e.message).toString("base64"));
		}
	}
});

// ---- BPM-synced preview -------------------------------------------------
// Track transport via the same tick chain ("tick <playing> <beats>", from
// plugsync~ outlets 0 and 6); bpm arrives separately from the wrapper's
// LiveAPI tempo observer. On "preview", open in sfplay~ and start at the
// next beat boundary using a node-side timer (jitter acceptable for
// previewing).
let beatState = { beats: 0, bpm: 120, playing: false, at: Date.now() };
Max.addHandler("tick", (playing, beats) => {
	beatState = { ...beatState, beats: Number(beats), playing: Number(playing) >= 0.5, at: Date.now() };
});
Max.addHandler("tempo", (bpm) => {
	if (Number(bpm) > 0) beatState.bpm = Number(bpm);
});

Max.addHandler("preview", async (name, n = 0) => {
	try {
		const file = await localPath(String(name), Number(n));
		Max.outlet("preview_open", file); // sfplay~ open <path>
		let delay = 30; // transport stopped: play now-ish
		if (beatState.playing) {
			const elapsed = (Date.now() - beatState.at) / 1000;
			const nowBeats = beatState.beats + elapsed * (beatState.bpm / 60);
			const nextBeat = Math.ceil(nowBeats);
			delay = ((nextBeat - nowBeats) * 60000) / beatState.bpm;
		}
		setTimeout(() => Max.outlet("preview_go"), Math.max(10, delay));
	} catch (e) {
		Max.outlet("fetcherr", Buffer.from(e.message).toString("base64"));
	}
});
Max.addHandler("preview_stop", () => Max.outlet("preview_stop"));

Max.addHandler("open_folder", async () => {
	await mkdir(CACHE, { recursive: true });
	const { exec } = await import("node:child_process");
	const cmd =
		process.platform === "win32"
			? `explorer "${CACHE}"`
			: process.platform === "darwin"
				? `open "${CACHE}"`
				: `xdg-open "${CACHE}"`;
	exec(cmd);
});

// Scale context from [js] observers (root 0-11, name string) - forwarded to UI by js
// directly; node only needs it if implementing transpose-on-download later.
Max.addHandler("scale", () => {});
for (const ignored of ["ui_ready", "code", "hush"]) Max.addHandler(ignored, () => {});
Max.post("strudel sample-browser ready");
Max.outlet("engine_ready");
