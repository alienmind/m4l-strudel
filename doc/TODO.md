# M4L-STRUDEL: what is left to do

The backlog for the devices themselves. Anything that belongs to the *library* -
patcher codegen, the Surface, fetch-to-disk, the chain vocabulary - lives in
`m4l-jweb`'s own [doc/TODO.md](../../m4l-jweb/doc/TODO.md), not here.

**Only open work lives here**, ordered from smallest effort to biggest. What has
shipped is recorded where it belongs: **what the devices do** in
[README.md](../README.md), **how and why (including every design tried, rejected or
measured)** in [ARCHITECTURE.md](ARCHITECTURE.md). What a human still has to check in
Live is [TESTING.md](TESTING.md). The strategic roadmap is [PLAN.md](PLAN.md).

---

## 1. The Rack preset (R4-c) - an hour in Live, no code

Compose the m4l-strudel Rack in Live: an Instrument Rack with Strudel MIDI
(sequencer) -> a native Ableton instrument (honest and useful until ours exists) ->
Strudel Audio FX. Save as `presets/m4l-strudel Rack.adg` and commit - an `.adg` is
gzipped undocumented XML, so it is hand-saved, never generated. The pipeline is
ready: the build and both installers already ship `presets/*.adg` next to the
devices.

Why a rack and not a super-device: container types are build-time, so one toggling
device is impossible - and the rack is better anyway (swap, remove, reorder,
macro-map).

## 2. Run the open Live checks

[TESTING.md](TESTING.md) - state-default seeding on a fresh instance, Push bank
names on hardware, presets landing in the User Library. Minutes each, and two of
them gate the npm publish of m4l-jweb 0.9.x.

## 3. The drag-to-clip spike

[SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md): does a drag from `[jweb]`'s Chromium
produce an OS drag Live's audio lane accepts? The LOM cannot create an audio clip
from a file (see ARCHITECTURE.md, "Not possible"), so the drag is the only path
better than reveal-in-folder. An afternoon with a NO that costs nothing - the
fallback (reveal button) already ships.

## 4. Scale and pitch matching in full Strudel code

Full Strudel code does not see the Octave/Shift controls or the Live Scale toggle.
It is passed through untouched - correct, since rewriting a user's JS would be worse -
but `note("c5")` there is MIDI **72** (scientific pitch), while `c5` in bare
mini-notation follows the octave convention. The UI warns in amber; it cannot fix it.
The Full Studio window raised the stakes: it is a big editor that invites full-code
use, and it carries the same amber warning because that is still all anyone can
honestly do.

## 5. Playhead highlighting for full Strudel code

The playhead highlight only works for bare mini-notation, computed from our own AST
whose tokens carry source positions. Full Strudel code has no link back to the typed
characters. Strudel's editor solves this with hap `context.locations` from the
transpiler - wiring that up means mapping locations in the *rewritten* string back to
the user's text: real work for a feature that mostly matters in the dialect that
already has it.

## 6. Adopt mode (R4-d) - `.lpf()` binds to the user's own Auto Filter

The R2 spike answered NO (Live's Browser is unreachable from `[js]` - see
ARCHITECTURE.md), so Translate mode is **adopt-only**, and that is now a design, not
a question: the user drops an Auto Filter in the rack once; the FX device finds it
(`this_device canonical_parent` is a `Chain` when in a rack), binds `.lpf()` to its
parameters through the `remote` chain (the same bind/stream/release machinery R3
verified), and the UI says what to add for what the line asks. Rules that survive
from the reconciler spec: re-identify by name and position, never persist raw LOM
ids, idempotent, values through the parameter's own `min`/`max`.

## 7. The polyphonic Strudel sampler (P3) - the drum rack device

The gate is open: instance-scoped buffer names are verified in Live (`---` prefix,
m4l-jweb). The device itself is still to build: a new instrument device on the
`instrument` chain, a slot per pad, notes routed to `playVoice()`. The substrate and
its polyphony are already confirmed in Live; what was missing was only the ability
to put two of them in a set - which is the normal case for a drum rack, and what the
Rack makes normal for everything.

## 8. Phase 8 - Strudel's own audio in the track (Route B first)

`FEAT-STRUDEL-002`. **Do not wait for the C++ external**: the standing analysis
([m4l-jweb ENHANCEMENTS.md](../../m4l-jweb/doc/ENHANCEMENTS.md)) ranks offline
rendering first - `OfflineAudioContext` renders cycle N+1 with the real superdough
(bit-identical sound), `saveToFile()` (to be built upstream) writes the WAV,
`[buffer~]`/`[play~]` locked to `current_song_time` plays it double-buffered. One
cycle of edit latency; random/stateful patterns fall back with a visible notice. See
[SPIKE-OFFLINE.md](SPIKE-OFFLINE.md). This eventually fills the Rack's instrument
slot.
