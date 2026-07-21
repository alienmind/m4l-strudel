import { useStateSync } from "@m4l-jweb/surface/react";
import { StudioWindow } from "@/app/shared/StudioWindow";
import surface from "./surface";

/**
 * The Full Studio window (surface.ts declares `entry: "StudioWindow"`). An editor, not
 * an engine: it binds the `code` slot and nothing else - the DEVICE view owns the
 * engine and the audio, so exactly one thing plays no matter how many views are open.
 */
export default function Studio() {
	const [code, setCode] = useStateSync(surface, "code");
	return <StudioWindow text={typeof code === "string" ? code : ""} onChange={setCode} device="superdough" />;
}
