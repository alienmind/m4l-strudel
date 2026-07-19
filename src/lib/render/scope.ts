/*
scope.ts - the eval-scope shims a full Strudel pattern needs that the headless engine
does not provide.

strudel.cc's repl injects a pile of helpers into the code's scope that only make sense
with a live scheduler and an editor: setCpm/setCps (bound to a running scheduler),
slider (a codemirror widget), _scope/_pianoroll (canvas visualisers). A pattern written
on strudel.cc uses them freely; compiled headless (engine.mjs bootScope = core+mini+tonal
only) they throw `X is not defined`.

For OFFLINE RENDER none of them drive anything - tempo comes from Live's transport, the UI
owns any slider, and there is no canvas - so they become the smallest shims that let the
code evaluate to a pattern:

  - setCpm/setCps/setcpm/setcps : capture the requested tempo (the renderer decides whether
    to honour it) and return silence, so the statement is a valid no-op.
  - slider(value, ...)          : return the default value; the UI, not the code, sweeps it.
  - _scope/_pianoroll/_spectrum : return the pattern unchanged (no visualisation offline).

Used by the render device (C.5) and by the S1 spike. Install once per page, after
bootScope().
*/
import { Pattern, silence, createParams } from "@strudel/core";
import { setGainCurve } from "superdough";

export interface RenderScopeOptions {
  /** Called when the code sets tempo via setCpm/setCps, with the resulting cps. */
  onCps?: (cps: number) => void;
}

let installed = false;

export function installRenderScope(opts: RenderScopeOptions = {}): void {
  if (installed) return;
  installed = true;

  const g = globalThis as Record<string, unknown>;

  // setCps(cps) and setCpm(cpm) - cpm/60 = cps, matching repl.mjs. Both return silence so
  // a bare `setCpm(150/4)` line is a valid statement that adds no sound.
  const setCps = (cps: unknown) => {
    opts.onCps?.(Number(cps));
    return silence;
  };
  const setCpm = (cpm: unknown) => {
    opts.onCps?.(Number(cpm) / 60);
    return silence;
  };
  g.setCps = setCps;
  g.setcps = setCps;
  g.setCpm = setCpm;
  g.setcpm = setCpm;

  // setGainCurve(fn) is real superdough state (maps 0..1 gain through fn) and affects the
  // rendered sound, so wire the actual function rather than a no-op.
  g.setGainCurve = setGainCurve;

  // slider(value, min?, max?, step?) - the codemirror widget. Offline it is just its
  // current value; the device's own control does any sweeping. The transpiler rewrites
  // `slider(...)` to `sliderWithID(id, value, min?, max?)`, so shim BOTH: the id-prefixed
  // form is the one the compiled code actually calls.
  g.slider = (value: unknown) => value;
  g.sliderWithID = (_id: unknown, value: unknown) => value;

  // Canvas visualisers: no-ops that pass the pattern through, so `.­_scope()` chains work.
  const passthrough = function (this: unknown) {
    return this;
  };
  const proto = Pattern.prototype as unknown as Record<string, unknown>;
  for (const name of ["_scope", "_pianoroll", "_spectrum", "_punchcard", "_pitchwheel"]) {
    if (typeof proto[name] !== "function") proto[name] = passthrough;
  }

  // @strudel/draw's visual params (x/y/w/h/angle/r/fill/smear) - a pattern may set them
  // (e.g. `.fill()` inside a custom register) even though they mean nothing to audio.
  // Register them as real controls via core, so the methods exist without pulling the
  // whole draw package (canvas, hydra) into the render bundle.
  createParams("x", "y", "w", "h", "angle", "r", "fill", "smear");
}
