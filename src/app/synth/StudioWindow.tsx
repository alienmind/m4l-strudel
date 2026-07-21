import { useStateSync } from "@m4l-jweb/surface/react";
import { StudioWindow } from "@/app/shared/StudioWindow";
import surface from "./surface";

/**
 * The Full Studio window (surface.ts declares `entry: "StudioWindow"`). An editor over
 * the same `code` slot - here that slot holds a sound spec rather than a pattern, but
 * the editing job, and the caret-following reference beside it, are identical.
 */
export default function Studio() {
	const [code, setCode] = useStateSync(surface, "code");
	return <StudioWindow text={typeof code === "string" ? code : ""} onChange={setCode} device="synth" />;
}
