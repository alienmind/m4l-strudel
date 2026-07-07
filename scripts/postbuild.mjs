/**
 * Runs after `vite build`. Assembles dist/:
 * 1. Rename dist/index.html → dist/strudel-ui.html
 * 2. Copy ableton-amxd/StrudelMidi.amxd → dist/ (if present)
 * 3. Copy strudel.js → dist/
 * 4. Zip m4l-strudel-dist.zip
 */
import archiver from "archiver";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { rename, copyFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

await rename(path.join(dist, "index.html"), path.join(dist, "strudel-ui.html"));
console.log("postbuild: dist/index.html → dist/strudel-ui.html");

const amxdSrc = path.join(root, "ableton-amxd", "StrudelMidi.amxd");
if (existsSync(amxdSrc)) {
	await copyFile(amxdSrc, path.join(dist, "StrudelMidi.amxd"));
	console.log("postbuild: ableton-amxd/StrudelMidi.amxd → dist/");
} else {
	console.log("postbuild: ableton-amxd/StrudelMidi.amxd not found (create it in Max) - skipping");
}

await copyFile(path.join(root, "strudel.js"), path.join(dist, "strudel.js"));
console.log("postbuild: strudel.js → dist/strudel.js");

const zipPath = path.join(root, "m4l-strudel-dist.zip");
await new Promise((resolve, reject) => {
	const output = createWriteStream(zipPath);
	const archive = archiver("zip", { zlib: { level: 9 } });
	output.on("close", resolve);
	archive.on("error", reject);
	archive.pipe(output);
	for (const f of ["StrudelMidi.amxd", "strudel.js", "strudel-ui.html"]) {
		const p = path.join(dist, f);
		if (existsSync(p)) archive.append(createReadStream(p), { name: `StrudelMidi/${f}` });
	}
	archive.finalize();
});
const { size } = await stat(zipPath);
console.log(`postbuild: m4l-strudel-dist.zip (${size} bytes)`);
