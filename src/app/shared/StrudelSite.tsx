import { useEffect } from "react";

/**
 * The strudel.cc web playground, in a floating window (surface.ts `entry: "StrudelSite"`).
 *
 * A window's `[jweb]` is a full Chromium context with network (the sample browser fetches
 * through the same platform), so the simplest, most robust way to "open strudel.cc" is to
 * NAVIGATE this window's top-level document to it - no iframe, so strudel.cc's framing
 * policy (X-Frame-Options) does not apply, and no dependency on the wrapper's OS-level
 * launchbrowser (which is not reliable here - see the Open-folder note in TODO).
 *
 * The bundled page redirects on mount and shows a link as the fallback if the navigation
 * is blocked. Once it navigates, this React app is gone and the window IS strudel.cc.
 */
const STRUDEL_URL = "https://strudel.cc";

export default function StrudelSite() {
	useEffect(() => {
		window.location.replace(STRUDEL_URL);
	}, []);
	return (
		<main className="flex h-screen w-screen flex-col items-center justify-center gap-2 bg-background p-4 text-center text-foreground">
			<p className="text-sm">Opening strudel.cc ...</p>
			<a href={STRUDEL_URL} className="text-xs text-primary hover:underline">
				{STRUDEL_URL}
			</a>
		</main>
	);
}
