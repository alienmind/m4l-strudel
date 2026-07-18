import { useStateSync } from "@m4l-jweb/surface/react";
import HelpWindow from "@/app/shared/HelpWindow";
import surface from "./surface";

/**
 * The reference window for the Sampler (surface.ts declares `entry: "Help"`).
 *
 * Binds `helpQuery` - the token the device view's caret is on - and hands it down, so the
 * floating reference follows the typing from its separate Chromium context.
 */
export default function Help() {
	const [query] = useStateSync(surface, "helpQuery");
	return <HelpWindow device="drums-sampler" query={typeof query === "string" ? query : ""} />;
}
