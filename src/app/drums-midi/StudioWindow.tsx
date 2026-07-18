import { useStateSync } from "@m4l-jweb/surface/react";
import { StudioWindow } from "@/app/shared/StudioWindow";
import surface from "./surface";

/**
 * The Full Studio window for this device (surface.ts declares `entry: "StudioWindow"`).
 *
 * The SEAM: this file holds the device's concrete surface, so the `code` binding happens
 * here and the shared window stays a view. Typing here writes the same [dict] the device
 * view reads, which is what makes the two one pattern rather than two editors racing.
 */
export default function Studio() {
	const [code, setCode] = useStateSync(surface, "code");
	return <StudioWindow text={typeof code === "string" ? code : ""} onChange={setCode} device="midi-drums" />;
}
