var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod2) => function __require() {
  return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// strudel/packages/core/controls.mjs
var controls_exports = {};
__export(controls_exports, {
  FXr: () => FXr,
  FXrel: () => FXrel,
  FXrelease: () => FXrelease,
  accelerate: () => accelerate,
  activeLabel: () => activeLabel,
  ad: () => ad,
  adsr: () => adsr,
  amp: () => amp,
  analyze: () => analyze,
  anchor: () => anchor,
  ar: () => ar,
  as: () => as,
  att: () => att,
  attack: () => attack,
  bandf: () => bandf,
  bandq: () => bandq,
  bank: () => bank,
  bbexpr: () => bbexpr,
  bbst: () => bbst,
  begin: () => begin,
  bgain: () => bgain,
  binshift: () => binshift,
  bmod: () => bmod,
  bp: () => bp,
  bpa: () => bpa,
  bpattack: () => bpattack,
  bpd: () => bpd,
  bpdc: () => bpdc,
  bpdecay: () => bpdecay,
  bpdepth: () => bpdepth,
  bpdepthfreq: () => bpdepthfreq,
  bpdepthfrequency: () => bpdepthfrequency,
  bpe: () => bpe,
  bpenv: () => bpenv,
  bpf: () => bpf,
  bpq: () => bpq,
  bpr: () => bpr,
  bprate: () => bprate,
  bprelease: () => bprelease,
  bps: () => bps,
  bpshape: () => bpshape,
  bpskew: () => bpskew,
  bpsustain: () => bpsustain,
  bpsync: () => bpsync,
  bus: () => bus,
  busgain: () => busgain,
  byteBeatExpression: () => byteBeatExpression,
  byteBeatStartTime: () => byteBeatStartTime,
  ccn: () => ccn,
  ccv: () => ccv,
  ch: () => ch,
  channel: () => channel,
  channels: () => channels,
  chord: () => chord,
  chorus: () => chorus,
  clip: () => clip,
  coarse: () => coarse,
  color: () => color,
  colour: () => colour,
  comb: () => comb,
  compressor: () => compressor,
  compressorAttack: () => compressorAttack,
  compressorKnee: () => compressorKnee,
  compressorRatio: () => compressorRatio,
  compressorRelease: () => compressorRelease,
  control: () => control,
  cps: () => cps,
  createParam: () => createParam,
  createParams: () => createParams,
  crush: () => crush,
  ctf: () => ctf,
  ctlNum: () => ctlNum,
  ctranspose: () => ctranspose,
  curve: () => curve,
  cut: () => cut,
  cutoff: () => cutoff,
  dec: () => dec,
  decay: () => decay,
  degree: () => degree,
  delay: () => delay,
  delayfb: () => delayfb,
  delayfeedback: () => delayfeedback,
  delayspeed: () => delayspeed,
  delaysync: () => delaysync,
  delayt: () => delayt,
  delaytime: () => delaytime,
  deltaSlide: () => deltaSlide,
  density: () => density2,
  det: () => det,
  detune: () => detune,
  dfb: () => dfb,
  dict: () => dict,
  dictionary: () => dictionary,
  dist: () => dist,
  distort: () => distort,
  distorttype: () => distorttype,
  distortvol: () => distortvol,
  djf: () => djf,
  drive: () => drive,
  dry: () => dry,
  ds: () => ds,
  dt: () => dt,
  duck: () => duck,
  duckattack: () => duckattack,
  duckdepth: () => duckdepth,
  duckonset: () => duckonset,
  dur: () => dur,
  duration: () => duration,
  end: () => end,
  enhance: () => enhance,
  env: () => env,
  expression: () => expression,
  fadeInTime: () => fadeInTime,
  fadeOutTime: () => fadeOutTime,
  fadeTime: () => fadeTime,
  fanchor: () => fanchor,
  fft: () => fft,
  fm: () => fm,
  fm1: () => fm1,
  fm2: () => fm2,
  fm3: () => fm3,
  fm4: () => fm4,
  fm5: () => fm5,
  fm6: () => fm6,
  fm7: () => fm7,
  fm8: () => fm8,
  fmatt: () => fmatt,
  fmatt1: () => fmatt1,
  fmatt2: () => fmatt2,
  fmatt3: () => fmatt3,
  fmatt4: () => fmatt4,
  fmatt5: () => fmatt5,
  fmatt6: () => fmatt6,
  fmatt7: () => fmatt7,
  fmatt8: () => fmatt8,
  fmattack: () => fmattack,
  fmattack1: () => fmattack1,
  fmattack2: () => fmattack2,
  fmattack3: () => fmattack3,
  fmattack4: () => fmattack4,
  fmattack5: () => fmattack5,
  fmattack6: () => fmattack6,
  fmattack7: () => fmattack7,
  fmattack8: () => fmattack8,
  fmdec: () => fmdec,
  fmdec1: () => fmdec1,
  fmdec2: () => fmdec2,
  fmdec3: () => fmdec3,
  fmdec4: () => fmdec4,
  fmdec5: () => fmdec5,
  fmdec6: () => fmdec6,
  fmdec7: () => fmdec7,
  fmdec8: () => fmdec8,
  fmdecay: () => fmdecay,
  fmdecay1: () => fmdecay1,
  fmdecay2: () => fmdecay2,
  fmdecay3: () => fmdecay3,
  fmdecay4: () => fmdecay4,
  fmdecay5: () => fmdecay5,
  fmdecay6: () => fmdecay6,
  fmdecay7: () => fmdecay7,
  fmdecay8: () => fmdecay8,
  fme: () => fme,
  fmenv: () => fmenv,
  fmenv1: () => fmenv1,
  fmenv2: () => fmenv2,
  fmenv3: () => fmenv3,
  fmenv4: () => fmenv4,
  fmenv5: () => fmenv5,
  fmenv6: () => fmenv6,
  fmenv7: () => fmenv7,
  fmenv8: () => fmenv8,
  fmh: () => fmh,
  fmh1: () => fmh1,
  fmh2: () => fmh2,
  fmh3: () => fmh3,
  fmh4: () => fmh4,
  fmh5: () => fmh5,
  fmh6: () => fmh6,
  fmh7: () => fmh7,
  fmh8: () => fmh8,
  fmi: () => fmi,
  fmi1: () => fmi1,
  fmi2: () => fmi2,
  fmi3: () => fmi3,
  fmi4: () => fmi4,
  fmi5: () => fmi5,
  fmi6: () => fmi6,
  fmi7: () => fmi7,
  fmi8: () => fmi8,
  fmrel: () => fmrel,
  fmrel1: () => fmrel1,
  fmrel2: () => fmrel2,
  fmrel3: () => fmrel3,
  fmrel4: () => fmrel4,
  fmrel5: () => fmrel5,
  fmrel6: () => fmrel6,
  fmrel7: () => fmrel7,
  fmrel8: () => fmrel8,
  fmrelease: () => fmrelease,
  fmrelease1: () => fmrelease1,
  fmrelease2: () => fmrelease2,
  fmrelease3: () => fmrelease3,
  fmrelease4: () => fmrelease4,
  fmrelease5: () => fmrelease5,
  fmrelease6: () => fmrelease6,
  fmrelease7: () => fmrelease7,
  fmrelease8: () => fmrelease8,
  fmsus: () => fmsus,
  fmsus1: () => fmsus1,
  fmsus2: () => fmsus2,
  fmsus3: () => fmsus3,
  fmsus4: () => fmsus4,
  fmsus5: () => fmsus5,
  fmsus6: () => fmsus6,
  fmsus7: () => fmsus7,
  fmsus8: () => fmsus8,
  fmsustain: () => fmsustain,
  fmsustain1: () => fmsustain1,
  fmsustain2: () => fmsustain2,
  fmsustain3: () => fmsustain3,
  fmsustain4: () => fmsustain4,
  fmsustain5: () => fmsustain5,
  fmsustain6: () => fmsustain6,
  fmsustain7: () => fmsustain7,
  fmsustain8: () => fmsustain8,
  fmwave: () => fmwave,
  fmwave1: () => fmwave1,
  fmwave2: () => fmwave2,
  fmwave3: () => fmwave3,
  fmwave4: () => fmwave4,
  fmwave5: () => fmwave5,
  fmwave6: () => fmwave6,
  fmwave7: () => fmwave7,
  fmwave8: () => fmwave8,
  frameRate: () => frameRate,
  frames: () => frames,
  freeze: () => freeze,
  freq: () => freq,
  fshift: () => fshift,
  fshiftnote: () => fshiftnote,
  fshiftphase: () => fshiftphase,
  ftype: () => ftype,
  fxr: () => fxr,
  gain: () => gain,
  gat: () => gat,
  gate: () => gate,
  getControlName: () => getControlName,
  harmonic: () => harmonic,
  hbrick: () => hbrick,
  hcutoff: () => hcutoff,
  hold: () => hold,
  hours: () => hours,
  hp: () => hp,
  hpa: () => hpa,
  hpattack: () => hpattack,
  hpd: () => hpd,
  hpdc: () => hpdc,
  hpdecay: () => hpdecay,
  hpdepth: () => hpdepth,
  hpdepthfreq: () => hpdepthfreq,
  hpdepthfrequency: () => hpdepthfrequency,
  hpe: () => hpe,
  hpenv: () => hpenv,
  hpf: () => hpf,
  hpq: () => hpq,
  hpr: () => hpr,
  hprate: () => hprate,
  hprelease: () => hprelease,
  hps: () => hps,
  hpshape: () => hpshape,
  hpskew: () => hpskew,
  hpsustain: () => hpsustain,
  hpsync: () => hpsync,
  hresonance: () => hresonance,
  i: () => i,
  imag: () => imag,
  ir: () => ir,
  irbegin: () => irbegin,
  iresponse: () => iresponse,
  irspeed: () => irspeed,
  isControlName: () => isControlName,
  kcutoff: () => kcutoff,
  krush: () => krush,
  label: () => label,
  lbrick: () => lbrick,
  legato: () => legato,
  leslie: () => leslie,
  lfo: () => lfo,
  lock: () => lock,
  loop: () => loop,
  loopBegin: () => loopBegin,
  loopEnd: () => loopEnd,
  loopb: () => loopb,
  loope: () => loope,
  lp: () => lp,
  lpa: () => lpa,
  lpattack: () => lpattack,
  lpd: () => lpd,
  lpdc: () => lpdc,
  lpdecay: () => lpdecay,
  lpdepth: () => lpdepth,
  lpdepthfreq: () => lpdepthfreq,
  lpdepthfrequency: () => lpdepthfrequency,
  lpe: () => lpe,
  lpenv: () => lpenv,
  lpf: () => lpf,
  lpq: () => lpq,
  lpr: () => lpr,
  lprate: () => lprate,
  lprelease: () => lprelease,
  lps: () => lps,
  lpshape: () => lpshape,
  lpskew: () => lpskew,
  lpsustain: () => lpsustain,
  lpsync: () => lpsync,
  lrate: () => lrate,
  lsize: () => lsize,
  midibend: () => midibend,
  midichan: () => midichan,
  midicmd: () => midicmd,
  midimap: () => midimap,
  midiport: () => midiport,
  miditouch: () => miditouch,
  minutes: () => minutes,
  mode: () => mode,
  mtranspose: () => mtranspose,
  n: () => n,
  noise: () => noise,
  note: () => note,
  nrpnn: () => nrpnn,
  nrpv: () => nrpv,
  nudge: () => nudge,
  oct: () => oct,
  octave: () => octave,
  octaveR: () => octaveR,
  octaves: () => octaves,
  octer: () => octer,
  octersub: () => octersub,
  octersubsub: () => octersubsub,
  offset: () => offset,
  orbit: () => orbit,
  oschost: () => oschost,
  oscport: () => oscport,
  overgain: () => overgain,
  overshape: () => overshape,
  pan: () => pan,
  panchor: () => panchor,
  panorient: () => panorient,
  panspan: () => panspan,
  pansplay: () => pansplay,
  panwidth: () => panwidth,
  patt: () => patt,
  pattack: () => pattack,
  pcurve: () => pcurve,
  pdec: () => pdec,
  pdecay: () => pdecay,
  penv: () => penv,
  ph: () => ph,
  phasdp: () => phasdp,
  phaser: () => phaser,
  phasercenter: () => phasercenter,
  phaserdepth: () => phaserdepth,
  phaserrate: () => phaserrate,
  phasersweep: () => phasersweep,
  phc: () => phc,
  phd: () => phd,
  phs: () => phs,
  pitchJump: () => pitchJump,
  pitchJumpTime: () => pitchJumpTime,
  polyTouch: () => polyTouch,
  postgain: () => postgain,
  prel: () => prel,
  prelease: () => prelease,
  progNum: () => progNum,
  psus: () => psus,
  psustain: () => psustain,
  pw: () => pw,
  pwrate: () => pwrate,
  pwsweep: () => pwsweep,
  rdim: () => rdim,
  real: () => real,
  registerControl: () => registerControl,
  registerMultiControl: () => registerMultiControl,
  rel: () => rel,
  release: () => release,
  resonance: () => resonance,
  rfade: () => rfade,
  ring: () => ring,
  ringdf: () => ringdf,
  ringf: () => ringf,
  rlp: () => rlp,
  room: () => room,
  roomdim: () => roomdim,
  roomfade: () => roomfade,
  roomlp: () => roomlp,
  roomsize: () => roomsize,
  rsize: () => rsize,
  s: () => s,
  scram: () => scram,
  scrub: () => scrub,
  seconds: () => seconds,
  semitone: () => semitone,
  shape: () => shape,
  size: () => size,
  slide: () => slide,
  smear: () => smear,
  songPtr: () => songPtr,
  sound: () => sound,
  source: () => source,
  speed: () => speed,
  spread: () => spread,
  squiz: () => squiz,
  src: () => src,
  stepsPerOctave: () => stepsPerOctave,
  stretch: () => stretch,
  sus: () => sus,
  sustain: () => sustain,
  sustainpedal: () => sustainpedal,
  sysex: () => sysex,
  sysexdata: () => sysexdata,
  sysexid: () => sysexid,
  sz: () => sz,
  transient: () => transient,
  trem: () => trem,
  tremolo: () => tremolo,
  tremolodepth: () => tremolodepth,
  tremolophase: () => tremolophase,
  tremoloshape: () => tremoloshape,
  tremoloskew: () => tremoloskew,
  tremolosync: () => tremolosync,
  triode: () => triode,
  tsdelay: () => tsdelay,
  uid: () => uid,
  unison: () => unison,
  unit: () => unit,
  v: () => v,
  val: () => val,
  vel: () => vel,
  velocity: () => velocity,
  vib: () => vib,
  vibmod: () => vibmod,
  vibrato: () => vibrato,
  vmod: () => vmod,
  voice: () => voice,
  vowel: () => vowel,
  warp: () => warp,
  warpatt: () => warpatt,
  warpattack: () => warpattack,
  warpdc: () => warpdc,
  warpdec: () => warpdec,
  warpdecay: () => warpdecay,
  warpdepth: () => warpdepth,
  warpenv: () => warpenv,
  warpmode: () => warpmode,
  warprate: () => warprate,
  warprel: () => warprel,
  warprelease: () => warprelease,
  warpshape: () => warpshape,
  warpskew: () => warpskew,
  warpsus: () => warpsus,
  warpsustain: () => warpsustain,
  warpsync: () => warpsync,
  waveloss: () => waveloss,
  wavetablePhaseRand: () => wavetablePhaseRand,
  wavetablePosition: () => wavetablePosition,
  wavetableWarp: () => wavetableWarp,
  wavetableWarpMode: () => wavetableWarpMode,
  wt: () => wt,
  wtatt: () => wtatt,
  wtattack: () => wtattack,
  wtdc: () => wtdc,
  wtdec: () => wtdec,
  wtdecay: () => wtdecay,
  wtdepth: () => wtdepth,
  wtenv: () => wtenv,
  wtphaserand: () => wtphaserand,
  wtrate: () => wtrate,
  wtrel: () => wtrel,
  wtrelease: () => wtrelease,
  wtshape: () => wtshape,
  wtskew: () => wtskew,
  wtsus: () => wtsus,
  wtsustain: () => wtsustain,
  wtsync: () => wtsync,
  xsdelay: () => xsdelay,
  zcrush: () => zcrush,
  zdelay: () => zdelay,
  zmod: () => zmod,
  znoise: () => znoise,
  zrand: () => zrand,
  zzfx: () => zzfx
});

// strudel/packages/core/logger.mjs
var logKey = "strudel.log";
var debounce = 1e3;
var lastMessage;
var lastTime;
function errorLogger(e, origin = "cyclist") {
  if (true) {
    console.error(e);
  }
  logger(`[${origin}] error: ${e.message}`);
}
function logger(message, type, data = {}) {
  let t = performance.now();
  if (lastMessage === message && t - lastTime < debounce) {
    return;
  }
  lastMessage = message;
  lastTime = t;
  console.log(`%c${message}`, "background-color: black;color:white;border-radius:15px");
  if (typeof document !== "undefined" && typeof CustomEvent !== "undefined") {
    document.dispatchEvent(
      new CustomEvent(logKey, {
        detail: {
          message,
          type,
          data
        }
      })
    );
  }
}
logger.key = logKey;

// node_modules/.pnpm/fraction.js@5.3.4/node_modules/fraction.js/dist/fraction.mjs
if (typeof BigInt === "undefined") BigInt = function(n2) {
  if (isNaN(n2)) throw new Error("");
  return n2;
};
var C_ZERO = BigInt(0);
var C_ONE = BigInt(1);
var C_TWO = BigInt(2);
var C_THREE = BigInt(3);
var C_FIVE = BigInt(5);
var C_TEN = BigInt(10);
var MAX_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
var MAX_CYCLE_LEN = 2e3;
var P = {
  "s": C_ONE,
  "n": C_ZERO,
  "d": C_ONE
};
function assign(n2, s2) {
  try {
    n2 = BigInt(n2);
  } catch (e) {
    throw InvalidParameter();
  }
  return n2 * s2;
}
function ifloor(x) {
  return typeof x === "bigint" ? x : Math.floor(x);
}
function newFraction(n2, d) {
  if (d === C_ZERO) {
    throw DivisionByZero();
  }
  const f = Object.create(Fraction.prototype);
  f["s"] = n2 < C_ZERO ? -C_ONE : C_ONE;
  n2 = n2 < C_ZERO ? -n2 : n2;
  const a = gcd(n2, d);
  f["n"] = n2 / a;
  f["d"] = d / a;
  return f;
}
var FACTORSTEPS = [C_TWO * C_TWO, C_TWO, C_TWO * C_TWO, C_TWO, C_TWO * C_TWO, C_TWO * C_THREE, C_TWO, C_TWO * C_THREE];
function factorize(n2) {
  const factors = /* @__PURE__ */ Object.create(null);
  if (n2 <= C_ONE) {
    factors[n2] = C_ONE;
    return factors;
  }
  const add2 = (p) => {
    factors[p] = (factors[p] || C_ZERO) + C_ONE;
  };
  while (n2 % C_TWO === C_ZERO) {
    add2(C_TWO);
    n2 /= C_TWO;
  }
  while (n2 % C_THREE === C_ZERO) {
    add2(C_THREE);
    n2 /= C_THREE;
  }
  while (n2 % C_FIVE === C_ZERO) {
    add2(C_FIVE);
    n2 /= C_FIVE;
  }
  for (let si = 0, p = C_TWO + C_FIVE; p * p <= n2; ) {
    while (n2 % p === C_ZERO) {
      add2(p);
      n2 /= p;
    }
    p += FACTORSTEPS[si];
    si = si + 1 & 7;
  }
  if (n2 > C_ONE) add2(n2);
  return factors;
}
var parse = function(p1, p2) {
  let n2 = C_ZERO, d = C_ONE, s2 = C_ONE;
  if (p1 === void 0 || p1 === null) {
  } else if (p2 !== void 0) {
    if (typeof p1 === "bigint") {
      n2 = p1;
    } else if (isNaN(p1)) {
      throw InvalidParameter();
    } else if (p1 % 1 !== 0) {
      throw NonIntegerParameter();
    } else {
      n2 = BigInt(p1);
    }
    if (typeof p2 === "bigint") {
      d = p2;
    } else if (isNaN(p2)) {
      throw InvalidParameter();
    } else if (p2 % 1 !== 0) {
      throw NonIntegerParameter();
    } else {
      d = BigInt(p2);
    }
    s2 = n2 * d;
  } else if (typeof p1 === "object") {
    if ("d" in p1 && "n" in p1) {
      n2 = BigInt(p1["n"]);
      d = BigInt(p1["d"]);
      if ("s" in p1)
        n2 *= BigInt(p1["s"]);
    } else if (0 in p1) {
      n2 = BigInt(p1[0]);
      if (1 in p1)
        d = BigInt(p1[1]);
    } else if (typeof p1 === "bigint") {
      n2 = p1;
    } else {
      throw InvalidParameter();
    }
    s2 = n2 * d;
  } else if (typeof p1 === "number") {
    if (isNaN(p1)) {
      throw InvalidParameter();
    }
    if (p1 < 0) {
      s2 = -C_ONE;
      p1 = -p1;
    }
    if (p1 % 1 === 0) {
      n2 = BigInt(p1);
    } else {
      let z = 1;
      let A = 0, B = 1;
      let C = 1, D = 1;
      let N = 1e7;
      if (p1 >= 1) {
        z = 10 ** Math.floor(1 + Math.log10(p1));
        p1 /= z;
      }
      while (B <= N && D <= N) {
        let M = (A + C) / (B + D);
        if (p1 === M) {
          if (B + D <= N) {
            n2 = A + C;
            d = B + D;
          } else if (D > B) {
            n2 = C;
            d = D;
          } else {
            n2 = A;
            d = B;
          }
          break;
        } else {
          if (p1 > M) {
            A += C;
            B += D;
          } else {
            C += A;
            D += B;
          }
          if (B > N) {
            n2 = C;
            d = D;
          } else {
            n2 = A;
            d = B;
          }
        }
      }
      n2 = BigInt(n2) * BigInt(z);
      d = BigInt(d);
    }
  } else if (typeof p1 === "string") {
    let ndx = 0;
    let v2 = C_ZERO, w = C_ZERO, x = C_ZERO, y = C_ONE, z = C_ONE;
    let match = p1.replace(/_/g, "").match(/\d+|./g);
    if (match === null)
      throw InvalidParameter();
    if (match[ndx] === "-") {
      s2 = -C_ONE;
      ndx++;
    } else if (match[ndx] === "+") {
      ndx++;
    }
    if (match.length === ndx + 1) {
      w = assign(match[ndx++], s2);
    } else if (match[ndx + 1] === "." || match[ndx] === ".") {
      if (match[ndx] !== ".") {
        v2 = assign(match[ndx++], s2);
      }
      ndx++;
      if (ndx + 1 === match.length || match[ndx + 1] === "(" && match[ndx + 3] === ")" || match[ndx + 1] === "'" && match[ndx + 3] === "'") {
        w = assign(match[ndx], s2);
        y = C_TEN ** BigInt(match[ndx].length);
        ndx++;
      }
      if (match[ndx] === "(" && match[ndx + 2] === ")" || match[ndx] === "'" && match[ndx + 2] === "'") {
        x = assign(match[ndx + 1], s2);
        z = C_TEN ** BigInt(match[ndx + 1].length) - C_ONE;
        ndx += 3;
      }
    } else if (match[ndx + 1] === "/" || match[ndx + 1] === ":") {
      w = assign(match[ndx], s2);
      y = assign(match[ndx + 2], C_ONE);
      ndx += 3;
    } else if (match[ndx + 3] === "/" && match[ndx + 1] === " ") {
      v2 = assign(match[ndx], s2);
      w = assign(match[ndx + 2], s2);
      y = assign(match[ndx + 4], C_ONE);
      ndx += 5;
    }
    if (match.length <= ndx) {
      d = y * z;
      s2 = /* void */
      n2 = x + d * v2 + z * w;
    } else {
      throw InvalidParameter();
    }
  } else if (typeof p1 === "bigint") {
    n2 = p1;
    s2 = p1;
    d = C_ONE;
  } else {
    throw InvalidParameter();
  }
  if (d === C_ZERO) {
    throw DivisionByZero();
  }
  P["s"] = s2 < C_ZERO ? -C_ONE : C_ONE;
  P["n"] = n2 < C_ZERO ? -n2 : n2;
  P["d"] = d < C_ZERO ? -d : d;
};
function modpow(b, e, m) {
  let r = C_ONE;
  for (; e > C_ZERO; b = b * b % m, e >>= C_ONE) {
    if (e & C_ONE) {
      r = r * b % m;
    }
  }
  return r;
}
function cycleLen(n2, d) {
  for (; d % C_TWO === C_ZERO; d /= C_TWO) {
  }
  for (; d % C_FIVE === C_ZERO; d /= C_FIVE) {
  }
  if (d === C_ONE)
    return C_ZERO;
  let rem = C_TEN % d;
  let t = 1;
  for (; rem !== C_ONE; t++) {
    rem = rem * C_TEN % d;
    if (t > MAX_CYCLE_LEN)
      return C_ZERO;
  }
  return BigInt(t);
}
function cycleStart(n2, d, len) {
  let rem1 = C_ONE;
  let rem2 = modpow(C_TEN, len, d);
  for (let t = 0; t < 300; t++) {
    if (rem1 === rem2)
      return BigInt(t);
    rem1 = rem1 * C_TEN % d;
    rem2 = rem2 * C_TEN % d;
  }
  return 0;
}
function gcd(a, b) {
  if (!a)
    return b;
  if (!b)
    return a;
  while (1) {
    a %= b;
    if (!a)
      return b;
    b %= a;
    if (!b)
      return a;
  }
}
function Fraction(a, b) {
  parse(a, b);
  if (this instanceof Fraction) {
    a = gcd(P["d"], P["n"]);
    this["s"] = P["s"];
    this["n"] = P["n"] / a;
    this["d"] = P["d"] / a;
  } else {
    return newFraction(P["s"] * P["n"], P["d"]);
  }
}
var DivisionByZero = function() {
  return new Error("Division by Zero");
};
var InvalidParameter = function() {
  return new Error("Invalid argument");
};
var NonIntegerParameter = function() {
  return new Error("Parameters must be integer");
};
Fraction.prototype = {
  "s": C_ONE,
  "n": C_ZERO,
  "d": C_ONE,
  /**
   * Calculates the absolute value
   *
   * Ex: new Fraction(-4).abs() => 4
   **/
  "abs": function() {
    return newFraction(this["n"], this["d"]);
  },
  /**
   * Inverts the sign of the current fraction
   *
   * Ex: new Fraction(-4).neg() => 4
   **/
  "neg": function() {
    return newFraction(-this["s"] * this["n"], this["d"]);
  },
  /**
   * Adds two rational numbers
   *
   * Ex: new Fraction({n: 2, d: 3}).add("14.9") => 467 / 30
   **/
  "add": function(a, b) {
    parse(a, b);
    return newFraction(
      this["s"] * this["n"] * P["d"] + P["s"] * this["d"] * P["n"],
      this["d"] * P["d"]
    );
  },
  /**
   * Subtracts two rational numbers
   *
   * Ex: new Fraction({n: 2, d: 3}).add("14.9") => -427 / 30
   **/
  "sub": function(a, b) {
    parse(a, b);
    return newFraction(
      this["s"] * this["n"] * P["d"] - P["s"] * this["d"] * P["n"],
      this["d"] * P["d"]
    );
  },
  /**
   * Multiplies two rational numbers
   *
   * Ex: new Fraction("-17.(345)").mul(3) => 5776 / 111
   **/
  "mul": function(a, b) {
    parse(a, b);
    return newFraction(
      this["s"] * P["s"] * this["n"] * P["n"],
      this["d"] * P["d"]
    );
  },
  /**
   * Divides two rational numbers
   *
   * Ex: new Fraction("-17.(345)").inverse().div(3)
   **/
  "div": function(a, b) {
    parse(a, b);
    return newFraction(
      this["s"] * P["s"] * this["n"] * P["d"],
      this["d"] * P["n"]
    );
  },
  /**
   * Clones the actual object
   *
   * Ex: new Fraction("-17.(345)").clone()
   **/
  "clone": function() {
    return newFraction(this["s"] * this["n"], this["d"]);
  },
  /**
   * Calculates the modulo of two rational numbers - a more precise fmod
   *
   * Ex: new Fraction('4.(3)').mod([7, 8]) => (13/3) % (7/8) = (5/6)
   * Ex: new Fraction(20, 10).mod().equals(0) ? "is Integer"
   **/
  "mod": function(a, b) {
    if (a === void 0) {
      return newFraction(this["s"] * this["n"] % this["d"], C_ONE);
    }
    parse(a, b);
    if (C_ZERO === P["n"] * this["d"]) {
      throw DivisionByZero();
    }
    return newFraction(
      this["s"] * (P["d"] * this["n"]) % (P["n"] * this["d"]),
      P["d"] * this["d"]
    );
  },
  /**
   * Calculates the fractional gcd of two rational numbers
   *
   * Ex: new Fraction(5,8).gcd(3,7) => 1/56
   */
  "gcd": function(a, b) {
    parse(a, b);
    return newFraction(gcd(P["n"], this["n"]) * gcd(P["d"], this["d"]), P["d"] * this["d"]);
  },
  /**
   * Calculates the fractional lcm of two rational numbers
   *
   * Ex: new Fraction(5,8).lcm(3,7) => 15
   */
  "lcm": function(a, b) {
    parse(a, b);
    if (P["n"] === C_ZERO && this["n"] === C_ZERO) {
      return newFraction(C_ZERO, C_ONE);
    }
    return newFraction(P["n"] * this["n"], gcd(P["n"], this["n"]) * gcd(P["d"], this["d"]));
  },
  /**
   * Gets the inverse of the fraction, means numerator and denominator are exchanged
   *
   * Ex: new Fraction([-3, 4]).inverse() => -4 / 3
   **/
  "inverse": function() {
    return newFraction(this["s"] * this["d"], this["n"]);
  },
  /**
   * Calculates the fraction to some integer exponent
   *
   * Ex: new Fraction(-1,2).pow(-3) => -8
   */
  "pow": function(a, b) {
    parse(a, b);
    if (P["d"] === C_ONE) {
      if (P["s"] < C_ZERO) {
        return newFraction((this["s"] * this["d"]) ** P["n"], this["n"] ** P["n"]);
      } else {
        return newFraction((this["s"] * this["n"]) ** P["n"], this["d"] ** P["n"]);
      }
    }
    if (this["s"] < C_ZERO) return null;
    let N = factorize(this["n"]);
    let D = factorize(this["d"]);
    let n2 = C_ONE;
    let d = C_ONE;
    for (let k in N) {
      if (k === "1") continue;
      if (k === "0") {
        n2 = C_ZERO;
        break;
      }
      N[k] *= P["n"];
      if (N[k] % P["d"] === C_ZERO) {
        N[k] /= P["d"];
      } else return null;
      n2 *= BigInt(k) ** N[k];
    }
    for (let k in D) {
      if (k === "1") continue;
      D[k] *= P["n"];
      if (D[k] % P["d"] === C_ZERO) {
        D[k] /= P["d"];
      } else return null;
      d *= BigInt(k) ** D[k];
    }
    if (P["s"] < C_ZERO) {
      return newFraction(d, n2);
    }
    return newFraction(n2, d);
  },
  /**
   * Calculates the logarithm of a fraction to a given rational base
   *
   * Ex: new Fraction(27, 8).log(9, 4) => 3/2
   */
  "log": function(a, b) {
    parse(a, b);
    if (this["s"] <= C_ZERO || P["s"] <= C_ZERO) return null;
    const allPrimes = /* @__PURE__ */ Object.create(null);
    const baseFactors = factorize(P["n"]);
    const T1 = factorize(P["d"]);
    const numberFactors = factorize(this["n"]);
    const T2 = factorize(this["d"]);
    for (const prime in T1) {
      baseFactors[prime] = (baseFactors[prime] || C_ZERO) - T1[prime];
    }
    for (const prime in T2) {
      numberFactors[prime] = (numberFactors[prime] || C_ZERO) - T2[prime];
    }
    for (const prime in baseFactors) {
      if (prime === "1") continue;
      allPrimes[prime] = true;
    }
    for (const prime in numberFactors) {
      if (prime === "1") continue;
      allPrimes[prime] = true;
    }
    let retN = null;
    let retD = null;
    for (const prime in allPrimes) {
      const baseExponent = baseFactors[prime] || C_ZERO;
      const numberExponent = numberFactors[prime] || C_ZERO;
      if (baseExponent === C_ZERO) {
        if (numberExponent !== C_ZERO) {
          return null;
        }
        continue;
      }
      let curN = numberExponent;
      let curD = baseExponent;
      const gcdValue = gcd(curN, curD);
      curN /= gcdValue;
      curD /= gcdValue;
      if (retN === null && retD === null) {
        retN = curN;
        retD = curD;
      } else if (curN * retD !== retN * curD) {
        return null;
      }
    }
    return retN !== null && retD !== null ? newFraction(retN, retD) : null;
  },
  /**
   * Check if two rational numbers are the same
   *
   * Ex: new Fraction(19.6).equals([98, 5]);
   **/
  "equals": function(a, b) {
    parse(a, b);
    return this["s"] * this["n"] * P["d"] === P["s"] * P["n"] * this["d"];
  },
  /**
   * Check if this rational number is less than another
   *
   * Ex: new Fraction(19.6).lt([98, 5]);
   **/
  "lt": function(a, b) {
    parse(a, b);
    return this["s"] * this["n"] * P["d"] < P["s"] * P["n"] * this["d"];
  },
  /**
   * Check if this rational number is less than or equal another
   *
   * Ex: new Fraction(19.6).lt([98, 5]);
   **/
  "lte": function(a, b) {
    parse(a, b);
    return this["s"] * this["n"] * P["d"] <= P["s"] * P["n"] * this["d"];
  },
  /**
   * Check if this rational number is greater than another
   *
   * Ex: new Fraction(19.6).lt([98, 5]);
   **/
  "gt": function(a, b) {
    parse(a, b);
    return this["s"] * this["n"] * P["d"] > P["s"] * P["n"] * this["d"];
  },
  /**
   * Check if this rational number is greater than or equal another
   *
   * Ex: new Fraction(19.6).lt([98, 5]);
   **/
  "gte": function(a, b) {
    parse(a, b);
    return this["s"] * this["n"] * P["d"] >= P["s"] * P["n"] * this["d"];
  },
  /**
   * Compare two rational numbers
   * < 0 iff this < that
   * > 0 iff this > that
   * = 0 iff this = that
   *
   * Ex: new Fraction(19.6).compare([98, 5]);
   **/
  "compare": function(a, b) {
    parse(a, b);
    let t = this["s"] * this["n"] * P["d"] - P["s"] * P["n"] * this["d"];
    return (C_ZERO < t) - (t < C_ZERO);
  },
  /**
   * Calculates the ceil of a rational number
   *
   * Ex: new Fraction('4.(3)').ceil() => (5 / 1)
   **/
  "ceil": function(places) {
    places = C_TEN ** BigInt(places || 0);
    return newFraction(
      ifloor(this["s"] * places * this["n"] / this["d"]) + (places * this["n"] % this["d"] > C_ZERO && this["s"] >= C_ZERO ? C_ONE : C_ZERO),
      places
    );
  },
  /**
   * Calculates the floor of a rational number
   *
   * Ex: new Fraction('4.(3)').floor() => (4 / 1)
   **/
  "floor": function(places) {
    places = C_TEN ** BigInt(places || 0);
    return newFraction(
      ifloor(this["s"] * places * this["n"] / this["d"]) - (places * this["n"] % this["d"] > C_ZERO && this["s"] < C_ZERO ? C_ONE : C_ZERO),
      places
    );
  },
  /**
   * Rounds a rational numbers
   *
   * Ex: new Fraction('4.(3)').round() => (4 / 1)
   **/
  "round": function(places) {
    places = C_TEN ** BigInt(places || 0);
    return newFraction(
      ifloor(this["s"] * places * this["n"] / this["d"]) + this["s"] * ((this["s"] >= C_ZERO ? C_ONE : C_ZERO) + C_TWO * (places * this["n"] % this["d"]) > this["d"] ? C_ONE : C_ZERO),
      places
    );
  },
  /**
    * Rounds a rational number to a multiple of another rational number
    *
    * Ex: new Fraction('0.9').roundTo("1/8") => 7 / 8
    **/
  "roundTo": function(a, b) {
    parse(a, b);
    const n2 = this["n"] * P["d"];
    const d = this["d"] * P["n"];
    const r = n2 % d;
    let k = ifloor(n2 / d);
    if (r + r >= d) {
      k++;
    }
    return newFraction(this["s"] * k * P["n"], P["d"]);
  },
  /**
   * Check if two rational numbers are divisible
   *
   * Ex: new Fraction(19.6).divisible(1.5);
   */
  "divisible": function(a, b) {
    parse(a, b);
    if (P["n"] === C_ZERO) return false;
    return this["n"] * P["d"] % (P["n"] * this["d"]) === C_ZERO;
  },
  /**
   * Returns a decimal representation of the fraction
   *
   * Ex: new Fraction("100.'91823'").valueOf() => 100.91823918239183
   **/
  "valueOf": function() {
    return Number(this["s"] * this["n"]) / Number(this["d"]);
  },
  /**
   * Creates a string representation of a fraction with all digits
   *
   * Ex: new Fraction("100.'91823'").toString() => "100.(91823)"
   **/
  "toString": function(dec2 = 15) {
    let N = this["n"];
    let D = this["d"];
    let cycLen = cycleLen(N, D);
    let cycOff = cycleStart(N, D, cycLen);
    let str = this["s"] < C_ZERO ? "-" : "";
    str += ifloor(N / D);
    N %= D;
    N *= C_TEN;
    if (N)
      str += ".";
    if (cycLen) {
      for (let i2 = cycOff; i2--; ) {
        str += ifloor(N / D);
        N %= D;
        N *= C_TEN;
      }
      str += "(";
      for (let i2 = cycLen; i2--; ) {
        str += ifloor(N / D);
        N %= D;
        N *= C_TEN;
      }
      str += ")";
    } else {
      for (let i2 = dec2; N && i2--; ) {
        str += ifloor(N / D);
        N %= D;
        N *= C_TEN;
      }
    }
    return str;
  },
  /**
   * Returns a string-fraction representation of a Fraction object
   *
   * Ex: new Fraction("1.'3'").toFraction() => "4 1/3"
   **/
  "toFraction": function(showMixed = false) {
    let n2 = this["n"];
    let d = this["d"];
    let str = this["s"] < C_ZERO ? "-" : "";
    if (d === C_ONE) {
      str += n2;
    } else {
      const whole = ifloor(n2 / d);
      if (showMixed && whole > C_ZERO) {
        str += whole;
        str += " ";
        n2 %= d;
      }
      str += n2;
      str += "/";
      str += d;
    }
    return str;
  },
  /**
   * Returns a latex representation of a Fraction object
   *
   * Ex: new Fraction("1.'3'").toLatex() => "\frac{4}{3}"
   **/
  "toLatex": function(showMixed = false) {
    let n2 = this["n"];
    let d = this["d"];
    let str = this["s"] < C_ZERO ? "-" : "";
    if (d === C_ONE) {
      str += n2;
    } else {
      const whole = ifloor(n2 / d);
      if (showMixed && whole > C_ZERO) {
        str += whole;
        n2 %= d;
      }
      str += "\\frac{";
      str += n2;
      str += "}{";
      str += d;
      str += "}";
    }
    return str;
  },
  /**
   * Returns an array of continued fraction elements
   *
   * Ex: new Fraction("7/8").toContinued() => [0,1,7]
   */
  "toContinued": function() {
    let a = this["n"];
    let b = this["d"];
    const res = [];
    while (b) {
      res.push(ifloor(a / b));
      const t = a % b;
      a = b;
      b = t;
    }
    return res;
  },
  "simplify": function(eps = 1e-3) {
    const ieps = BigInt(Math.ceil(1 / eps));
    const thisABS = this["abs"]();
    const cont = thisABS["toContinued"]();
    for (let i2 = 1; i2 < cont.length; i2++) {
      let s2 = newFraction(cont[i2 - 1], C_ONE);
      for (let k = i2 - 2; k >= 0; k--) {
        s2 = s2["inverse"]()["add"](cont[k]);
      }
      let t = s2["sub"](thisABS);
      if (t["n"] * ieps < t["d"]) {
        return s2["mul"](this["s"]);
      }
    }
    return this;
  }
};

// strudel/packages/core/util.mjs
var isNoteWithOctave = (name) => /^[a-gA-G][#bsf]*[0-9]*$/.test(name);
var isNote = (name) => /^[a-gA-G][#bsf]*-?[0-9]*$/.test(name);
var tokenizeNote = (note2) => {
  if (typeof note2 !== "string") {
    return [];
  }
  const [pc, acc = "", oct2] = note2.match(/^([a-gA-G])([#bsf]*)(-?[0-9]*)$/)?.slice(1) || [];
  if (!pc) {
    return [];
  }
  return [pc, acc, oct2 ? Number(oct2) : void 0];
};
var chromas = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
var accs = { "#": 1, b: -1, s: 1, f: -1 };
var getAccidentalsOffset = (accidentals) => {
  return accidentals?.split("").reduce((o, char) => o + accs[char], 0) || 0;
};
var noteToMidi = (note2, defaultOctave = 3) => {
  const [pc, acc, oct2 = defaultOctave] = tokenizeNote(note2);
  if (!pc) {
    throw new Error('not a note: "' + note2 + '"');
  }
  const chroma = chromas[pc.toLowerCase()];
  const offset2 = getAccidentalsOffset(acc);
  return (Number(oct2) + 1) * 12 + chroma + offset2;
};
var midiToFreq = (n2) => {
  return Math.pow(2, (n2 - 69) / 12) * 440;
};
var freqToMidi = (freq2) => {
  return 12 * Math.log(freq2 / 440) / Math.LN2 + 69;
};
var valueToMidi = (value, fallbackValue) => {
  if (typeof value !== "object") {
    throw new Error("valueToMidi: expected object value");
  }
  let { freq: freq2, note: note2 } = value;
  if (typeof freq2 === "number") {
    return freqToMidi(freq2);
  }
  if (typeof note2 === "string") {
    return noteToMidi(note2);
  }
  if (typeof note2 === "number") {
    return note2;
  }
  if (!fallbackValue) {
    throw new Error("valueToMidi: expected freq or note to be set");
  }
  return fallbackValue;
};
var getEventOffsetMs = (targetTimeSeconds, currentTimeSeconds) => {
  return (targetTimeSeconds - currentTimeSeconds) * 1e3;
};
var getFreq = (noteOrMidi) => {
  if (typeof noteOrMidi === "number") {
    return midiToFreq(noteOrMidi);
  }
  return midiToFreq(noteToMidi(noteOrMidi));
};
var pcs = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
var midi2note = (n2) => {
  const oct2 = Math.floor(n2 / 12) - 1;
  const pc = pcs[n2 % 12];
  return pc + oct2;
};
var _mod = (n2, m) => (n2 % m + m) % m;
var averageArray = (arr) => arr.reduce((a, b) => a + b) / arr.length;
function nanFallback(value, fallback = 0) {
  if (isNaN(Number(value))) {
    logger(`"${value}" is not a number, falling back to ${fallback}`, "warning");
    return fallback;
  }
  return value;
}
var getSoundIndex = (n2, numSounds) => {
  return _mod(Math.round(nanFallback(n2 ?? 0, 0)), numSounds);
};
var getPlayableNoteValue = (hap) => {
  let { value, context } = hap;
  let note2 = value;
  if (typeof note2 === "object" && !Array.isArray(note2)) {
    note2 = note2.note || note2.n || note2.value;
    if (note2 === void 0) {
      throw new Error(`cannot find a playable note for ${JSON.stringify(value)}`);
    }
  }
  if (typeof note2 === "number" && context.type !== "frequency") {
    note2 = midiToFreq(hap.value);
  } else if (typeof note2 === "number" && context.type === "frequency") {
    note2 = hap.value;
  } else if (typeof note2 !== "string" || !isNote(note2)) {
    throw new Error("not a note: " + JSON.stringify(note2));
  }
  return note2;
};
var getFrequency = (hap) => {
  let { value, context } = hap;
  if (typeof value === "object") {
    if (value.freq) {
      return value.freq;
    }
    return getFreq(value.note || value.n || value.value);
  }
  if (typeof value === "number" && context.type !== "frequency") {
    value = midiToFreq(hap.value);
  } else if (typeof value === "string" && isNote(value)) {
    value = midiToFreq(noteToMidi(hap.value));
  } else if (typeof value !== "number") {
    throw new Error("not a note or frequency: " + value);
  }
  return value;
};
var rotate = (arr, n2) => arr.slice(n2).concat(arr.slice(0, n2));
var pipe = (...funcs) => {
  return funcs.reduce(
    (f, g) => (...args) => f(g(...args)),
    (x) => x
  );
};
var compose = (...funcs) => pipe(...funcs.reverse());
var removeUndefineds = (xs) => xs.filter((x) => x != void 0);
var flatten = (arr) => [].concat(...arr);
var id = (a) => a;
var constant = (a, b) => a;
var listRange = (min, max) => Array.from({ length: max - min + 1 }, (_, i2) => i2 + min);
function curry(func2, overload, arity = func2.length) {
  const fn = function curried(...args) {
    if (args.length >= arity) {
      return func2.apply(this, args);
    } else {
      const partial = function(...args2) {
        return curried.apply(this, args.concat(args2));
      };
      if (overload) {
        overload(partial, args);
      }
      return partial;
    }
  };
  if (overload) {
    overload(fn, []);
  }
  return fn;
}
function parseNumeral(numOrString) {
  const asNumber = Number(numOrString);
  if (!isNaN(asNumber)) {
    return asNumber;
  }
  if (isNote(numOrString)) {
    return noteToMidi(numOrString);
  }
  throw new Error(`cannot parse as numeral: "${numOrString}"`);
}
function mapArgs(fn, mapFn) {
  return (...args) => fn(...args.map(mapFn));
}
function numeralArgs(fn) {
  return mapArgs(fn, parseNumeral);
}
function parseFractional(numOrString) {
  const asNumber = Number(numOrString);
  if (!isNaN(asNumber)) {
    return asNumber;
  }
  const specialValue = {
    pi: Math.PI,
    w: 1,
    h: 0.5,
    q: 0.25,
    e: 0.125,
    s: 0.0625,
    t: 1 / 3,
    f: 0.2,
    x: 1 / 6
  }[numOrString];
  if (typeof specialValue !== "undefined") {
    return specialValue;
  }
  throw new Error(`cannot parse as fractional: "${numOrString}"`);
}
var fractionalArgs = (fn) => mapArgs(fn, parseFractional);
var splitAt = function(index, value) {
  return [value.slice(0, index), value.slice(index)];
};
var zipWith = (f, xs, ys) => xs.map((n2, i2) => f(n2, ys[i2]));
var pairs = function(xs) {
  const result = [];
  for (let i2 = 0; i2 < xs.length - 1; ++i2) {
    result.push([xs[i2], xs[i2 + 1]]);
  }
  return result;
};
var clamp = (num, min, max) => Math.min(Math.max(num, min), max);
var solfeggio = ["Do", "Reb", "Re", "Mib", "Mi", "Fa", "Solb", "Sol", "Lab", "La", "Sib", "Si"];
var indian = [
  "Sa",
  "Re",
  "Ga",
  "Ma",
  "Pa",
  "Dha",
  "Ni"
];
var german = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Hb", "H"];
var byzantine = [
  "Ni",
  "Pab",
  "Pa",
  "Voub",
  "Vou",
  "Ga",
  "Dib",
  "Di",
  "Keb",
  "Ke",
  "Zob",
  "Zo"
];
var japanese = [
  "I",
  "Ro",
  "Ha",
  "Ni",
  "Ho",
  "He",
  "To"
];
var english = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
var sol2note = (n2, notation = "letters") => {
  const pc = notation === "solfeggio" ? solfeggio : notation === "indian" ? indian : notation === "german" ? german : notation === "byzantine" ? byzantine : notation === "japanese" ? japanese : english;
  const note2 = pc[n2 % 12];
  const oct2 = Math.floor(n2 / 12) - 1;
  return note2 + oct2;
};
function uniq(a) {
  var seen = {};
  return a.filter(function(item) {
    return seen.hasOwn(item) ? false : seen[item] = true;
  });
}
function uniqsort(a) {
  return a.sort().filter(function(item, pos, ary) {
    return !pos || item != ary[pos - 1];
  });
}
function uniqsortr(a) {
  return a.sort((x, y) => x.compare(y)).filter(function(item, pos, ary) {
    return !pos || item.ne(ary[pos - 1]);
  });
}
function unicodeToBase64(text) {
  const utf8Bytes = new TextEncoder().encode(text);
  let binaryString = "";
  const chunkSize = 32768;
  for (let i2 = 0; i2 < utf8Bytes.length; i2 += chunkSize) {
    const chunk2 = utf8Bytes.subarray(i2, i2 + chunkSize);
    binaryString += String.fromCharCode.apply(null, chunk2);
  }
  return btoa(binaryString);
}
function base64ToUnicode(base64String) {
  const utf8Bytes = new Uint8Array(
    atob(base64String).split("").map((char) => char.charCodeAt(0))
  );
  const decodedText = new TextDecoder().decode(utf8Bytes);
  return decodedText;
}
function code2hash(code) {
  return encodeURIComponent(unicodeToBase64(code));
}
function hash2code(hash) {
  return base64ToUnicode(decodeURIComponent(hash));
}
function objectMap(obj, fn) {
  if (Array.isArray(obj)) {
    return obj.map(fn);
  }
  return Object.fromEntries(Object.entries(obj).map(([k, v2], i2) => [k, fn(v2, k, i2)]));
}
function cycleToSeconds(cycle, cps2) {
  return cycle / cps2;
}
var ClockCollator = class {
  constructor({
    getTargetClockTime = getUnixTimeSeconds,
    weight = 16,
    offsetDelta = 5e-3,
    checkAfterTime = 2,
    resetAfterTime = 8
  }) {
    this.offsetTime;
    this.timeAtPrevOffsetSample;
    this.prevOffsetTimes = [];
    this.getTargetClockTime = getTargetClockTime;
    this.weight = weight;
    this.offsetDelta = offsetDelta;
    this.checkAfterTime = checkAfterTime;
    this.resetAfterTime = resetAfterTime;
    this.reset = () => {
      this.prevOffsetTimes = [];
      this.offsetTime = null;
      this.timeAtPrevOffsetSample = null;
    };
  }
  calculateOffset(currentTime) {
    const targetClockTime = this.getTargetClockTime();
    const diffBetweenTimeSamples = targetClockTime - this.timeAtPrevOffsetSample;
    const newOffsetTime = targetClockTime - currentTime;
    if (diffBetweenTimeSamples > this.resetAfterTime) {
      this.reset();
    }
    if (this.offsetTime == null) {
      this.offsetTime = newOffsetTime;
    }
    this.prevOffsetTimes.push(newOffsetTime);
    if (this.prevOffsetTimes.length > this.weight) {
      this.prevOffsetTimes.shift();
    }
    if (this.timeAtPrevOffsetSample == null || diffBetweenTimeSamples > this.checkAfterTime) {
      this.timeAtPrevOffsetSample = targetClockTime;
      const rollingOffsetTime = averageArray(this.prevOffsetTimes);
      if (Math.abs(rollingOffsetTime - this.offsetTime) > this.offsetDelta) {
        this.offsetTime = rollingOffsetTime;
      }
    }
    return this.offsetTime;
  }
  calculateTimestamp(currentTime, targetTime) {
    return this.calculateOffset(currentTime) + targetTime;
  }
};
function getPerformanceTimeSeconds() {
  return performance.now() * 1e-3;
}
function getUnixTimeSeconds() {
  return Date.now() * 1e-3;
}
var keyAlias = /* @__PURE__ */ new Map([
  ["control", "Control"],
  ["ctrl", "Control"],
  ["alt", "Alt"],
  ["shift", "Shift"],
  ["down", "ArrowDown"],
  ["up", "ArrowUp"],
  ["left", "ArrowLeft"],
  ["right", "ArrowRight"]
]);
var keyState;
function getCurrentKeyboardState() {
  if (keyState == null) {
    if (typeof window === "undefined") {
      return;
    }
    keyState = {};
    window.addEventListener("keydown", (event) => {
      keyState[event.key] = true;
    });
    window.addEventListener("keyup", (event) => {
      keyState[event.key] = false;
    });
  }
  return { ...keyState };
}
function stringifyValues(value, compact = false) {
  return typeof value === "object" ? compact ? JSON.stringify(value).slice(1, -1).replaceAll('"', "").replaceAll(",", " ") : JSON.stringify(value) : value;
}

// strudel/packages/core/fraction.mjs
Fraction.prototype.sam = function() {
  return this.floor();
};
Fraction.prototype.nextSam = function() {
  return this.sam().add(1);
};
Fraction.prototype.wholeCycle = function() {
  return new TimeSpan(this.sam(), this.nextSam());
};
Fraction.prototype.cyclePos = function() {
  return this.sub(this.sam());
};
Fraction.prototype.lt = function(other) {
  return this.compare(other) < 0;
};
Fraction.prototype.gt = function(other) {
  return this.compare(other) > 0;
};
Fraction.prototype.lte = function(other) {
  return this.compare(other) <= 0;
};
Fraction.prototype.gte = function(other) {
  return this.compare(other) >= 0;
};
Fraction.prototype.eq = function(other) {
  return this.compare(other) == 0;
};
Fraction.prototype.ne = function(other) {
  return this.compare(other) != 0;
};
Fraction.prototype.max = function(other) {
  return this.gt(other) ? this : other;
};
Fraction.prototype.maximum = function(...others) {
  others = others.map((x) => new Fraction(x));
  return others.reduce((max, other) => other.max(max), this);
};
Fraction.prototype.min = function(other) {
  return this.lt(other) ? this : other;
};
Fraction.prototype.mulmaybe = function(other) {
  return other !== void 0 ? this.mul(other) : void 0;
};
Fraction.prototype.divmaybe = function(other) {
  return other !== void 0 ? this.div(other) : void 0;
};
Fraction.prototype.addmaybe = function(other) {
  return other !== void 0 ? this.add(other) : void 0;
};
Fraction.prototype.submaybe = function(other) {
  return other !== void 0 ? this.sub(other) : void 0;
};
Fraction.prototype.show = function() {
  return this.s * this.n + "/" + this.d;
};
Fraction.prototype.or = function(other) {
  return this.eq(0) ? other : this;
};
var fraction = (n2) => {
  if (typeof n2 === "number") {
  }
  return Fraction(n2);
};
var gcd2 = (...fractions) => {
  fractions = removeUndefineds(fractions);
  if (fractions.length === 0) {
    return void 0;
  }
  return fractions.reduce((gcd3, fraction2) => gcd3.gcd(fraction2), fraction(1));
};
var lcm = (...fractions) => {
  fractions = removeUndefineds(fractions);
  if (fractions.length === 0) {
    return void 0;
  }
  const x = fractions.pop();
  return fractions.reduce(
    (lcm2, fraction2) => lcm2 === void 0 || fraction2 === void 0 ? void 0 : lcm2.lcm(fraction2),
    x
  );
};
var isFraction = (x) => x instanceof Fraction;
fraction._original = Fraction;
var fraction_default = fraction;

// strudel/packages/core/timespan.mjs
var TimeSpan = class _TimeSpan {
  constructor(begin2, end2) {
    this.begin = fraction_default(begin2);
    this.end = fraction_default(end2);
  }
  get spanCycles() {
    const spans = [];
    var begin2 = this.begin;
    const end2 = this.end;
    const end_sam = end2.sam();
    if (begin2.equals(end2)) {
      return [new _TimeSpan(begin2, end2)];
    }
    while (end2.gt(begin2)) {
      if (begin2.sam().equals(end_sam)) {
        spans.push(new _TimeSpan(begin2, this.end));
        break;
      }
      const next_begin = begin2.nextSam();
      spans.push(new _TimeSpan(begin2, next_begin));
      begin2 = next_begin;
    }
    return spans;
  }
  get duration() {
    return this.end.sub(this.begin);
  }
  cycleArc() {
    const b = this.begin.cyclePos();
    const e = b.add(this.duration);
    return new _TimeSpan(b, e);
  }
  withTime(func_time) {
    return new _TimeSpan(func_time(this.begin), func_time(this.end));
  }
  withEnd(func_time) {
    return new _TimeSpan(this.begin, func_time(this.end));
  }
  withCycle(func_time) {
    const sam = this.begin.sam();
    const b = sam.add(func_time(this.begin.sub(sam)));
    const e = sam.add(func_time(this.end.sub(sam)));
    return new _TimeSpan(b, e);
  }
  intersection(other) {
    const intersect_begin = this.begin.max(other.begin);
    const intersect_end = this.end.min(other.end);
    if (intersect_begin.gt(intersect_end)) {
      return void 0;
    }
    if (intersect_begin.equals(intersect_end)) {
      if (intersect_begin.equals(this.end) && this.begin.lt(this.end)) {
        return void 0;
      }
      if (intersect_begin.equals(other.end) && other.begin.lt(other.end)) {
        return void 0;
      }
    }
    return new _TimeSpan(intersect_begin, intersect_end);
  }
  intersection_e(other) {
    const result = this.intersection(other);
    if (result == void 0) {
      throw "TimeSpans do not intersect";
    }
    return result;
  }
  midpoint() {
    return this.begin.add(this.duration.div(fraction_default(2)));
  }
  equals(other) {
    return this.begin.equals(other.begin) && this.end.equals(other.end);
  }
  show() {
    return this.begin.show() + " \u2192 " + this.end.show();
  }
};
var timespan_default = TimeSpan;

// strudel/packages/core/hap.mjs
var Hap = class _Hap {
  /*
        Event class, representing a value active during the timespan
        'part'. This might be a fragment of an event, in which case the
        timespan will be smaller than the 'whole' timespan, otherwise the
        two timespans will be the same. The 'part' must never extend outside of the
        'whole'. If the event represents a continuously changing value
        then the whole will be returned as None, in which case the given
        value will have been sampled from the point halfway between the
        start and end of the 'part' timespan.
        The context is to store a list of source code locations causing the event.
  
        The word 'Event' is more or less a reserved word in javascript, hence this
        class is named called 'Hap'.
        */
  constructor(whole, part, value, context = {}, stateful = false) {
    this.whole = whole;
    this.part = part;
    this.value = value;
    this.context = context;
    this.stateful = stateful;
    if (stateful) {
      console.assert(typeof this.value === "function", "Stateful values must be functions");
    }
  }
  get duration() {
    let duration2;
    if (typeof this.value?.duration === "number") {
      duration2 = fraction_default(this.value.duration);
    } else {
      duration2 = this.whole.end.sub(this.whole.begin);
    }
    if (typeof this.value?.clip === "number") {
      return duration2.mul(this.value.clip);
    }
    return duration2;
  }
  get endClipped() {
    return this.whole.begin.add(this.duration);
  }
  isActive(currentTime) {
    return this.whole.begin <= currentTime && this.endClipped >= currentTime;
  }
  isInPast(currentTime) {
    return currentTime > this.endClipped;
  }
  isInNearPast(margin, currentTime) {
    return currentTime - margin <= this.endClipped;
  }
  isInFuture(currentTime) {
    return currentTime < this.whole.begin;
  }
  isInNearFuture(margin, currentTime) {
    return currentTime < this.whole.begin && currentTime > this.whole.begin - margin;
  }
  isWithinTime(min, max) {
    return this.whole.begin <= max && this.endClipped >= min;
  }
  wholeOrPart() {
    return this.whole ? this.whole : this.part;
  }
  withSpan(func2) {
    const whole = this.whole ? func2(this.whole) : void 0;
    return new _Hap(whole, func2(this.part), this.value, this.context);
  }
  withValue(func2) {
    return new _Hap(this.whole, this.part, func2(this.value), this.context);
  }
  hasOnset() {
    return this.whole != void 0 && this.whole.begin.equals(this.part.begin);
  }
  hasTag(tag) {
    return this.context.tags?.includes(tag);
  }
  resolveState(state) {
    if (this.stateful && this.hasOnset()) {
      console.log("stateful");
      const func2 = this.value;
      const [newState, newValue] = func2(state);
      return [newState, new _Hap(this.whole, this.part, newValue, this.context, false)];
    }
    return [state, this];
  }
  spanEquals(other) {
    return this.whole == void 0 && other.whole == void 0 || this.whole.equals(other.whole);
  }
  equals(other) {
    return this.spanEquals(other) && this.part.equals(other.part) && // TODO would == be better ??
    this.value === other.value;
  }
  show(compact = false) {
    const value = typeof this.value === "object" ? compact ? JSON.stringify(this.value).slice(1, -1).replaceAll('"', "").replaceAll(",", " ") : JSON.stringify(this.value) : this.value;
    var spans = "";
    if (this.whole == void 0) {
      spans = "~" + this.part.show;
    } else {
      var is_whole = this.whole.begin.equals(this.part.begin) && this.whole.end.equals(this.part.end);
      if (!this.whole.begin.equals(this.part.begin)) {
        spans = this.whole.begin.show() + " \u21DC ";
      }
      if (!is_whole) {
        spans += "(";
      }
      spans += this.part.show();
      if (!is_whole) {
        spans += ")";
      }
      if (!this.whole.end.equals(this.part.end)) {
        spans += " \u21DD " + this.whole.end.show();
      }
    }
    return "[ " + spans + " | " + value + " ]";
  }
  showWhole(compact = false) {
    return `${this.whole == void 0 ? "~" : this.whole.show()}: ${stringifyValues(this.value, compact)}`;
  }
  combineContext(b) {
    const a = this;
    return { ...a.context, ...b.context, locations: (a.context.locations || []).concat(b.context.locations || []) };
  }
  setContext(context) {
    return new _Hap(this.whole, this.part, this.value, context);
  }
  ensureObjectValue() {
    if (typeof this.value !== "object") {
      throw new Error(
        `expected hap.value to be an object, but got "${this.value}". Hint: append .note() or .s() to the end`,
        "error"
      );
    }
  }
};
var hap_default = Hap;

// strudel/packages/core/state.mjs
var State = class _State {
  constructor(span, controls = {}) {
    this.span = span;
    this.controls = controls;
  }
  // Returns new State with different span
  setSpan(span) {
    return new _State(span, this.controls);
  }
  withSpan(func2) {
    return this.setSpan(func2(this.span));
  }
  // Returns new State with added controls.
  setControls(controls) {
    return new _State(this.span, { ...this.controls, ...controls });
  }
};
var state_default = State;

// strudel/packages/core/value.mjs
function unionWithObj(a, b, func2) {
  if (b?.value !== void 0 && Object.keys(b).length === 1) {
    logger(`[warn]: Can't do arithmetic on control pattern.`);
    return a;
  }
  const common = Object.keys(a).filter((k) => Object.keys(b).includes(k));
  return Object.assign({}, a, b, Object.fromEntries(common.map((k) => [k, func2(a[k], b[k])])));
}
var mul = curry((a, b) => a * b);
var map = curry((f, anyFunctor) => anyFunctor.map(f));

// strudel/packages/core/drawLine.mjs
function drawLine(pat, chars = 60) {
  let cycle = 0;
  let pos = fraction_default(0);
  let lines = [""];
  let emptyLine = "";
  while (lines[0].length < chars) {
    const haps = pat.queryArc(cycle, cycle + 1);
    const durations = haps.filter((hap) => hap.hasOnset()).map((hap) => hap.duration);
    const charFraction = gcd2(...durations);
    const totalSlots = charFraction.inverse();
    lines = lines.map((line) => line + "|");
    emptyLine += "|";
    for (let i2 = 0; i2 < totalSlots; i2++) {
      const [begin2, end2] = [pos, pos.add(charFraction)];
      const matches = haps.filter((hap) => hap.whole.begin.lte(begin2) && hap.whole.end.gte(end2));
      const missingLines = matches.length - lines.length;
      if (missingLines > 0) {
        lines = lines.concat(Array(missingLines).fill(emptyLine));
      }
      lines = lines.map((line, i3) => {
        const hap = matches[i3];
        if (hap) {
          const isOnset = hap.whole.begin.eq(begin2);
          const char = isOnset ? "" + hap.value : "-";
          return line + char;
        }
        return line + ".";
      });
      emptyLine += ".";
      pos = pos.add(charFraction);
    }
    cycle++;
  }
  return lines.join("\n");
}
var drawLine_default = drawLine;

// strudel/packages/core/evaluate.mjs
var strudelScope = {};
globalThis.strudelScope = strudelScope;
var userDefinedKeys = /* @__PURE__ */ new Set();
globalThis.userDefinedKeys = userDefinedKeys;
var clearScope = () => {
  for (const key of userDefinedKeys) {
    delete strudelScope[key];
    delete globalThis[key];
  }
  userDefinedKeys.clear();
  return globalThis.silence;
};
globalThis.clearScope = clearScope;
var evalScope = async (...args) => {
  const results = await Promise.allSettled(args);
  const modules = results.filter((result) => result.status === "fulfilled").map((r) => r.value);
  results.forEach((result, i2) => {
    if (result.status === "rejected") {
      console.warn(`evalScope: module with index ${i2} could not be loaded:`, result.reason);
    }
  });
  modules.forEach((module) => {
    Object.entries(module).forEach(([name, value]) => {
      globalThis[name] = value;
      strudelScope[name] = value;
    });
  });
  return modules;
};
function safeEval(str, options = {}) {
  const { wrapExpression = true, wrapAsync = true } = options;
  if (wrapExpression) {
    str = `{${str}}`;
  }
  if (wrapAsync) {
    str = `(async ()=>${str})()`;
  }
  const body = `"use strict";return (${str})`;
  return Function(body)();
}
var evaluate = async (code, transpiler, transpilerOptions) => {
  let meta = {};
  if (transpiler) {
    const transpiled = transpiler(code, transpilerOptions);
    code = transpiled.output;
    meta = transpiled;
  }
  const options = { wrapExpression: !!transpiler };
  let evaluated = await safeEval(code, options);
  return { mode: "javascript", pattern: evaluated, meta };
};

// strudel/packages/core/pattern.mjs
var stringParser;
var __steps = true;
var calculateSteps = function(x) {
  __steps = x ? true : false;
};
var setStringParser = (parser) => stringParser = parser;
var Pattern = class _Pattern {
  /**
   * Create a pattern. As an end user, you will most likely not create a Pattern directly.
   *
   * @param {function} query - The function that maps a `State` to an array of `Hap`.
   * @noAutocomplete
   */
  constructor(query, steps2 = void 0) {
    __publicField(this, "polyJoin", function() {
      const pp = this;
      return pp.fmap((p) => p.extend(pp._steps.div(p._steps))).outerJoin();
    });
    this.query = query;
    this._Pattern = true;
    this._steps = steps2;
  }
  get _steps() {
    return this.__steps;
  }
  set _steps(steps2) {
    this.__steps = steps2 === void 0 ? void 0 : fraction_default(steps2);
  }
  setSteps(steps2) {
    this._steps = steps2;
    return this;
  }
  withSteps(f) {
    if (!__steps) {
      return this;
    }
    return new _Pattern(this.query, this._steps === void 0 ? void 0 : f(this._steps));
  }
  get hasSteps() {
    return this._steps !== void 0;
  }
  //////////////////////////////////////////////////////////////////////
  // Haskell-style functor, applicative and monadic operations
  /**
   * Returns a new pattern, with the function applied to the value of
   * each hap. It has the alias `fmap`.
   * @tags functional
   * @synonyms fmap
   * @param {Function} func to to apply to the value
   * @returns Pattern
   * @example
   * "0 1 2".withValue(v => v + 10).log()
   */
  withValue(func2) {
    const result = new _Pattern((state) => this.query(state).map((hap) => hap.withValue(func2)));
    result._steps = this._steps;
    return result;
  }
  // runs func on query state
  withState(func2) {
    return new _Pattern((state) => this.query(func2(state)));
  }
  /**
   * see `withValue`
   * @noAutocomplete
   */
  fmap(func2) {
    return this.withValue(func2);
  }
  /**
   * Assumes 'this' is a pattern of functions, and given a function to
   * resolve wholes, applies a given pattern of values to that
   * pattern of functions.
   * @tags functional
   * @param {Function} whole_func
   * @param {Function} func
   * @noAutocomplete
   * @returns Pattern
   */
  appWhole(whole_func, pat_val) {
    const pat_func = this;
    const query = function(state) {
      const hap_funcs = pat_func.query(state);
      const hap_vals = pat_val.query(state);
      const apply2 = function(hap_func, hap_val) {
        const s2 = hap_func.part.intersection(hap_val.part);
        if (s2 == void 0) {
          return void 0;
        }
        return new hap_default(
          whole_func(hap_func.whole, hap_val.whole),
          s2,
          hap_func.value(hap_val.value),
          hap_val.combineContext(hap_func)
        );
      };
      return flatten(
        hap_funcs.map((hap_func) => removeUndefineds(hap_vals.map((hap_val) => apply2(hap_func, hap_val))))
      );
    };
    return new _Pattern(query);
  }
  /**
   * When this method is called on a pattern of functions, it matches its haps
   * with those in the given pattern of values.  A new pattern is returned, with
   * each matching value applied to the corresponding function.
   *
   * In this `_appBoth` variant, where timespans of the function and value haps
   * are not the same but do intersect, the resulting hap has a timespan of the
   * intersection. This applies to both the part and the whole timespan.
   * @tags functional
   * @param {Pattern} pat_val
   * @noAutocomplete
   * @returns Pattern
   */
  appBoth(pat_val) {
    const pat_func = this;
    const whole_func = function(span_a, span_b) {
      if (span_a == void 0 || span_b == void 0) {
        return void 0;
      }
      return span_a.intersection_e(span_b);
    };
    const result = pat_func.appWhole(whole_func, pat_val);
    if (__steps) {
      result._steps = lcm(pat_val._steps, pat_func._steps);
    }
    return result;
  }
  /**
   * As with `appBoth`, but the `whole` timespan is not the intersection,
   * but the timespan from the function of patterns that this method is called
   * on. In practice, this means that the pattern structure, including onsets,
   * are preserved from the pattern of functions (often referred to as the left
   * hand or inner pattern).
   * @tags functional
   * @param {Pattern} pat_val
   * @noAutocomplete
   * @returns Pattern
   */
  appLeft(pat_val) {
    const pat_func = this;
    const query = function(state) {
      const haps = [];
      for (const hap_func of pat_func.query(state)) {
        const hap_vals = pat_val.query(state.setSpan(hap_func.wholeOrPart()));
        for (const hap_val of hap_vals) {
          const new_whole = hap_func.whole;
          const new_part = hap_func.part.intersection(hap_val.part);
          if (new_part) {
            const new_value = hap_func.value(hap_val.value);
            const new_context = hap_val.combineContext(hap_func);
            const hap = new hap_default(new_whole, new_part, new_value, new_context);
            haps.push(hap);
          }
        }
      }
      return haps;
    };
    const result = new _Pattern(query);
    result._steps = this._steps;
    return result;
  }
  /**
   * As with `appLeft`, but `whole` timespans are instead taken from the
   * pattern of values, i.e. structure is preserved from the right hand/outer
   * pattern.
   * @tags functional
   * @param {Pattern} pat_val
   * @noAutocomplete
   * @returns Pattern
   */
  appRight(pat_val) {
    const pat_func = this;
    const query = function(state) {
      const haps = [];
      for (const hap_val of pat_val.query(state)) {
        const hap_funcs = pat_func.query(state.setSpan(hap_val.wholeOrPart()));
        for (const hap_func of hap_funcs) {
          const new_whole = hap_val.whole;
          const new_part = hap_func.part.intersection(hap_val.part);
          if (new_part) {
            const new_value = hap_func.value(hap_val.value);
            const new_context = hap_val.combineContext(hap_func);
            const hap = new hap_default(new_whole, new_part, new_value, new_context);
            haps.push(hap);
          }
        }
      }
      return haps;
    };
    const result = new _Pattern(query);
    result._steps = pat_val._steps;
    return result;
  }
  bindWhole(choose_whole, func2) {
    const pat_val = this;
    const query = function(state) {
      const withWhole = function(a, b) {
        return new hap_default(
          choose_whole(a.whole, b.whole),
          b.part,
          b.value,
          Object.assign({}, a.context, b.context, {
            locations: (a.context.locations || []).concat(b.context.locations || [])
          })
        );
      };
      const match = function(a) {
        return func2(a.value).query(state.setSpan(a.part)).map((b) => withWhole(a, b));
      };
      return flatten(pat_val.query(state).map((a) => match(a)));
    };
    return new _Pattern(query);
  }
  bind(func2) {
    const whole_func = function(a, b) {
      if (a == void 0 || b == void 0) {
        return void 0;
      }
      return a.intersection_e(b);
    };
    return this.bindWhole(whole_func, func2);
  }
  join() {
    return this.bind(id);
  }
  outerBind(func2) {
    return this.bindWhole((a) => a, func2).setSteps(this._steps);
  }
  outerJoin() {
    return this.outerBind(id);
  }
  innerBind(func2) {
    return this.bindWhole((_, b) => b, func2);
  }
  innerJoin() {
    return this.innerBind(id);
  }
  // Flatterns patterns of patterns, by retriggering/resetting inner patterns at onsets of outer pattern haps
  resetJoin(restart = false) {
    const pat_of_pats = this;
    return new _Pattern((state) => {
      return pat_of_pats.discreteOnly().query(state).map((outer_hap) => {
        return outer_hap.value.late(restart ? outer_hap.whole.begin : outer_hap.whole.begin.cyclePos()).query(state).map(
          (inner_hap) => new hap_default(
            // Supports continuous haps in the inner pattern
            inner_hap.whole ? inner_hap.whole.intersection(outer_hap.whole) : void 0,
            inner_hap.part.intersection(outer_hap.part),
            inner_hap.value
          ).setContext(outer_hap.combineContext(inner_hap))
        ).filter((hap) => hap.part);
      }).flat();
    });
  }
  restartJoin() {
    return this.resetJoin(true);
  }
  // Like the other joins above, joins a pattern of patterns of values, into a flatter
  // pattern of values. In this case it takes whole cycles of the inner pattern to fit each event
  // in the outer pattern.
  squeezeJoin() {
    const pat_of_pats = this;
    function query(state) {
      const haps = pat_of_pats.discreteOnly().query(state);
      function flatHap(outerHap) {
        const inner_pat = outerHap.value._focusSpan(outerHap.wholeOrPart());
        const innerHaps = inner_pat.query(state.setSpan(outerHap.part));
        function munge(outer, inner) {
          let whole = void 0;
          if (inner.whole && outer.whole) {
            whole = inner.whole.intersection(outer.whole);
            if (!whole) {
              return void 0;
            }
          }
          const part = inner.part.intersection(outer.part);
          if (!part) {
            return void 0;
          }
          const context = inner.combineContext(outer);
          return new hap_default(whole, part, inner.value, context);
        }
        return innerHaps.map((innerHap) => munge(outerHap, innerHap));
      }
      const result = flatten(haps.map(flatHap));
      return result.filter((x) => x);
    }
    return new _Pattern(query);
  }
  squeezeBind(func2) {
    return this.fmap(func2).squeezeJoin();
  }
  polyBind(func2) {
    return this.fmap(func2).polyJoin();
  }
  //////////////////////////////////////////////////////////////////////
  // Utility methods mainly for internal use
  /**
   * Query haps inside the given time span.
   *
   * @tags internals
   * @param {Fraction | number} begin from time
   * @param {Fraction | number} end to time
   * @returns Hap[]
   * @example
   * const pattern = sequence('a', ['b', 'c'])
   * const haps = pattern.queryArc(0, 1)
   * console.log(haps)
   * silence
   * @noAutocomplete
   */
  queryArc(begin2, end2, controls = {}) {
    try {
      return this.query(new state_default(new timespan_default(begin2, end2), controls));
    } catch (err) {
      errorLogger(err, "query");
      return [];
    }
  }
  /**
   * Returns a new pattern, with queries split at cycle boundaries. This makes
   * some calculations easier to express, as all haps are then constrained to
   * happen within a cycle.
   * @tags internals
   * @returns Pattern
   * @noAutocomplete
   */
  splitQueries() {
    const pat = this;
    const q = (state) => {
      return flatten(state.span.spanCycles.map((subspan) => pat.query(state.setSpan(subspan))));
    };
    return new _Pattern(q);
  }
  /**
   * Returns a new pattern, where the given function is applied to the query
   * timespan before passing it to the original pattern.
   * @tags internals
   * @param {Function} func the function to apply
   * @returns Pattern
   * @noAutocomplete
   */
  withQuerySpan(func2) {
    return new _Pattern((state) => this.query(state.withSpan(func2)));
  }
  withQuerySpanMaybe(func2) {
    const pat = this;
    return new _Pattern((state) => {
      const newState = state.withSpan(func2);
      if (!newState.span) {
        return [];
      }
      return pat.query(newState);
    });
  }
  /**
   * As with `withQuerySpan`, but the function is applied to both the
   * begin and end time of the query timespan.
   * @tags internals
   * @param {Function} func the function to apply
   * @returns Pattern
   * @noAutocomplete
   */
  withQueryTime(func2) {
    return new _Pattern((state) => this.query(state.withSpan((span) => span.withTime(func2))));
  }
  /**
   * Similar to `withQuerySpan`, but the function is applied to the timespans
   * of all haps returned by pattern queries (both `part` timespans, and where
   * present, `whole` timespans).
   * @tags internals
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withHapSpan(func2) {
    return new _Pattern((state) => this.query(state).map((hap) => hap.withSpan(func2)));
  }
  /**
   * As with `withHapSpan`, but the function is applied to both the
   * begin and end time of the hap timespans.
   * @tags internals
   * @param {Function} func the function to apply
   * @returns Pattern
   * @noAutocomplete
   */
  withHapTime(func2) {
    return this.withHapSpan((span) => span.withTime(func2));
  }
  /**
   * Returns a new pattern with the given function applied to the list of haps returned by every query.
   * @tags internals
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withHaps(func2) {
    const result = new _Pattern((state) => func2(this.query(state), state));
    result._steps = this._steps;
    return result;
  }
  /**
   * As with `withHaps`, but applies the function to every hap, rather than every list of haps.
   * @tags internals
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withHap(func2) {
    return this.withHaps((haps) => haps.map(func2));
  }
  /**
   * Returns a new pattern with the context field set to every hap set to the given value.
   * @tags internals
   * @param {*} context
   * @returns Pattern
   * @noAutocomplete
   */
  setContext(context) {
    return this.withHap((hap) => hap.setContext(context));
  }
  /**
   * Returns a new pattern with the given function applied to the context field of every hap.
   * @tags internals
   * @param {Function} func
   * @returns Pattern
   * @noAutocomplete
   */
  withContext(func2) {
    const result = this.withHap((hap) => hap.setContext(func2(hap.context)));
    if (this.__pure !== void 0) {
      result.__pure = this.__pure;
      result.__pure_loc = this.__pure_loc;
    }
    return result;
  }
  /**
   * Returns a new pattern with the context field of every hap set to an empty object.
   * @tags internals
   * @returns Pattern
   * @noAutocomplete
   */
  stripContext() {
    return this.withHap((hap) => hap.setContext({}));
  }
  /**
   * Returns a new pattern with the given location information added to the
   * context of every hap.
   * @tags internals
   * @param {Number} start start offset
   * @param {Number} end end offset
   * @returns Pattern
   * @noAutocomplete
   */
  withLoc(start, end2) {
    const location = {
      start,
      end: end2
    };
    const result = this.withContext((context) => {
      const locations = (context.locations || []).concat([location]);
      return { ...context, locations };
    });
    if (this.__pure) {
      result.__pure = this.__pure;
      result.__pure_loc = location;
    }
    return result;
  }
  /**
   * Returns a new Pattern, which only returns haps that meet the given test.
   * @tags internals
   * @param {Function} hap_test - a function which returns false for haps to be removed from the pattern
   * @returns Pattern
   * @example
   * s("bd*8").velocity(rand).filterHaps((h) => (h.whole.begin % 1) < h.value.velocity)
   */
  filterHaps(hap_test) {
    return new _Pattern((state) => this.query(state).filter(hap_test));
  }
  /**
   * As with `filterHaps`, but the function is applied to values
   * inside haps.
   * @tags internals
   * @param {Function} value_test
   * @returns Pattern
   * @example
   * const drums = s("bd sd bd sd")
   * kick: drums.filterValues((v) => v.s === 'bd').duck(2)
   * snare: drums.filterValues((v) => v.s === 'sd')
   * bass: s("saw!4").note("G#1").lpf(80).lpenv(4).orbit(2)
   */
  filterValues(value_test) {
    return new _Pattern((state) => this.query(state).filter((hap) => value_test(hap.value))).setSteps(this._steps);
  }
  /**
   * Returns a new pattern, with haps containing undefined values removed from
   * query results.
   * @tags internals
   * @returns Pattern
   * @noAutocomplete
   */
  removeUndefineds() {
    return this.filterValues((val2) => val2 != void 0);
  }
  /**
   * Returns a new pattern, with all haps without onsets filtered out. A hap
   * with an onset is one with a `whole` timespan that begins at the same time
   * as its `part` timespan.
   * @tags internals
   * @returns Pattern
   * @noAutocomplete
   */
  onsetsOnly() {
    return this.filterHaps((hap) => hap.hasOnset());
  }
  /**
   * Returns a new pattern, with 'continuous' haps (those without 'whole'
   * timespans) removed from query results.
   * @tags internals
   * @returns Pattern
   * @noAutocomplete
   */
  discreteOnly() {
    return this.filterHaps((hap) => hap.whole);
  }
  /**
   * Combines adjacent haps with the same value and whole.  Only
   * intended for use in tests.
   * @tags internals
   * @noAutocomplete
   */
  defragmentHaps() {
    const pat = this.discreteOnly();
    return pat.withHaps((haps) => {
      const result = [];
      for (var i2 = 0; i2 < haps.length; ++i2) {
        var searching = true;
        var a = haps[i2];
        while (searching) {
          const a_value = JSON.stringify(haps[i2].value);
          var found = false;
          for (var j = i2 + 1; j < haps.length; j++) {
            const b = haps[j];
            if (a.whole.equals(b.whole)) {
              if (a.part.begin.eq(b.part.end)) {
                if (a_value === JSON.stringify(b.value)) {
                  a = new hap_default(a.whole, new timespan_default(b.part.begin, a.part.end), a.value);
                  haps.splice(j, 1);
                  found = true;
                  break;
                }
              } else if (b.part.begin.eq(a.part.end)) {
                if (a_value == JSON.stringify(b.value)) {
                  a = new hap_default(a.whole, new timespan_default(a.part.begin, b.part.end), a.value);
                  haps.splice(j, 1);
                  found = true;
                  break;
                }
              }
            }
          }
          searching = found;
        }
        result.push(a);
      }
      return result;
    });
  }
  /**
   * Queries the pattern for the first cycle, returning Haps. Mainly of use when
   * debugging a pattern.
   * @tags internals
   * @param {Boolean} with_context - set to true, otherwise the context field
   * will be stripped from the resulting haps.
   * @returns [Hap]
   * @noAutocomplete
   */
  firstCycle(with_context = false) {
    var self = this;
    if (!with_context) {
      self = self.stripContext();
    }
    return self.query(new state_default(new timespan_default(fraction_default(0), fraction_default(1))));
  }
  /**
   * Accessor for a list of values returned by querying the first cycle.
   * @tags internals
   * @noAutocomplete
   */
  get firstCycleValues() {
    return this.firstCycle().map((hap) => hap.value);
  }
  /**
   * More human-readable version of the `firstCycleValues` accessor.
   * @tags internals
   * @noAutocomplete
   */
  get showFirstCycle() {
    return this.firstCycle().map(
      (hap) => `${hap.value}: ${hap.whole.begin.toFraction()} - ${hap.whole.end.toFraction()}`
    );
  }
  /**
   * Returns a new pattern, which returns haps sorted in temporal order. Mainly
   * of use when comparing two patterns for equality, in tests.
   * @tags internals
   * @returns Pattern
   * @noAutocomplete
   */
  sortHapsByPart() {
    return this.withHaps(
      (haps) => haps.sort(
        (a, b) => a.part.begin.sub(b.part.begin).or(a.part.end.sub(b.part.end)).or(a.whole.begin.sub(b.whole.begin).or(a.whole.end.sub(b.whole.end)))
      )
    );
  }
  /**
   * Returns a new pattern with all values parsed as numerals.
   * @tags internals
   */
  asNumber() {
    return this.fmap(parseNumeral);
  }
  //////////////////////////////////////////////////////////////////////
  // Operators - see 'make composers' later..
  _opIn(other, func2) {
    return this.fmap(func2).appLeft(reify(other));
  }
  _opOut(other, func2) {
    return this.fmap(func2).appRight(reify(other));
  }
  _opMix(other, func2) {
    return this.fmap(func2).appBoth(reify(other));
  }
  _opSqueeze(other, func2) {
    const otherPat = reify(other);
    return this.fmap((a) => otherPat.fmap((b) => func2(a)(b))).squeezeJoin();
  }
  _opSqueezeOut(other, func2) {
    const thisPat = this;
    const otherPat = reify(other);
    return otherPat.fmap((a) => thisPat.fmap((b) => func2(b)(a))).squeezeJoin();
  }
  _opReset(other, func2) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a) => func2(a)(b))).resetJoin();
  }
  _opRestart(other, func2) {
    const otherPat = reify(other);
    return otherPat.fmap((b) => this.fmap((a) => func2(a)(b))).restartJoin();
  }
  _opPoly(other, func2) {
    const otherPat = reify(other);
    return this.fmap((b) => otherPat.fmap((a) => func2(a)(b))).polyJoin();
  }
  //////////////////////////////////////////////////////////////////////
  // End-user methods.
  // Those beginning with an underscore (_) are 'patternified',
  // i.e. versions are created without the underscore, that are
  // magically transformed to accept patterns for all their arguments.
  //////////////////////////////////////////////////////////////////////
  // Methods without corresponding toplevel functions
  /**
   * Layers the result of the given function(s). Like `superimpose`, but without the original pattern:
   * @name layer
   * @tags combiners
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*8"
   *   .layer(x=>x.add("0,2"))
   *   .scale('C minor').note()
   */
  layer(...funcs) {
    return stack(...funcs.map((func2) => func2(this)));
  }
  /**
   * Superimposes the result of the given function(s) on top of the original pattern:
   * @name superimpose
   * @tags combiners
   * @memberof Pattern
   * @returns Pattern
   * @example
   * "<0 2 4 6 ~ 4 ~ 2 0!3 ~!5>*8"
   *   .superimpose(x=>x.add(2))
   *   .scale('C minor').note()
   */
  superimpose(...funcs) {
    return this.stack(...funcs.map((func2) => func2(this)));
  }
  //////////////////////////////////////////////////////////////////////
  // Multi-pattern functions
  stack(...pats) {
    return stack(this, ...pats);
  }
  sequence(...pats) {
    return sequence(this, ...pats);
  }
  seq(...pats) {
    return sequence(this, ...pats);
  }
  cat(...pats) {
    return cat(this, ...pats);
  }
  fastcat(...pats) {
    return fastcat(this, ...pats);
  }
  slowcat(...pats) {
    return slowcat(this, ...pats);
  }
  //////////////////////////////////////////////////////////////////////
  // Context methods - ones that deal with metadata
  onTrigger(onTrigger, dominant = true) {
    return this.withHap(
      (hap) => hap.setContext({
        ...hap.context,
        onTrigger: (...args) => {
          hap.context.onTrigger?.(...args);
          onTrigger(...args);
        },
        // if dominantTrigger is set to true, the default output (webaudio) will be disabled
        // when using multiple triggers, you cannot flip this flag to false again!
        // example: x.csound('CooLSynth').log() as well as x.log().csound('CooLSynth') should work the same
        dominantTrigger: hap.context.dominantTrigger || dominant
      })
    );
  }
  /**
   * Writes the content of the current event to the console (visible in the side menu).
   * @tags visualization
   * @name log
   * @memberof Pattern
   * @example
   * s("bd sd").log()
   */
  log(func2 = (hap) => `[hap] ${hap.showWhole(true)}`, getData = (hap) => ({ hap })) {
    return this.onTrigger((...args) => {
      logger(func2(...args), void 0, getData(...args));
    }, false);
  }
  /**
   * A simplified version of `log` which writes all "values" (various configurable parameters)
   * within the event to the console (visible in the side menu).
   * @tags visualization
   * @name logValues
   * @memberof Pattern
   * @example
   * s("bd sd").gain("0.25 0.5 1").n("2 1 0").logValues()
   */
  logValues(func2 = (value) => `[hap] ${stringifyValues(value, true)}`) {
    return this.log((hap) => func2(hap.value));
  }
  //////////////////////////////////////////////////////////////////////
  // Visualisation
  drawLine() {
    console.log(drawLine_default(this));
    return this;
  }
  //////////////////////////////////////////////////////////////////////
  // methods relating to breaking patterns into subcycles
  // Breaks a pattern into a pattern of patterns, according to the structure of the given binary pattern.
  unjoin(pieces, func2 = id) {
    return pieces.withHap(
      (hap) => hap.withValue((v2) => v2 ? func2(this.ribbon(hap.whole.begin, hap.whole.duration)) : this)
    );
  }
  /**
   * Breaks a pattern into pieces according to the structure of a given pattern.
   * True values in the given pattern cause the corresponding subcycle of the
   * source pattern to be looped, and for an (optional) given function to be
   * applied. False values result in the corresponding part of the source pattern
   * to be played unchanged.
   * @tags temporal
   * @name into
   * @memberof Pattern
   * @example
   * sound("bd sd ht lt").into("1 0", hurry(2))
   */
  into(pieces, func2) {
    return this.unjoin(pieces, func2).innerJoin();
  }
};
function groupHapsBy(eq2, haps) {
  let groups = [];
  haps.forEach((hap) => {
    const match = groups.findIndex(([other]) => eq2(hap, other));
    if (match === -1) {
      groups.push([hap]);
    } else {
      groups[match].push(hap);
    }
  });
  return groups;
}
var congruent = (a, b) => a.spanEquals(b);
Pattern.prototype.collect = function() {
  return this.withHaps(
    (haps) => groupHapsBy(congruent, haps).map((_haps) => new hap_default(_haps[0].whole, _haps[0].part, _haps, {}))
  );
};
var arpWith = register("arpWith", (func2, pat) => {
  return pat.collect().fmap((v2) => reify(func2(v2))).innerJoin().withHap((h) => new hap_default(h.whole, h.part, h.value.value, h.combineContext(h.value)));
});
var arp = register(
  "arp",
  (indices, pat) => pat.arpWith((haps) => reify(indices).fmap((i2) => haps[i2 % haps.length])),
  false
);
function _nonArrayObject(x) {
  return !Array.isArray(x) && typeof x === "object" && !isFraction(x);
}
function _composeOp(a, b, func2) {
  if (_nonArrayObject(a) || _nonArrayObject(b)) {
    if (!_nonArrayObject(a)) {
      a = { value: a };
    }
    if (!_nonArrayObject(b)) {
      b = { value: b };
    }
    return unionWithObj(a, b, func2);
  }
  return func2(a, b);
}
var COMPOSERS = {
  /**
   * When called on a pattern `a`, with a input pattern `b` (`a.set(b)`),
   * combines `a` and `b` such that anything defined in `b`
   * and anything defined in `a` that is *not* defined in `b`
   * will be in the resulting pattern.
   *
   * The structure is maintained from `a`,
   * because the default pattern alignment is `in`,
   * see the section on `Pattern Alignment`
   * in the technical manual in the docs
   *
   * This is the inverse of `keep`
   *
   * See examples below
   * @name set
   * @param {Pattern} pat
   * @returns {Pattern}
   * @memberof Pattern
   * @tags internal, combiners
   * @example
   * // because input pattern has `s` set,
   * // it overrides the "sine" declared earlier
   * note("c a f e").s("sine").set(s("triangle"))
   */
  set: [(a, b) => b],
  /**
   * When called on a pattern `a`, with a input pattern `b` (`a.keep(b)`),
   * combines `a` and `b` such that anything defined in `a`,
   * and anything defined in `b` that is *not* defined in `a`
   * will be in the resulting pattern
   *
   * The structure is maintained from `a`,
   * because the default pattern alignment is `in`,
   * see the section on `Pattern Alignment`
   * in the technical manual in the docs
   *
   * This is the inverse of `set`
   *
   * See examples below
   * @name keep
   * @param {Pattern} pat
   * @memberof Pattern
   * @returns {Pattern}
   * @tags internal, combiners
   * @example
   * // notes, already defined, will stay "c a f e",
   * // while "s", not defined, will be set to "piano"
   * note("c a f e").keep(note("e f a c").s("piano"))
   */
  keep: [(a) => a],
  keepif: [(a, b) => b ? a : void 0],
  // numerical functions
  /**
   *
   * Assumes a pattern of numbers. Adds the given number to each item in the pattern.
   * @name add
   * @memberof Pattern
   * @tags math
   * @example
   * // Here, the triad 0, 2, 4 is shifted by different amounts
   * n("0 2 4".add("<0 3 4 0>")).scale("C:major")
   * // Without add, the equivalent would be:
   * // n("<[0 2 4] [3 5 7] [4 6 8] [0 2 4]>").scale("C:major")
   * @example
   * // You can also use add with notes:
   * note("c3 e3 g3".add("<0 5 7 0>"))
   * // Behind the scenes, the notes are converted to midi numbers:
   * // note("48 52 55".add("<0 5 7 0>"))
   */
  add: [numeralArgs((a, b) => a + b)],
  // support string concatenation
  /**
   *
   * Like add, but the given numbers are subtracted.
   * @name sub
   * @memberof Pattern
   * @tags math
   * @example
   * n("0 2 4".sub("<0 1 2 3>")).scale("C4:minor")
   * // See add for more information.
   */
  sub: [numeralArgs((a, b) => a - b)],
  /**
   *
   * Multiplies each number by the given factor.
   * @name mul
   * @memberof Pattern
   * @tags math
   * @example
   * "<1 1.5 [1.66, <2 2.33>]>*4".mul(150).freq()
   */
  mul: [numeralArgs((a, b) => a * b)],
  /**
   *
   * Divides each number by the given factor.
   * @name div
   * @memberof Pattern
   * @tags math
   */
  div: [numeralArgs((a, b) => a / b)],
  mod: [numeralArgs(_mod)],
  pow: [numeralArgs(Math.pow)],
  band: [numeralArgs((a, b) => a & b)],
  bor: [numeralArgs((a, b) => a | b)],
  bxor: [numeralArgs((a, b) => a ^ b)],
  blshift: [numeralArgs((a, b) => a << b)],
  brshift: [numeralArgs((a, b) => a >> b)],
  // TODO - force numerical comparison if both look like numbers?
  lt: [(a, b) => a < b],
  gt: [(a, b) => a > b],
  lte: [(a, b) => a <= b],
  gte: [(a, b) => a >= b],
  eq: [(a, b) => a == b],
  eqt: [(a, b) => a === b],
  ne: [(a, b) => a != b],
  net: [(a, b) => a !== b],
  and: [(a, b) => a && b],
  or: [(a, b) => a || b],
  //  bitwise ops
  func: [(a, b) => b(a)]
};
var _setupAlignments = () => {
  for (const [what, [op, preprocess]] of Object.entries(COMPOSERS)) {
    Pattern.prototype["_" + what] = function(value) {
      return this.fmap((x) => op(x, value));
    };
    Object.defineProperty(Pattern.prototype, what, {
      // Set to configurable so we can update if the default alignment changes
      configurable: true,
      // a getter that returns a function, so 'pat' can be
      // accessed by closures that are methods of that function..
      get: function() {
        const pat = this;
        const wrapper = (...other) => pat[what][DEFAULT_ALIGNMENT](...other);
        for (const how of ALIGNMENTS) {
          wrapper[how.toLowerCase()] = function(...other) {
            var howpat = pat;
            other = sequence(other);
            if (preprocess) {
              howpat = preprocess(howpat);
              other = preprocess(other);
            }
            var result;
            if (what === "keepif") {
              result = howpat["_op" + how](other, (a) => (b) => op(a, b));
              result = result.removeUndefineds();
            } else {
              result = howpat["_op" + how](other, (a) => (b) => _composeOp(a, b, op));
            }
            return result;
          };
        }
        wrapper.squeezein = wrapper.squeeze;
        return wrapper;
      }
    });
  }
};
var DEFAULT_ALIGNMENT = "in";
var ALIGNMENTS = ["In", "Out", "Mix", "Squeeze", "SqueezeOut", "Reset", "Restart", "Poly"];
var ALIGNMENT_KEYS = ALIGNMENTS.map((how) => how.toLowerCase());
(function() {
  _setupAlignments();
  for (const how of ALIGNMENTS) {
    Pattern.prototype[how.toLowerCase()] = function(...args) {
      return this.set[how.toLowerCase()](args);
    };
  }
  Pattern.prototype.struct = function(...args) {
    return this.keepif.out(...args);
  };
  Pattern.prototype.structAll = function(...args) {
    return this.keep.out(...args);
  };
  Pattern.prototype.mask = function(...args) {
    return this.keepif.in(...args);
  };
  Pattern.prototype.maskAll = function(...args) {
    return this.keep.in(...args);
  };
  Pattern.prototype.reset = function(...args) {
    return this.keepif.reset(...args);
  };
  Pattern.prototype.resetAll = function(...args) {
    return this.keep.reset(...args);
  };
  Pattern.prototype.restart = function(...args) {
    return this.keepif.restart(...args);
  };
  Pattern.prototype.restartAll = function(...args) {
    return this.keep.restart(...args);
  };
})();
var setDefaultJoin = (alignment) => {
  alignment = alignment?.toLowerCase();
  if (DEFAULT_ALIGNMENT !== alignment && ALIGNMENT_KEYS.includes(alignment)) {
    DEFAULT_ALIGNMENT = alignment;
    _setupAlignments();
  }
};
var polyrhythm = stack;
var pr = stack;
var pm = polymeter;
var gap = (steps2) => new Pattern(() => [], steps2);
var silence = gap(1);
var nothing = gap(0);
function pure(value) {
  function query(state) {
    return state.span.spanCycles.map((subspan) => new hap_default(fraction_default(subspan.begin).wholeCycle(), subspan, value));
  }
  const result = new Pattern(query, 1);
  result.__pure = value;
  return result;
}
function isPattern(thing) {
  const is = thing instanceof Pattern || thing?._Pattern;
  return is;
}
function reify(thing) {
  if (isPattern(thing)) {
    return thing;
  }
  if (stringParser && typeof thing === "string") {
    return stringParser(thing);
  }
  return pure(thing);
}
function sequenceP(pats) {
  let result = pure([]);
  for (const pat of pats) {
    result = result.bind((list) => pat.fmap((v2) => list.concat([v2])));
  }
  return result;
}
function stack(...pats) {
  pats = pats.map((pat) => Array.isArray(pat) ? sequence(...pat) : reify(pat));
  const query = (state) => flatten(pats.map((pat) => pat.query(state)));
  const result = new Pattern(query);
  if (__steps) {
    result._steps = lcm(...pats.map((pat) => pat._steps));
  }
  return result;
}
function _stackWith(func2, pats) {
  pats = pats.map((pat) => Array.isArray(pat) ? sequence(...pat) : reify(pat));
  if (pats.length === 0) {
    return silence;
  }
  if (pats.length === 1) {
    return pats[0];
  }
  const [left2, ...right2] = pats.map((pat) => pat._steps);
  const steps2 = __steps ? left2.maximum(...right2) : void 0;
  return stack(...func2(steps2, pats));
}
function stackLeft(...pats) {
  return _stackWith(
    (steps2, pats2) => pats2.map((pat) => pat._steps.eq(steps2) ? pat : stepcat(pat, gap(steps2.sub(pat._steps)))),
    pats
  );
}
function stackRight(...pats) {
  return _stackWith(
    (steps2, pats2) => pats2.map((pat) => pat._steps.eq(steps2) ? pat : stepcat(gap(steps2.sub(pat._steps)), pat)),
    pats
  );
}
function stackCentre(...pats) {
  return _stackWith(
    (steps2, pats2) => pats2.map((pat) => {
      if (pat._steps.eq(steps2)) {
        return pat;
      }
      const g = gap(steps2.sub(pat._steps).div(2));
      return stepcat(g, pat, g);
    }),
    pats
  );
}
function stackBy(by, ...pats) {
  const [left2, ...right2] = pats.map((pat) => pat._steps);
  const steps2 = left2.maximum(...right2);
  const lookup = {
    centre: stackCentre,
    left: stackLeft,
    right: stackRight,
    expand: stack,
    repeat: (...args) => polymeter(...args).steps(steps2)
  };
  return by.inhabit(lookup).fmap((func2) => func2(...pats)).innerJoin().setSteps(steps2);
}
function slowcat(...pats) {
  pats = pats.map((pat) => Array.isArray(pat) ? fastcat(...pat) : reify(pat));
  if (pats.length == 1) {
    return pats[0];
  }
  const query = function(state) {
    const span = state.span;
    const pat_n = _mod(span.begin.sam(), pats.length);
    const pat = pats[pat_n];
    if (!pat) {
      return [];
    }
    const offset2 = span.begin.floor().sub(span.begin.div(pats.length).floor());
    return pat.withHapTime((t) => t.add(offset2)).query(state.setSpan(span.withTime((t) => t.sub(offset2))));
  };
  const steps2 = __steps ? lcm(...pats.map((x) => x._steps)) : void 0;
  return new Pattern(query).splitQueries().setSteps(steps2);
}
function slowcatPrime(...pats) {
  pats = pats.map(reify);
  const query = function(state) {
    const pat_n = Math.floor(state.span.begin) % pats.length;
    const pat = pats[pat_n];
    return pat?.query(state) || [];
  };
  return new Pattern(query).splitQueries();
}
function cat(...pats) {
  return slowcat(...pats);
}
function arrange(...sections) {
  const total = sections.reduce((sum, [cycles]) => sum + cycles, 0);
  sections = sections.map(([cycles, section]) => [cycles, section.fast(cycles)]);
  return stepcat(...sections).slow(total);
}
function seqPLoop(...parts) {
  let total = fraction_default(0);
  const pats = [];
  for (let part of parts) {
    if (part.length == 2) {
      part.unshift(total);
    }
    total = part[1];
  }
  return stack(
    ...parts.map(
      ([start, stop, pat]) => pure(reify(pat)).compress(fraction_default(start).div(total), fraction_default(stop).div(total))
    )
  ).slow(total).innerJoin();
}
function fastcat(...pats) {
  let result = slowcat(...pats);
  if (pats.length > 1) {
    result = result._fast(pats.length);
    result._steps = pats.length;
  }
  if (pats.length == 1 && pats[0].__steps_source) {
    pats._steps = pats[0]._steps;
  }
  return result;
}
function sequence(...pats) {
  return fastcat(...pats);
}
function seq(...pats) {
  return fastcat(...pats);
}
function _sequenceCount(x) {
  if (Array.isArray(x)) {
    if (x.length == 0) {
      return [silence, 0];
    }
    if (x.length == 1) {
      return _sequenceCount(x[0]);
    }
    return [fastcat(...x.map((a) => _sequenceCount(a)[0])), x.length];
  }
  return [reify(x), 1];
}
var mask = curry((a, b) => reify(b).mask(a));
var struct = curry((a, b) => reify(b).struct(a));
var superimpose = curry((a, b) => reify(b).superimpose(...a));
var withValue = curry((a, b) => reify(b).withValue(a));
var bind = curry((a, b) => reify(b).bind(a));
var innerBind = curry((a, b) => reify(b).innerBind(a));
var outerBind = curry((a, b) => reify(b).outerBind(a));
var squeezeBind = curry((a, b) => reify(b).squeezeBind(a));
var stepBind = curry((a, b) => reify(b).stepBind(a));
var polyBind = curry((a, b) => reify(b).polyBind(a));
var set = curry((a, b) => reify(b).set(a));
var keep = curry((a, b) => reify(b).keep(a));
var keepif = curry((a, b) => reify(b).keepif(a));
var add = curry((a, b) => reify(b).add(a));
var sub = curry((a, b) => reify(b).sub(a));
var mul2 = curry((a, b) => reify(b).mul(a));
var div = curry((a, b) => reify(b).div(a));
var mod = curry((a, b) => reify(b).mod(a));
var pow = curry((a, b) => reify(b).pow(a));
var band = curry((a, b) => reify(b).band(a));
var bor = curry((a, b) => reify(b).bor(a));
var bxor = curry((a, b) => reify(b).bxor(a));
var blshift = curry((a, b) => reify(b).blshift(a));
var brshift = curry((a, b) => reify(b).brshift(a));
var lt = curry((a, b) => reify(b).lt(a));
var gt = curry((a, b) => reify(b).gt(a));
var lte = curry((a, b) => reify(b).lte(a));
var gte = curry((a, b) => reify(b).gte(a));
var eq = curry((a, b) => reify(b).eq(a));
var eqt = curry((a, b) => reify(b).eqt(a));
var ne = curry((a, b) => reify(b).ne(a));
var net = curry((a, b) => reify(b).net(a));
var and = curry((a, b) => reify(b).and(a));
var or = curry((a, b) => reify(b).or(a));
var func = curry((a, b) => reify(b).func(a));
function register(name, func2, patternify = true, preserveSteps = false, join = (x) => x.innerJoin()) {
  if (isPattern(name)) {
    throw new Error(
      `Name argument for register is a pattern, try using single quotes ('name') instead of double quotes ("name")`
    );
  }
  if (Array.isArray(name)) {
    const result = {};
    for (const name_item of name) {
      result[name_item] = register(name_item, func2, patternify, preserveSteps, join);
    }
    return result;
  }
  const arity = func2.length;
  var pfunc;
  if (patternify) {
    pfunc = function(...args) {
      args = args.map(reify);
      const pat = args[args.length - 1];
      let result;
      if (arity === 1) {
        result = func2(pat);
      } else {
        const firstArgs = args.slice(0, -1);
        if (firstArgs.every((arg) => arg.__pure != void 0)) {
          const pureArgs = firstArgs.map((arg) => arg.__pure);
          const pureLocs = firstArgs.filter((arg) => arg.__pure_loc).map((arg) => arg.__pure_loc);
          result = func2(...pureArgs, pat);
          result = result.withContext((context) => {
            const locations = (context.locations || []).concat(pureLocs);
            return { ...context, locations };
          });
        } else {
          const [left2, ...right2] = firstArgs;
          let mapFn = (...args2) => {
            return func2(...args2, pat);
          };
          mapFn = curry(mapFn, null, arity - 1);
          result = join(right2.reduce((acc, p) => acc.appLeft(p), left2.fmap(mapFn)));
        }
      }
      if (preserveSteps) {
        result._steps = pat._steps;
      }
      return result;
    };
  } else {
    pfunc = function(...args) {
      args = args.map(reify);
      const result = func2(...args);
      if (preserveSteps) {
        result._steps = args[args.length - 1]._steps;
      }
      return result;
    };
  }
  Pattern.prototype[name] = function(...args) {
    if (arity === 2 && args.length !== 1) {
      args = [sequence(...args)];
    } else if (arity !== args.length + 1) {
      throw new Error(`.${name}() expects ${arity - 1} inputs but got ${args.length}.`);
    }
    args = args.map(reify);
    return pfunc(...args, this);
  };
  if (arity > 1) {
    Pattern.prototype["_" + name] = function(...args) {
      const result = func2(...args, this);
      if (preserveSteps) {
        result.setSteps(this._steps);
      }
      return result;
    };
  }
  const curried = curry(pfunc, null, arity);
  strudelScope[name] = curried;
  return curried;
}
function stepRegister(name, func2, patternify = true, preserveSteps = false, join = (x) => x.stepJoin()) {
  return register(name, func2, patternify, preserveSteps, join);
}
var round = register("round", function(pat) {
  return pat.asNumber().fmap((v2) => Math.round(v2));
});
var floor = register("floor", function(pat) {
  return pat.asNumber().fmap((v2) => Math.floor(v2));
});
var log2 = register("log2", (pat) => pat.asNumber().fmap((v2) => Math.log2(v2)));
var ceil = register("ceil", function(pat) {
  return pat.asNumber().fmap((v2) => Math.ceil(v2));
});
var toBipolar = register("toBipolar", function(pat) {
  return pat.fmap((x) => x * 2 - 1);
});
var fromBipolar = register("fromBipolar", function(pat) {
  return pat.fmap((x) => (x + 1) / 2);
});
var range = register("range", function(min, max, pat) {
  return pat.mul(max - min).add(min);
});
var rangex = register("rangex", function(min, max, pat) {
  return pat._range(Math.log(min), Math.log(max)).fmap(Math.exp);
});
var range2 = register("range2", function(min, max, pat) {
  return pat.fromBipolar()._range(min, max);
});
var ratio = register(
  "ratio",
  (pat) => pat.fmap((v2) => {
    if (!Array.isArray(v2)) {
      return v2;
    }
    return v2.slice(1).reduce((acc, n2) => acc / n2, v2[0]);
  })
);
var compress = register("compress", function(b, e, pat) {
  b = fraction_default(b);
  e = fraction_default(e);
  if (b.gt(e) || b.gt(1) || e.gt(1) || b.lt(0) || e.lt(0)) {
    return silence;
  }
  return pat._fastGap(fraction_default(1).div(e.sub(b)))._late(b);
});
var { compressSpan, compressspan } = register(["compressSpan", "compressspan"], function(span, pat) {
  return pat._compress(span.begin, span.end);
});
var { fastGap, fastgap } = register(["fastGap", "fastgap"], function(factor, pat) {
  const qf = function(span) {
    const cycle = span.begin.sam();
    const bpos = span.begin.sub(cycle).mul(factor).min(1);
    const epos = span.end.sub(cycle).mul(factor).min(1);
    if (bpos >= 1) {
      return void 0;
    }
    return new timespan_default(cycle.add(bpos), cycle.add(epos));
  };
  const ef = function(hap) {
    const begin2 = hap.part.begin;
    const end2 = hap.part.end;
    const cycle = begin2.sam();
    const beginPos = begin2.sub(cycle).div(factor).min(1);
    const endPos = end2.sub(cycle).div(factor).min(1);
    const newPart = new timespan_default(cycle.add(beginPos), cycle.add(endPos));
    const newWhole = !hap.whole ? void 0 : new timespan_default(
      newPart.begin.sub(begin2.sub(hap.whole.begin).div(factor)),
      newPart.end.add(hap.whole.end.sub(end2).div(factor))
    );
    return new hap_default(newWhole, newPart, hap.value, hap.context);
  };
  return pat.withQuerySpanMaybe(qf).withHap(ef).splitQueries();
});
var focus = register("focus", function(b, e, pat) {
  b = fraction_default(b);
  e = fraction_default(e);
  return pat._early(b.sam())._fast(fraction_default(1).div(e.sub(b)))._late(b);
});
var { focusSpan, focusspan } = register(["focusSpan", "focusspan"], function(span, pat) {
  return pat._focus(span.begin, span.end);
});
var ply = register("ply", function(factor, pat) {
  const result = pat.fmap((x) => pure(x)._fast(factor)).squeezeJoin();
  if (__steps) {
    result._steps = fraction_default(factor).mulmaybe(pat._steps);
  }
  return result;
});
var { fast, density } = register(
  ["fast", "density"],
  function(factor, pat) {
    if (factor === 0) {
      return silence;
    }
    factor = fraction_default(factor);
    const fastQuery = pat.withQueryTime((t) => t.mul(factor));
    return fastQuery.withHapTime((t) => t.div(factor)).setSteps(pat._steps);
  },
  true,
  true
);
var hurry = register("hurry", function(r, pat) {
  return pat._fast(r).mul(pure({ speed: r }));
});
var { slow, sparsity } = register(["slow", "sparsity"], function(factor, pat) {
  if (factor === 0) {
    return silence;
  }
  return pat._fast(fraction_default(1).div(factor));
});
var inside = register("inside", function(factor, f, pat) {
  return f(pat._slow(factor))._fast(factor);
});
var outside = register("outside", function(factor, f, pat) {
  return f(pat._fast(factor))._slow(factor);
});
var lastOf = register("lastOf", function(n2, func2, pat) {
  const pats = Array(n2 - 1).fill(pat);
  pats.push(func2(pat));
  return slowcatPrime(...pats);
});
var { firstOf, every } = register(["firstOf", "every"], function(n2, func2, pat) {
  const pats = Array(n2 - 1).fill(pat);
  pats.unshift(func2(pat));
  return slowcatPrime(...pats);
});
var apply = register("apply", function(func2, pat) {
  return func2(pat);
});
var cpm = register("cpm", function(cpm2, pat) {
  return pat._fast(cpm2 / 60 / 1);
});
var early = register(
  "early",
  function(offset2, pat) {
    offset2 = fraction_default(offset2);
    return pat.withQueryTime((t) => t.add(offset2)).withHapTime((t) => t.sub(offset2));
  },
  true,
  true
);
var late = register(
  "late",
  function(offset2, pat) {
    offset2 = fraction_default(offset2);
    return pat._early(fraction_default(0).sub(offset2));
  },
  true,
  true
);
var zoom = register("zoom", function(s2, e, pat) {
  e = fraction_default(e);
  s2 = fraction_default(s2);
  if (s2.gte(e)) {
    return nothing;
  }
  const d = e.sub(s2);
  const steps2 = __steps ? pat._steps?.mulmaybe(d) : void 0;
  return pat.withQuerySpan((span) => span.withCycle((t) => t.mul(d).add(s2))).withHapSpan((span) => span.withCycle((t) => t.sub(s2).div(d))).splitQueries().setSteps(steps2);
});
var { zoomArc, zoomarc } = register(["zoomArc", "zoomarc"], function(a, pat) {
  return pat.zoom(a.begin, a.end);
});
var bite = register(
  "bite",
  (npat, ipat, pat) => {
    return ipat.fmap((i2) => (n2) => {
      const a = fraction_default(i2).div(n2).mod(1);
      const b = a.add(fraction_default(1).div(n2));
      return pat.zoom(a, b);
    }).appLeft(npat).squeezeJoin();
  },
  false
);
var linger = register(
  "linger",
  function(t, pat) {
    if (t == 0) {
      return silence;
    } else if (t < 0) {
      return pat._zoom(t.add(1), 1)._slow(t);
    }
    return pat._zoom(0, t)._slow(t);
  },
  true,
  true
);
var { segment, seg } = register(["segment", "seg"], function(rate, pat) {
  return pat.struct(pure(true)._fast(rate)).setSteps(rate);
});
var swingBy = register("swingBy", (swing2, n2, pat) => pat.inside(n2, late(seq(0, swing2 / 2))));
var swing = register("swing", (n2, pat) => pat.swingBy(1 / 3, n2));
var { invert, inv } = register(
  ["invert", "inv"],
  function(pat) {
    return pat.fmap((x) => !x);
  },
  true,
  true
);
var when = register("when", function(on, func2, pat) {
  return on ? func2(pat) : pat;
});
var off = register("off", function(time_pat, func2, pat) {
  return stack(pat, func2(pat.late(time_pat)));
});
var brak = register("brak", function(pat) {
  return pat.when(slowcat(false, true), (x) => fastcat(x, silence)._late(0.25));
});
var rev = register(
  "rev",
  function(pat) {
    const query = function(state) {
      const span = state.span;
      const cycle = span.begin.sam();
      const next_cycle = span.begin.nextSam();
      const reflect = function(to_reflect) {
        const reflected = to_reflect.withTime((time3) => cycle.add(next_cycle.sub(time3)));
        const tmp = reflected.begin;
        reflected.begin = reflected.end;
        reflected.end = tmp;
        return reflected;
      };
      const haps = pat.query(state.setSpan(reflect(span)));
      return haps.map((hap) => hap.withSpan(reflect));
    };
    return new Pattern(query).splitQueries();
  },
  false,
  true
);
var revv = register("revv", function(pat) {
  const negateSpan = (span) => new timespan_default(fraction_default(0).sub(span.end), fraction_default(0).sub(span.begin));
  return pat.withQuerySpan(negateSpan).withHapSpan(negateSpan);
});
var pressBy = register("pressBy", function(r, pat) {
  return pat.fmap((x) => pure(x).compress(r, 1)).squeezeJoin();
});
var press = register("press", function(pat) {
  return pat._pressBy(0.5);
});
Pattern.prototype.hush = function() {
  return silence;
};
var palindrome = register(
  "palindrome",
  function(pat) {
    return pat.lastOf(2, rev);
  },
  true,
  true
);
var { juxBy, juxby } = register(["juxBy", "juxby"], function(by, func2, pat) {
  by /= 2;
  const elem_or = function(dict2, key, dflt) {
    if (key in dict2) {
      return dict2[key];
    }
    return dflt;
  };
  const left2 = pat.withValue((val2) => Object.assign({}, val2, { pan: elem_or(val2, "pan", 0.5) - by }));
  const right2 = func2(pat.withValue((val2) => Object.assign({}, val2, { pan: elem_or(val2, "pan", 0.5) + by })));
  return stack(left2, right2).setSteps(__steps ? lcm(left2._steps, right2._steps) : void 0);
});
var { juxFlipBy, juxflipby, fluxBy, fluxby } = register(
  ["juxFlipBy", "juxflipby", "fluxBy", "fluxby"],
  function(by, func2, pat) {
    return pat.juxBy(slowcat(by, -by), func2);
  }
);
var jux = register("jux", function(func2, pat) {
  return pat._juxBy(1, func2, pat);
});
var { juxFlip, flux } = register(["juxFlip", "juxflip", "flux"], function(func2, pat) {
  return pat._juxFlipBy(1, func2, pat);
});
var { echoWith, echowith, stutWith, stutwith } = register(
  ["echoWith", "echowith", "stutWith", "stutwith"],
  function(times, time3, func2, pat) {
    return stack(...listRange(0, times - 1).map((i2) => func2(pat.late(fraction_default(time3).mul(i2)), i2)));
  }
);
var echo = register("echo", function(times, time3, feedback, pat) {
  return pat._echoWith(times, time3, (pat2, i2) => pat2.gain(Math.pow(feedback, i2)));
});
var stut = register("stut", function(times, feedback, time3, pat) {
  return pat._echoWith(times, time3, (pat2, i2) => pat2.gain(Math.pow(feedback, i2)));
});
var applyN = register("applyN", function(n2, func2, p) {
  let result = p;
  for (let i2 = 0; i2 < n2; i2++) {
    result = func2(result);
  }
  return result;
});
var plyWith = register(["plyWith", "plywith"], function(factor, func2, pat) {
  const result = pat.fmap((x) => cat(...listRange(0, factor - 1).map((i2) => applyN(i2, func2, x)))._fast(factor)).squeezeJoin();
  if (__steps) {
    result._steps = fraction_default(factor).mulmaybe(pat._steps);
  }
  return result;
});
var plyForEach = register(["plyForEach", "plyforeach"], function(factor, func2, pat) {
  const result = pat.fmap((x) => cat(cat(pure(x), ...listRange(1, factor - 1).map((i2) => func2(pure(x), i2))))._fast(factor)).squeezeJoin();
  if (__steps) {
    result._steps = fraction_default(factor).mulmaybe(pat._steps);
  }
  return result;
});
var _iter = function(times, pat, back = false) {
  times = fraction_default(times);
  return slowcat(
    ...listRange(0, times.sub(1)).map(
      (i2) => back ? pat.late(fraction_default(i2).div(times)) : pat.early(fraction_default(i2).div(times))
    )
  );
};
var iter = register(
  "iter",
  function(times, pat) {
    return _iter(times, pat, false);
  },
  true,
  true
);
var { iterBack, iterback } = register(
  ["iterBack", "iterback"],
  function(times, pat) {
    return _iter(times, pat, true);
  },
  true,
  true
);
var { repeatCycles } = register(
  "repeatCycles",
  function(n2, pat) {
    return new Pattern(function(state) {
      const cycle = state.span.begin.sam();
      const source_cycle = cycle.div(n2).sam();
      const delta = cycle.sub(source_cycle);
      state = state.withSpan((span) => span.withTime((spant) => spant.sub(delta)));
      return pat.query(state).map((hap) => hap.withSpan((span) => span.withTime((spant) => spant.add(delta))));
    }).splitQueries();
  },
  true,
  true
);
var _chunk = function(n2, func2, pat, back = false, fast2 = false) {
  const binary2 = Array(n2 - 1).fill(false);
  binary2.unshift(true);
  const binary_pat = _iter(n2, sequence(...binary2), !back);
  if (!fast2) {
    pat = pat.repeatCycles(n2);
  }
  return pat.when(binary_pat, func2);
};
var { chunk, slowchunk, slowChunk } = register(
  ["chunk", "slowchunk", "slowChunk"],
  function(n2, func2, pat) {
    return _chunk(n2, func2, pat, false, false);
  },
  true,
  true
);
var { chunkBack, chunkback } = register(
  ["chunkBack", "chunkback"],
  function(n2, func2, pat) {
    return _chunk(n2, func2, pat, true);
  },
  true,
  true
);
var { fastchunk, fastChunk } = register(
  ["fastchunk", "fastChunk"],
  function(n2, func2, pat) {
    return _chunk(n2, func2, pat, false, true);
  },
  true,
  true
);
var { chunkinto, chunkInto } = register(["chunkinto", "chunkInto"], function(n2, func2, pat) {
  return pat.into(fastcat(true, ...Array(n2 - 1).fill(false))._iterback(n2), func2);
});
var { chunkbackinto, chunkBackInto } = register(["chunkbackinto", "chunkBackInto"], function(n2, func2, pat) {
  return pat.into(
    fastcat(true, ...Array(n2 - 1).fill(false))._iter(n2)._early(1),
    func2
  );
});
var bypass = register(
  "bypass",
  function(on, pat) {
    on = Boolean(parseInt(on));
    return on ? silence : pat;
  },
  true,
  true
);
var { ribbon, rib } = register(
  ["ribbon", "rib"],
  (offset2, cycles, pat) => pat.early(offset2).restart(pure(1).slow(cycles))
);
var hsla = register("hsla", (h, s2, l, a, pat) => {
  return pat.color(`hsla(${h}turn,${s2 * 100}%,${l * 100}%,${a})`);
});
var hsl = register("hsl", (h, s2, l, pat) => {
  return pat.color(`hsl(${h}turn,${s2 * 100}%,${l * 100}%)`);
});
Pattern.prototype.tag = function(tag) {
  return this.withContext((ctx) => ({ ...ctx, tags: (ctx.tags || []).concat([tag]) }));
};
var filter = register("filter", (test, pat) => pat.withHaps((haps) => haps.filter(test)));
var filterWhen = register("filterWhen", (test, pat) => pat.filter((h) => test(h.whole.begin)));
var within = register(
  "within",
  (a, b, fn, pat) => stack(
    fn(pat.filterWhen((t) => t.cyclePos() >= a && t.cyclePos() <= b)),
    pat.filterWhen((t) => t.cyclePos() < a || t.cyclePos() > b)
  )
);
Pattern.prototype.stepJoin = function() {
  const pp = this;
  const first_t = stepcat(..._retime(_slices(pp.queryArc(0, 1))))._steps;
  const q = function(state) {
    const shifted = pp.early(state.span.begin.sam());
    const haps = shifted.query(state.setSpan(new timespan_default(fraction_default(0), fraction_default(1))));
    const pat = stepcat(..._retime(_slices(haps)));
    return pat.query(state);
  };
  return new Pattern(q, first_t);
};
Pattern.prototype.stepBind = function(func2) {
  return this.fmap(func2).stepJoin();
};
function _retime(timedHaps) {
  const occupied_perc = timedHaps.filter((t, pat) => pat.hasSteps).reduce((a, b) => a.add(b), fraction_default(0));
  const occupied_steps = removeUndefineds(timedHaps.map((t, pat) => pat._steps)).reduce(
    (a, b) => a.add(b),
    fraction_default(0)
  );
  const total_steps = occupied_perc.eq(0) ? void 0 : occupied_steps.div(occupied_perc);
  function adjust(dur2, pat) {
    if (pat._steps === void 0) {
      return [dur2.mulmaybe(total_steps), pat];
    }
    return [pat._steps, pat];
  }
  return timedHaps.map((x) => adjust(...x));
}
function _slices(haps) {
  const breakpoints = flatten(haps.map((hap) => [hap.part.begin, hap.part.end]));
  const unique = uniqsortr([fraction_default(0), fraction_default(1), ...breakpoints]);
  const slicespans = pairs(unique);
  return slicespans.map((s2) => [
    s2[1].sub(s2[0]),
    stack(..._fitslice(new timespan_default(...s2), haps).map((x) => x.value.withHap((h) => h.setContext(h.combineContext(x)))))
  ]);
}
function _fitslice(span, haps) {
  return removeUndefineds(haps.map((hap) => _match(span, hap)));
}
function _match(span, hap_p) {
  const subspan = span.intersection(hap_p.part);
  if (subspan == void 0) {
    return void 0;
  }
  return new hap_default(hap_p.whole, subspan, hap_p.value, hap_p.context);
}
var pace = register("pace", function(targetSteps, pat) {
  if (pat._steps === void 0) {
    return pat;
  }
  if (pat._steps.eq(fraction_default(0))) {
    return nothing;
  }
  return pat._fast(fraction_default(targetSteps).div(pat._steps)).setSteps(targetSteps);
});
function _polymeterListSteps(steps2, ...args) {
  const seqs = args.map((a) => _sequenceCount(a));
  if (seqs.length == 0) {
    return silence;
  }
  if (steps2 == 0) {
    steps2 = seqs[0][1];
  }
  const pats = [];
  for (const seq2 of seqs) {
    if (seq2[1] == 0) {
      continue;
    }
    if (steps2 == seq2[1]) {
      pats.push(seq2[0]);
    } else {
      pats.push(seq2[0]._fast(fraction_default(steps2).div(fraction_default(seq2[1]))));
    }
  }
  return stack(...pats);
}
function polymeter(...args) {
  if (Array.isArray(args[0])) {
    return _polymeterListSteps(0, ...args);
  }
  args = args.filter((arg) => arg.hasSteps);
  if (args.length == 0) {
    return silence;
  }
  const steps2 = lcm(...args.map((x) => x._steps));
  if (steps2.eq(fraction_default(0))) {
    return nothing;
  }
  const result = stack(...args.map((x) => x.pace(steps2)));
  result._steps = steps2;
  return result;
}
function stepcat(...timepats) {
  if (timepats.length === 0) {
    return nothing;
  }
  const findsteps = (x) => Array.isArray(x) ? x : [x._steps ?? 1, x];
  timepats = timepats.map(findsteps);
  if (timepats.find((x) => x[0] === void 0)) {
    const times = timepats.map((a) => a[0]).filter((x) => x !== void 0);
    if (times.length === 0) {
      return fastcat(...timepats.map((x) => x[1]));
    }
    if (times.length === timepats.length) {
      return nothing;
    }
    const avg = times.reduce((a, b) => a.add(b), fraction_default(0)).div(times.length);
    for (let timepat of timepats) {
      if (timepat[0] === void 0) {
        timepat[0] = avg;
      }
    }
  }
  if (timepats.length == 1) {
    const result2 = reify(timepats[0][1]);
    return result2.withSteps((_) => timepats[0][0]);
  }
  const total = timepats.map((a) => a[0]).reduce((a, b) => a.add(b), fraction_default(0));
  let begin2 = fraction_default(0);
  const pats = [];
  for (const [time3, pat] of timepats) {
    if (fraction_default(time3).eq(0)) {
      continue;
    }
    const end2 = begin2.add(time3);
    pats.push(reify(pat)._compress(begin2.div(total), end2.div(total)));
    begin2 = end2;
  }
  const result = stack(...pats);
  result._steps = total;
  return result;
}
function stepalt(...groups) {
  groups = groups.map((a) => Array.isArray(a) ? a.map(reify) : [reify(a)]);
  const cycles = lcm(...groups.map((x) => fraction_default(x.length)));
  let result = [];
  for (let cycle = 0; cycle < cycles; ++cycle) {
    result.push(...groups.map((x) => x.length == 0 ? silence : x[cycle % x.length]));
  }
  result = result.filter((x) => x.hasSteps && x._steps > 0);
  const steps2 = result.reduce((a, b) => a.add(b._steps), fraction_default(0));
  result = stepcat(...result);
  result._steps = steps2;
  return result;
}
var take = stepRegister("take", function(i2, pat) {
  if (!pat.hasSteps) {
    return nothing;
  }
  if (pat._steps.lte(0)) {
    return nothing;
  }
  i2 = fraction_default(i2);
  if (i2.eq(0)) {
    return nothing;
  }
  const flip = i2 < 0;
  if (flip) {
    i2 = i2.abs();
  }
  const frac = i2.div(pat._steps);
  if (frac.lte(0)) {
    return nothing;
  }
  if (frac.gte(1)) {
    return pat;
  }
  if (flip) {
    return pat.zoom(fraction_default(1).sub(frac), 1);
  }
  return pat.zoom(0, frac);
});
var drop = stepRegister("drop", function(i2, pat) {
  if (!pat.hasSteps) {
    return nothing;
  }
  i2 = fraction_default(i2);
  if (i2.lt(0)) {
    return pat.take(pat._steps.add(i2));
  }
  return pat.take(fraction_default(0).sub(pat._steps.sub(i2)));
});
var extend = stepRegister("extend", function(factor, pat) {
  return pat.fast(factor).expand(factor);
});
var replicate = stepRegister("replicate", function(factor, pat) {
  return pat.repeatCycles(factor).fast(factor).expand(factor);
});
var expand = stepRegister("expand", function(factor, pat) {
  return pat.withSteps((t) => t.mul(fraction_default(factor)));
});
var contract = stepRegister("contract", function(factor, pat) {
  return pat.withSteps((t) => t.div(fraction_default(factor)));
});
Pattern.prototype.shrinklist = function(amount) {
  const pat = this;
  if (!pat.hasSteps) {
    return [pat];
  }
  let [amountv, times] = Array.isArray(amount) ? amount : [amount, pat._steps];
  amountv = fraction_default(amountv);
  if (times === 0 || amountv === 0) {
    return [pat];
  }
  const fromstart = amountv > 0;
  const ranges = [];
  if (fromstart) {
    const seg2 = fraction_default(1).div(pat._steps).mul(amountv);
    for (let i2 = 0; i2 < times; ++i2) {
      const s2 = seg2.mul(i2);
      if (s2.gt(1)) {
        break;
      }
      ranges.push([s2, 1]);
    }
  } else {
    amountv = fraction_default(0).sub(amountv);
    const seg2 = fraction_default(1).div(pat._steps).mul(amountv);
    for (let i2 = 0; i2 < times; ++i2) {
      const e = fraction_default(1).sub(seg2.mul(i2));
      if (e.lt(0)) {
        break;
      }
      ranges.push([fraction_default(0), e]);
    }
  }
  return ranges.map((x) => pat.zoom(...x));
};
var shrinklist = (amount, pat) => pat.shrinklist(amount);
Pattern.prototype.growlist = function(amount) {
  return this.shrinklist(amount).reverse();
};
var growlist = (amount, pat) => pat.growlist(amount);
var shrink = register(
  "shrink",
  function(amount, pat) {
    if (!pat.hasSteps) {
      return nothing;
    }
    const list = pat.shrinklist(amount);
    const result = stepcat(...list);
    result._steps = list.reduce((a, b) => a.add(b._steps), fraction_default(0));
    return result;
  },
  true,
  false,
  (x) => x.stepJoin()
);
var grow = register(
  "grow",
  function(amount, pat) {
    if (!pat.hasSteps) {
      return nothing;
    }
    const list = pat.shrinklist(fraction_default(0).sub(amount));
    list.reverse();
    const result = stepcat(...list);
    result._steps = list.reduce((a, b) => a.add(b._steps), fraction_default(0));
    return result;
  },
  true,
  false,
  (x) => x.stepJoin()
);
var tour = function(pat, ...many) {
  return pat.tour(...many);
};
Pattern.prototype.tour = function(...many) {
  return stepcat(
    ...[].concat(
      ...many.map((x, i2) => [...many.slice(0, many.length - i2), this, ...many.slice(many.length - i2)]),
      this,
      ...many
    )
  );
};
var zip = function(...pats) {
  pats = pats.filter((pat) => pat.hasSteps);
  const zipped = slowcat(...pats.map((pat) => pat._slow(pat._steps)));
  const steps2 = lcm(...pats.map((x) => x._steps));
  return zipped._fast(steps2).setSteps(steps2);
};
var timecat = stepcat;
var timeCat = stepcat;
var s_cat = stepcat;
var s_alt = stepalt;
var s_polymeter = polymeter;
Pattern.prototype.s_polymeter = Pattern.prototype.polymeter;
var s_taper = shrink;
Pattern.prototype.s_taper = Pattern.prototype.shrink;
var s_taperlist = shrinklist;
Pattern.prototype.s_taperlist = Pattern.prototype.shrinklist;
var s_add = take;
Pattern.prototype.s_add = Pattern.prototype.take;
var s_sub = drop;
Pattern.prototype.s_sub = Pattern.prototype.drop;
var s_expand = expand;
Pattern.prototype.s_expand = Pattern.prototype.expand;
var s_extend = extend;
Pattern.prototype.s_extend = Pattern.prototype.extend;
var s_contract = contract;
Pattern.prototype.s_contract = Pattern.prototype.contract;
var s_tour = tour;
Pattern.prototype.s_tour = Pattern.prototype.tour;
var s_zip = zip;
Pattern.prototype.s_zip = Pattern.prototype.zip;
var steps = pace;
Pattern.prototype.steps = Pattern.prototype.pace;
var chop = register("chop", function(n2, pat) {
  const slices = Array.from({ length: n2 }, (x, i2) => i2);
  const slice_objects = slices.map((i2) => ({ begin: i2 / n2, end: (i2 + 1) / n2 }));
  const merge = function(a, b) {
    if ("begin" in a && "end" in a && a.begin !== void 0 && a.end !== void 0) {
      const d = a.end - a.begin;
      b = { begin: a.begin + b.begin * d, end: a.begin + b.end * d };
    }
    return Object.assign({}, a, b);
  };
  const func2 = function(o) {
    return sequence(slice_objects.map((slice_o) => merge(o, slice_o)));
  };
  return pat.squeezeBind(func2).setSteps(__steps ? fraction_default(n2).mulmaybe(pat._steps) : void 0);
});
var striate = register("striate", function(n2, pat) {
  const slices = Array.from({ length: n2 }, (x, i2) => i2);
  const slice_objects = slices.map((i2) => ({ begin: i2 / n2, end: (i2 + 1) / n2 }));
  const slicePat = slowcat(...slice_objects);
  return pat.set(slicePat)._fast(n2).setSteps(__steps ? fraction_default(n2).mulmaybe(pat._steps) : void 0);
});
var _loopAt = function(factor, pat, cps2 = 0.5) {
  return pat.speed(1 / factor * cps2).unit("c").slow(factor);
};
var { loopAt, loopat } = register(["loopAt", "loopat"], function(factor, pat) {
  const steps2 = pat._steps ? pat._steps.div(factor) : void 0;
  return new Pattern((state) => _loopAt(factor, pat, state.controls._cps).query(state), steps2);
});
var slice = register(
  "slice",
  function(npat, ipat, opat) {
    return npat.innerBind(
      (n2) => ipat.outerBind(
        (i2) => opat.outerBind((o) => {
          o = o instanceof Object ? o : { s: o };
          const begin2 = Array.isArray(n2) ? n2[i2] : i2 / n2;
          const end2 = Array.isArray(n2) ? n2[i2 + 1] : (i2 + 1) / n2;
          return pure({ begin: begin2, end: end2, _slices: n2, ...o });
        })
      )
    ).setSteps(ipat._steps);
  },
  false
  // turns off auto-patternification
);
Pattern.prototype.onTriggerTime = function(func2) {
  return this.onTrigger((hap, currentTime, _cps, targetTime) => {
    const diff = targetTime - currentTime;
    window.setTimeout(() => {
      func2(hap);
    }, diff * 1e3);
  }, false);
};
var splice = register(
  "splice",
  function(npat, ipat, opat) {
    const sliced = slice(npat, ipat, opat);
    return new Pattern((state) => {
      const cps2 = state.controls._cps || 1;
      const haps = sliced.query(state);
      return haps.map(
        (hap) => hap.withValue((v2) => ({
          ...{
            speed: cps2 / v2._slices / hap.whole.duration * (v2.speed || 1),
            unit: "c"
          },
          ...v2
        }))
      );
    }).setSteps(ipat._steps);
  },
  false
  // turns off auto-patternification
);
var fit = register(
  "fit",
  (pat) => pat.withHaps(
    (haps, state) => haps.map(
      (hap) => hap.withValue((v2) => {
        const slicedur = ("end" in v2 ? v2.end : 1) - ("begin" in v2 ? v2.begin : 0);
        return {
          ...v2,
          speed: (state.controls._cps || 1) / hap.whole.duration * slicedur,
          unit: "c"
        };
      })
    )
  )
);
var { loopAtCps, loopatcps } = register(["loopAtCps", "loopatcps"], function(factor, cps2, pat) {
  return _loopAt(factor, pat, cps2);
});
var ref = (accessor) => pure(1).withValue(() => reify(accessor())).innerJoin();
var fadeGain = (p) => p < 0.5 ? 1 : 1 - (p - 0.5) / 0.5;
var xfade = (a, pos, b) => {
  pos = reify(pos);
  a = reify(a);
  b = reify(b);
  let gaina = pos.fmap((v2) => ({ gain: fadeGain(v2) }));
  let gainb = pos.fmap((v2) => ({ gain: fadeGain(1 - v2) }));
  return stack(a.mul(gaina), b.mul(gainb));
};
Pattern.prototype.xfade = function(pos, b) {
  return xfade(this, pos, b);
};
var __beat = (join) => (t, div2, pat) => {
  t = fraction_default(t).mod(div2);
  div2 = fraction_default(div2);
  const b = t.div(div2);
  const e = t.add(1).div(div2);
  return join(pat.fmap((x) => pure(x)._compress(b, e)));
};
var { beat } = register(
  ["beat"],
  __beat((x) => x.innerJoin())
);
var _morph = (from, to, by) => {
  by = fraction_default(by);
  const dur2 = fraction_default(1).div(from.length);
  const positions = (list) => {
    const result = [];
    for (const [pos, value] of list.entries()) {
      if (value) {
        result.push([fraction_default(pos).div(list.length), value]);
      }
    }
    return result;
  };
  const arcs = zipWith(
    ([posa, valuea], [posb, valueb]) => {
      const b = by.mul(posb - posa).add(posa);
      const e = b.add(dur2);
      return new timespan_default(b, e);
    },
    positions(from),
    positions(to)
  );
  function query(state) {
    const cycle = state.span.begin.sam();
    const cycleArc = state.span.cycleArc();
    const result = [];
    for (const whole of arcs) {
      const part = whole.intersection(cycleArc);
      if (part !== void 0) {
        result.push(
          new hap_default(
            whole.withTime((x) => x.add(cycle)),
            part.withTime((x) => x.add(cycle)),
            true
          )
        );
      }
    }
    return result;
  }
  return new Pattern(query).splitQueries();
};
var morph = (frompat, topat, bypat) => {
  frompat = reify(frompat);
  topat = reify(topat);
  bypat = reify(bypat);
  return frompat.innerBind((from) => topat.innerBind((to) => bypat.innerBind((by) => _morph(from, to, by))));
};
var _distortWithAlg = function(name) {
  const func2 = function(args, pat) {
    const argsPat = reify(args).fmap((v2) => Array.isArray(v2) ? [...v2, name] : [v2, 1, name]);
    if (!pat) {
      return pure({}).distort(argsPat);
    }
    return pat.distort(argsPat);
  };
  Pattern.prototype[name] = function(args) {
    return func2(args, this);
  };
  return func2;
};
var soft = _distortWithAlg("soft");
var hard = _distortWithAlg("hard");
var cubic = _distortWithAlg("cubic");
var diode = _distortWithAlg("diode");
var asym = _distortWithAlg("asym");
var fold = _distortWithAlg("fold");
var sinefold = _distortWithAlg("sinefold");
var chebyshev = _distortWithAlg("chebyshev");
var parray = (pats) => {
  const pack = (...xs) => xs;
  let acc = pure(curry(pack, null, pats.length));
  for (const p of pats) acc = acc.appBoth(reify(p));
  return acc;
};
var _ensureListPattern = (list) => {
  if (Array.isArray(list)) {
    return parray(list);
  }
  return reify(list);
};
Pattern.prototype.partials = function(list) {
  return this.withValue((v2) => (l) => ({ ...v2, partials: l })).appLeft(_ensureListPattern(list));
};
var partials = (list) => {
  return _ensureListPattern(list).as("partials");
};
Pattern.prototype.phases = function(list) {
  return this.withValue((v2) => (l) => ({ ...v2, phases: l })).appLeft(_ensureListPattern(list));
};
var phases = (list) => {
  return _ensureListPattern(list).as("phases");
};
Pattern.prototype.FX = function(...effects) {
  effects = effects.map(reify);
  return this.withValue((v2) => (vEff) => {
    const currFX = v2.FX ?? [];
    return { ...v2, FX: currFX.concat(vEff) };
  }).appLeft(parray(effects));
};
var _asArrayPattern = (pats) => {
  const pack = (...xs) => xs;
  let acc = pure(curry(pack, null, pats.length));
  for (const p of pats) acc = acc.appLeft(p);
  return acc;
};
Pattern.prototype.worklet = function(src2, ...inputs) {
  inputs = inputs.map(reify);
  return this.outerBind((v2) => {
    return _asArrayPattern(inputs).withValue((vInput) => {
      const currInputs = v2.workletInputs ?? [];
      return { ...v2, workletSrc: src2, workletInputs: currInputs.concat(vInput) };
    });
  });
};
var worklet = (...args) => pure({}).worklet(...args);
var base = (n2, b = 10, d = 0) => {
  if (Array.isArray(n2)) {
    n2 = sequence(n2);
  }
  n2 = reify(n2);
  b = reify(b);
  d = reify(d);
  return d.withValue((e) => {
    return b.withValue((c) => {
      return n2.withValue((v2) => {
        let digits = [];
        let value = v2;
        while (value > 0) {
          digits.unshift(value % c);
          value = Math.floor(value / c);
        }
        if (e) {
          const l = digits.length;
          if (l > e) {
            digits = digits.slice(-1 * e);
          }
        }
        return sequence(digits);
      }).squeezeJoin();
    }).squeezeJoin();
  }).squeezeJoin();
};

// strudel/packages/core/controls.mjs
function createParam(names) {
  let isMulti = Array.isArray(names);
  names = !isMulti ? [names] : names;
  const name = names[0];
  const withVal = (xs) => {
    let bag;
    if (typeof xs === "object" && xs.value !== void 0) {
      bag = { ...xs };
      xs = xs.value;
      delete bag.value;
    }
    if (isMulti && Array.isArray(xs)) {
      const result = bag || {};
      xs.forEach((x, i2) => {
        if (i2 < names.length) {
          result[names[i2]] = x;
        }
      });
      return result;
    } else if (bag) {
      bag[name] = xs;
      return bag;
    } else {
      return { [name]: xs };
    }
  };
  const func2 = function(value, pat) {
    if (!pat) {
      return reify(value).withValue(withVal);
    }
    if (typeof value === "undefined") {
      return pat.fmap(withVal);
    }
    return pat.set(reify(value).withValue(withVal));
  };
  Pattern.prototype[name] = function(value) {
    return func2(value, this);
  };
  return func2;
}
var controlAlias = /* @__PURE__ */ new Map();
function isControlName(name) {
  return controlAlias.has(name);
}
function registerControl(names, ...aliases) {
  const name = Array.isArray(names) ? names[0] : names;
  let bag = {};
  bag[name] = createParam(names);
  controlAlias.set(name, name);
  aliases.forEach((alias) => {
    bag[alias] = bag[name];
    controlAlias.set(alias, name);
    Pattern.prototype[alias] = Pattern.prototype[name];
  });
  return bag;
}
function registerMultiControl(names, maxControls, ...aliases) {
  names = Array.isArray(names) ? names : [names];
  let bag = {};
  for (let i2 = 1; i2 <= maxControls; i2++) {
    let theseAliases = [...aliases];
    let theseNames = [...names];
    if (i2 === 1) {
      const aliases1 = theseAliases.map((a) => `${a}1`);
      const names1 = theseNames.map((n2) => `${n2}1`);
      theseAliases = theseAliases.concat(aliases1).concat(names1);
    } else {
      theseAliases = theseAliases.map((a) => `${a}${i2}`);
      theseNames = theseNames.map((n2) => `${n2}${i2}`);
    }
    const subBag = registerControl(theseNames, ...theseAliases);
    bag = { ...bag, ...subBag };
  }
  return bag;
}
var { s, sound } = registerControl(["s", "n", "gain"], "sound");
var { wt, wavetablePosition } = registerControl("wt", "wavetablePosition");
var { wtenv } = registerControl("wtenv");
var { wtattack, wtatt } = registerControl("wtattack", "wtatt");
var { wtdecay, wtdec } = registerControl("wtdecay", "wtdec");
var { wtsustain, wtsus } = registerControl("wtsustain", "wtsus");
var { wtrelease, wtrel } = registerControl("wtrelease", "wtrel");
var { wtrate } = registerControl("wtrate");
var { wtsync } = registerControl("wtsync");
var { wtdepth } = registerControl("wtdepth");
var { wtshape } = registerControl("wtshape");
var { wtdc } = registerControl("wtdc");
var { wtskew } = registerControl("wtskew");
var { warp, wavetableWarp } = registerControl("warp", "wavetableWarp");
var { warpattack, warpatt } = registerControl("warpattack", "warpatt");
var { warpdecay, warpdec } = registerControl("warpdecay", "warpdec");
var { warpsustain, warpsus } = registerControl("warpsustain", "warpsus");
var { warprelease, warprel } = registerControl("warprelease", "warprel");
var { warprate } = registerControl("warprate");
var { warpdepth } = registerControl("warpdepth");
var { warpshape } = registerControl("warpshape");
var { warpdc } = registerControl("warpdc");
var { warpskew } = registerControl("warpskew");
var { warpmode, wavetableWarpMode } = registerControl("warpmode", "wavetableWarpMode");
var { wtphaserand, wavetablePhaseRand } = registerControl("wtphaserand", "wavetablePhaseRand");
var { warpenv } = registerControl("warpenv");
var { warpsync } = registerControl("warpsync");
var { source, src } = registerControl("source", "src");
var { n } = registerControl("n");
var { i } = registerControl("i");
var { note } = registerControl(["note", "n"]);
var { accelerate } = registerControl("accelerate");
var { velocity, vel } = registerControl("velocity", "vel");
var { gain } = registerControl("gain");
var { postgain } = registerControl("postgain");
var { amp } = registerControl("amp");
var { fmh, fmh1, fmh2, fmh3, fmh4, fmh5, fmh6, fmh7, fmh8 } = registerMultiControl(["fmh", "fmi"], 8, "fmh");
var { fmi, fmi1, fmi2, fmi3, fmi4, fmi5, fmi6, fmi7, fmi8, fm, fm1, fm2, fm3, fm4, fm5, fm6, fm7, fm8 } = registerMultiControl(["fmi", "fmh"], 8, "fm");
var { fmenv, fmenv1, fmenv2, fmenv3, fmenv4, fmenv5, fmenv6, fmenv7, fmenv8, fme } = registerMultiControl(
  "fmenv",
  8,
  "fme"
);
var {
  fmattack,
  fmattack1,
  fmattack2,
  fmattack3,
  fmattack4,
  fmattack5,
  fmattack6,
  fmattack7,
  fmattack8,
  fmatt,
  fmatt1,
  fmatt2,
  fmatt3,
  fmatt4,
  fmatt5,
  fmatt6,
  fmatt7,
  fmatt8
} = registerMultiControl("fmattack", 8, "fmatt");
var { fmwave, fmwave1, fmwave2, fmwave3, fmwave4, fmwave5, fmwave6, fmwave7, fmwave8 } = registerMultiControl(
  "fmwave",
  8
);
var {
  fmdecay,
  fmdecay1,
  fmdecay2,
  fmdecay3,
  fmdecay4,
  fmdecay5,
  fmdecay6,
  fmdecay7,
  fmdecay8,
  fmdec,
  fmdec1,
  fmdec2,
  fmdec3,
  fmdec4,
  fmdec5,
  fmdec6,
  fmdec7,
  fmdec8
} = registerMultiControl("fmdecay", 8, "fmdec");
var {
  fmsustain,
  fmsustain1,
  fmsustain2,
  fmsustain3,
  fmsustain4,
  fmsustain5,
  fmsustain6,
  fmsustain7,
  fmsustain8,
  fmsus,
  fmsus1,
  fmsus2,
  fmsus3,
  fmsus4,
  fmsus5,
  fmsus6,
  fmsus7,
  fmsus8
} = registerMultiControl("fmsustain", 8, "fmsus");
var {
  fmrelease,
  fmrelease1,
  fmrelease2,
  fmrelease3,
  fmrelease4,
  fmrelease5,
  fmrelease6,
  fmrelease7,
  fmrelease8,
  fmrel,
  fmrel1,
  fmrel2,
  fmrel3,
  fmrel4,
  fmrel5,
  fmrel6,
  fmrel7,
  fmrel8
} = registerMultiControl("fmrelease", 8, "fmrel");
for (let i2 = 0; i2 <= 8; i2++) {
  for (let j = 0; j <= 8; j++) {
    registerControl(`fmi${i2}${j}`, `fm${i2}${j}`);
  }
}
var { bank } = registerControl("bank");
var { chorus } = registerControl("chorus");
var { analyze } = registerControl("analyze");
var { fft } = registerControl("fft");
var { attack, att } = registerControl("attack", "att");
var { decay, dec } = registerControl("decay", "dec");
var { sustain, sus } = registerControl("sustain", "sus");
var { release, rel } = registerControl("release", "rel");
var { hold } = registerControl("hold");
var { bandf, bpf, bp } = registerControl(["bandf", "bandq", "bpenv"], "bpf", "bp");
var { bandq, bpq } = registerControl("bandq", "bpq");
var { begin } = registerControl("begin");
var { end } = registerControl("end");
var { loop } = registerControl("loop");
var { loopBegin, loopb } = registerControl("loopBegin", "loopb");
var { loopEnd, loope } = registerControl("loopEnd", "loope");
var { crush } = registerControl("crush");
var { coarse } = registerControl("coarse");
var { tremolo, trem } = registerControl(["tremolo", "tremolodepth", "tremoloskew", "tremolophase"], "trem");
var { tremolosync } = registerControl(
  ["tremolosync", "tremolodepth", "tremoloskew", "tremolophase"],
  "tremsync"
);
var { tremolodepth } = registerControl("tremolodepth", "tremdepth");
var { tremoloskew } = registerControl("tremoloskew", "tremskew");
var { tremolophase } = registerControl("tremolophase", "tremphase");
var { tremoloshape } = registerControl("tremoloshape", "tremshape");
var { drive } = registerControl("drive");
var { duck } = registerControl("duckorbit", "duck");
var { duckdepth } = registerControl("duckdepth");
var { duckonset } = registerControl("duckonset", "duckons");
var { duckattack } = registerControl("duckattack", "duckatt", "datt");
var { byteBeatExpression, bbexpr } = registerControl("byteBeatExpression", "bbexpr", "bb");
var { byteBeatStartTime, bbst } = registerControl("byteBeatStartTime", "bbst");
var { channels, ch } = registerControl("channels", "ch");
var { pw } = registerControl(["pw", "pwrate", "pwsweep"]);
var { pwrate } = registerControl("pwrate", "pwr");
var { pwsweep } = registerControl("pwsweep", "pws");
var { phaserrate, ph, phaser } = registerControl(
  ["phaserrate", "phaserdepth", "phasercenter", "phasersweep"],
  "ph",
  "phaser"
);
var { phasersweep, phs } = registerControl("phasersweep", "phs");
var { phasercenter, phc } = registerControl("phasercenter", "phc");
var { phaserdepth, phd, phasdp } = registerControl("phaserdepth", "phd", "phasdp");
var { channel } = registerControl("channel");
var { cut } = registerControl("cut");
var { cutoff, ctf, lpf, lp } = registerControl(["cutoff", "resonance", "lpenv"], "ctf", "lpf", "lp");
var { lpenv, lpe } = registerControl("lpenv", "lpe");
var { hpenv, hpe } = registerControl("hpenv", "hpe");
var { bpenv, bpe } = registerControl("bpenv", "bpe");
var { lpattack, lpa } = registerControl("lpattack", "lpa");
var { hpattack, hpa } = registerControl("hpattack", "hpa");
var { bpattack, bpa } = registerControl("bpattack", "bpa");
var { lpdecay, lpd } = registerControl("lpdecay", "lpd");
var { hpdecay, hpd } = registerControl("hpdecay", "hpd");
var { bpdecay, bpd } = registerControl("bpdecay", "bpd");
var { lpsustain, lps } = registerControl("lpsustain", "lps");
var { hpsustain, hps } = registerControl("hpsustain", "hps");
var { bpsustain, bps } = registerControl("bpsustain", "bps");
var { lprelease, lpr } = registerControl("lprelease", "lpr");
var { hprelease, hpr } = registerControl("hprelease", "hpr");
var { bprelease, bpr } = registerControl("bprelease", "bpr");
var { ftype } = registerControl("ftype");
var { fanchor } = registerControl("fanchor");
var { lprate } = registerControl("lprate");
var { lpsync } = registerControl("lpsync");
var { lpdepth } = registerControl("lpdepth");
var { lpdepthfrequency, lpdepthfreq } = registerControl("lpdepthfrequency", "lpdepthfreq");
var { lpshape } = registerControl("lpshape");
var { lpdc } = registerControl("lpdc");
var { lpskew } = registerControl("lpskew");
var { bprate } = registerControl("bprate");
var { bpsync } = registerControl("bpsync");
var { bpdepth } = registerControl("bpdepth");
var { bpdepthfrequency, bpdepthfreq } = registerControl("bpdepthfrequency", "bpdepthfreq");
var { bpshape } = registerControl("bpshape");
var { bpdc } = registerControl("bpdc");
var { bpskew } = registerControl("bpskew");
var { hprate } = registerControl("hprate");
var { hpsync } = registerControl("hpsync");
var { hpdepth } = registerControl("hpdepth");
var { hpdepthfrequency, hpdepthfreq } = registerControl("hpdepthfrequency", "hpdepthfreq");
var { hpshape } = registerControl("hpshape");
var { hpdc } = registerControl("hpdc");
var { hpskew } = registerControl("hpskew");
var { vib, vibrato, v } = registerControl(["vib", "vibmod"], "vibrato", "v");
var { noise } = registerControl("noise");
var { vibmod, vmod } = registerControl(["vibmod", "vib"], "vmod");
var { hcutoff, hpf, hp } = registerControl(["hcutoff", "hresonance", "hpenv"], "hpf", "hp");
var { hresonance, hpq } = registerControl("hresonance", "hpq");
var { resonance, lpq } = registerControl("resonance", "lpq");
var { djf } = registerControl("djf");
var { delay } = registerControl(["delay", "delaytime", "delayfeedback"]);
var { delayfeedback, delayfb, dfb } = registerControl("delayfeedback", "delayfb", "dfb");
var { delayspeed } = registerControl("delayspeed");
var { delaytime, delayt, dt } = registerControl("delaytime", "delayt", "dt");
var { delaysync } = registerControl("delaysync", "delays", "ds");
var { lock } = registerControl("lock");
var { detune, det } = registerControl("detune", "det");
var { unison } = registerControl("unison");
var { spread } = registerControl("spread");
var { dry } = registerControl("dry");
var { fadeTime, fadeOutTime } = registerControl("fadeTime", "fadeOutTime");
var { fadeInTime } = registerControl("fadeInTime");
var { freq } = registerControl("freq");
var { pattack, patt } = registerControl("pattack", "patt");
var { pdecay, pdec } = registerControl("pdecay", "pdec");
var { psustain, psus } = registerControl("psustain", "psus");
var { prelease, prel } = registerControl("prelease", "prel");
var { penv } = registerControl("penv");
var { pcurve } = registerControl("pcurve");
var { panchor } = registerControl("panchor");
var { gate, gat } = registerControl("gate", "gat");
var { leslie } = registerControl("leslie");
var { lrate } = registerControl("lrate");
var { lsize } = registerControl("lsize");
var { activeLabel } = registerControl("activeLabel");
var { label } = registerControl(["label", "activeLabel"]);
var { degree } = registerControl("degree");
var { mtranspose } = registerControl("mtranspose");
var { ctranspose } = registerControl("ctranspose");
var { harmonic } = registerControl("harmonic");
var { stepsPerOctave } = registerControl("stepsPerOctave");
var { octaveR } = registerControl("octaveR");
var { nudge } = registerControl("nudge");
var { octave, oct } = registerControl("octave", "oct");
var { orbit } = registerControl("orbit", "o");
var { bus } = registerControl("bus");
var { busgain, bgain } = registerControl("busgain", "bgain");
var { overgain } = registerControl("overgain");
var { overshape } = registerControl("overshape");
var { pan } = registerControl("pan");
var { panspan } = registerControl("panspan");
var { pansplay } = registerControl("pansplay");
var { panwidth } = registerControl("panwidth");
var { panorient } = registerControl("panorient");
var { slide } = registerControl("slide");
var { semitone } = registerControl("semitone");
var { voice } = registerControl("voice");
var { chord } = registerControl("chord");
var { dictionary, dict } = registerControl("dictionary", "dict");
var { anchor } = registerControl("anchor");
var { offset } = registerControl("offset");
var { octaves } = registerControl("octaves");
var { mode } = registerControl(["mode", "anchor"]);
var { room } = registerControl(["room", "size"]);
var { roomlp, rlp } = registerControl("roomlp", "rlp");
var { roomdim, rdim } = registerControl("roomdim", "rdim");
var { roomfade, rfade } = registerControl("roomfade", "rfade");
var { ir, iresponse } = registerControl(["ir", "i"], "iresponse");
var { irspeed } = registerControl("irspeed");
var { irbegin } = registerControl("irbegin");
var { roomsize, size, sz, rsize } = registerControl("roomsize", "size", "sz", "rsize");
var { shape } = registerControl(["shape", "shapevol"]);
var { distort, dist } = registerControl(["distort", "distortvol", "distorttype"], "dist");
var { distortvol } = registerControl("distortvol", "distvol");
var { distorttype } = registerControl("distorttype", "disttype");
var { compressor } = registerControl([
  "compressor",
  "compressorRatio",
  "compressorKnee",
  "compressorAttack",
  "compressorRelease"
]);
var { compressorKnee } = registerControl("compressorKnee");
var { compressorRatio } = registerControl("compressorRatio");
var { compressorAttack } = registerControl("compressorAttack");
var { compressorRelease } = registerControl("compressorRelease");
var { speed } = registerControl("speed");
var { stretch } = registerControl("stretch");
var { unit } = registerControl("unit");
var { squiz } = registerControl("squiz");
var { vowel } = registerControl("vowel");
var { waveloss } = registerControl("waveloss");
var { density: density2 } = registerControl("density");
var { expression } = registerControl("expression");
var { sustainpedal } = registerControl("sustainpedal");
var { fshift } = registerControl("fshift");
var { fshiftnote } = registerControl("fshiftnote");
var { fshiftphase } = registerControl("fshiftphase");
var { triode } = registerControl("triode");
var { krush } = registerControl("krush");
var { kcutoff } = registerControl("kcutoff");
var { octer } = registerControl("octer");
var { octersub } = registerControl("octersub");
var { octersubsub } = registerControl("octersubsub");
var { ring } = registerControl("ring");
var { ringf } = registerControl("ringf");
var { ringdf } = registerControl("ringdf");
var { freeze } = registerControl("freeze");
var { xsdelay } = registerControl("xsdelay");
var { tsdelay } = registerControl("tsdelay");
var { real } = registerControl("real");
var { imag } = registerControl("imag");
var { enhance } = registerControl("enhance");
var { comb } = registerControl("comb");
var { smear } = registerControl("smear");
var { scram } = registerControl("scram");
var { binshift } = registerControl("binshift");
var { hbrick } = registerControl("hbrick");
var { lbrick } = registerControl("lbrick");
var { frameRate } = registerControl("frameRate");
var { frames } = registerControl("frames");
var { hours } = registerControl("hours");
var { minutes } = registerControl("minutes");
var { seconds } = registerControl("seconds");
var { songPtr } = registerControl("songPtr");
var { uid } = registerControl("uid");
var { val } = registerControl("val");
var { cps } = registerControl("cps");
var { clip, legato } = registerControl("clip", "legato");
var { duration, dur } = registerControl("duration", "dur");
var { zrand } = registerControl("zrand");
var { curve } = registerControl("curve");
var { deltaSlide } = registerControl("deltaSlide");
var { pitchJump } = registerControl("pitchJump");
var { pitchJumpTime } = registerControl("pitchJumpTime");
var { znoise } = registerControl("znoise");
var { zmod } = registerControl("zmod");
var { zcrush } = registerControl("zcrush");
var { zdelay } = registerControl("zdelay");
var { zzfx } = registerControl("zzfx");
var { color, colour } = registerControl(["color", "colour"]);
var createParams = (...names) => names.reduce((acc, name) => Object.assign(acc, { [name]: createParam(name) }), {});
var adsr = register("adsr", (adsr2, pat) => {
  adsr2 = !Array.isArray(adsr2) ? [adsr2] : adsr2;
  const [attack2, decay2, sustain2, release2] = adsr2;
  return pat.set({ attack: attack2, decay: decay2, sustain: sustain2, release: release2 });
});
var ad = register("ad", (t, pat) => {
  t = !Array.isArray(t) ? [t] : t;
  const [attack2, decay2 = attack2] = t;
  return pat.attack(attack2).decay(decay2);
});
var ds = register("ds", (t, pat) => {
  t = !Array.isArray(t) ? [t] : t;
  const [decay2, sustain2 = 0] = t;
  return pat.set({ decay: decay2, sustain: sustain2 });
});
var ar = register("ar", (t, pat) => {
  t = !Array.isArray(t) ? [t] : t;
  const [attack2, release2 = attack2] = t;
  return pat.set({ attack: attack2, release: release2 });
});
var { midichan } = registerControl("midichan");
var { midimap } = registerControl("midimap");
var { midiport } = registerControl("midiport");
var { midicmd } = registerControl("midicmd");
var control = register("control", (args, pat) => {
  if (!Array.isArray(args)) {
    throw new Error("control expects an array of [ccn, ccv]");
  }
  const [_ccn, _ccv] = args;
  return pat.ccn(_ccn).ccv(_ccv);
});
var { ccn } = registerControl("ccn");
var { ccv } = registerControl("ccv");
var { ctlNum } = registerControl("ctlNum");
var { nrpnn } = registerControl("nrpnn");
var { nrpv } = registerControl("nrpv");
var { progNum } = registerControl("progNum");
var sysex = register("sysex", (args, pat) => {
  if (!Array.isArray(args)) {
    throw new Error("sysex expects an array of [id, data]");
  }
  const [id2, data] = args;
  return pat.sysexid(id2).sysexdata(data);
});
var { sysexid } = registerControl("sysexid");
var { sysexdata } = registerControl("sysexdata");
var { midibend } = registerControl("midibend");
var { miditouch } = registerControl("miditouch");
var { polyTouch } = registerControl("polyTouch");
var { oschost } = registerControl("oschost");
var { oscport } = registerControl("oscport");
var getControlName = (alias) => {
  if (controlAlias.has(alias)) {
    return controlAlias.get(alias);
  }
  return alias;
};
var as = register("as", (mapping, pat) => {
  mapping = Array.isArray(mapping) ? mapping : [mapping];
  return pat.fmap((v2) => {
    v2 = Array.isArray(v2) ? v2 : [v2];
    const entries = [];
    for (let i2 = 0; i2 < mapping.length; ++i2) {
      if (v2[i2] !== void 0) {
        entries.push([getControlName(mapping[i2]), v2[i2]]);
      }
    }
    return Object.fromEntries(entries);
  });
});
var scrub = register(
  "scrub",
  (beginPat, pat) => {
    return beginPat.outerBind((v2) => {
      if (!Array.isArray(v2)) {
        v2 = [v2];
      }
      const [beginVal, speedMultiplier = 1] = v2;
      return pat.begin(beginVal).mul(speed(speedMultiplier)).clip(1);
    });
  },
  false
);
var subControlAliases = /* @__PURE__ */ new Map();
var registerSubControl = (control2, subControl, ...aliases) => {
  const aliasMap = subControlAliases.get(control2) ?? /* @__PURE__ */ new Map();
  const allKeys = /* @__PURE__ */ new Set([subControl, ...aliases]);
  for (const alias of allKeys) {
    aliasMap.set(String(alias).toLowerCase(), subControl);
  }
  subControlAliases.set(control2, aliasMap);
};
var registerSubControls = (control2, subControlAliases2 = []) => {
  for (const [subControl, ...aliases] of subControlAliases2) {
    registerSubControl(control2, subControl, ...aliases);
  }
};
var getMainSubcontrolName = (control2, subKey) => {
  const aliasMap = subControlAliases.get(control2);
  if (!aliasMap) return subKey;
  return aliasMap.get(String(subKey).toLowerCase()) ?? subKey;
};
registerSubControls("lfo", [
  ["control", "c"],
  ["subControl", "sc"],
  ["rate", "r"],
  ["depth", "dep", "dr"],
  ["depthabs", "da"],
  ["dcoffset", "dc"],
  ["shape", "sh"],
  ["skew", "sk"],
  ["curve", "cu"],
  ["sync", "s"],
  ["retrig", "rt"],
  ["fxi"]
]);
registerSubControls("env", [
  ["control", "c"],
  ["subControl", "sc"],
  ["attack", "att", "a"],
  ["decay", "dec", "d"],
  ["sustain", "sus", "s"],
  ["release", "rel", "r"],
  ["depth", "dep", "dr"],
  ["depthabs", "da"],
  ["acurve", "ac"],
  ["dcurve", "dc"],
  ["rcurve", "rc"],
  ["fxi"]
]);
registerSubControls("bmod", [
  ["bus", "b"],
  ["control", "c"],
  ["subControl", "sc"],
  ["depth", "dep", "dr"],
  ["depthabs", "da"],
  ["dc"],
  ["fxi"]
]);
Pattern.prototype.modulate = function(type, config, idPat) {
  config = { control: void 0, ...config };
  const modulatorKeys = ["lfo", "env", "bmod"];
  if (!modulatorKeys.includes(type)) {
    logger(`[core] Modulation type ${type} not found. Please use one of 'lfo', 'env', 'bmod'`);
    return this;
  }
  let output = this;
  let defaultValue = void 0;
  output = output.fmap((v2) => (id2) => ({ v: v2, id: id2 })).appLeft(reify(idPat));
  for (const [rawKey, value] of Object.entries(config)) {
    const key = getMainSubcontrolName(type, rawKey);
    const valuePat = reify(value);
    output = output.fmap(({ v: v2, id: id2 }) => (c) => {
      if (defaultValue === void 0) {
        let control2 = getControlName(Object.keys(v2).at(-1));
        if (modulatorKeys.includes(control2)) {
          control2 = `${control2}_${[...v2[control2].__ids].at(-1)}`;
        }
        defaultValue = control2;
      }
      v2[type] ?? (v2[type] = { __ids: /* @__PURE__ */ new Set() });
      const t = v2[type];
      id2 ?? (id2 = t.__ids.size);
      t[id2] ?? (t[id2] = { control: defaultValue });
      t.__ids.add(id2);
      if (c === void 0) return { v: v2, id: id2 };
      if (key === "control" || key === "subControl") {
        t[id2][key] = getControlName(c);
      } else {
        t[id2][key] = c;
      }
      return { v: v2, id: id2 };
    }).appLeft(valuePat);
  }
  return output.fmap(({ v: v2 }) => v2);
};
Pattern.prototype.lfo = function(config, id2) {
  return this.modulate("lfo", config, id2);
};
var lfo = (config) => pure({}).lfo(config);
Pattern.prototype.env = function(config, id2) {
  return this.modulate("env", config, id2);
};
var env = (config) => pure({}).env(config);
Pattern.prototype.bmod = function(config, id2) {
  return this.modulate("bmod", config, id2);
};
var bmod = (config) => pure({}).bmod(config);
var { transient } = registerControl(["transient", "transsustain"]);
var { FXrelease, FXrel, FXr, fxr } = registerControl("FXrelease", "FXrel", "FXr", "fxr");

// strudel/packages/core/euclid.mjs
var left = function(n2, x) {
  const [ons, offs] = n2;
  const [xs, ys] = x;
  const [_xs, __xs] = splitAt(offs, xs);
  return [
    [offs, ons - offs],
    [zipWith((a, b) => a.concat(b), _xs, ys), __xs]
  ];
};
var right = function(n2, x) {
  const [ons, offs] = n2;
  const [xs, ys] = x;
  const [_ys, __ys] = splitAt(ons, ys);
  const result = [
    [ons, offs - ons],
    [zipWith((a, b) => a.concat(b), xs, _ys), __ys]
  ];
  return result;
};
var _bjorklund = function(n2, x) {
  const [ons, offs] = n2;
  return Math.min(ons, offs) <= 1 ? [n2, x] : _bjorklund(...ons > offs ? left(n2, x) : right(n2, x));
};
var bjorklund = function(ons, steps2) {
  const inverted = ons < 0;
  const absOns = Math.abs(ons);
  const offs = steps2 - absOns;
  const ones = Array(absOns).fill([1]);
  const zeros = Array(offs).fill([0]);
  const result = _bjorklund([absOns, offs], [ones, zeros]);
  const pattern2 = flatten(result[1][0]).concat(flatten(result[1][1]));
  return inverted ? pattern2.map((x) => 1 - x) : pattern2;
};
var _euclidRot = function(pulses, steps2, rotation) {
  const b = bjorklund(pulses, steps2);
  if (rotation) {
    return rotate(b, -rotation);
  }
  return b;
};
var euclid = register("euclid", function(pulses, steps2, pat) {
  return pat.struct(_euclidRot(pulses, steps2, 0));
});
var bjork = register("bjork", function(euc, pat) {
  if (!Array.isArray(euc)) {
    euc = [euc];
  }
  const [pulses, steps2 = pulses, rot = 0] = euc;
  return pat.struct(_euclidRot(pulses, steps2, rot));
});
var { euclidrot, euclidRot } = register(["euclidrot", "euclidRot"], function(pulses, steps2, rotation, pat) {
  return pat.struct(_euclidRot(pulses, steps2, rotation));
});
var _euclidLegato = function(pulses, steps2, rotation, pat) {
  if (pulses < 1) {
    return silence;
  }
  const bin_pat = _euclidRot(pulses, steps2, 0);
  const gapless = bin_pat.join("").split("1").slice(1).map((s2) => [s2.length + 1, true]);
  return pat.struct(timeCat(...gapless)).late(fraction_default(rotation).div(steps2));
};
var euclidLegato = register(["euclidLegato"], function(pulses, steps2, pat) {
  return _euclidLegato(pulses, steps2, 0, pat);
});
var euclidLegatoRot = register(["euclidLegatoRot"], function(pulses, steps2, rotation, pat) {
  return _euclidLegato(pulses, steps2, rotation, pat);
});
var { euclidish, eish } = register(["euclidish", "eish"], function(pulses, steps2, perc, pat) {
  const morphed = _morph(bjorklund(pulses, steps2), new Array(pulses).fill(1), perc);
  return pat.struct(morphed).setSteps(steps2);
});

// strudel/packages/core/zyklus.mjs
function createClock(getTime2, callback, duration2 = 0.05, interval = 0.1, overlap = 0.1, setInterval = globalThis.setInterval, clearInterval = globalThis.clearInterval, round2 = true) {
  let tick = 0;
  let phase = 0;
  let precision = 10 ** 4;
  let minLatency = 0.01;
  const setDuration = (setter) => duration2 = setter(duration2);
  overlap = overlap || interval / 2;
  const onTick = () => {
    const t = getTime2();
    const lookahead = t + interval + overlap;
    if (phase === 0) {
      phase = t + minLatency;
    }
    while (phase < lookahead) {
      phase = round2 ? Math.round(phase * precision) / precision : phase;
      callback(phase, duration2, tick, t);
      phase += duration2;
      tick++;
    }
  };
  let intervalID;
  const start = () => {
    clear();
    onTick();
    intervalID = setInterval(onTick, interval * 1e3);
  };
  const clear = () => {
    intervalID !== void 0 && clearInterval(intervalID);
    intervalID = void 0;
  };
  const pause = () => clear();
  const stop = () => {
    tick = 0;
    phase = 0;
    clear();
  };
  const getPhase = () => phase;
  return { setDuration, start, stop, pause, duration: duration2, interval, getPhase, minLatency };
}
var zyklus_default = createClock;

// strudel/packages/core/cyclist.mjs
var Cyclist = class {
  constructor({
    interval,
    onTrigger,
    onToggle,
    onError,
    getTime: getTime2,
    latency = 0.1,
    setInterval,
    clearInterval,
    beforeStart
  }) {
    this.started = false;
    this.beforeStart = beforeStart;
    this.cps = 0.5;
    this.num_ticks_since_cps_change = 0;
    this.lastTick = 0;
    this.lastBegin = 0;
    this.lastEnd = 0;
    this.getTime = getTime2;
    this.num_cycles_at_cps_change = 0;
    this.seconds_at_cps_change;
    this.onToggle = onToggle;
    this.latency = latency;
    this.clock = zyklus_default(
      getTime2,
      // called slightly before each cycle
      (phase, duration2, _, t) => {
        if (this.num_ticks_since_cps_change === 0) {
          this.num_cycles_at_cps_change = this.lastEnd;
          this.seconds_at_cps_change = phase;
        }
        this.num_ticks_since_cps_change++;
        const seconds_since_cps_change = this.num_ticks_since_cps_change * duration2;
        const num_cycles_since_cps_change = seconds_since_cps_change * this.cps;
        try {
          const begin2 = this.lastEnd;
          this.lastBegin = begin2;
          const end2 = this.num_cycles_at_cps_change + num_cycles_since_cps_change;
          this.lastEnd = end2;
          this.lastTick = phase;
          if (phase < t) {
            console.log(`skip query: too late`);
            return;
          }
          const haps = this.pattern.queryArc(begin2, end2, { _cps: this.cps, cyclist: "cyclist" });
          haps.forEach((hap) => {
            if (hap.hasOnset()) {
              const targetTime = (hap.whole.begin - this.num_cycles_at_cps_change) / this.cps + this.seconds_at_cps_change + latency;
              const duration3 = hap.duration / this.cps;
              const deadline = targetTime - phase;
              onTrigger?.(hap, deadline, duration3, this.cps, targetTime);
              if (hap.value.cps !== void 0 && this.cps != hap.value.cps) {
                this.cps = hap.value.cps;
                this.num_ticks_since_cps_change = 0;
              }
            }
          });
        } catch (e) {
          errorLogger(e);
          onError?.(e);
        }
      },
      interval,
      // duration of each cycle
      0.1,
      0.1,
      setInterval,
      clearInterval
    );
  }
  now() {
    if (!this.started) {
      return 0;
    }
    const secondsSinceLastTick = this.getTime() - this.lastTick - this.clock.duration;
    return this.lastBegin + secondsSinceLastTick * this.cps;
  }
  setStarted(v2) {
    this.started = v2;
    this.onToggle?.(v2);
  }
  async start() {
    await this.beforeStart?.();
    this.num_ticks_since_cps_change = 0;
    this.num_cycles_at_cps_change = 0;
    if (!this.pattern) {
      throw new Error("Scheduler: no pattern set! call .setPattern first.");
    }
    logger("[cyclist] start");
    this.clock.start();
    this.setStarted(true);
  }
  pause() {
    logger("[cyclist] pause");
    this.clock.pause();
    this.setStarted(false);
  }
  stop() {
    logger("[cyclist] stop");
    this.clock.stop();
    this.lastEnd = 0;
    this.setStarted(false);
  }
  async setPattern(pat, autostart = false) {
    this.pattern = pat;
    if (autostart && !this.started) {
      await this.start();
    }
  }
  setCps(cps2 = 0.5) {
    if (this.cps === cps2) {
      return;
    }
    this.cps = cps2;
    this.num_ticks_since_cps_change = 0;
  }
  log(begin2, end2, haps) {
    const onsets = haps.filter((h) => h.hasOnset());
    console.log(`${begin2.toFixed(4)} - ${end2.toFixed(4)} ${Array(onsets.length).fill("I").join("")}`);
  }
};

// strudel/packages/core/impure.mjs
var timelines = {};
var reset_state = function() {
  reset_timelines();
};
var reset_timelines = function() {
  timelines = {};
};
var timeline = register(
  "timeline",
  function(tpat, pat) {
    tpat = reify(tpat);
    const f = function(state) {
      const scheduler = !!state.controls.cyclist;
      const timehaps = tpat.query(state);
      const result = [];
      for (const timehap of timehaps) {
        const tlid = timehap.value;
        let offset2;
        if (tlid === 0) {
          offset2 = 0;
        } else if (tlid in timelines) {
          offset2 = timelines[tlid];
        } else {
          const timearc = timehap.wholeOrPart();
          if (!scheduler || state.span.begin.lt(timearc.midpoint())) {
            offset2 = timearc.begin;
          } else {
            offset2 = timearc.end;
          }
        }
        if (scheduler) {
          timelines[tlid] = offset2;
          if (tlid !== 0) {
            delete timelines[-tlid];
          }
        }
        const pathaps = pat.late(offset2).query(state.setSpan(timehap.part)).map((h) => h.setContext(h.combineContext(timehap)));
        result.push(...pathaps);
      }
      return result;
    };
    return new Pattern(f, pat._steps);
  },
  false
);

// strudel/packages/core/pick.mjs
var _pick = function(lookup, pat, modulo = true) {
  const array = Array.isArray(lookup);
  const len = Object.keys(lookup).length;
  lookup = objectMap(lookup, reify);
  if (len === 0) {
    return silence;
  }
  return pat.fmap((i2) => {
    let key = i2;
    if (array) {
      key = modulo ? Math.round(key) % len : clamp(Math.round(key), 0, lookup.length - 1);
    }
    return lookup[key];
  });
};
var pick = function(lookup, pat) {
  if (Array.isArray(pat)) {
    [pat, lookup] = [lookup, pat];
  }
  return __pick(lookup, pat);
};
var __pick = register("pick", function(lookup, pat) {
  return _pick(lookup, pat, false).innerJoin();
});
var pickmod = register("pickmod", function(lookup, pat) {
  return _pick(lookup, pat, true).innerJoin();
});
var pickF = register("pickF", function(pickPattern, lookup, pat) {
  return pat.apply(pick(lookup, pickPattern));
});
var pickmodF = register("pickmodF", function(pickPattern, lookup, pat) {
  return pat.apply(pickmod(lookup, pickPattern));
});
var pickOut = register("pickOut", function(lookup, pat) {
  return _pick(lookup, pat, false).outerJoin();
});
var pickmodOut = register("pickmodOut", function(lookup, pat) {
  return _pick(lookup, pat, true).outerJoin();
});
var pickRestart = register("pickRestart", function(lookup, pat) {
  return _pick(lookup, pat, false).restartJoin();
});
var pickmodRestart = register("pickmodRestart", function(lookup, pat) {
  return _pick(lookup, pat, true).restartJoin();
});
var pickReset = register("pickReset", function(lookup, pat) {
  return _pick(lookup, pat, false).resetJoin();
});
var pickmodReset = register("pickmodReset", function(lookup, pat) {
  return _pick(lookup, pat, true).resetJoin();
});
var { inhabit, pickSqueeze } = register(["inhabit", "pickSqueeze"], function(lookup, pat) {
  return _pick(lookup, pat, false).squeezeJoin();
});
var { inhabitmod, pickmodSqueeze } = register(["inhabitmod", "pickmodSqueeze"], function(lookup, pat) {
  return _pick(lookup, pat, true).squeezeJoin();
});
var squeeze = (pat, xs) => {
  xs = xs.map(reify);
  if (xs.length == 0) {
    return silence;
  }
  return pat.fmap((i2) => {
    const key = _mod(Math.round(i2), xs.length);
    return xs[key];
  }).squeezeJoin();
};

// strudel/packages/core/neocyclist.mjs
var NeoCyclist = class {
  constructor({ onTrigger, onToggle, getTime: getTime2 }) {
    this.started = false;
    this.cps = 0.5;
    this.getTime = getTime2;
    this.time_at_last_tick_message = 0;
    this.collator = new ClockCollator({ getTargetClockTime: getTime2 });
    this.onToggle = onToggle;
    this.latency = 0.1;
    this.cycle = 0;
    this.id = Math.round(Date.now() * Math.random());
    this.worker = new SharedWorker(new URL("./clockworker.js", import.meta.url));
    this.worker.port.start();
    this.channel = new BroadcastChannel("strudeltick");
    const tickCallback = (payload) => {
      const { cps: cps2, begin: begin2, end: end2, cycle, time: time3 } = payload;
      this.cps = cps2;
      this.cycle = cycle;
      const currentTime = this.collator.calculateOffset(time3) + time3;
      processHaps(begin2, end2, currentTime);
      this.time_at_last_tick_message = currentTime;
    };
    const processHaps = (begin2, end2, currentTime) => {
      if (this.started === false) {
        return;
      }
      const haps = this.pattern.queryArc(begin2, end2, { _cps: this.cps, cyclist: "neocyclist" });
      haps.forEach((hap) => {
        if (hap.hasOnset()) {
          const timeUntilTrigger = cycleToSeconds(hap.whole.begin - this.cycle, this.cps);
          const targetTime = timeUntilTrigger + currentTime + this.latency;
          const duration2 = cycleToSeconds(hap.duration, this.cps);
          onTrigger?.(hap, 0, duration2, this.cps, targetTime);
        }
      });
    };
    this.channel.onmessage = (message) => {
      if (!this.started) {
        return;
      }
      const { payload, type } = message.data;
      switch (type) {
        case "tick": {
          tickCallback(payload);
        }
      }
    };
  }
  sendMessage(type, payload) {
    this.worker.port.postMessage({ type, payload, id: this.id });
  }
  now() {
    const gap2 = (this.getTime() - this.time_at_last_tick_message) * this.cps;
    return this.cycle + gap2;
  }
  setCps(cps2 = 1) {
    this.sendMessage("cpschange", { cps: cps2 });
  }
  setCycle(cycle) {
    this.sendMessage("setcycle", { cycle });
  }
  setStarted(started) {
    this.sendMessage("toggle", { started });
    this.started = started;
    this.onToggle?.(started);
  }
  start() {
    logger("[cyclist] start");
    this.setStarted(true);
  }
  stop() {
    logger("[cyclist] stop");
    this.collator.reset();
    this.setStarted(false);
  }
  setPattern(pat, autostart = false) {
    this.pattern = pat;
    if (autostart && !this.started) {
      this.start();
    }
  }
  log(begin2, end2, haps) {
    const onsets = haps.filter((h) => h.hasOnset());
    console.log(`${begin2.toFixed(4)} - ${end2.toFixed(4)} ${Array(onsets.length).fill("I").join("")}`);
  }
};

// strudel/packages/core/schedulerState.mjs
var time;
var cpsFunc;
var pattern;
var triggerFunc;
var isStarted;
function getTime() {
  if (!time) {
    throw new Error("no time set! use setTime to define a time source");
  }
  return time();
}
function setTime(func2) {
  time = func2;
}
function setCpsFunc(func2) {
  cpsFunc = func2;
}
function getCps() {
  return cpsFunc?.();
}
function setPattern(pat) {
  pattern = pat;
}
function getPattern() {
  return pattern;
}
function setTriggerFunc(func2) {
  triggerFunc = func2;
}
function getTriggerFunc() {
  return triggerFunc;
}
function setIsStarted(val2) {
  isStarted = !!val2;
}
function getIsStarted() {
  return isStarted;
}

// strudel/packages/core/repl.mjs
function repl({
  defaultOutput,
  onEvalError,
  beforeEval,
  beforeStart,
  afterEval,
  getTime: getTime2,
  transpiler,
  onToggle,
  editPattern,
  onUpdateState,
  sync = false,
  setInterval,
  clearInterval,
  id: id2,
  mondo = false
}) {
  const state = {
    schedulerError: void 0,
    evalError: void 0,
    code: "// LOADING",
    activeCode: "// LOADING",
    pattern: void 0,
    miniLocations: [],
    widgets: [],
    sliders: [],
    pending: false,
    started: false
  };
  const transpilerOptions = {
    id: id2
  };
  const updateState = (update) => {
    Object.assign(state, update);
    state.isDirty = state.code !== state.activeCode;
    state.error = state.evalError || state.schedulerError;
    onUpdateState?.(state);
  };
  const schedulerOptions = {
    onTrigger: getTrigger({ defaultOutput, getTime: getTime2 }),
    getTime: getTime2,
    onToggle: (started) => {
      updateState({ started });
      setIsStarted(started);
      onToggle?.(started);
      if (!started) {
        reset_state();
      }
    },
    setInterval,
    clearInterval,
    beforeStart
  };
  const scheduler = sync && typeof SharedWorker != "undefined" ? new NeoCyclist(schedulerOptions) : new Cyclist(schedulerOptions);
  setTriggerFunc(schedulerOptions.onTrigger);
  setCpsFunc(() => scheduler.cps);
  let pPatterns = {};
  let anonymousIndex = 0;
  let allTransform;
  let eachTransform;
  let codeBlocks = {};
  let lastActiveVisualizerLabel = null;
  let blockPatterns = /* @__PURE__ */ new Map();
  function collectFromBlocks(property) {
    return Object.entries(codeBlocks).flatMap(([key, block]) => {
      if (key === "$") {
        return Array.isArray(block) ? block.flatMap((b) => b[property] || []) : [];
      }
      return block[property] || [];
    });
  }
  function processLabeledBlock(labels, i2, code, options, meta) {
    const label2 = labels[i2];
    const nextLabel = labels[i2 + 1] || { index: code.length, end: code.length };
    const labelCode = code.slice(label2.index, nextLabel.index);
    const labelRange = [label2.index + options.range[0], label2.end + options.range[0]];
    const blockStart = label2.index + options.range[0];
    const blockEnd = nextLabel.index + options.range[0];
    const blockWidgets = (meta?.widgets || []).filter((widget) => {
      const widgetPos = widget.from ?? widget.index ?? 0;
      return widgetPos >= blockStart && widgetPos < blockEnd;
    });
    const blockSliders = (meta?.sliders || []).filter((slider) => {
      const sliderPos = slider.from ?? slider.index ?? 0;
      return sliderPos >= blockStart && sliderPos < blockEnd;
    });
    const blockMiniLocations = (meta?.miniLocations || []).filter((loc) => {
      const locStart = Array.isArray(loc) ? loc[0] : loc.start ?? loc.from ?? 0;
      return locStart >= blockStart && locStart < blockEnd;
    });
    handleSingleLabelBlock(
      label2,
      labelCode,
      { ...options, range: labelRange },
      { widgets: blockWidgets, sliders: blockSliders, miniLocations: blockMiniLocations }
    );
  }
  function cleanupConflictingRanges(codeBlocks2, currentKey, newRange) {
    for (const [existingKey, existingBlock] of Object.entries(codeBlocks2)) {
      if (existingKey === currentKey) continue;
      if (!existingBlock.range) continue;
      const [existingStart, existingEnd] = existingBlock.range;
      const [newStart, newEnd] = newRange;
      if (!(newEnd <= existingStart || newStart >= existingEnd)) {
        delete codeBlocks2[existingKey];
      }
    }
  }
  function handleSingleLabelBlock(label2, code, options, meta) {
    const activeVisualizer = label2.activeVisualizer || null;
    if (activeVisualizer !== null) {
      lastActiveVisualizerLabel = label2.name;
    }
    codeBlocks[label2.name] = {
      code,
      range: options.range,
      labels: [label2.name],
      miniLocations: meta?.miniLocations || [],
      widgets: meta?.widgets || [],
      sliders: meta?.sliders || [],
      activeVisualizer
      // Store the widget type if present, null otherwise
    };
    cleanupConflictingRanges(codeBlocks, label2.name, options.range);
  }
  function handleDeclarationBlock(code, options, meta) {
    const range3 = options.range || [];
    if (range3.length < 2) return;
    const blockKey = `_decl:${range3[0]}:${range3[1]}`;
    codeBlocks[blockKey] = {
      code,
      range: range3,
      labels: [],
      miniLocations: meta?.miniLocations || [],
      widgets: meta?.widgets || [],
      sliders: meta?.sliders || [],
      activeVisualizer: null
    };
    cleanupConflictingRanges(codeBlocks, blockKey, range3);
  }
  const hush = function() {
    pPatterns = {};
    anonymousIndex = 0;
    allTransform = void 0;
    eachTransform = void 0;
    codeBlocks = {};
    blockPatterns.clear();
    lastActiveVisualizerLabel = null;
    return silence;
  };
  function unpure(pat) {
    if (pat._Pattern) {
      return pat.__pure;
    }
    return pat;
  }
  const setPattern2 = async (pattern2, autostart = true) => {
    pattern2 = editPattern?.(pattern2) || pattern2;
    await scheduler.setPattern(pattern2, autostart);
    setPattern(pattern2);
    return pattern2;
  };
  setTime(() => scheduler.now());
  function applyPatternTransforms(pattern2) {
    const allPatterns = Object.values(pPatterns);
    if (allPatterns.length) {
      let patterns = [];
      let soloActive = false;
      for (const [key, value] of Object.entries(pPatterns)) {
        const isSolod = key.length > 1 && key.startsWith("S");
        if (isSolod && soloActive === false) {
          patterns = [];
          soloActive = true;
        }
        if (!soloActive || soloActive && isSolod) {
          const valWithState = value.withState((state2) => state2.setControls({ id: key }));
          patterns.push(valWithState);
        }
      }
      if (eachTransform) {
        patterns = patterns.map((x) => eachTransform(x));
      }
      pattern2 = stack(...patterns);
    } else if (eachTransform) {
      pattern2 = eachTransform(pattern2);
    }
    if (allTransforms.length) {
      for (const transform of allTransforms) {
        pattern2 = transform(pattern2);
      }
    }
    if (!isPattern(pattern2)) {
      pattern2 = silence;
    }
    return pattern2;
  }
  const stop = () => {
    codeBlocks = {};
    blockPatterns.clear();
    pPatterns = {};
    lastActiveVisualizerLabel = null;
    updateState({
      miniLocations: [],
      widgets: [],
      sliders: []
    });
    scheduler.stop();
  };
  const start = () => scheduler.start();
  const pause = () => scheduler.pause();
  const toggle = () => scheduler.toggle();
  const setCps = (cps2) => {
    scheduler.setCps(unpure(cps2));
    return silence;
  };
  const setCpm = (cpm2) => {
    scheduler.setCps(unpure(cpm2) / 60);
    return silence;
  };
  let allTransforms = [];
  const all = function(transform) {
    allTransforms.push(transform);
    return silence;
  };
  const each = function(transform) {
    eachTransform = transform;
    return silence;
  };
  const injectPatternMethods = () => {
    Pattern.prototype.p = function(id3) {
      if (typeof id3 === "string" && (id3.startsWith("_") || id3.endsWith("_"))) {
        return silence;
      }
      if (id3.includes("$")) {
        id3 = `${id3}${anonymousIndex}`;
        anonymousIndex++;
      }
      pPatterns[id3] = this;
      return this;
    };
    Pattern.prototype.q = function(id3) {
      return silence;
    };
    try {
      for (let i2 = 1; i2 < 10; ++i2) {
        Object.defineProperty(Pattern.prototype, `d${i2}`, {
          get() {
            return this.p(i2);
          },
          configurable: true
        });
        Object.defineProperty(Pattern.prototype, `p${i2}`, {
          get() {
            return this.p(i2);
          },
          configurable: true
        });
        Pattern.prototype[`q${i2}`] = silence;
      }
    } catch (err) {
      console.warn("injectPatternMethods: error:", err);
    }
    const cpm2 = register("cpm", function(cpm3, pat) {
      return pat._fast(cpm3 / 60 / scheduler.cps);
    });
    return evalScope({
      all,
      each,
      hush,
      cpm: cpm2,
      setCps,
      setcps: setCps,
      setCpm,
      setcpm: setCpm
    });
  };
  const evaluate2 = async (code, autostart = true) => {
    if (!code) {
      throw new Error("no code to evaluate");
    }
    try {
      updateState({ code, pending: true });
      await injectPatternMethods();
      setTime(() => scheduler.now());
      await beforeEval?.({ code, blockBased: false });
      allTransforms = [];
      codeBlocks = {};
      hush();
      if (mondo) {
        code = `mondolang\`${code}\``;
      }
      let { pattern: pattern2, meta } = await evaluate(code, transpiler, transpilerOptions);
      pattern2 = applyPatternTransforms(pattern2);
      logger(`[eval] code updated`);
      pattern2 = await setPattern2(pattern2, autostart);
      updateState({
        miniLocations: meta?.miniLocations || [],
        widgets: meta?.widgets || [],
        sliders: meta?.sliders || [],
        activeCode: code,
        pattern: pattern2,
        evalError: void 0,
        schedulerError: void 0,
        pending: false
      });
      afterEval?.({ code, pattern: pattern2, meta, range: void 0, widgetRemoved: false });
      return pattern2;
    } catch (err) {
      logger(`[eval] error: ${err.message}`, "error");
      console.error(err);
      updateState({ evalError: err, pending: false });
      onEvalError?.(err);
    }
  };
  const evaluateBlock = async (code, autostart = true, options = {}) => {
    if (!code) {
      throw new Error("no code to evaluate");
    }
    try {
      updateState({ code, pending: true });
      await injectPatternMethods();
      setTime(() => scheduler.now());
      await beforeEval?.({ code, blockBased: true });
      allTransforms = [];
      const transpilerOptionsWithBlock = {
        ...transpilerOptions,
        blockBased: true,
        range: options.range || []
      };
      if (mondo) {
        code = `mondolang\`${code}\``;
      }
      let { pattern: pattern2, meta } = await evaluate(code, transpiler, transpilerOptionsWithBlock);
      let widgetRemoved = false;
      const labels = meta.labels || [];
      const hasAnonymousLabel = labels.some((label2) => label2.name.startsWith("$"));
      if (hasAnonymousLabel) {
        throw new Error(
          "anonymous labels disabled for block based evaluation (see https://strudel.cc/blog/#label-notation)"
        );
      } else if (labels.length > 0) {
        for (let i2 = 0; i2 < labels.length; i2++) {
          processLabeledBlock(labels, i2, meta.output, options, meta);
        }
      } else {
        handleDeclarationBlock(code, options, meta);
      }
      meta.miniLocations = collectFromBlocks("miniLocations");
      meta.widgets = collectFromBlocks("widgets");
      meta.sliders = collectFromBlocks("sliders");
      const blocksToUpdate = labels.map((label2) => label2.name);
      for (const [key, block] of Object.entries(codeBlocks)) {
        if (blocksToUpdate.includes(key)) {
          if (block.activeVisualizer !== null) {
            lastActiveVisualizerLabel = key;
          } else if (lastActiveVisualizerLabel === key) {
            widgetRemoved = true;
            lastActiveVisualizerLabel = null;
          }
        }
      }
      pPatterns = Object.fromEntries(
        Object.entries(pPatterns).filter(([key]) => {
          return Object.keys(codeBlocks).includes(key);
        })
      );
      pattern2 = applyPatternTransforms(pattern2);
      logger(`[eval] code updated`);
      pattern2 = await setPattern2(pattern2, autostart);
      updateState({
        miniLocations: meta?.miniLocations || [],
        widgets: meta?.widgets || [],
        sliders: meta?.sliders || [],
        activeCode: code,
        pattern: pattern2,
        evalError: void 0,
        schedulerError: void 0,
        pending: false
      });
      afterEval?.({ code, pattern: pattern2, meta, range: options.range, widgetRemoved });
      return pattern2;
    } catch (err) {
      logger(`[eval] error: ${err.message}`, "error");
      console.error(err);
      updateState({ evalError: err, pending: false });
      onEvalError?.(err);
    }
  };
  const setCode = (code) => updateState({ code });
  return { scheduler, evaluate: evaluate2, evaluateBlock, start, stop, pause, setCps, setPattern: setPattern2, setCode, toggle, state };
}
var getTrigger = ({ getTime: getTime2, defaultOutput }) => async (hap, deadline, duration2, cps2, t) => {
  try {
    if (!hap.context.onTrigger || !hap.context.dominantTrigger) {
      await defaultOutput(hap, deadline, duration2, cps2, t);
    }
    if (hap.context.onTrigger) {
      await hap.context.onTrigger(hap, getTime2(), cps2, t);
    }
  } catch (err) {
    errorLogger(err, "getTrigger");
  }
};

// strudel/packages/core/signal.mjs
function steady(value) {
  return new Pattern((state) => [new Hap(void 0, state.span, value)]);
}
var signal = (func2) => {
  const query = (state) => [new Hap(void 0, state.span, func2(state.span.begin, state.controls))];
  return new Pattern(query);
};
var saw = signal((t) => t % 1);
var saw2 = saw.toBipolar();
var isaw = signal((t) => 1 - t % 1);
var isaw2 = isaw.toBipolar();
var sine2 = signal((t) => Math.sin(Math.PI * 2 * t));
var sine = sine2.fromBipolar();
var cosine = sine._early(fraction_default(1).div(4));
var cosine2 = sine2._early(fraction_default(1).div(4));
var square = signal((t) => Math.floor(t * 2 % 2));
var square2 = square.toBipolar();
var tri = fastcat(saw, isaw);
var tri2 = fastcat(saw2, isaw2);
var itri = fastcat(isaw, saw);
var itri2 = fastcat(isaw2, saw2);
var time2 = signal(id);
var _mouseY = 0;
var _mouseX = 0;
if (typeof window !== "undefined") {
  document.addEventListener("mousemove", (e) => {
    _mouseY = e.clientY / document.body.clientHeight;
    _mouseX = e.clientX / document.body.clientWidth;
  });
}
var mousey = signal(() => _mouseY);
var mouseY = signal(() => _mouseY);
var mousex = signal(() => _mouseX);
var mouseX = signal(() => _mouseX);
var _murmurHashFinalizer = (x) => {
  x |= 0;
  x ^= x >>> 16;
  x = Math.imul(x, 2246822507);
  x ^= x >>> 13;
  x = Math.imul(x, 3266489909);
  x ^= x >>> 16;
  return x >>> 0;
};
var _tToT = (t) => {
  return Math.floor(t * 536870912);
};
var _decorrelate = (T, i2 = 0, seed2 = 0) => {
  const lowBits = T >>> 0 >>> 0;
  const highBits = Math.floor(T / 4294967296) >>> 0;
  let key = lowBits ^ Math.imul(highBits ^ 2246822507, 3266489909);
  key ^= Math.imul(i2 ^ 2135587861, 2654435769);
  key ^= Math.imul(seed2 ^ 374761393, 668265261);
  return key >>> 0;
};
var randAt = (T, i2 = 0, seed2 = 0) => {
  return _murmurHashFinalizer(_decorrelate(T, i2, seed2)) / 4294967296;
};
var timeToRands = (t, n2, seed2 = 0) => {
  const T = _tToT(t);
  if (n2 === 1) {
    return randAt(T, 0, seed2);
  }
  const out = new Array(n2);
  for (let i2 = 0; i2 < n2; i2++) out[i2] = randAt(T, i2, seed2);
  return out;
};
var __xorwise = (x) => {
  const a = x << 13 ^ x;
  const b = a >> 17 ^ a;
  return b << 5 ^ b;
};
var __frac = (x) => x - Math.trunc(x);
var __timeToIntSeed = (x) => __xorwise(Math.trunc(__frac(x / 300) * 536870912));
var __intSeedToRand = (x) => x % 536870912 / 536870912;
var __timeToRandsPrime = (seed2, n2) => {
  if (n2 === 1) {
    return Math.abs(__intSeedToRand(seed2));
  }
  const result = [];
  for (let i2 = 0; i2 < n2; i2++) {
    result.push(__intSeedToRand(seed2));
    seed2 = __xorwise(seed2);
  }
  return result;
};
var __timeToRands = (t, n2) => __timeToRandsPrime(__timeToIntSeed(t), n2);
var RNG_MODE = "legacy";
var getRandsAtTime = (t, n2 = 1, seed2 = 0) => {
  return RNG_MODE === "legacy" ? __timeToRands(t + seed2, n2) : timeToRands(t, n2, seed2);
};
var useRNG = (mode2 = "legacy") => RNG_MODE = mode2;
var run = (n2) => saw.range(0, n2).round().segment(n2);
var binary = (n2) => {
  const nBits = reify(n2).log2().floor().add(1);
  return binaryN(n2, nBits);
};
var binaryN = (n2, nBits = 16) => {
  nBits = reify(nBits);
  const bitPos = run(nBits).mul(-1).add(nBits.sub(1));
  return reify(n2).segment(nBits).brshift(bitPos).band(pure(1));
};
var binaryL = (n2) => {
  const nBits = reify(n2).log2().floor().add(1);
  return binaryNL(n2, nBits);
};
var binaryNL = (n2, nBits = 16) => {
  return reify(n2).withValue((v2) => (bits) => {
    const bList = [];
    for (let i2 = bits - 1; i2 >= 0; i2--) {
      bList.push(v2 >> i2 & 1);
    }
    return bList;
  }).appLeft(reify(nBits));
};
var randL = (n2) => {
  return signal((t) => (nVal) => getRandsAtTime(t, nVal).map(Math.abs)).appLeft(reify(n2));
};
var randrun = (n2) => {
  return signal((t, controls) => {
    let rands = getRandsAtTime(t.floor().add(0.5), n2, controls.randSeed);
    if (!Array.isArray(rands)) rands = [rands];
    const nums = rands.map((n3, i3) => [n3, i3]).sort((a, b) => (a[0] > b[0]) - (a[0] < b[0])).map((x) => x[1]);
    const i2 = t.cyclePos().mul(n2).floor() % n2;
    return nums[i2];
  })._segment(n2);
};
var _rearrangeWith = (ipat, n2, pat) => {
  const pats = [...Array(n2).keys()].map((i2) => pat.zoom(fraction_default(i2).div(n2), fraction_default(i2 + 1).div(n2)));
  return ipat.fmap((i2) => pats[i2].repeatCycles(n2)._fast(n2)).innerJoin();
};
var shuffle = register("shuffle", (n2, pat) => {
  return _rearrangeWith(randrun(n2), n2, pat);
});
var scramble = register("scramble", (n2, pat) => {
  return _rearrangeWith(_irand(n2)._segment(n2), n2, pat);
});
var withSeed = (func2, pat) => {
  return new Pattern((state) => {
    let { randSeed, ...controls } = state.controls;
    randSeed = func2(randSeed);
    return pat.query(state.setControls({ ...controls, randSeed }));
  }, pat._steps);
};
var seed = register("seed", (n2, pat) => {
  return withSeed(() => n2, pat);
});
var rand = signal((t, controls) => getRandsAtTime(t, 1, controls.randSeed));
var rand2 = rand.toBipolar();
var _brandBy = (p) => rand.fmap((x) => x < p);
var brandBy = (pPat) => reify(pPat).fmap(_brandBy).innerJoin();
var brand = _brandBy(0.5);
var _irand = (i2) => rand.fmap((x) => Math.trunc(x * i2));
var irand = (ipat) => reify(ipat).fmap(_irand).innerJoin();
var __chooseWith = (pat, xs) => {
  xs = xs.map(reify);
  if (xs.length == 0) {
    return silence;
  }
  return pat.range(0, xs.length).fmap((i2) => {
    const key = Math.min(Math.max(Math.floor(i2), 0), xs.length - 1);
    return xs[key];
  });
};
var chooseWith = (pat, xs) => {
  return __chooseWith(pat, xs).outerJoin();
};
var chooseInWith = (pat, xs) => {
  return __chooseWith(pat, xs).innerJoin();
};
var choose = (...xs) => chooseWith(rand, xs);
var chooseIn = (...xs) => chooseInWith(rand, xs);
var chooseOut = choose;
Pattern.prototype.choose = function(...xs) {
  return chooseWith(this, xs);
};
Pattern.prototype.choose2 = function(...xs) {
  return chooseWith(this.fromBipolar(), xs);
};
var chooseCycles = (...xs) => chooseInWith(rand.segment(1), xs);
var randcat = chooseCycles;
var _wchooseWith = function(pat, ...pairs2) {
  const values = pairs2.map((pair) => reify(pair[0]));
  const weights = [];
  let total = pure(0);
  for (const pair of pairs2) {
    total = total.add(pair[1]);
    weights.push(total);
  }
  const weightspat = sequenceP(weights);
  const match = function(r) {
    const findpat = total.mul(r);
    return weightspat.fmap((weights2) => (find) => values[weights2.findIndex((x) => x > find, weights2)]).appLeft(findpat);
  };
  return pat.bind(match);
};
var wchooseWith = (...args) => _wchooseWith(...args).outerJoin();
var wchoose = (...pairs2) => wchooseWith(rand, ...pairs2);
var wchooseCycles = (...pairs2) => _wchooseWith(rand.segment(1), ...pairs2).innerJoin();
var wrandcat = wchooseCycles;
function _perlin(t, seed2 = 0) {
  let ta = Math.floor(t);
  let tb = ta + 1;
  const smootherStep = (x) => 6 * x ** 5 - 15 * x ** 4 + 10 * x ** 3;
  const interp = (x) => (a) => (b) => a + smootherStep(x) * (b - a);
  const ra = getRandsAtTime(ta, 1, seed2);
  const rb = getRandsAtTime(tb, 1, seed2);
  const v2 = interp(t - ta)(ra)(rb);
  return v2;
}
function _berlin(t, seed2 = 0) {
  const prevRidgeStartIndex = Math.floor(t);
  const nextRidgeStartIndex = prevRidgeStartIndex + 1;
  const prevRidgeBottomPoint = getRandsAtTime(prevRidgeStartIndex, 1, seed2);
  const height = getRandsAtTime(nextRidgeStartIndex, 1, seed2);
  const nextRidgeTopPoint = prevRidgeBottomPoint + height;
  const currentPercent = (t - prevRidgeStartIndex) / (nextRidgeStartIndex - prevRidgeStartIndex);
  const interp = (a, b, t2) => {
    return a + t2 * (b - a);
  };
  return interp(prevRidgeBottomPoint, nextRidgeTopPoint, currentPercent) / 2;
}
var perlin = signal((t, controls) => _perlin(t, controls.randSeed));
var berlin = signal((t, controls) => _berlin(t, controls.randSeed));
var degradeByWith = register(
  "degradeByWith",
  (withPat, x, pat) => pat.fmap((a) => (_) => a).appLeft(withPat.filterValues((v2) => v2 > x)),
  true,
  true
);
var degradeBy = register(
  "degradeBy",
  function(x, pat) {
    return pat._degradeByWith(rand, x);
  },
  true,
  true
);
var degrade = register("degrade", (pat) => pat._degradeBy(0.5), true, true);
var undegradeBy = register(
  "undegradeBy",
  function(x, pat) {
    return pat._degradeByWith(
      rand.fmap((r) => 1 - r),
      x
    );
  },
  true,
  true
);
var undegrade = register("undegrade", (pat) => pat._undegradeBy(0.5), true, true);
var sometimesBy = register("sometimesBy", function(patx, func2, pat) {
  return reify(patx).fmap((x) => stack(pat._degradeBy(x), func2(pat._undegradeBy(1 - x)))).innerJoin();
});
var sometimes = register("sometimes", function(func2, pat) {
  return pat._sometimesBy(0.5, func2);
});
var someCyclesBy = register("someCyclesBy", function(patx, func2, pat) {
  return reify(patx).fmap(
    (x) => stack(
      pat._degradeByWith(rand._segment(1), x),
      func2(pat._degradeByWith(rand.fmap((r) => 1 - r)._segment(1), 1 - x))
    )
  ).innerJoin();
});
var someCycles = register("someCycles", function(func2, pat) {
  return pat._someCyclesBy(0.5, func2);
});
var often = register("often", function(func2, pat) {
  return pat.sometimesBy(0.75, func2);
});
var rarely = register("rarely", function(func2, pat) {
  return pat.sometimesBy(0.25, func2);
});
var almostNever = register("almostNever", function(func2, pat) {
  return pat.sometimesBy(0.1, func2);
});
var almostAlways = register("almostAlways", function(func2, pat) {
  return pat.sometimesBy(0.9, func2);
});
var never = register("never", function(_, pat) {
  return pat;
});
var always = register("always", function(func2, pat) {
  return func2(pat);
});
function _keyDown(keyname) {
  if (Array.isArray(keyname) === false) {
    keyname = [keyname];
  }
  const keyState2 = getCurrentKeyboardState();
  return keyname.every((x) => {
    const keyName = keyAlias.get(x) ?? x;
    return keyState2[keyName];
  });
}
var whenKey = register("whenKey", function(input, func2, pat) {
  return pat.when(_keyDown(input), func2);
});
var keyDown = register("keyDown", function(pat) {
  return pat.fmap(_keyDown);
});
var cyclesPer = new Pattern(function(state) {
  return [new Hap(void 0, state.span, state.span.duration)];
});
var per = new Pattern(function(state) {
  return [new Hap(void 0, state.span, fraction_default(1).div(state.span.duration))];
});
var perCycle = per;
var perx = new Pattern(function(state) {
  const n2 = fraction_default(1).div(state.span.duration);
  return [new Hap(void 0, state.span, Math.log(n2) / Math.log(2) + 1)];
});

// strudel/packages/core/speak.mjs
var synth;
try {
  synth = window?.speechSynthesis;
} catch (err) {
  console.warn("cannot use window: not in browser?");
}
var allVoices = synth?.getVoices();
function triggerSpeech(words, lang, voice2) {
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(words);
  utterance.lang = lang;
  allVoices = synth.getVoices();
  const voices = allVoices.filter((v2) => v2.lang.includes(lang));
  if (typeof voice2 === "number") {
    utterance.voice = voices[voice2 % voices.length];
  } else if (typeof voice2 === "string") {
    utterance.voice = voices.find((voice3) => voice3.name === voice3);
  }
  speechSynthesis.speak(utterance);
}
var speak = register("speak", function(lang, voice2, pat) {
  return pat.onTrigger((hap) => {
    triggerSpeech(hap.value, lang, voice2);
  });
});

// strudel/packages/core/ui.mjs
var backgroundImage = function(src2, animateOptions = {}) {
  const container = document.getElementById("code");
  const bg = "background-image:url(" + src2 + ");background-size:contain;";
  container.style = bg;
  const { className: initialClassName } = container;
  const handleOption = (option, value) => {
    ({
      style: () => container.style = bg + ";" + value,
      className: () => container.className = value + " " + initialClassName
    })[option]();
  };
  const funcOptions = Object.entries(animateOptions).filter(([_, v2]) => typeof v2 === "function");
  const stringOptions = Object.entries(animateOptions).filter(([_, v2]) => typeof v2 === "string");
  stringOptions.forEach(([option, value]) => handleOption(option, value));
  if (funcOptions.length === 0) {
    return;
  }
};
var cleanupUi = () => {
  const container = document.getElementById("code");
  if (container) {
    container.style = "";
  }
};

// strudel/packages/core/index.mjs
logger("\u{1F300} @strudel/core loaded \u{1F300}");
if (globalThis._strudelLoaded) {
  console.warn(
    `@strudel/core was loaded more than once...
This might happen when you have multiple versions of strudel installed. 
Please check with "npm ls @strudel/core".`
  );
}
globalThis._strudelLoaded = true;

export {
  __commonJS,
  __toESM,
  logKey,
  errorLogger,
  logger,
  isNoteWithOctave,
  isNote,
  tokenizeNote,
  getAccidentalsOffset,
  noteToMidi,
  midiToFreq,
  freqToMidi,
  valueToMidi,
  getEventOffsetMs,
  getFreq,
  midi2note,
  _mod,
  averageArray,
  nanFallback,
  getSoundIndex,
  getPlayableNoteValue,
  getFrequency,
  rotate,
  pipe,
  compose,
  removeUndefineds,
  flatten,
  id,
  constant,
  listRange,
  curry,
  parseNumeral,
  mapArgs,
  numeralArgs,
  parseFractional,
  fractionalArgs,
  splitAt,
  zipWith,
  pairs,
  clamp,
  sol2note,
  uniq,
  uniqsort,
  uniqsortr,
  unicodeToBase64,
  base64ToUnicode,
  code2hash,
  hash2code,
  objectMap,
  cycleToSeconds,
  ClockCollator,
  getPerformanceTimeSeconds,
  keyAlias,
  getCurrentKeyboardState,
  stringifyValues,
  lcm,
  fraction_default,
  TimeSpan,
  Hap,
  State,
  drawLine_default,
  strudelScope,
  userDefinedKeys,
  clearScope,
  evalScope,
  evaluate,
  calculateSteps,
  setStringParser,
  Pattern,
  arpWith,
  arp,
  setDefaultJoin,
  polyrhythm,
  pr,
  pm,
  gap,
  silence,
  nothing,
  pure,
  isPattern,
  reify,
  sequenceP,
  stack,
  stackLeft,
  stackRight,
  stackCentre,
  stackBy,
  slowcat,
  slowcatPrime,
  cat,
  arrange,
  seqPLoop,
  fastcat,
  sequence,
  seq,
  mask,
  struct,
  superimpose,
  withValue,
  bind,
  innerBind,
  outerBind,
  squeezeBind,
  stepBind,
  polyBind,
  set,
  keep,
  keepif,
  add,
  sub,
  mul2 as mul,
  div,
  mod,
  pow,
  band,
  bor,
  bxor,
  blshift,
  brshift,
  lt,
  gt,
  lte,
  gte,
  eq,
  eqt,
  ne,
  net,
  and,
  or,
  func,
  register,
  round,
  floor,
  log2,
  ceil,
  toBipolar,
  fromBipolar,
  range,
  rangex,
  range2,
  ratio,
  compress,
  compressSpan,
  compressspan,
  fastGap,
  fastgap,
  focus,
  focusSpan,
  focusspan,
  ply,
  fast,
  hurry,
  slow,
  sparsity,
  inside,
  outside,
  lastOf,
  firstOf,
  every,
  apply,
  cpm,
  early,
  late,
  zoom,
  zoomArc,
  zoomarc,
  bite,
  linger,
  segment,
  seg,
  swingBy,
  swing,
  invert,
  inv,
  when,
  off,
  brak,
  rev,
  revv,
  pressBy,
  press,
  palindrome,
  juxBy,
  juxby,
  juxFlipBy,
  juxflipby,
  fluxBy,
  fluxby,
  jux,
  juxFlip,
  flux,
  echoWith,
  echowith,
  stutWith,
  stutwith,
  echo,
  stut,
  applyN,
  plyWith,
  plyForEach,
  iter,
  iterBack,
  iterback,
  repeatCycles,
  chunk,
  slowchunk,
  slowChunk,
  chunkBack,
  chunkback,
  fastchunk,
  fastChunk,
  chunkinto,
  chunkInto,
  chunkbackinto,
  chunkBackInto,
  bypass,
  ribbon,
  rib,
  hsla,
  hsl,
  filter,
  filterWhen,
  within,
  _retime,
  _slices,
  _fitslice,
  _match,
  pace,
  _polymeterListSteps,
  polymeter,
  stepcat,
  stepalt,
  take,
  drop,
  extend,
  replicate,
  expand,
  contract,
  shrinklist,
  growlist,
  shrink,
  grow,
  tour,
  zip,
  timecat,
  timeCat,
  s_cat,
  s_alt,
  s_polymeter,
  s_taper,
  s_taperlist,
  s_add,
  s_sub,
  s_expand,
  s_extend,
  s_contract,
  s_tour,
  s_zip,
  steps,
  chop,
  striate,
  loopAt,
  loopat,
  slice,
  splice,
  fit,
  loopAtCps,
  loopatcps,
  ref,
  xfade,
  beat,
  _morph,
  morph,
  soft,
  hard,
  cubic,
  diode,
  asym,
  fold,
  sinefold,
  chebyshev,
  parray,
  partials,
  phases,
  worklet,
  base,
  createParam,
  isControlName,
  registerControl,
  registerMultiControl,
  s,
  sound,
  wt,
  wavetablePosition,
  wtenv,
  wtattack,
  wtatt,
  wtdecay,
  wtdec,
  wtsustain,
  wtsus,
  wtrelease,
  wtrel,
  wtrate,
  wtsync,
  wtdepth,
  wtshape,
  wtdc,
  wtskew,
  warp,
  wavetableWarp,
  warpattack,
  warpatt,
  warpdecay,
  warpdec,
  warpsustain,
  warpsus,
  warprelease,
  warprel,
  warprate,
  warpdepth,
  warpshape,
  warpdc,
  warpskew,
  warpmode,
  wavetableWarpMode,
  wtphaserand,
  wavetablePhaseRand,
  warpenv,
  warpsync,
  source,
  src,
  n,
  i,
  note,
  accelerate,
  velocity,
  vel,
  gain,
  postgain,
  amp,
  fmh,
  fmh1,
  fmh2,
  fmh3,
  fmh4,
  fmh5,
  fmh6,
  fmh7,
  fmh8,
  fmi,
  fmi1,
  fmi2,
  fmi3,
  fmi4,
  fmi5,
  fmi6,
  fmi7,
  fmi8,
  fm,
  fm1,
  fm2,
  fm3,
  fm4,
  fm5,
  fm6,
  fm7,
  fm8,
  fmenv,
  fmenv1,
  fmenv2,
  fmenv3,
  fmenv4,
  fmenv5,
  fmenv6,
  fmenv7,
  fmenv8,
  fme,
  fmattack,
  fmattack1,
  fmattack2,
  fmattack3,
  fmattack4,
  fmattack5,
  fmattack6,
  fmattack7,
  fmattack8,
  fmatt,
  fmatt1,
  fmatt2,
  fmatt3,
  fmatt4,
  fmatt5,
  fmatt6,
  fmatt7,
  fmatt8,
  fmwave,
  fmwave1,
  fmwave2,
  fmwave3,
  fmwave4,
  fmwave5,
  fmwave6,
  fmwave7,
  fmwave8,
  fmdecay,
  fmdecay1,
  fmdecay2,
  fmdecay3,
  fmdecay4,
  fmdecay5,
  fmdecay6,
  fmdecay7,
  fmdecay8,
  fmdec,
  fmdec1,
  fmdec2,
  fmdec3,
  fmdec4,
  fmdec5,
  fmdec6,
  fmdec7,
  fmdec8,
  fmsustain,
  fmsustain1,
  fmsustain2,
  fmsustain3,
  fmsustain4,
  fmsustain5,
  fmsustain6,
  fmsustain7,
  fmsustain8,
  fmsus,
  fmsus1,
  fmsus2,
  fmsus3,
  fmsus4,
  fmsus5,
  fmsus6,
  fmsus7,
  fmsus8,
  fmrelease,
  fmrelease1,
  fmrelease2,
  fmrelease3,
  fmrelease4,
  fmrelease5,
  fmrelease6,
  fmrelease7,
  fmrelease8,
  fmrel,
  fmrel1,
  fmrel2,
  fmrel3,
  fmrel4,
  fmrel5,
  fmrel6,
  fmrel7,
  fmrel8,
  bank,
  chorus,
  analyze,
  fft,
  attack,
  att,
  decay,
  dec,
  sustain,
  sus,
  release,
  rel,
  hold,
  bandf,
  bpf,
  bp,
  bandq,
  bpq,
  begin,
  end,
  loop,
  loopBegin,
  loopb,
  loopEnd,
  loope,
  crush,
  coarse,
  tremolo,
  trem,
  tremolosync,
  tremolodepth,
  tremoloskew,
  tremolophase,
  tremoloshape,
  drive,
  duck,
  duckdepth,
  duckonset,
  duckattack,
  byteBeatExpression,
  bbexpr,
  byteBeatStartTime,
  bbst,
  channels,
  ch,
  pw,
  pwrate,
  pwsweep,
  phaserrate,
  ph,
  phaser,
  phasersweep,
  phs,
  phasercenter,
  phc,
  phaserdepth,
  phd,
  phasdp,
  channel,
  cut,
  cutoff,
  ctf,
  lpf,
  lp,
  lpenv,
  lpe,
  hpenv,
  hpe,
  bpenv,
  bpe,
  lpattack,
  lpa,
  hpattack,
  hpa,
  bpattack,
  bpa,
  lpdecay,
  lpd,
  hpdecay,
  hpd,
  bpdecay,
  bpd,
  lpsustain,
  lps,
  hpsustain,
  hps,
  bpsustain,
  bps,
  lprelease,
  lpr,
  hprelease,
  hpr,
  bprelease,
  bpr,
  ftype,
  fanchor,
  lprate,
  lpsync,
  lpdepth,
  lpdepthfrequency,
  lpdepthfreq,
  lpshape,
  lpdc,
  lpskew,
  bprate,
  bpsync,
  bpdepth,
  bpdepthfrequency,
  bpdepthfreq,
  bpshape,
  bpdc,
  bpskew,
  hprate,
  hpsync,
  hpdepth,
  hpdepthfrequency,
  hpdepthfreq,
  hpshape,
  hpdc,
  hpskew,
  vib,
  vibrato,
  v,
  noise,
  vibmod,
  vmod,
  hcutoff,
  hpf,
  hp,
  hresonance,
  hpq,
  resonance,
  lpq,
  djf,
  delay,
  delayfeedback,
  delayfb,
  dfb,
  delayspeed,
  delaytime,
  delayt,
  dt,
  delaysync,
  lock,
  detune,
  det,
  unison,
  spread,
  dry,
  fadeTime,
  fadeOutTime,
  fadeInTime,
  freq,
  pattack,
  patt,
  pdecay,
  pdec,
  psustain,
  psus,
  prelease,
  prel,
  penv,
  pcurve,
  panchor,
  gate,
  gat,
  leslie,
  lrate,
  lsize,
  activeLabel,
  label,
  degree,
  mtranspose,
  ctranspose,
  harmonic,
  stepsPerOctave,
  octaveR,
  nudge,
  octave,
  oct,
  orbit,
  bus,
  busgain,
  bgain,
  overgain,
  overshape,
  pan,
  panspan,
  pansplay,
  panwidth,
  panorient,
  slide,
  semitone,
  voice,
  chord,
  dictionary,
  dict,
  anchor,
  offset,
  octaves,
  mode,
  room,
  roomlp,
  rlp,
  roomdim,
  rdim,
  roomfade,
  rfade,
  ir,
  iresponse,
  irspeed,
  irbegin,
  roomsize,
  size,
  sz,
  rsize,
  shape,
  distort,
  dist,
  distortvol,
  distorttype,
  compressor,
  compressorKnee,
  compressorRatio,
  compressorAttack,
  compressorRelease,
  speed,
  stretch,
  unit,
  squiz,
  vowel,
  waveloss,
  expression,
  sustainpedal,
  fshift,
  fshiftnote,
  fshiftphase,
  triode,
  krush,
  kcutoff,
  octer,
  octersub,
  octersubsub,
  ring,
  ringf,
  ringdf,
  freeze,
  xsdelay,
  tsdelay,
  real,
  imag,
  enhance,
  comb,
  smear,
  scram,
  binshift,
  hbrick,
  lbrick,
  frameRate,
  frames,
  hours,
  minutes,
  seconds,
  songPtr,
  uid,
  val,
  cps,
  clip,
  legato,
  duration,
  dur,
  zrand,
  curve,
  deltaSlide,
  pitchJump,
  pitchJumpTime,
  znoise,
  zmod,
  zcrush,
  zdelay,
  zzfx,
  color,
  colour,
  createParams,
  adsr,
  ad,
  ds,
  ar,
  midichan,
  midimap,
  midiport,
  midicmd,
  control,
  ccn,
  ccv,
  ctlNum,
  nrpnn,
  nrpv,
  progNum,
  sysex,
  sysexid,
  sysexdata,
  midibend,
  miditouch,
  polyTouch,
  oschost,
  oscport,
  getControlName,
  as,
  scrub,
  lfo,
  env,
  bmod,
  transient,
  FXrelease,
  FXrel,
  FXr,
  fxr,
  controls_exports,
  bjorklund,
  euclid,
  bjork,
  euclidrot,
  euclidRot,
  euclidLegato,
  euclidLegatoRot,
  euclidish,
  eish,
  zyklus_default,
  Cyclist,
  reset_state,
  reset_timelines,
  timeline,
  pick,
  pickmod,
  pickF,
  pickmodF,
  pickOut,
  pickmodOut,
  pickRestart,
  pickmodRestart,
  pickReset,
  pickmodReset,
  inhabit,
  pickSqueeze,
  inhabitmod,
  pickmodSqueeze,
  squeeze,
  getTime,
  setTime,
  setCpsFunc,
  getCps,
  setPattern,
  getPattern,
  setTriggerFunc,
  getTriggerFunc,
  setIsStarted,
  getIsStarted,
  repl,
  getTrigger,
  steady,
  signal,
  saw,
  saw2,
  isaw,
  isaw2,
  sine2,
  sine,
  cosine,
  cosine2,
  square,
  square2,
  tri,
  tri2,
  itri,
  itri2,
  time2 as time,
  mousey,
  mouseY,
  mousex,
  mouseX,
  getRandsAtTime,
  useRNG,
  run,
  binary,
  binaryN,
  binaryL,
  binaryNL,
  randL,
  randrun,
  shuffle,
  scramble,
  withSeed,
  seed,
  rand,
  rand2,
  _brandBy,
  brandBy,
  brand,
  _irand,
  irand,
  __chooseWith,
  chooseWith,
  chooseInWith,
  choose,
  chooseIn,
  chooseOut,
  chooseCycles,
  randcat,
  wchoose,
  wchooseCycles,
  wrandcat,
  perlin,
  berlin,
  degradeByWith,
  degradeBy,
  degrade,
  undegradeBy,
  undegrade,
  sometimesBy,
  sometimes,
  someCyclesBy,
  someCycles,
  often,
  rarely,
  almostNever,
  almostAlways,
  never,
  always,
  _keyDown,
  whenKey,
  keyDown,
  cyclesPer,
  per,
  perCycle,
  perx,
  speak,
  backgroundImage,
  cleanupUi
};
