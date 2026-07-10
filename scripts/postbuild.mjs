/**
 * Runs after `vite build`. Assembles the final distributable folder,
 * named after the project (package.json "name"):
 * 1. Move dist/index.html → dist/<name>/strudel-ui.html
 * 2. Generate dist/<name>/<name>.amxd from ableton-amxd/patcher.json
 * 3. Copy wrapper.js (root) → dist/<name>/
 * 4. Create dist/<name>.zip (release archive of that folder + install scripts)
 */
import archiver from "archiver";
import { createReadStream, createWriteStream, existsSync } from "node:fs";
import { rename, copyFile, mkdir, readFile, stat } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

const { name } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const outDir = path.join(dist, name);
await mkdir(outDir, { recursive: true });

await rename(path.join(dist, "index.html"), path.join(outDir, "strudel-ui.html"));
console.log(`postbuild: dist/index.html → dist/${name}/strudel-ui.html`);

execFileSync(process.execPath, [
	path.join(root, "scripts", "build-amxd.mjs"),
	path.join(outDir, `${name}.amxd`),
], { stdio: "inherit" });

await copyFile(path.join(root, "strudel-wrapper.js"), path.join(outDir, "strudel-wrapper.js"));
console.log(`postbuild: strudel-wrapper.js → dist/${name}/strudel-wrapper.js`);

const zipPath = path.join(dist, `${name}.zip`);
await new Promise((resolve, reject) => {
	const output = createWriteStream(zipPath);
	const archive = archiver("zip", { zlib: { level: 9 } });
	output.on("close", resolve);
	archive.on("error", reject);
	archive.pipe(output);
	for (const f of [`${name}.amxd`, "strudel-wrapper.js", "strudel-ui.html"]) {
		const p = path.join(outDir, f);
		if (existsSync(p)) archive.append(createReadStream(p), { name: `${name}/${f}` });
	}
	for (const installer of ["install-windows.ps1", "install-mac.sh", "install-linux.sh"]) {
		archive.file(path.join(root, "scripts", installer), { name: installer, mode: 0o755 });
	}
	archive.finalize();
});
const { size } = await stat(zipPath);
console.log(`postbuild: dist/${name}.zip (${size} bytes)`);
