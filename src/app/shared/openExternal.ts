import { outlet } from "@m4l-jweb/bridge";

/**
 * Open a URL in the user's REAL browser, outside Live.
 *
 * A device page is a `[jweb]` webview a few hundred pixels tall with no chrome, no
 * tabs and no back button. Following a link inside it strands the user in a website
 * they cannot navigate and cannot leave except by reloading the device. An external
 * page belongs in an external browser.
 *
 * Max's only door is `max.launchbrowser`, which hands the argument to the OS default
 * handler, so the wrapper makes that call (`open_url` in wrapper/device.ts).
 *
 * IT IS FIRE AND FORGET - no reply, no error - which is exactly how the folder-reveal
 * attempt in DRAWER_OF_FAILED_IDEAS.md managed to look correct and do nothing. That
 * failure was measured on `file://` paths; an `https://` URL is what launchbrowser is
 * documented for. The wrapper logs every call so a silent no-op is at least visible
 * in the Max console.
 */
export function openExternal(url: string): void {
	outlet("open_url", url);
}
