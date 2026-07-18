# The drawer of failed ideas

Things we tried and that do not work - kept so nobody spends a second afternoon
rediscovering the same wall. Ideas that WORKED are not here; they live in
[README.md](../README.md) and [ARCHITECTURE.md](ARCHITECTURE.md) (native `live.*`
controls and Push banks, the macro-mappable transport, clip I/O that reaches the track
even inside a Rack, the shipped Instrument Rack preset).

(The drag-a-sample-into-a-clip idea is NOT here: it was reopened with a new,
untested approach - see [SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md). It lands here
only if that spike also fails.)

---

## Translate / Adopt mode - `.lpf()` drives the user's own Auto Filter

**Verdict: abandoned. It does not work, and it was not worth making work.**

This descends from an old grand plan: make these devices a "dumb controller" that
TRANSLATES Strudel's language onto Ableton's own native controls, and lets Live do the
sound, instead of reimplementing effects. Parts of that plan landed - native dials,
native transport, documented above. This part never will.

The idea (R4-d in the old plan): a device-wide "Translate" toggle so that instead of the
FX device's OWN built-in filter, `.lpf(800)` would bind and drive a **sibling** Auto
Filter the user placed in the rack - the "dumb controller translating to native devices"
plan taken to its logical end.

It was built end to end - an upstream `get_sibling_param` LOM walk in the wrapper, a
`resolveSiblingParam` bridge call returning the foreign parameter's id and range, a
reconciler (`useAdopt`) that bound/streamed/released like the pattern-modulation path,
value-scaling through the foreign `min`/`max`, and a UI toggle with per-stage status -
then **removed**, because the idea itself is wrong:

- **The device already HAS a cutoff filter.** Binding `.lpf()` to a *second*, external
  filter to do the same job is nonsensical - it is not translating a capability the
  device lacks, it is duplicating one it has.
- **Live already does this natively.** Anything the user would want to macro-map or
  automate on their own Auto Filter, they can map in Ableton directly. The device added
  nothing but a confusing indirection.
- And in practice it did not even bind reliably (sibling resolution across rack/track
  nesting and class-name matching was fragile).

The lesson that survives: the "translate onto native controls" plan is right ONLY where
the device would otherwise reimplement something Live does better - and it already paid
off there (native `live.dial` parameters, Push banks, the macro-mappable transport, all
shipped). Reaching out to CONTROL other devices' parameters is a bridge too far: it has
no user value the native mapping does not already give, and it fights Live's own model.

## The "super-device" and the single unified app - superseded, not built

**Verdict: dropped. The Rack made both unnecessary.**

Two shapes from the same old plan, neither built because the shipped design is better:

- **One "super-device" with a mode toggle** (sequencer + instrument + fx in a single
  draggable device, flipped by a runtime switch). Impossible AND unwanted: a device's
  container type (`mmmm` MIDI / `aaaa` audio / instrument) is stamped into the `.amxd`
  at build time and Live enforces placement by it - no runtime toggle crosses that line.
- **Merging every device into one `src/app/unified/` app** shipped into several
  containers by `mode`. This was the plan's route to the super-device feel with one
  codebase.

What shipped instead - the **Instrument Rack preset** (separate, properly-typed devices
pre-wired, one library entry) - delivers the single-thing-to-drag goal AND stays
hand-composable (swap the instrument, remove the fx, add your own). So the unified merge
bought nothing over the devices as they are, and was dropped. The devices stay separate,
sharing code only where it already pays (`src/app/shared/`, `ui:` reuse), not forced into
one bundle.
