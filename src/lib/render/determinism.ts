/*
determinism.ts - can this pattern be pre-rendered into a loop without lying?

A random or history-dependent pattern cannot be baked into a repeating buffer without
changing what it means. We detect that, we do not guess: query the same arc twice and
compare serialized haps. Strudel's rand family disagrees across two queries; a
deterministic pattern serializes identically. The source-regex is the belt, the query
equality is the suspenders.

A non-deterministic verdict does NOT kill rendering - the conductor drops to rolling
mode (render one cycle ahead, each cycle is one realization of the dice) and says so in
the UI.
*/

/** The slice of a Strudel Hap this check reads. Kept minimal - engine.mjs is untyped. */
interface HapLike {
  value: unknown;
  whole?: { begin: { valueOf(): number } } | null;
  duration: { valueOf(): number };
  hasOnset?(): boolean;
}

/** The slice of a Strudel Pattern this check reads. */
interface PatternLike {
  queryArc(begin: number, end: number, controls: Record<string, unknown>): HapLike[];
}

/**
 * Known non-deterministic combinators. A source hit is enough to refuse a loop - some
 * of these (degrade, sometimes) reduce to rand internally, others (shuffle, scramble)
 * pick a permutation per query.
 */
const RANDOM_RE =
  /\b(rand|irand|perlin|chooseIn?|wchoose|degrade(By)?|sometimes(By)?|someCycles(By)?|often|rarely|almost(Never|Always)|randcat|shuffle|scramble)\b/;

function signature(arc: HapLike[]): string {
  return arc
    .map((h) => `${JSON.stringify(h.value)}@${h.whole?.begin?.valueOf()}+${h.duration.valueOf()}`)
    .sort()
    .join("|");
}

/**
 * True when `pat` renders the same haps every time over [0, cycles) - safe to bake into
 * a looping buffer. False for anything random or history-dependent.
 */
export function isDeterministic(code: string, pat: PatternLike, cycles: number, cps: number): boolean {
  if (RANDOM_RE.test(code)) return false;
  const a = pat.queryArc(0, cycles, { _cps: cps });
  const b = pat.queryArc(0, cycles, { _cps: cps });
  return signature(a) === signature(b);
}

/**
 * The pattern's true loop period in cycles, for the RENDERER.
 *
 * engine.mjs's patternCycles() is the wrong probe here, and deliberately not reused: its
 * signatures go through hapToClipNote, which reduces a hap to a MIDI pitch. A hap with no
 * pitch - `s("bd <sd cp>")`, the bread and butter of this device - signatures to nothing,
 * and a cycle that varies only in effects (`.lpf("<400 800>")`) signatures identically,
 * so both collapse to "period 1" and the render loses the alternation. The renderer plays
 * the WHOLE hap value, so the signature must too: the full value, JSON-serialized, at its
 * cycle-relative time.
 *
 * Same shortest-consistent-period search as patternCycles: a period is only trusted if it
 * survives the whole probe window (2x maxCycles), so a 3-cycle pattern is not mistaken
 * for a 6-cycle one.
 */
export function renderPeriod(pat: PatternLike, cps: number, maxCycles = 32): number {
  const probe = maxCycles * 2;
  const sigs: string[] = [];
  for (let c = 0; c < probe; c++) {
    const events = pat
      .queryArc(c, c + 1, { _cps: cps })
      // Onsets only: a hap held over from the previous cycle shows up in this window
      // with a negative relative begin, which would make every cycle's signature
      // unique and defeat the period search. The renderer schedules onsets only too.
      .filter((h) => h.hasOnset?.() ?? true)
      .map((h) => {
        const begin = h.whole?.begin?.valueOf();
        const at = begin === undefined ? "?" : (begin - c).toFixed(6);
        return `${JSON.stringify(h.value)}@${at}+${h.duration.valueOf().toFixed(6)}`;
      })
      .sort();
    sigs.push(events.join("|"));
  }
  for (let p = 1; p <= maxCycles; p++) {
    let ok = true;
    for (let c = 0; c < probe && ok; c++) {
      if (sigs[c] !== sigs[c % p]) ok = false;
    }
    if (ok) return p;
  }
  return maxCycles;
}
