/**
 * maxBridge - thin wrapper over jweb's `window.max` bridge (see LiveCam).
 * Outside Max, exposes `window.maxSimulate(name, ...args)` for browser dev.
 */

type InletHandler = (...args: unknown[]) => void;

interface MaxGlobal {
	bindInlet: (name: string, fn: InletHandler) => void;
	outlet: (...args: unknown[]) => void;
}

declare global {
	interface Window {
		max?: MaxGlobal;
		maxSimulate?: (name: string, ...args: unknown[]) => void;
	}
}

const handlers = new Map<string, InletHandler>();

export const inJweb = typeof window !== "undefined" && !!window.max;

export function bindInlet(name: string, fn: InletHandler): void {
	handlers.set(name, fn);
	if (typeof window !== "undefined" && window.max) {
		window.max.bindInlet(name, fn);
	}
}

export function outlet(...args: unknown[]): void {
	if (typeof window !== "undefined" && window.max) {
		window.max.outlet(...args);
	} else {
		console.debug("[maxBridge:outlet]", ...args);
	}
}

if (typeof window !== "undefined" && !window.max) {
	window.maxSimulate = (name, ...args) => {
		const fn = handlers.get(name);
		if (fn) fn(...args);
		else console.warn(`[maxBridge] no handler bound for "${name}"`);
	};
	console.info(
		"[maxBridge] running outside Max. Try: maxSimulate('notes', 4, 2, 60,0,1, 64,1,1)",
	);
}
