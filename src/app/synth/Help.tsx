import { useStateSync } from "@m4l-jweb/surface/react";
import HelpWindow from "@/app/shared/HelpWindow";
import surface from "./surface";

/**
 * The reference window for the Synth (surface.ts declares `entry: "Help"`). The list is
 * the effect and modulation vocabulary - what a superdough VALUE can carry. Pattern
 * structure is deliberately absent: this device collapses it (see useSynth.ts).
 */
export default function Help() {
	const [query] = useStateSync(surface, "helpQuery");
	return <HelpWindow device="synth" query={typeof query === "string" ? query : ""} />;
}
