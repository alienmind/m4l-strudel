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
