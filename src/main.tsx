import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
// Wrap fetch() with the persistent sample cache before anything can fetch (doc/TODO
// item 2). Must stay ABOVE the App import - import order is execution order.
import "@/lib/sampleCache.install";

/**
 * ONE DEVICE PER BUNDLE.
 *
 * `@device` is an alias resolved in vite.config.ts to `src/app/<device>/`, where
 * <device> comes from the dev/build script (see scripts/). So this entry point is
 * shared but contains no branching, and each bundle holds exactly one device: the
 * MIDI device's bundle carries no sampler code, and vice versa.
 */
import App from "@device/App";

/**
 * The mocked-Live dev harness renders BESIDE the app in dev, and must never reach
 * a device. `import.meta.env.DEV` is replaced by the literal `false` in a
 * production build, so this branch becomes dead code that rollup drops before the
 * bundle is inlined into the .amxd.
 */
const DevHarness = import.meta.env.DEV ? (await import("@m4l-jweb/surface/dev")).DevHarness : null;

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		{DevHarness ? (
			<div className="dev-layout">
				<DevHarness />
				<App />
			</div>
		) : (
			<App />
		)}
	</StrictMode>,
);
