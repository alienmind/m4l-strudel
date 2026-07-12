import { useEffect, useState } from "react";
import { bindInlet } from "@m4l-jweb/bridge";

export type DeviceMode = "midi" | "audio" | "sampler";

export function useDeviceMode(): DeviceMode {
	const [mode, setMode] = useState<DeviceMode>("midi");
	useEffect(() => {
		bindInlet("mode", (m) => setMode(String(m) as DeviceMode));
	}, []);
	return mode;
}
