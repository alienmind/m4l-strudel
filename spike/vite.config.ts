/*
Standalone vite config for the S1 render spike (spike/superdough-render). Kept separate
from the root vite.config.ts, which is a per-DEVICE build factory with a @device alias
that has no meaning here. Reuses the same submodule aliases + the audioworklet plugin so
superdough renders exactly as it will inside the device.
*/
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import bundleAudioWorklet from "../strudel/packages/vite-plugin-bundle-audioworklet/vite-plugin-bundle-audioworklet.js";

const strudelPkg = (p: string) => fileURLToPath(new URL(`../strudel/packages/${p}`, import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL("./superdough-render", import.meta.url)),
  plugins: [bundleAudioWorklet()],
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("../src", import.meta.url)) },
      { find: "@strudel/core/fraction.mjs", replacement: strudelPkg("core/fraction.mjs") },
      { find: "@strudel/core", replacement: strudelPkg("core/index.mjs") },
      { find: "@strudel/mini", replacement: strudelPkg("mini/index.mjs") },
      { find: "@strudel/transpiler", replacement: strudelPkg("transpiler/index.mjs") },
      { find: "@strudel/tonal", replacement: strudelPkg("tonal/index.mjs") },
      { find: /^superdough$/, replacement: strudelPkg("superdough/index.mjs") },
      { find: /^superdough\/(.*)$/, replacement: strudelPkg("superdough/$1") },
    ],
  },
  server: { host: "127.0.0.1", port: 4180, open: false },
});
