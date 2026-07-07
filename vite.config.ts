import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import pkg from "./package.json";

export default defineConfig({
	base: "./",
	plugins: [react(), tailwindcss(), viteSingleFile()],
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
		},
	},
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
});
