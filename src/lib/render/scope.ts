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
  - slider(value, ...)          : return the value - unless the DEVICE overrides it (below).
  - _scope/_pianoroll/_spectrum : return the pattern unchanged (no visualisation offline).

SLIDERS ARE THE DEVICE'S KNOBS. strudel.cc's slider() is a codemirror widget; here the
same role is played by native live.dial parameters. Each compile records every slider the
code declares, in source order (beginSliderCapture / getSliderSpecs), and the device maps
slider N to knob N: setSliderOverrides() feeds the knob values back into the NEXT compile,
so turning a knob re-renders the pattern with the new value - the offline-render
equivalent of dragging the widget on strudel.cc.

Used by the render device (C.5/C.6) and by the S1 spike. Install once per page, after
bootScope().
*/
import { Pattern, silence, createParams } from "@strudel/core";

export interface RenderScopeOptions {
  /** Called when the code sets tempo via setCpm/setCps, with the resulting cps. */
  onCps?: (cps: number) => void;
  /**
   * superdough's real setGainCurve, INJECTED rather than imported: importing the
   * superdough barrel at module level references AudioWorkletProcessor, which only
   * exists in a browser - and this file must stay loadable under node (unit tests).
   * Callers that render (the device hook, the spike) pass the real one; without it
   * the shim is a no-op and a pattern's setGainCurve() silently does nothing.
   */
  setGainCurve?: (fn: (x: number) => number) => void;
}

/** One slider() occurrence in the code: its default and range, in source order. */
export interface SliderSpec {
  /** The transpiler's widget id (source position). Only order matters to the device. */
  id: string;
  value: number;
  min: number;
  max: number;
}

// The capture of the CURRENT compile (call order = source order, deduped by id - a
// slider inside a register()'d combinator can be called once per use), and the values
// the device wants instead of the code's defaults (indexed by capture order).
let capturedSliders: SliderSpec[] = [];
let sliderOverrides: (number | null)[] = [];

/** Reset the capture; call right before each compile. */
export function beginSliderCapture(): void {
  capturedSliders = [];
}

/** The sliders the last compile declared, in source order. */
export function getSliderSpecs(): SliderSpec[] {
  return capturedSliders;
}

/**
 * Values to substitute for the code's slider defaults on the NEXT compile, by capture
 * order. `null` keeps the code's own value (an untouched knob).
 */
export function setSliderOverrides(values: (number | null)[]): void {
  sliderOverrides = values;
}

function sliderValue(id: string, value: unknown, min: unknown, max: unknown): number {
  const v = Number(value);
  let index = capturedSliders.findIndex((s) => s.id === id);
  if (index < 0) {
    index = capturedSliders.length;
    capturedSliders.push({
      id,
      value: v,
      min: Number.isFinite(Number(min)) ? Number(min) : 0,
      max: Number.isFinite(Number(max)) ? Number(max) : 1,
    });
  }
  const override = sliderOverrides[index];
  return override ?? v;
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
  // rendered sound - wire the injected real function (see RenderScopeOptions).
  g.setGainCurve = opts.setGainCurve ?? (() => {});

  // slider(value, min?, max?, step?) - the codemirror widget, here backed by the
  // device's knobs (see the header). The transpiler rewrites `slider(...)` to
  // `sliderWithID(id, value, min?, max?)`, so shim BOTH: the id-prefixed form is the
  // one the compiled code actually calls; the bare form only appears if the code was
  // evaluated without the transpiler (it gets a synthetic per-capture id).
  g.slider = (value: unknown, min?: unknown, max?: unknown) =>
    sliderValue(`plain-${capturedSliders.length}`, value, min, max);
  g.sliderWithID = (id: unknown, value: unknown, min?: unknown, max?: unknown) =>
    sliderValue(String(id), value, min, max);

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
