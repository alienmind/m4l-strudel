import { useStateSync } from "@m4l-jweb/surface/react";
import { StudioWindow } from "@/app/shared/StudioWindow";
import surface from "./surface";

/**
 * The Full Studio window for the Sampler (surface.ts declares `entry: "StudioWindow"`),
 * reached from About > Advanced. Binds the `code` slot here so typing in the big editor
 * writes the same [dict] the device view reads - one pattern, two views. The device view
 * stays the only engine.
 */
export default function Studio() {
	const [code, setCode] = useStateSync(surface, "code");
	return <StudioWindow text={typeof code === "string" ? code : ""} onChange={setCode} device="drums-sampler" />;
}
