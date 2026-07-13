/**
 * Bundle each [node.script] entry into a single self-contained CJS file.
 * @strudel/* resolve into the git submodule; 'max-api' stays external
 * (Node for Max injects it at runtime).
 */
import { build } from "esbuild";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = (p) => path.join(root, "strudel", "packages", p);

const alias = {
	"@strudel/core": path.join(pkg("core"), "index.mjs"),
	"@strudel/core/fraction.mjs": path.join(pkg("core"), "fraction.mjs"),
	"@strudel/mini": path.join(pkg("mini"), "index.mjs"),
	"@strudel/transpiler": path.join(pkg("transpiler"), "index.mjs"),
	"@strudel/tonal": path.join(pkg("tonal"), "index.mjs"),
};

mkdirSync(path.join(root, "dist", "node"), { recursive: true });

for (const device of ["sampler-browser"]) {
	await build({
		entryPoints: [path.join(root, "src", "max", device, "main.mjs")],
		bundle: true,
		platform: "node",
		format: "cjs",
		target: "node16", 
		outfile: path.join(root, "dist", "node", `strudel-node-${device}.cjs`),
		alias,
		nodePaths: [path.join(root, "strudel", "node_modules")],
		external: ["max-api"],
		logLevel: "info",
	});
}
