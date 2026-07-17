import { DEVICE_BLURB, type Device } from "@/lib/reference";
import { ReferencePanel } from "./ReferencePanel";

/**
 * WHICH STRUDEL FEATURES THIS DEVICE SUPPORTS - in a floating window.
 *
 * The framing is the point, and it is not "what this device can do". Strudel is the
 * language; these devices implement a SUBSET of it, and a different subset each. The
 * question a user has mid-pattern is "will this work HERE?", which is why the list is
 * filtered per device (`only` on every entry) rather than being one page with
 * everything on it - the FX device's line is `.lpf(800)`, a method chain, and putting
 * mini-notation in front of it only ever answered a question nobody asked.
 *
 * A SEPARATE bundle and its own Chromium context (surface.ts declares `entry: "Help"`),
 * so it takes its `device` as a prop from the per-device entry file: there is nothing
 * to read from over here.
 *
 * It FLOATS (`alwaysOnTop` in surface.ts). Without that it is useless in the way that
 * matters: clicking back into Live to type - the exact thing you opened it to do - is
 * what would send it behind the main window.
 *
 * IT FOLLOWS THE CARET (`query`, from the device view's `helpQuery` slot). Type `.del`
 * in the device's box and this list narrows to `.delay` while you type, IDE-style, from
 * a different Chromium context - the state slot is the only channel between the two.
 * The search box stays live: the caret proposes, typing here overrules it.
 *
 * IT IS AS WIDE AS THE DEVICE VIEW (420 px), so it reads as an extension of it rather
 * than a separate application. **It cannot be ANCHORED above the device**, which is the
 * obvious next ask: a device view is drawn inside Live's own chain and nothing - not
 * Max, not the LOM - reports where that is on screen, and `thispatcher window size`
 * wants absolute screen coordinates. Max windows do remember where you put them.
 *
 * Offline by construction: the whole vocabulary is a data file in the bundle, so it
 * works in a set with no network. strudel.cc is named as the place for everything this
 * deliberately does not cover, not linked - [jweb] is not a browser you want to hand
 * someone.
 */
export default function HelpWindow({ device, query }: { device: string; query?: string }) {
	return (
		<main className="flex h-screen w-screen flex-col overflow-hidden bg-background p-3 text-foreground">
			<header className="shrink-0 border-b border-input pb-2">
				<h1 className="text-sm font-semibold tracking-tight">Supported Strudel features</h1>
				<p className="mt-0.5 text-[11px] text-muted-foreground">{DEVICE_BLURB[device as Device] ?? "What this device understands."}</p>
			</header>

			<div className="flex min-h-0 flex-1 flex-col pt-2">
				<ReferencePanel device={device} query={query} />
			</div>

			<footer className="shrink-0 border-t border-input pt-2 text-[11px] text-muted-foreground">
				The full language is at <span className="text-foreground">strudel.cc/learn</span>. This lists what these devices support of it.
			</footer>
		</main>
	);
}
