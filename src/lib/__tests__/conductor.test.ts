import { describe, it, expect, vi } from "vitest";
import { SuperdoughConductor, type ConductorDeps } from "@/lib/render/conductor";

/** A deps set whose every effect is a spy, with sane defaults a test can override. */
function mockDeps(over: Partial<ConductorDeps> = {}): ConductorDeps {
  return {
    compile: vi.fn(async () => ({ pat: true })),
    probePeriod: vi.fn(() => 2),
    isDeterministic: vi.fn(() => true),
    renderCycles: vi.fn(async () => ({ wav: new ArrayBuffer(8), seconds: 4 })),
    saveToFile: vi.fn(async () => ({ bytes: 8 })),
    renderLoad: vi.fn(),
    renderArm: vi.fn(),
    renderSync: vi.fn(),
    ...over,
  };
}

/** The spy the transport tests assert on. */
const syncOf = (deps: ConductorDeps) => deps.renderSync as ReturnType<typeof vi.fn>;

describe("SuperdoughConductor", () => {
  it("compiles, renders one period, saves, and loads slot A (deterministic)", async () => {
    const deps = mockDeps();
    const c = new SuperdoughConductor(deps);
    const slot = await c.evaluate('s("bd sd")', 120, 4); // cps = 0.5

    expect(slot).toBe("rndA");
    expect(deps.compile).toHaveBeenCalledWith('s("bd sd")');
    // period 2, cps 0.5 -> render cycles [0, 2)
    expect(deps.renderCycles).toHaveBeenCalledWith({ pat: true }, 0.5, 0, 2);
    expect(deps.saveToFile).toHaveBeenCalledWith("rndA.wav", expect.any(ArrayBuffer));
    // lengthBeats = cycles(2) * beatsPerCycle(4) = 8
    expect(deps.renderLoad).toHaveBeenCalledWith("rndA", "rndA.wav", 8);
    expect(c.getStatus().mode).toBe("loop");
    expect(c.getStatus().phase).toBe("loading");
  });

  it("arms the slot only once Max reports it ready", async () => {
    const deps = mockDeps();
    const c = new SuperdoughConductor(deps);
    await c.evaluate('s("bd")', 120, 4);
    expect(deps.renderArm).not.toHaveBeenCalled();

    c.ready("rndA");
    expect(deps.renderArm).toHaveBeenCalledWith("rndA");
    expect(c.getStatus().phase).toBe("armed");
  });

  it("ignores a ready() for a slot it is not waiting on", async () => {
    const deps = mockDeps();
    const c = new SuperdoughConductor(deps);
    await c.evaluate('s("bd")', 120, 4);
    c.ready("rndB"); // never loaded
    expect(deps.renderArm).not.toHaveBeenCalled();
  });

  it("drops to rolling mode for a random pattern: one cycle, next slot on ready", async () => {
    const deps = mockDeps({ isDeterministic: vi.fn(() => false) });
    const c = new SuperdoughConductor(deps);
    const slot = await c.evaluate('s("bd").sometimesBy(.5, fast(2))', 120, 4);

    expect(slot).toBe("rndA");
    expect(c.getStatus().mode).toBe("rolling");
    // rolling renders ONE cycle at a time
    expect(deps.renderCycles).toHaveBeenCalledWith(expect.anything(), 0.5, 0, 1);

    // ready() arms AND kicks the next cycle's render into the other slot
    c.ready("rndA");
    expect(deps.renderArm).toHaveBeenCalledWith("rndA");
    await Promise.resolve(); // let the fire-and-forget renderChunk settle
    await Promise.resolve();
    expect(deps.renderLoad).toHaveBeenCalledWith("rndB", "rndB.wav", 4); // 1 cycle * 4 beats
  });

  it("alternates A/B slots across successive evaluates", async () => {
    const deps = mockDeps();
    const c = new SuperdoughConductor(deps);
    expect(await c.evaluate('s("a")', 120, 4)).toBe("rndA");
    expect(await c.evaluate('s("b")', 120, 4)).toBe("rndB");
    expect(await c.evaluate('s("c")', 120, 4)).toBe("rndA");
  });

  it("a stale render (superseded by a newer evaluate) does not load", async () => {
    let signalStarted: () => void = () => {};
    const firstRenderStarted = new Promise<void>((r) => (signalStarted = r));
    let release: () => void = () => {};
    const gate = new Promise<void>((r) => (release = r));
    let first = true;
    const deps = mockDeps({
      renderCycles: vi.fn(async () => {
        if (first) {
          first = false;
          signalStarted(); // p1 is now inside render
          await gate; // ...and stalled here until we let go
        }
        return { wav: new ArrayBuffer(8), seconds: 4 };
      }),
    });
    const c = new SuperdoughConductor(deps);
    const p1 = c.evaluate('s("a")', 120, 4);
    await firstRenderStarted; // p1 has passed compile and is mid-render
    const p2 = c.evaluate('s("b")', 120, 4); // supersedes it
    await p2; // p2's render runs immediately (first=false) and loads
    release(); // now let p1's stale render finish
    expect(await p1).toBeNull(); // the superseded evaluate bails, does not load
    expect((deps.renderLoad as ReturnType<typeof vi.fn>).mock.calls.length).toBe(1);
  });

  // Transport lock. renderCycles mock: seconds 4, period 2, beatsPerCycle 4 =>
  // loopBeats = 8, loopSeconds = 4, so phaseMs(beats) = (beats mod 8) / 8 * 4000.
  describe("transport sync", () => {
    it("aligns the active slot to the phase on the transport START edge", async () => {
      const deps = mockDeps();
      const c = new SuperdoughConductor(deps);
      await c.evaluate('s("bd")', 120, 4);
      c.ready("rndA"); // not playing yet -> ready() does not sync
      expect(syncOf(deps)).not.toHaveBeenCalled();

      c.tick(true, 2); // start edge, 2 beats -> phase 2/8 * 4000 = 1000 ms
      expect(syncOf(deps)).toHaveBeenCalledWith("rndA", 1000);
    });

    it("does NOT re-sync on ordinary advancing ticks (avoids the boundary click)", async () => {
      const deps = mockDeps();
      const c = new SuperdoughConductor(deps);
      await c.evaluate('s("bd")', 120, 4);
      c.ready("rndA");
      c.tick(true, 0); // start -> one sync
      c.tick(true, 0.1);
      c.tick(true, 0.2);
      c.tick(true, 0.3);
      expect(syncOf(deps)).toHaveBeenCalledTimes(1);
    });

    it("re-syncs on a relocate (a beat jump the poll rate cannot explain)", async () => {
      const deps = mockDeps();
      const c = new SuperdoughConductor(deps);
      await c.evaluate('s("bd")', 120, 4);
      c.ready("rndA");
      c.tick(true, 0); // start
      c.tick(true, 0.1); // normal advance, no sync
      c.tick(true, 6); // jump forward > loopBeats/2 (4) -> relocate: 6/8 * 4000 = 3000
      expect(syncOf(deps)).toHaveBeenLastCalledWith("rndA", 3000);
      expect(syncOf(deps)).toHaveBeenCalledTimes(2);
    });

    it("aligns a slot armed WHILE the transport is already playing", async () => {
      const deps = mockDeps();
      const c = new SuperdoughConductor(deps);
      await c.evaluate('s("bd")', 120, 4);
      c.tick(true, 3); // playing, no active slot yet -> no sync
      expect(syncOf(deps)).not.toHaveBeenCalled();
      c.ready("rndA"); // armed while playing -> sync to lastBeats 3 -> 1500 ms
      expect(syncOf(deps)).toHaveBeenCalledWith("rndA", 1500);
    });

    it("does not sync while the transport is stopped (self-clock owns position)", async () => {
      const deps = mockDeps();
      const c = new SuperdoughConductor(deps);
      await c.evaluate('s("bd")', 120, 4);
      c.ready("rndA");
      c.tick(false, 0); // stopped
      c.tick(false, 0); // still stopped
      expect(syncOf(deps)).not.toHaveBeenCalled();
    });

    it("works without a renderSync dep (loop plays self-clocked, just not bar-locked)", async () => {
      const deps = mockDeps({ renderSync: undefined });
      const c = new SuperdoughConductor(deps);
      await c.evaluate('s("bd")', 120, 4);
      c.ready("rndA");
      expect(() => c.tick(true, 2)).not.toThrow();
    });
  });

  it("reports a compile error without rendering", async () => {
    const deps = mockDeps({ compile: vi.fn(async () => { throw new Error("bad syntax"); }) });
    const c = new SuperdoughConductor(deps);
    const slot = await c.evaluate("$: nonsense(", 120, 4);
    expect(slot).toBeNull();
    expect(c.getStatus().phase).toBe("error");
    expect(deps.renderCycles).not.toHaveBeenCalled();
  });
});
