import { useStateSync } from "@m4l-jweb/surface/react";
import HelpWindow from "@/app/shared/HelpWindow";
import surface from "./surface";

/**
 * The reference window for this device (surface.ts declares `entry: "Help"`). Same seam
 * as the MIDI device's: this file holds the concrete surface, so it binds `helpQuery`.
 * The device runs ALL of Strudel, so referenceFor("strudel") returns everything.
 */
export default function Help() {
	const [query] = useStateSync(surface, "helpQuery");
	return <HelpWindow device="strudel" query={typeof query === "string" ? query : ""} />;
}
