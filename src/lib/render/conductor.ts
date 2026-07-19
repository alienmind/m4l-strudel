/*
conductor.ts - the render conductor's state machine, pure and deps-injected.

The brain of the superdough device, kept free of
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

Rolling is PACED BY THE TRANSPORT, not by the render pipeline: the next cycle's render
kicks off when tick() sees the loop boundary pass, never straight from ready(). Chaining
off ready() (render -> load -> ready -> render...) runs the pipeline as fast as it can -
many times realtime - so renders race unboundedly ahead of playback, realizations are
armed and replaced unheard, and the disk churns for nothing. One render per audible loop
is the honest rate.

With the transport STOPPED there are no tick boundaries, but the groove keeps looping
self-clocked - so rolling paces itself with a loop-period timer instead. Strudel's rand
family is cycle-seeded (a pure function of time), so advancing the render window IS the
randomness; holding the window still plays one realization forever, which is what a
stopped-transport rolling pattern sounded like before this timer existed.
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
  private lastBeatsPerCycle = 4;
  private nextBegin = 0;
  /**
   * Per-instance WAV filename prefix. Two instances of the device share one folder
   * (relative saveToFile paths resolve next to the .amxd), so bare `rndA.wav` names
   * would have them clobber each other's renders. The buffers are `---`-scoped; the
   * files must be scoped too.
   */
  private filePrefix: string;
  private status: ConductorStatus = { phase: "idle", mode: null, message: "idle", slot: null };

  // Transport lock. The slot currently audible (the last one armed), plus the loop geometry
  // needed to turn a beat position into a groove play position. See tick().
  private activeSlot: string | null = null;
  private loopBeats = 4;
  private loopSeconds = 2;
  private playing = false;
  private lastBeats = 0;
  /** Rolling's transport-stopped pacer: one render per loop period, self-timed. */
  private rollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(deps: ConductorDeps, opts: { filePrefix?: string } = {}) {
    this.deps = deps;
    this.filePrefix = opts.filePrefix ?? "";
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
    this.lastBeatsPerCycle = beatsPerCycle;
    this.nextBegin = 0;

    const mode = deterministic ? "loop" : "rolling";
    this.setStatus({
      mode,
      message: deterministic ? `loop: ${cycles} cycle(s)` : "random pattern: rendering ahead, each cycle is one realization",
    });

    return this.renderChunk(gen);
  }

  /** Render + save + load one chunk into the next slot. Shared by evaluate() and the rolling advance. */
  private async renderChunk(gen: number): Promise<string | null> {
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

    // Flat filename in the device folder (neither [js] File nor [maxurl] creates
    // subdirectories), prefixed per instance so two devices in one set do not collide.
    const path = `${this.filePrefix}${slot}.wav`;
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

    const lengthBeats = this.lastCycles * this.lastBeatsPerCycle;
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
   * Max reported a slot's buffer finished loading. Arm it (swap at the next boundary).
   * The next rolling render is NOT kicked from here - tick() paces it off the loop
   * boundary, one render per audible loop (see the header note on rolling).
   */
  ready(slot: string): void {
    if (slot !== this.pendingSlot) return; // a stale or unknown slot
    this.pendingSlot = null;
    this.deps.renderArm(slot);
    this.activeSlot = slot;
    // Align the newly-armed slot to the current transport phase BEFORE it becomes audible at
    // the next boundary, so the swap lands bar-locked. Only while the transport is running -
    // stopped, the self-clock fallback owns position.
    if (this.playing) this.deps.renderSync?.(slot, this.phaseMs(this.lastBeats));
    this.setStatus({ phase: "armed", message: this.rolling ? "rolling" : "looping", slot });
    // Transport stopped: no tick boundary will ever fire, so rolling paces itself off
    // the loop period (the groove free-runs at exactly that rate). Playing: tick() owns
    // the pace, and the timer must not double-kick beside it.
    if (this.rolling && !this.playing) this.scheduleRollTimer();
  }

  /** One self-timed rolling advance per loop period, only while the transport is stopped. */
  private scheduleRollTimer(): void {
    this.clearRollTimer();
    const gen = this.generation;
    this.rollTimer = setTimeout(() => {
      this.rollTimer = null;
      if (gen !== this.generation || !this.rolling || this.pendingSlot || this.playing) return;
      void this.renderChunk(gen);
    }, this.loopSeconds * 1000);
  }

  private clearRollTimer(): void {
    if (this.rollTimer) {
      clearTimeout(this.rollTimer);
      this.rollTimer = null;
    }
  }

  /**
   * Stop: supersede any in-flight render and forget the audible slot so tick() stops
   * re-syncing it. The caller fades Max out with renderStop(); a later evaluate()
   * starts a fresh generation.
   */
  stop(): void {
    this.generation++;
    this.clearRollTimer();
    this.pendingSlot = null;
    this.activeSlot = null;
    this.rolling = false;
    this.setStatus({ phase: "idle", mode: null, message: "stopped", slot: null });
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
    // Rolling advance, paced by the transport: when the loop boundary passes (the beat
    // count enters a new loop), render the NEXT cycle into the idle slot - exactly one
    // render per audible loop. A relocate crosses a boundary too; rendering the next
    // window from wherever the transport landed is the honest response to a seek.
    if (this.rolling && playing && this.activeSlot && !this.pendingSlot && this.loopBeats > 0) {
      const loopOf = (b: number) => Math.floor(b / this.loopBeats);
      if (this.playing && loopOf(beats) !== loopOf(this.lastBeats)) {
        void this.renderChunk(this.generation);
      }
    }
    // Transport edges hand the rolling pace over: starting, the tick boundary owns it
    // (kill the timer so it cannot double-kick); stopping, the self-timer takes it back.
    if (this.rolling && this.activeSlot) {
      if (playing && !this.playing) this.clearRollTimer();
      else if (!playing && this.playing && !this.pendingSlot) this.scheduleRollTimer();
    }
    this.playing = playing;
    this.lastBeats = beats;
  }
}
