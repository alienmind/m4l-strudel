import { defineConfig } from "vitest/config";
import { fileURLToPath, URL } from "node:url";

const pkg = (p: string) => fileURLToPath(new URL(`./strudel/packages/${p}`, import.meta.url));

export default defineConfig({
	resolve: {
		alias: [
			{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
			{ find: "@strudel/core/fraction.mjs", replacement: pkg("core/fraction.mjs") },
			{ find: "@strudel/core", replacement: pkg("core/index.mjs") },
			{ find: "@strudel/mini", replacement: pkg("mini/index.mjs") },
			{ find: "@strudel/transpiler", replacement: pkg("transpiler/index.mjs") },
			{ find: "@strudel/tonal", replacement: pkg("tonal/index.mjs") },
		],
	},
	test: {
		globals: true,
		environment: "node",
		// only this project's tests - the strudel/ submodule ships its own
		// test suite (and its own vitest config) which we don't want to run here.
		include: ["src/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
	},
});
