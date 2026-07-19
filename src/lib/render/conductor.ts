/*
conductor.ts - the render conductor's state machine, pure and deps-injected.

The brain of the superdough device (doc/IDEA-STRUDEL-INSTRUMENT.md C.5), kept free of
React and of the real audio context so it can be unit-tested: every side effect - compile,
render, save, load, arm - is a function passed in. `useSuperdoughRender` wires the real
ones; the test wires mocks.

The flow per edit (evaluate):
  compile -> probe loop period -> determinism check -> render N cycles -> save WAV to the
  next A/B slot -> render_load it. Then, when Max reports the slot ready (ready()), arm it -
  the crossfade swap lands on the next loop boundary, Max-side.

Deterministic patterns render ONE full period and loop it. Random / history-dependent
patterns cannot be honestly looped, so they drop to ROLLING mode: render one cycle at a
time, each cycle a fresh realization. The status carries which mode is in effect.
*/

/** Opaque compiled pattern - the conductor never inspects it, only passes it to render. */
export type CompiledPattern = unknown;

export interface RenderChunk {
  wav: ArrayBuffer;
  seconds: number;
}

/** Every side effect the conductor needs, injected so the core stays pure and testable. */
export interface ConductorDeps {
  /** Compile Strudel source to a pattern ($:-aware). */
  compile(code: string): Promise<CompiledPattern>;
  /** The pattern's true loop period in cycles (patternCycles), capped. */
  probePeriod(pat: CompiledPattern, cps: number): number;
  /** Whether the pattern can be honestly pre-rendered and looped. */
  isDeterministic(code: string, pat: CompiledPattern, cycles: number, cps: number): boolean;
  /** Render cycles [begin, begin+cycles) of the pattern to a WAV. */
  renderCycles(pat: CompiledPattern, cps: number, begin: number, cycles: number): Promise<RenderChunk>;
  /** Write the WAV to disk (device folder, flat filename). */
  saveToFile(path: string, wav: ArrayBuffer): Promise<{ bytes: number }>;
  /** Tell Max to read the WAV into a renderplay slot's buffer. */
  renderLoad(slot: string, path: string, lengthBeats: number): void;
  /** Tell Max to crossfade to a slot at the next loop boundary. */
  renderArm(slot: string): void;
  /**
   * Relocate a slot's loop to a transport position (ms). Optional: without it the loop
   * still plays, self-clocked, just not bar-locked. With it the loop is transport-locked.
   */
  renderSync?(slot: string, positionMs: number): void;
  /** Status/health for the UI. Optional. */
  onStatus?(status: ConductorStatus): void;
}

export type Phase = "idle" | "compiling" | "probing" | "rendering" | "saving" | "loading" | "armed" | "error";

export interface ConductorStatus {
  phase: Phase;
  /** "loop" (deterministic, one period looped) or "rolling" (one cycle at a time). */
  mode: "loop" | "rolling" | null;
  /** Human-readable line for the UI. */
  message: string;
  /** The slot currently loading/armed, if any. */
  slot: string | null;
}

const SLOTS = ["rndA", "rndB"] as const;
/** Cap on how long a rendered loop can be, so a 64-cycle pattern does not render forever. */
export const MAX_LOOP_SECONDS = 60;

export class SuperdoughConductor {
  private deps: ConductorDeps;
  /** Bumped on every evaluate(); a stale async result checks this and bails. */
  private generation = 0;
  /** Which A/B slot the next render lands in. */
  private slotIndex = 0;
  /** The slot the in-flight render is loading into, awaiting its ready(). */
  private pendingSlot: string | null = null;
  /** Rolling mode re-renders the NEXT cycle each loop; this tracks where we are. */
  private rolling = false;
  private lastPattern: CompiledPattern | null = null;
  private lastCps = 0.5;
  private lastCycles = 1;
  private nextBegin = 0;
  private status: ConductorStatus = { phase: "idle", mode: null, message: "idle", slot: null };

  // Transport lock. The slot currently audible (the last one armed), plus the loop geometry
  // needed to turn a beat position into a groove play position. See tick().
  private activeSlot: string | null = null;
  private loopBeats = 4;
  private loopSeconds = 2;
  private playing = false;
  private lastBeats = 0;

  constructor(deps: ConductorDeps) {
    this.deps = deps;
  }

  getStatus(): ConductorStatus {
    return this.status;
  }

  private setStatus(patch: Partial<ConductorStatus>): void {
    this.status = { ...this.status, ...patch };
    this.deps.onStatus?.(this.status);
  }

  /**
   * A new code / tempo. Compile, decide loop-vs-rolling, render the first chunk into the
   * next slot and load it. Returns the slot that was loaded (or null if superseded/failed).
   */
  async evaluate(code: string, bpm: number, beatsPerCycle: number): Promise<string | null> {
    const gen = ++this.generation;
    const cps = bpm / 60 / beatsPerCycle;
    this.setStatus({ phase: "compiling", message: "compiling", mode: null });

    let pat: CompiledPattern;
    try {
      pat = await this.deps.compile(code);
    } catch (e) {
      if (gen !== this.generation) return null;
      this.setStatus({ phase: "error", message: `compile error: ${(e as Error).message}` });
      return null;
    }
    if (gen !== this.generation) return null;

    this.setStatus({ phase: "probing", message: "probing period" });
    const period = this.deps.probePeriod(pat, cps);
    const deterministic = this.deps.isDeterministic(code, pat, period, cps);
    // Deterministic: render one full period, but never more than MAX_LOOP_SECONDS of audio.
    // Rolling: one cycle at a time, each a fresh realization of the randomness.
    const maxCycles = Math.max(1, Math.floor(MAX_LOOP_SECONDS * cps));
    const cycles = deterministic ? Math.min(period, maxCycles) : 1;

    this.rolling = !deterministic;
    this.lastPattern = pat;
    this.lastCps = cps;
    this.lastCycles = cycles;
    this.nextBegin = 0;

    const mode = deterministic ? "loop" : "rolling";
    this.setStatus({
      mode,
      message: deterministic ? `loop: ${cycles} cycle(s)` : "random pattern: rendering ahead, each cycle is one realization",
    });

    return this.renderChunk(gen, beatsPerCycle);
  }

  /** Render + save + load one chunk into the next slot. Shared by evaluate() and rolling advance(). */
  private async renderChunk(gen: number, beatsPerCycle: number): Promise<string | null> {
    if (!this.lastPattern) return null;
    const slot = SLOTS[this.slotIndex % SLOTS.length];

    this.setStatus({ phase: "rendering", message: "rendering", slot });
    let chunk: RenderChunk;
    try {
      chunk = await this.deps.renderCycles(this.lastPattern, this.lastCps, this.nextBegin, this.lastCycles);
    } catch (e) {
      if (gen !== this.generation) return null;
      this.setStatus({ phase: "error", message: `render error: ${(e as Error).message}` });
      return null;
    }
    if (gen !== this.generation) return null;

    const path = `${slot}.wav`; // flat filename in the device folder (see saveToFile)
    this.setStatus({ phase: "saving", message: "saving", slot });
    try {
      await this.deps.saveToFile(path, chunk.wav);
    } catch (e) {
      if (gen !== this.generation) return null;
      this.setStatus({ phase: "error", message: `save error: ${(e as Error).message}` });
      return null;
    }
    if (gen !== this.generation) return null;

    // Advance the A/B slot and the rolling window for next time.
    this.slotIndex++;
    this.nextBegin += this.lastCycles;
    this.pendingSlot = slot;

    const lengthBeats = this.lastCycles * beatsPerCycle;
    // Remember this loop's geometry so tick() can map a beat position to a groove position.
    // Both slots share the length in loop mode; in rolling mode each cycle is one beatsPerCycle.
    this.loopBeats = lengthBeats;
    this.loopSeconds = chunk.seconds;
    this.setStatus({ phase: "loading", message: "loading", slot });
    this.deps.renderLoad(slot, path, lengthBeats);
    return slot;
  }

  /** The groove play position (ms) for a transport beat position, given the loop geometry. */
  private phaseMs(beats: number): number {
    if (this.loopBeats <= 0) return 0;
    const phase = ((beats % this.loopBeats) + this.loopBeats) % this.loopBeats; // guard negatives
    return (phase / this.loopBeats) * this.loopSeconds * 1000;
  }

  /**
   * Max reported a slot's buffer finished loading. Arm it (swap at the next boundary). In
   * rolling mode this is also the cue to render the next cycle ahead.
   */
  ready(slot: string, beatsPerCycle = 4): void {
    if (slot !== this.pendingSlot) return; // a stale or unknown slot
    this.pendingSlot = null;
    this.deps.renderArm(slot);
    this.activeSlot = slot;
    // Align the newly-armed slot to the current transport phase BEFORE it becomes audible at
    // the next boundary, so the swap lands bar-locked. Only while the transport is running -
    // stopped, the self-clock fallback owns position.
    if (this.playing) this.deps.renderSync?.(slot, this.phaseMs(this.lastBeats));
    this.setStatus({ phase: "armed", message: this.rolling ? "rolling" : "looping", slot });
    if (this.rolling) {
      // Kick the next cycle's render into the other slot, staying one ahead.
      void this.renderChunk(this.generation, beatsPerCycle);
    }
  }

  /**
   * A transport poll from LiveAPI (`tick <playing> <beats>`, 20 Hz). Align the audible slot
   * to the transport ONCE - on the start edge and on a relocate (a beat jump the poll rate
   * cannot explain by normal advance) - then rate-1 @loop holds the lock. NOT every tick: a
   * per-tick re-sync fights the loop and reintroduces the boundary click.
   */
  tick(playing: boolean, beats: number): void {
    const started = playing && !this.playing;
    // Normal advance between polls is small; a jump past half a loop's beats is a relocate
    // (or a backward seek). Half the loop length adapts to odd loop lengths (e.g. 7 beats).
    const jumpThreshold = Math.max(0.5, this.loopBeats / 2);
    const jumped = playing && Math.abs(beats - this.lastBeats) > jumpThreshold;
    if ((started || jumped) && this.activeSlot) {
      this.deps.renderSync?.(this.activeSlot, this.phaseMs(beats));
    }
    this.playing = playing;
    this.lastBeats = beats;
  }
}
