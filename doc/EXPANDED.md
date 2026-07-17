# EXPANDED.md - can our devices "maximize" like EQ Eight?

Status: exploratory. Nothing here is implemented. This document records what Live
actually offers, what it does not, and a preliminary design for the closest thing
we can build, split between m4l-jweb (the library) and m4l-strudel (the devices).

## 1. The question

EQ Eight, Spectrum, Wavetable, Operator, Meld and a few other native devices have
a small arrow button in the device title bar ("Toggle Expanded View"). Clicking it
opens a large editor panel in Live's MAIN window, docked above the device chain,
sized by Live itself. Can a Max for Live device get that button?

## 2. The answer: no, and it is not close

The expanded view is a native-device feature. Live draws that panel itself; there
is no hook for it anywhere a Max for Live device can reach:

- The Live Object Model exposes no "expanded view" on Device, DeviceView or
  MaxDevice. There is nothing to call.
- The patcher inspector has no flag for it. Max for Live devices get exactly one
  rectangle in the chain: fixed height (169 px at 100% zoom), width taken from the
  presentation rects.
- Ableton's own Max for Live production guidelines list the full menu of "more
  space" techniques, and the main-window panel is not on it. What is on it:
  fold-out width (the device grows WIDER when an arrow button is clicked), tabbed
  views, overlay views, and pop-out windows opened with [pcontrol] - which the
  guidelines explicitly recommend setting to floating mode.
- The Cycling '74 forum thread asking for exactly this ("Expand height like
  Spectrum") ends where we do: not possible, people fake it with floating windows
  or dummy native devices, nobody has a real mechanism.

Nothing in Live 12.x changed this. Live 12.2 added the Max for Live device EDIT
button behavior (opens the patcher in Max), which is unrelated. So there is no
m4l-jweb feature that can conjure the real thing; the design below is about
building the best imitation Live permits.

Sources:
- https://cycling74.com/forums/expand-height-like-spectrum
- https://github.com/Ableton/maxdevtools/blob/main/m4l-production-guidelines/m4l-production-guidelines.md
- https://www.ableton.com/en/live-manual/12/max-for-live-devices/

## 3. What IS available, honestly ranked

### 3a. A large floating [jweb] window (what we already have, grown up)

m4l-jweb 0.7.x already builds this: `windows:` in surface.ts compiles to a
subpatcher holding its own [jweb], opened by [pcontrol], floated by
[thispatcher] `window flags float`. The `?` reference window and the Strudel
Studio window are this feature.

This is the ceiling Live allows, and it is genuinely close to the goal if we stop
treating it as an auxiliary popup and start treating it as THE expanded device:

- It can be any size, including near-fullscreen. Today's windows are fixed-size
  and small (420x620); nothing prevents a large, resizable one.
- Max windows remember where the user put them, so "my expanded view lives on my
  second monitor" works for free.
- The one hard limit we already measured and documented (HelpWindow.tsx): it
  cannot be ANCHORED to the device. Nothing reports where the device view sits
  on screen, so it can never look docked the way EQ Eight's panel does.
- The one architectural limit: a window is a separate Chromium context. It shares
  nothing with the device view except `state()` slots and Live parameters. An
  expanded view that mirrors the whole UI needs every piece of mirrored state to
  live in one of those two channels. The Studio window already proved the pattern
  (the `code` slot); an expanded view is the same pattern with more slots.

### 3b. Fold-out width (the in-chain arrow button)

A real, Ableton-endorsed pattern: an arrow button on the device that widens the
device view in place, used by Surround Panner and others. It gives horizontal
space only; height stays 169 px. Worth having for the fx device (more dials, a
wider text line), useless for "a big pattern editor".

Caveat from our own history: runtime reflow of native live.* objects in a frozen
device did not work for us (fx surface.ts, the two-screens note); only hide/show
did. The fold-out pattern sidesteps this by pre-placing objects in the folded-out
area and scripting only the PATCHER width, but this needs a spike in a frozen
.amxd before we promise it. Treat as unproven until Phase 0 says otherwise.

### 3c. Overlay / tabs inside the 169 px

Already effectively in use (the fx device's two layered screens). No new space,
just reuse. Not part of this design.

## 4. Preliminary design: "Expanded" as a first-class m4l-jweb feature

Goal: one arrow button on the device that opens a single large window containing
the FULL device UI, replacing the current scatter of special-purpose child
windows (`?` reference, Strudel Studio) with one "maximized device". The library
grows a small amount; the devices mostly reshuffle React code they already have.

### 4a. m4l-jweb changes (C:\Users\jaime\src\m4l-jweb)

1. **Window spec grows sizing options** (packages/surface/src/index.ts).

   ```ts
   window({
     title: "Strudel Studio",
     entry: "Expanded",
     width: 1100, height: 700,   // initial size, as today
     resizable: true,            // NEW: user can drag-resize
     alwaysOnTop: true,
   })
   ```

   `resizable` compiles (packages/build/src/surface.mjs) to the subpatcher's
   window attributes: keep `float` in the `window flags` list, drop `nogrow`
   (or send `window flags grow`), then `window exec`. Today's windows are
   fixed-size; for a maximized-device window the user must be able to size it.

2. **Window open/close state reported back to the app** (packages/build +
   packages/wrapper + packages/surface).

   The device UI needs its arrow button to reflect reality (window closed by its
   own close box must un-press the button). Wire a [closebang] inside the
   generated window subpatcher to a message the wrapper forwards to all views as
   `window_<id>_closed`. Surface side: `useWindow(id)` hook returning
   `{ open, close, toggle, isOpen }` instead of today's fire-and-forget open.

3. **A transient (non-persisted) state channel** (packages/wrapper +
   packages/surface).

   Mirroring a whole UI across two Chromium contexts needs more shared state, and
   most of it is UI-only (caret token, active tab, selection). Today every slot
   persists into the Live set - already a named wart for `helpQuery`
   (src/app/shared/surface.ts). Add `state({ transient: true })`: broadcast to
   all views through the same [dict] path, excluded from the saved payload.

4. **Optional sugar: `expanded:` in the surface** - declares one window as THE
   expanded view and generates a native arrow button (live.text, top corner of
   the native panel) wired directly to the [pcontrol] open, so the device can be
   expanded even while the web UI is still loading. Nice-to-have; items 1-3 are
   the substance.

Non-goals for the library: docking, following the Live window, any use of the
LOM to find screen coordinates (measured dead end), and the fold-out width
pattern (device-side technique, not a library feature, pending the Phase 0
spike).

### 4b. m4l-strudel changes (this repo)

1. **One `expanded` window per device replaces the two windows the MIDI devices
   have today.** The Expanded entry composes what already exists: the pattern
   editor (StudioWindow's textarea), the ReferencePanel, and per-device extras
   (drum map for midi-drums, the fx line + dial readouts for fx). The `?` button
   stays but opens the expanded window scrolled to the reference panel, or the
   help window simply becomes a panel inside Expanded - one window to manage,
   not three.

2. **Device UI gets the arrow button** in the top corner of each App.tsx,
   mirroring EQ Eight's placement, driven by `useWindow("expanded")`. Pressed
   state tracks `isOpen` (library item 2).

3. **State audit per device**: everything the expanded view must mirror moves to
   slots if it is not already there. `code` already is. `helpQuery` flips to
   `transient: true`. Candidates to check: fx `named` (already a slot), sampler
   browser selection, drum map (already a slot).

4. **Engine stays in the device view.** Unchanged and non-negotiable
   (StudioWindow.tsx header comment): windows never receive `tick`, never
   schedule, never sound. The expanded view is an editor with a big screen, not
   a second engine.

### 4c. Phasing

- **Phase 0 (spikes, half a day)**: (a) confirm `window flags grow` sticks in a
  frozen .amxd on Windows and Mac; (b) confirm [closebang] fires in a window
  subpatcher when the user closes it; (c) the fold-out width spike from 3b,
  which can fail without hurting the rest.
- **Phase 1 (m4l-jweb)**: items 1-3, new minor version.
- **Phase 2 (m4l-strudel)**: consume it, starting with ONE device (midi) to
  shake out the state audit, then the rest.
- **Phase 3 (optional)**: fold-out width for the fx device if the spike worked;
  the `expanded:` sugar if the arrow button placement bothers us.

## 5. What to tell users

The honest framing for docs/ABOUT: "Live does not let plugins open EQ Eight
style panels in the main window; the arrow opens the device full-size in a
floating window instead, and it remembers where you put it." Setting the
expectation kills the bug report before it is filed.
