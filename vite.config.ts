import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import pkg from "./package.json";

const pkg2 = (p: string) => fileURLToPath(new URL(`./strudel/packages/${p}`, import.meta.url));

export default defineConfig({
	base: "./",
	plugins: [react(), tailwindcss(), viteSingleFile()],
	resolve: {
		// @strudel/* resolve into the git submodule (same aliases as
		// vitest.config.ts) - the engine worker bundles the real engine.
		alias: [
			{ find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
			{ find: "@strudel/core/fraction.mjs", replacement: pkg2("core/fraction.mjs") },
			{ find: "@strudel/core", replacement: pkg2("core/index.mjs") },
			{ find: "@strudel/mini", replacement: pkg2("mini/index.mjs") },
			{ find: "@strudel/transpiler", replacement: pkg2("transpiler/index.mjs") },
			{ find: "@strudel/tonal", replacement: pkg2("tonal/index.mjs") },
		],
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
	// The engine worker contains dynamic imports (evalScope). They must be
	// bundled into the single inlined chunk: a ?worker&inline blob URL cannot
	// resolve relative chunk imports at runtime.
	worker: {
		format: "es",
		rollupOptions: {
			output: {
				inlineDynamicImports: true,
			},
		},
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
