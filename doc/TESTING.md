# TESTING - what a human has to check, and how

Everything here needs **Live**. It is the list of things the test suites cannot reach:
the suites pin what the generated patcher SAYS, and nothing in CI can hear a filter,
watch a window open, or count undo steps.

Two kinds of thing live here, and the difference matters:

- **SPIKES** - a question nobody has answered. There is no "pass" expected; the ANSWER is
  the deliverable, and a NO is just as useful as a YES. Write the answer into
  [TODO.md](TODO.md) and delete the spike code.
- **CHECKS** - a feature is built and believed to work. You are confirming it.

**Open work is at the top. What has been confirmed is at the [END](#confirmed)** - kept,
not deleted, because each one records a claim that could silently stop being true.

> **STATE (2026-07-17).** Everything built so far is confirmed working in Live. **The two
> SPIKES below are all that is left**, and both are gates: R2 decides whether Translate
> mode exists at all, and the `#0` spike decides whether the drum rack (P3) can be built.

## Before you start

```bash
cd m4l-strudel
pnpm install            # deps: see the dependency note at the end
pnpm build              # writes dist/<name>/*.amxd
pnpm install:device     # copies them into the User Library
```

Then in Live: **File > New Live Set**, and drag each device onto a track from the User
Library. If a device shows a stale build stamp, quit Live entirely and reopen - Live
caches `.amxd` files aggressively.

---

# 1. SPIKE - can a device populate the user's rack?  (TODO R2)

**The question:** can `[js]` reach Live's Browser and create a REAL Ableton device? If
yes, `.lpf(800)` can build an Auto Filter in the user's rack (Translate mode) - Ableton's
own DSP, automation, presets and undo, instead of filters we ported. If no, the fallback
is ADOPT-don't-create, and most of the value survives.

**A NO is a perfectly good answer and ends the question. Stop at the first NO.**

How to run it:

1. Put any Strudel device on a track, **inside a rack**.
2. Click the device's **edit (pencil) button** to open the Max editor.
3. Unlock the patcher (Cmd/Ctrl-E), add a **message box** (Cmd/Ctrl-M), type `spike_rack`
   in it, and drag a cord from its outlet to the **`[js]` object's left inlet**.
4. Open the **Max Console** (Window > Max Console).
5. Lock the patcher and **click the message box**.

Every line is prefixed `SPIKE-R2`. It answers Q1-Q3 by itself:

| | Question | What a NO means |
|---|---|---|
| Q1 | Does `live_app browser` resolve from `[js]`? | Nothing is reachable. Translate mode is adopt-only. Stop. |
| Q2 | Can an Auto Filter BrowserItem be found, and does `load_item` exist? | Nothing can instantiate. Stop. |
| Q3 | Does `load_item` actually place a device, and where? | Reachable but not callable from `[js]`. Stop. |

**Q4 and Q5 need you** - a console cannot hear a click or count undo steps:

- **Q4 (playback):** start the transport, play something, click `spike_rack` again.
  **Listen.** A click or dropout means Translate mode must batch its changes or apply
  them on stop.
- **Q5 (undo):** press Cmd/Ctrl-Z **once**. It should remove the whole insertion. If it
  takes twelve presses, the reconciler needs its own undo grouping or it is unusable.

**Afterwards:** write the answers into [TODO.md](TODO.md) R2 and **delete the
`spike_rack` block** from `wrapper/device.ts`. It is marked throwaway and must not become
a feature.

# 2. SPIKE - do instance-scoped buffer names work?  (TODO P3, m4l-jweb item 0)

**RUN 2026-07-17: PASSED with `---`.** Two copies on two tracks, different samples,
each kept its own sound. The steps stay here as the re-check recipe if the buffer
naming ever changes - see the confirmed section below.

**The question:** does the `---` prefix scope a buffer name per device instance?

**Why it matters:** buffer names are global to Max. They used to be generated from the
device name alone, so **two copies of a sampler on two tracks silently corrupted each
other's samples** - no error, just the wrong sound. Names are now `---buf-...`, and
`---` is Live's documented per-device expansion.

**History:** the first attempt was `#0`, and it FAILED this test (2026-07-17): `#0`
does not expand in an `.amxd`, both devices agreed on the literal name, and the first
device played the second's sample - the silent mode, not the loud one predicted below.
`---` replaced it.

This spike has no code to run - **it is two copies of a device and your ears.**

1. Put **Strudel Samples** on a track. Download and audition a sample. It must play.
   - **If it does not play at all**, the device and the voice disagreed on the expanded
     name. Check the Max Console for a `buffer~` complaint. A loud failure is still an
     answer.
2. Now put a **second** Strudel Samples on a **different track**.
3. Load a **different** sample into the second one.
4. **Audition the FIRST device again.** It must still play ITS OWN sample.
   - If it now plays the second device's sample, `---` did not scope the name either
     (this is how `#0` failed). That would exhaust Max's load-time mechanisms and
     force runtime scripting of the `[buffer~]` from `[js]`.

**Afterwards:** write the answer into [m4l-jweb/doc/TODO.md](../../m4l-jweb/doc/TODO.md)
item 0. **P3 (the polyphonic drum rack device) cannot be built until this is a YES** - a
drum rack is exactly the multi-instance case.

---

# 3. Pattern-driven modulation (TODO R3) - built, needs your ears

The whole chain is code except the last inch: does `live.remote~` actually move the
parameter, audibly and without writing automation? Put **Strudel Audio FX** on a track
with audio and:

1. Type `.lpf(sine.range(200, 2000))` and press Enter. The line must KEEP that text
   (not rewrite itself to a number) - that is the `sources` persistence.
2. **Start the transport.** The Cutoff dial must sweep once per bar, and you must hear
   the filter move. Stopped transport = no motion (the last value holds).
3. While modulated, try to turn the Cutoff dial: live.remote~ owns it - expected.
   Check the automation lane stays EMPTY while the sweep runs (the whole point of
   live.remote~ over parameter writes).
4. Replace the line with `.lpf(800)`, Enter. The dial must come BACK (the release,
   `id 0`) and sit at 800.
5. Retype the sine line, save the set, close, reopen. The line must come back intact
   and the sweep must resume on play - LOM ids re-resolved on load, sources from the
   state slot.

**Afterwards:** write the answer into TODO.md R3. A NO on step 2 with a
`live.remote~` complaint in the Max console is a binding problem (check
`get_param_id` lines); silence with no complaint is a tick problem (check the fx
app's console for `tick` arriving).

# What is NOT here, and why

- **The Rack preset** (R4-c) has to be composed and saved by hand in Live - there is no
  code to test. See TODO R4-c.

# The dependency note

`package.json` points `@m4l-jweb/*` at `^0.9.0`. **m4l-jweb 0.9.0 has to be published
before a fresh clone or CI can install** - until then, the local
`link:../m4l-jweb/packages/*` is what makes both repos build together.

<a id="confirmed"></a>

---

# CONFIRMED IN LIVE

Kept rather than deleted: each one is a claim that could quietly stop being true, and
this says what to re-check if the code underneath it changes.

### Instance-scoped buffer names: `---` scopes, `#0` does not (2026-07-17)
Two copies of Strudel Samples on two tracks, different samples, each keeps its own
sound. The mechanism is the `---` prefix (`---buf-<device>-<slot>`), which Live
expands per DEVICE instance, `[poly~]` voices included. **`#0` was tried first and
FAILED**: it never expands in an `.amxd`, writer and reader agreed on the literal
name, and the first device silently played the second's sample. Re-check with
section 2's steps if the buffer naming in m4l-jweb's `chains.mjs` ever changes.

### `.hpf()` and `.crush()` make a sound (2026-07-17)
The two neutral-at-rest claims are the ones worth re-checking if the chains change:
**`.hpf(0)` and `.crush(24)` must be SILENT** - bit-for-bit the dry signal, A/B'd against
bypass. That is the frozen-graph law: every stage is always in the path, so each needs a
setting where it does nothing. `.crush(16)` is deliberately NOT clean - Strudel calls 16
"minimum crush", and 16-bit quantisation is a quiet crush, not a bypass, which is why the
rack rests at 24.

Also confirmed: nine dials in two rows on the knob panel, and **two Push banks** ("Tone"
and "Space") because nine parameters do not fit on Push's eight encoders.

### The reference window (2026-07-17)
The `?` on the three Strudel-taking devices; the per-device split (FX shows only Effects
and Modulation - its line is a method chain, so mini-notation was never relevant there);
**pinning** (`alwaysOnTop` -> `[thispatcher]`, `window flags grow close title float,
window exec`); and the help following the caret from the device's own box.

The sample browser has **no `?`**, deliberately: it takes no Strudel at all.

### The editor holds what you type, and survives the set (2026-07-17)
Two bugs deep, and both are worth remembering:

- **An empty editor is a VALUE, not an absence.** The engine read
  `saved.length ? saved : theDefault`, so every select-all-and-cut restored the default
  over the top. If cut/paste ever breaks again, look here first.
- **A Max `[dict]` is a key/value MAP.** A state slot holding a string (the pattern) or an
  array (the fx `named` line) had nowhere to land and round-tripped to `{}`. A drum map is
  an object, which is the only reason anything persisted at all. Every value now travels
  as `{"__value": ...}`, with its spaces escaped so Max cannot split the payload.

### The Full Studio window (2026-07-17)
Opens with the pattern in it, syncs both ways with the device view, is pinned, and makes
no sound of its own. **The claim to re-check: exactly ONE stream of notes.** Doubled notes
mean the window has grown an engine, which is the failure its design exists to prevent -
the device view alone receives `tick`.
