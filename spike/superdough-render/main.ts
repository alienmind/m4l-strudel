/*
S1 spike driver - render a Strudel pattern through the real superdough offline, then
listen. Run with: pnpm spike:render (vite dev server), open the printed URL.

This is the browser-only, no-Live spike from the SUPERDOUGH Rendering design, section E:
it proves worklets-in-OfflineAudioContext, sample fetch before startRendering, and the
WAV encoder. It imports the SAME src/lib/render/offline.ts the device will use.
*/
// @ts-expect-error - engine.mjs is untyped (raw submodule-facing JS)
import { bootScope, compile } from "@/max/shared/engine.mjs";
import { renderCycles } from "@/lib/render/offline";
import { installRenderScope } from "@/lib/render/scope";
// Load the default strudel sample map so s("bd sd") resolves, exactly as the repl does.
// setGainCurve is injected into the render scope (scope.ts cannot import the superdough
// barrel itself - it must stay loadable under node for the unit tests).
import { samples, setGainCurve } from "superdough";

const cpsInput = () => document.getElementById("cps") as HTMLInputElement;

// Full-Strudel scope shims (setCpm/setCps/slider/_scope). setCpm/setCps in the code
// auto-fill the cps box so a pasted strudel.cc pattern renders at its own tempo.
installRenderScope({
  setGainCurve,
  onCps: (cps) => { if (Number.isFinite(cps) && cps > 0) cpsInput().value = String(cps); },
});

const logEl = document.getElementById("log")!;
const log = (msg: string, cls = "") => {
  logEl.innerHTML += `<span class="${cls}">${msg}</span>\n`;
};

let lastWav: ArrayBuffer | null = null;
let sampleMapLoaded = false;

async function ensureSamples() {
  if (sampleMapLoaded) return;
  log("loading default dirt-samples map...");
  // The strudel.cc default bank. Needs network on first load; then cached for the session.
  await samples("github:tidalcycles/dirt-samples");
  sampleMapLoaded = true;
  log("samples map ready", "ok");
}

async function render() {
  const code = (document.getElementById("code") as HTMLTextAreaElement).value;
  const cps = Number((document.getElementById("cps") as HTMLInputElement).value);
  const cycles = Number((document.getElementById("cycles") as HTMLInputElement).value);
  logEl.textContent = "";
  try {
    await bootScope();
    await ensureSamples();
    log(`compiling: ${code}`);
    const pat = await compile(code);
    log(`rendering ${cycles} cycle(s) at cps=${cps}...`);
    const t0 = performance.now();
    const { wav, seconds } = await renderCycles(pat, cps, 0, cycles);
    const ms = (performance.now() - t0).toFixed(0);
    lastWav = wav;
    log(`OK: ${wav.byteLength} bytes, ${seconds.toFixed(2)}s audio, rendered in ${ms}ms (${(seconds * 1000 / Number(ms)).toFixed(1)}x realtime)`, "ok");
    (document.getElementById("play") as HTMLButtonElement).disabled = false;
    (document.getElementById("download") as HTMLButtonElement).disabled = false;
  } catch (e) {
    log(`FAIL: ${(e as Error).message}\n${(e as Error).stack ?? ""}`, "err");
  }
}

document.getElementById("render")!.addEventListener("click", render);

document.getElementById("play")!.addEventListener("click", async () => {
  if (!lastWav) return;
  const ctx = new AudioContext();
  const buf = await ctx.decodeAudioData(lastWav.slice(0));
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
});

// Headless S1: /?auto renders a SYNTH-only pattern (no sample fetch, no network) and
// writes the verdict to document.title, so `chrome --headless --dump-dom` can read it.
// Proves the kill-switch claim: worklets + OfflineAudioContext produce non-silent audio.
if (new URLSearchParams(location.search).has("auto")) {
  (async () => {
    try {
      console.log("auto: bootScope");
      await bootScope();
      // ?samples adds the sample claim (network fetch + decodeAudioData BEFORE
      // startRendering); ?trance renders the real doc/trance.strudel (full-Strudel scope:
      // setCpm, register, slider, _scope); default is synth+effects only (no network).
      const q = new URLSearchParams(location.search);
      const useSamples = q.has("samples") || q.has("trance");
      if (useSamples) await ensureSamples();
      console.log("auto: compile");
      let code: string;
      if (q.has("trance")) {
        code = (await import("../../doc/examples/switch_angel - trance example.strudel?raw")).default;
      } else {
        code = useSamples ? 's("bd sd").lpf(800).room(.5)' : 'note("c e g a").s("sawtooth").lpf(800).room(.5)';
      }
      const pat = await compile(code);
      // compile() ran the code, so any setCpm/setCps in it has updated the cps box.
      const cps = Number(cpsInput().value) || 0.5;
      console.log("auto: renderCycles start cps=" + cps);
      const { wav } = await renderCycles(pat, cps, 0, 2);
      console.log("auto: renderCycles done");
      // Peak of the 16-bit PCM data (skip the 44-byte header): silence => 0.
      const pcm = new Int16Array(wav, 44);
      let peak = 0;
      for (let i = 0; i < pcm.length; i++) peak = Math.max(peak, Math.abs(pcm[i]));
      document.title = `S1:${peak > 500 ? "PASS" : "FAIL"} peak=${peak} bytes=${wav.byteLength}`;
      log(document.title, peak > 500 ? "ok" : "err");
    } catch (e) {
      document.title = `S1:FAIL ${(e as Error).message}`;
      log(document.title, "err");
    }
  })();
}

document.getElementById("download")!.addEventListener("click", () => {
  if (!lastWav) return;
  const blob = new Blob([lastWav], { type: "audio/wav" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "spike-render.wav";
  a.click();
});
