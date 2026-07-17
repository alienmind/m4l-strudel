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

**The question:** does Max expand `#0` inside a Max for Live device patcher?

**Why it matters:** buffer names are global to Max. They used to be generated from the
device name alone, so **two copies of a sampler on two tracks silently corrupted each
other's samples** - no error, just the wrong sound. Names are now `#0-buf-...`, and `#0`
expands per patcher instance. `#0` is documented for abstractions; whether an `.amxd`
counts as one is exactly the unknown.

This spike has no code to run - **it is two copies of a device and your ears.**

1. Put **Strudel Samples** on a track. Download and audition a sample. It must play.
   - **If it does not play at all**, `#0` did NOT expand: the buffer name contains a
     literal `#0` and nothing resolves. Check the Max Console for a `buffer~` complaint.
     That is a clean, loud failure - and it is the answer.
2. Now put a **second** Strudel Samples on a **different track**.
3. Load a **different** sample into the second one.
4. **Audition the FIRST device again.** It must still play ITS OWN sample.
   - If it now plays the second device's sample, `#0` did not scope the name and the
     collision is still live. That is the answer, and it means the fallback route (a
     wrapper-minted id) needs a buffer renameable at runtime - which is why `#0` was
     chosen instead.

**Afterwards:** write the answer into [m4l-jweb/doc/TODO.md](../../m4l-jweb/doc/TODO.md)
item 0. **P3 (the polyphonic drum rack device) cannot be built until this is a YES** - a
drum rack is exactly the multi-instance case.

---

# What is NOT here, and why

- **Pattern modulation** (`.lpf(sine.range(200, 2000))`) is **not testable yet.** The
  parser understands it and the `remote` chain exists upstream, but the FX app has no
  transport tick, so nothing streams values. It will type without an error and do
  nothing. See TODO R3.
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
