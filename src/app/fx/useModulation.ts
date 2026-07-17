/**
 * useModulation - the tick half of pattern-driven modulation (TODO R3).
 *
 * `.lpf(sine.range(200, 2000))` parses into a PatternedStage (lib/fx.ts); this hook
 * is what makes it move. Three jobs, and the seams between them are the design:
 *
 *   BIND    each modulated stage's parameter to a `remote` slot, by LOM id. The
 *           slot map is fixed - slot i is RACK[i], forever - so there is no
 *           allocator to get wrong: a stage cannot collide with another stage,
 *           and rebinding the same param is idempotent.
 *   STREAM  on every transport tick, query each stage's pattern at the current
 *           cycle and send the value down its slot. The `remote` chain ramps it
 *           (~20 ms) into a signal for live.remote~ - the app stays control-rate.
 *   RELEASE a stage that stops being modulated gives its parameter BACK (`id 0`
 *           unbinds live.remote~). This matters: a bound live.remote~ owns the
 *           parameter exclusively - the dial, automation and Push are all locked
 *           out - so holding a binding the line no longer asks for would freeze
 *           a control for no reason the user can see.
 *
 * LOM IDS ARE RESOLVED HERE AND NEVER PERSISTED. An id is a handle into the
 * running set, not a name: a set reload invalidates every one. That case needs no
 * observer - reloading the set reloads the device, [jweb] with it, and this hook
 * re-resolves from scratch on mount. The id lives exactly as long as it is valid.
 *
 * THE CLOCK: one cycle = one 4/4 bar (4 of Live's beats), locked to the transport
 * (`current_song_time`), not to wall time. `.lpf(sine)` sweeps once a bar at any
 * tempo, lands on the downbeat, and survives loop jumps and scrubbing - beats come
 * from Live each tick, nothing here integrates time. A `setcpm()` has no place in
 * a one-line fx chain, so unlike the MIDI engine there is no cps to honour.
 *
 * Writes happen only while the transport RUNS. Stopped, the last ramped value
 * stays - a parameter that keeps sweeping in a silent set is motion with no sound
 * attached, and starting the transport resumes from the pattern, not from a stash.
 */
import { useEffect, useRef } from "react";
import { bindInlet, bindRemote, resolveParamId, writeRemote } from "@m4l-jweb/bridge";
import { queryFxPattern, RACK, type FxParam, type PatternedStage } from "@/lib/fx";
import { IN } from "./protocol";
import surface from "./surface";

/** Beats per cycle: one 4/4 bar. See "THE CLOCK" above. */
const BEATS_PER_CYCLE = 4;

/** The fixed slot map: slot i drives RACK[i]'s parameter. patcher/devices.mjs
 *  declares `remotes: 9` from this same order - the two must agree. */
const SLOT: Record<FxParam, number> = Object.fromEntries(RACK.map((s, i) => [s.param, i])) as Record<FxParam, number>;

/**
 * Pre-warp a value for live.remote~: it does NOT take the parameter's own units.
 *
 * Measured, not read anywhere: Live treats the incoming value as a LINEAR position
 * across the parameter's range and then applies the knob's `exponent` curve to it,
 * exactly as if the number had grabbed the dial by its travel. Send 2000 into
 * cutoff (range 40-18000, exponent 4) and the parameter lands at
 * 40 + 17960 * ((2000-40)/17960)^4 = 42.5 Hz - which is how `.lpf(sine.range(200,
 * 2000))` swept the dial between 40 and 42. Parameters with exponent 1 pass
 * through untouched, which is why the chain's own tests never caught it.
 *
 * So invert the curve: aim the travel at norm(v)^(1/e) and Live's ^e lands the
 * value where the pattern asked. Clamped first - outside the range the inverse
 * is not defined, and Live would clamp anyway.
 */
function toRemote(param: FxParam, v: number): number {
	const spec = surface.params[param];
	if (spec.kind !== "dial") return v;
	const [min, max] = spec.range;
	const e = spec.exponent ?? 1;
	const norm = Math.min(1, Math.max(0, (v - min) / (max - min)));
	return min + (max - min) * (e === 1 ? norm : Math.pow(norm, 1 / e));
}

export function useModulation(patterned: readonly PatternedStage[]): void {
	/** What the tick handler reads. A ref, not state: a 20 Hz clock must not render. */
	const stagesRef = useRef<{ stage: PatternedStage; slot: number }[]>([]);
	const boundRef = useRef<Set<number>>(new Set());

	// Re-bind only when WHAT is modulated changes, not on every re-parse: each parse
	// makes fresh Pattern objects, so the stages themselves cannot be the dependency.
	// The param+source key is the identity that matters.
	const key = patterned.map((s) => `${s.param}=${s.source}`).join("|");

	useEffect(() => {
		stagesRef.current = patterned.map((stage) => ({ stage, slot: SLOT[stage.param] }));

		const want = new Set(stagesRef.current.map((s) => s.slot));
		for (const slot of boundRef.current) {
			if (!want.has(slot)) bindRemote(slot, 0); // release: the dial works again
		}
		for (const { stage, slot } of stagesRef.current) {
			if (boundRef.current.has(slot)) continue; // same param, id still good
			// The surface param id doubles as the Live parameter's longname - that is
			// the contract resolveParamId rides on. 0 back means no such parameter,
			// which is a build-time drift between RACK and surface.ts, not a runtime
			// condition - say so and leave the slot silent.
			resolveParamId(stage.param).then(
				(id) => {
					if (id) bindRemote(slot, id);
					else console.error(`fx: no Live parameter named "${stage.param}" - RACK and surface.ts disagree`);
				},
				(e) => console.error(`fx: ${String(e)}`),
			);
		}
		boundRef.current = want;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	useEffect(() => {
		bindInlet(IN.tick, (playing, beats) => {
			if (Number(playing) !== 1) return;
			const cycle = Number(beats) / BEATS_PER_CYCLE;
			for (const { stage, slot } of stagesRef.current) {
				const v = queryFxPattern(stage, cycle);
				// null is "the pattern says nothing here" - leave the parameter be.
				if (v !== null) writeRemote(slot, toRemote(stage.param, v));
			}
		});
	}, []);
}
