import { useStateSync } from "@m4l-jweb/surface/react";
import HelpWindow from "@/app/shared/HelpWindow";
import surface from "./surface";

/**
 * The reference window for this device (surface.ts declares `entry: "Help"`).
 *
 * The SEAM: this file holds the device's concrete surface, so it binds `helpQuery` -
 * the word the device view's caret is sitting on - and hands it down. That is what makes
 * the floating reference follow your typing from a different Chromium context: the slot
 * is the only channel between the two.
 */
export default function Help() {
	const [query] = useStateSync(surface, "helpQuery");
	return <HelpWindow device="midi" query={typeof query === "string" ? query : ""} />;
}
