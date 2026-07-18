import {
  __commonJS,
  __toESM,
  _mod,
  errorLogger,
  getAccidentalsOffset,
  isNote,
  logger,
  noteToMidi,
  register,
  removeUndefineds,
  silence,
  stack
} from "./chunk-7T2QG76H.mjs";

// node_modules/.pnpm/@tonaljs+pitch@5.0.2/node_modules/@tonaljs/pitch/dist/index.js
var require_dist = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch@5.0.2/node_modules/@tonaljs/pitch/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var pitch_exports = {};
    __export(pitch_exports, {
      chroma: () => chroma,
      coordinates: () => coordinates,
      height: () => height,
      isNamedPitch: () => isNamedPitch,
      isPitch: () => isPitch,
      midi: () => midi,
      pitch: () => pitch
    });
    module.exports = __toCommonJS(pitch_exports);
    function isNamedPitch(src) {
      return src !== null && typeof src === "object" && "name" in src && typeof src.name === "string" ? true : false;
    }
    var SIZES = [0, 2, 4, 5, 7, 9, 11];
    var chroma = ({ step, alt }) => (SIZES[step] + alt + 120) % 12;
    var height = ({ step, alt, oct, dir = 1 }) => dir * (SIZES[step] + alt + 12 * (oct === void 0 ? -100 : oct));
    var midi = (pitch2) => {
      const h = height(pitch2);
      return pitch2.oct !== void 0 && h >= -12 && h <= 115 ? h + 12 : null;
    };
    function isPitch(pitch2) {
      return pitch2 !== null && typeof pitch2 === "object" && "step" in pitch2 && typeof pitch2.step === "number" && "alt" in pitch2 && typeof pitch2.alt === "number" && !isNaN(pitch2.step) && !isNaN(pitch2.alt) ? true : false;
    }
    var FIFTHS = [0, 2, 4, -1, 1, 3, 5];
    var STEPS_TO_OCTS = FIFTHS.map(
      (fifths) => Math.floor(fifths * 7 / 12)
    );
    function coordinates(pitch2) {
      const { step, alt, oct, dir = 1 } = pitch2;
      const f = FIFTHS[step] + 7 * alt;
      if (oct === void 0) {
        return [dir * f];
      }
      const o = oct - STEPS_TO_OCTS[step] - 4 * alt;
      return [dir * f, dir * o];
    }
    var FIFTHS_TO_STEPS = [3, 0, 4, 1, 5, 2, 6];
    function pitch(coord) {
      const [f, o, dir] = coord;
      const step = FIFTHS_TO_STEPS[unaltered(f)];
      const alt = Math.floor((f + 1) / 7);
      if (o === void 0) {
        return { step, alt, dir };
      }
      const oct = o + 4 * alt + STEPS_TO_OCTS[step];
      return { step, alt, oct, dir };
    }
    function unaltered(f) {
      const i = (f + 1) % 7;
      return i < 0 ? 7 + i : i;
    }
  }
});

// node_modules/.pnpm/@tonaljs+pitch-interval@6.1.0/node_modules/@tonaljs/pitch-interval/dist/index.js
var require_dist2 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch-interval@6.1.0/node_modules/@tonaljs/pitch-interval/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var pitch_interval_exports = {};
    __export(pitch_interval_exports, {
      coordToInterval: () => coordToInterval,
      interval: () => interval,
      tokenizeInterval: () => tokenizeInterval
    });
    module.exports = __toCommonJS(pitch_interval_exports);
    var import_pitch = require_dist();
    var fillStr = (s, n) => Array(Math.abs(n) + 1).join(s);
    var NoInterval = Object.freeze({
      empty: true,
      name: "",
      num: NaN,
      q: "",
      type: "",
      step: NaN,
      alt: NaN,
      dir: NaN,
      simple: NaN,
      semitones: NaN,
      chroma: NaN,
      coord: [],
      oct: NaN
    });
    var INTERVAL_TONAL_REGEX = "([-+]?\\d+)(d{1,4}|m|M|P|A{1,4})";
    var INTERVAL_SHORTHAND_REGEX = "(AA|A|P|M|m|d|dd)([-+]?\\d+)";
    var REGEX = new RegExp(
      "^" + INTERVAL_TONAL_REGEX + "|" + INTERVAL_SHORTHAND_REGEX + "$"
    );
    function tokenizeInterval(str) {
      const m = REGEX.exec(`${str}`);
      if (m === null) {
        return ["", ""];
      }
      return m[1] ? [m[1], m[2]] : [m[4], m[3]];
    }
    var cache = {};
    function interval(src) {
      return typeof src === "string" ? cache[src] || (cache[src] = parse(src)) : (0, import_pitch.isPitch)(src) ? interval(pitchName(src)) : (0, import_pitch.isNamedPitch)(src) ? interval(src.name) : NoInterval;
    }
    var SIZES = [0, 2, 4, 5, 7, 9, 11];
    var TYPES = "PMMPPMM";
    function parse(str) {
      const tokens = tokenizeInterval(str);
      if (tokens[0] === "") {
        return NoInterval;
      }
      const num = +tokens[0];
      const q = tokens[1];
      const step = (Math.abs(num) - 1) % 7;
      const t = TYPES[step];
      if (t === "M" && q === "P") {
        return NoInterval;
      }
      const type = t === "M" ? "majorable" : "perfectable";
      const name = "" + num + q;
      const dir = num < 0 ? -1 : 1;
      const simple2 = num === 8 || num === -8 ? num : dir * (step + 1);
      const alt = qToAlt(type, q);
      const oct = Math.floor((Math.abs(num) - 1) / 7);
      const semitones = dir * (SIZES[step] + alt + 12 * oct);
      const chroma = (dir * (SIZES[step] + alt) % 12 + 12) % 12;
      const coord = (0, import_pitch.coordinates)({ step, alt, oct, dir });
      return {
        empty: false,
        name,
        num,
        q,
        step,
        alt,
        dir,
        type,
        simple: simple2,
        semitones,
        chroma,
        coord,
        oct
      };
    }
    function coordToInterval(coord, forceDescending) {
      const [f, o = 0] = coord;
      const isDescending = f * 7 + o * 12 < 0;
      const ivl = forceDescending || isDescending ? [-f, -o, -1] : [f, o, 1];
      return interval((0, import_pitch.pitch)(ivl));
    }
    function qToAlt(type, q) {
      return q === "M" && type === "majorable" || q === "P" && type === "perfectable" ? 0 : q === "m" && type === "majorable" ? -1 : /^A+$/.test(q) ? q.length : /^d+$/.test(q) ? -1 * (type === "perfectable" ? q.length : q.length + 1) : 0;
    }
    function pitchName(props) {
      const { step, alt, oct = 0, dir } = props;
      if (!dir) {
        return "";
      }
      const calcNum = step + 1 + 7 * oct;
      const num = calcNum === 0 ? step + 1 : calcNum;
      const d = dir < 0 ? "-" : "";
      const type = TYPES[step] === "M" ? "majorable" : "perfectable";
      const name = d + num + altToQ(type, alt);
      return name;
    }
    function altToQ(type, alt) {
      if (alt === 0) {
        return type === "majorable" ? "M" : "P";
      } else if (alt === -1 && type === "majorable") {
        return "m";
      } else if (alt > 0) {
        return fillStr("A", alt);
      } else {
        return fillStr("d", type === "perfectable" ? alt : alt + 1);
      }
    }
  }
});

// node_modules/.pnpm/@tonaljs+pitch-note@6.1.0/node_modules/@tonaljs/pitch-note/dist/index.js
var require_dist3 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch-note@6.1.0/node_modules/@tonaljs/pitch-note/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
    var pitch_note_exports = {};
    __export(pitch_note_exports, {
      accToAlt: () => accToAlt,
      altToAcc: () => altToAcc,
      coordToNote: () => coordToNote,
      note: () => note,
      stepToLetter: () => stepToLetter,
      tokenizeNote: () => tokenizeNote2
    });
    module.exports = __toCommonJS(pitch_note_exports);
    var import_pitch = require_dist();
    var fillStr = (s, n) => Array(Math.abs(n) + 1).join(s);
    var NoNote = Object.freeze({
      empty: true,
      name: "",
      letter: "",
      acc: "",
      pc: "",
      step: NaN,
      alt: NaN,
      chroma: NaN,
      height: NaN,
      coord: [],
      midi: null,
      freq: null
    });
    var cache = /* @__PURE__ */ new Map();
    var stepToLetter = (step) => "CDEFGAB".charAt(step);
    var altToAcc = (alt) => alt < 0 ? fillStr("b", -alt) : fillStr("#", alt);
    var accToAlt = (acc) => acc[0] === "b" ? -acc.length : acc.length;
    function note(src) {
      const stringSrc = JSON.stringify(src);
      const cached = cache.get(stringSrc);
      if (cached) {
        return cached;
      }
      const value = typeof src === "string" ? parse(src) : (0, import_pitch.isPitch)(src) ? note(pitchName(src)) : (0, import_pitch.isNamedPitch)(src) ? note(src.name) : NoNote;
      cache.set(stringSrc, value);
      return value;
    }
    var REGEX = /^([a-gA-G]?)(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)$/;
    function tokenizeNote2(str) {
      const m = REGEX.exec(str);
      return m ? [m[1].toUpperCase(), m[2].replace(/x/g, "##"), m[3], m[4]] : ["", "", "", ""];
    }
    function coordToNote(noteCoord) {
      return note((0, import_pitch.pitch)(noteCoord));
    }
    var mod = (n, m) => (n % m + m) % m;
    var SEMI = [0, 2, 4, 5, 7, 9, 11];
    function parse(noteName) {
      const tokens = tokenizeNote2(noteName);
      if (tokens[0] === "" || tokens[3] !== "") {
        return NoNote;
      }
      const letter = tokens[0];
      const acc = tokens[1];
      const octStr = tokens[2];
      const step = (letter.charCodeAt(0) + 3) % 7;
      const alt = accToAlt(acc);
      const oct = octStr.length ? +octStr : void 0;
      const coord = (0, import_pitch.coordinates)({ step, alt, oct });
      const name = letter + acc + octStr;
      const pc = letter + acc;
      const chroma = (SEMI[step] + alt + 120) % 12;
      const height = oct === void 0 ? mod(SEMI[step] + alt, 12) - 12 * 99 : SEMI[step] + alt + 12 * (oct + 1);
      const midi = height >= 0 && height <= 127 ? height : null;
      const freq = oct === void 0 ? null : Math.pow(2, (height - 69) / 12) * 440;
      return {
        empty: false,
        acc,
        alt,
        chroma,
        coord,
        freq,
        height,
        letter,
        midi,
        name,
        oct,
        pc,
        step
      };
    }
    function pitchName(props) {
      const { step, alt, oct } = props;
      const letter = stepToLetter(step);
      if (!letter) {
        return "";
      }
      const pc = letter + altToAcc(alt);
      return oct || oct === 0 ? pc + oct : pc;
    }
  }
});

// node_modules/.pnpm/@tonaljs+pitch-distance@5.0.5/node_modules/@tonaljs/pitch-distance/dist/index.js
var require_dist4 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch-distance@5.0.5/node_modules/@tonaljs/pitch-distance/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var pitch_distance_exports = {};
    __export(pitch_distance_exports, {
      distance: () => distance,
      tonicIntervalsTransposer: () => tonicIntervalsTransposer,
      transpose: () => transpose2
    });
    module.exports = __toCommonJS(pitch_distance_exports);
    var import_pitch_interval = require_dist2();
    var import_pitch_note = require_dist3();
    function transpose2(noteName, intervalName) {
      const note = (0, import_pitch_note.note)(noteName);
      const intervalCoord = Array.isArray(intervalName) ? intervalName : (0, import_pitch_interval.interval)(intervalName).coord;
      if (note.empty || !intervalCoord || intervalCoord.length < 2) {
        return "";
      }
      const noteCoord = note.coord;
      const tr = noteCoord.length === 1 ? [noteCoord[0] + intervalCoord[0]] : [noteCoord[0] + intervalCoord[0], noteCoord[1] + intervalCoord[1]];
      return (0, import_pitch_note.coordToNote)(tr).name;
    }
    function tonicIntervalsTransposer(intervals, tonic) {
      const len = intervals.length;
      return (normalized) => {
        if (!tonic) return "";
        const index = normalized < 0 ? (len - -normalized % len) % len : normalized % len;
        const octaves = Math.floor(normalized / len);
        const root = transpose2(tonic, [0, octaves]);
        return transpose2(root, intervals[index]);
      };
    }
    function distance(fromNote, toNote) {
      const from = (0, import_pitch_note.note)(fromNote);
      const to = (0, import_pitch_note.note)(toNote);
      if (from.empty || to.empty) {
        return "";
      }
      const fcoord = from.coord;
      const tcoord = to.coord;
      const fifths = tcoord[0] - fcoord[0];
      const octs = fcoord.length === 2 && tcoord.length === 2 ? tcoord[1] - fcoord[1] : -Math.floor(fifths * 7 / 12);
      const forceDescending = to.height === from.height && to.midi !== null && from.oct === to.oct && from.step > to.step;
      return (0, import_pitch_interval.coordToInterval)([fifths, octs], forceDescending).name;
    }
  }
});

// node_modules/.pnpm/@tonaljs+abc-notation@4.9.1/node_modules/@tonaljs/abc-notation/dist/index.js
var require_dist5 = __commonJS({
  "node_modules/.pnpm/@tonaljs+abc-notation@4.9.1/node_modules/@tonaljs/abc-notation/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var abc_notation_exports = {};
    __export(abc_notation_exports, {
      abcToScientificNotation: () => abcToScientificNotation,
      default: () => abc_notation_default,
      distance: () => distance,
      scientificToAbcNotation: () => scientificToAbcNotation,
      tokenize: () => tokenize,
      transpose: () => transpose2
    });
    module.exports = __toCommonJS(abc_notation_exports);
    var import_pitch_distance = require_dist4();
    var import_pitch_note = require_dist3();
    var fillStr = (character, times) => Array(times + 1).join(character);
    var REGEX = /^(_{1,}|=|\^{1,}|)([abcdefgABCDEFG])([,']*)$/;
    function tokenize(str) {
      const m = REGEX.exec(str);
      if (!m) {
        return ["", "", ""];
      }
      return [m[1], m[2], m[3]];
    }
    function abcToScientificNotation(str) {
      const [acc, letter, oct] = tokenize(str);
      if (letter === "") {
        return "";
      }
      let o = 4;
      for (let i = 0; i < oct.length; i++) {
        o += oct.charAt(i) === "," ? -1 : 1;
      }
      const a = acc[0] === "_" ? acc.replace(/_/g, "b") : acc[0] === "^" ? acc.replace(/\^/g, "#") : "";
      return letter.charCodeAt(0) > 96 ? letter.toUpperCase() + a + (o + 1) : letter + a + o;
    }
    function scientificToAbcNotation(str) {
      const n = (0, import_pitch_note.note)(str);
      if (n.empty || !n.oct && n.oct !== 0) {
        return "";
      }
      const { letter, acc, oct } = n;
      const a = acc[0] === "b" ? acc.replace(/b/g, "_") : acc.replace(/#/g, "^");
      const l = oct > 4 ? letter.toLowerCase() : letter;
      const o = oct === 5 ? "" : oct > 4 ? fillStr("'", oct - 5) : fillStr(",", 4 - oct);
      return a + l + o;
    }
    function transpose2(note2, interval) {
      return scientificToAbcNotation((0, import_pitch_distance.transpose)(abcToScientificNotation(note2), interval));
    }
    function distance(from, to) {
      return (0, import_pitch_distance.distance)(abcToScientificNotation(from), abcToScientificNotation(to));
    }
    var abc_notation_default = {
      abcToScientificNotation,
      scientificToAbcNotation,
      tokenize,
      transpose: transpose2,
      distance
    };
  }
});

// node_modules/.pnpm/@tonaljs+array@4.8.4/node_modules/@tonaljs/array/dist/index.js
var require_dist6 = __commonJS({
  "node_modules/.pnpm/@tonaljs+array@4.8.4/node_modules/@tonaljs/array/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var array_exports = {};
    __export(array_exports, {
      compact: () => compact,
      permutations: () => permutations,
      range: () => range,
      rotate: () => rotate,
      shuffle: () => shuffle,
      sortedNoteNames: () => sortedNoteNames,
      sortedUniqNoteNames: () => sortedUniqNoteNames
    });
    module.exports = __toCommonJS(array_exports);
    var import_pitch_note = require_dist3();
    function ascR(b, n) {
      const a = [];
      for (; n--; a[n] = n + b) ;
      return a;
    }
    function descR(b, n) {
      const a = [];
      for (; n--; a[n] = b - n) ;
      return a;
    }
    function range(from, to) {
      return from < to ? ascR(from, to - from + 1) : descR(from, from - to + 1);
    }
    function rotate(times, arr) {
      const len = arr.length;
      const n = (times % len + len) % len;
      return arr.slice(n, len).concat(arr.slice(0, n));
    }
    function compact(arr) {
      return arr.filter((n) => n === 0 || n);
    }
    function sortedNoteNames(notes) {
      const valid = notes.map((n) => (0, import_pitch_note.note)(n)).filter((n) => !n.empty);
      return valid.sort((a, b) => a.height - b.height).map((n) => n.name);
    }
    function sortedUniqNoteNames(arr) {
      return sortedNoteNames(arr).filter((n, i, a) => i === 0 || n !== a[i - 1]);
    }
    function shuffle(arr, rnd = Math.random) {
      let i;
      let t;
      let m = arr.length;
      while (m) {
        i = Math.floor(rnd() * m--);
        t = arr[m];
        arr[m] = arr[i];
        arr[i] = t;
      }
      return arr;
    }
    function permutations(arr) {
      if (arr.length === 0) {
        return [[]];
      }
      return permutations(arr.slice(1)).reduce((acc, perm) => {
        return acc.concat(
          arr.map((e, pos) => {
            const newPerm = perm.slice();
            newPerm.splice(pos, 0, arr[0]);
            return newPerm;
          })
        );
      }, []);
    }
  }
});

// node_modules/.pnpm/@tonaljs+collection@4.9.0/node_modules/@tonaljs/collection/dist/index.js
var require_dist7 = __commonJS({
  "node_modules/.pnpm/@tonaljs+collection@4.9.0/node_modules/@tonaljs/collection/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var collection_exports = {};
    __export(collection_exports, {
      compact: () => compact,
      default: () => collection_default,
      permutations: () => permutations,
      range: () => range,
      rotate: () => rotate,
      shuffle: () => shuffle
    });
    module.exports = __toCommonJS(collection_exports);
    function ascR(b, n) {
      const a = [];
      for (; n--; a[n] = n + b) ;
      return a;
    }
    function descR(b, n) {
      const a = [];
      for (; n--; a[n] = b - n) ;
      return a;
    }
    function range(from, to) {
      return from < to ? ascR(from, to - from + 1) : descR(from, from - to + 1);
    }
    function rotate(times, arr) {
      const len = arr.length;
      const n = (times % len + len) % len;
      return arr.slice(n, len).concat(arr.slice(0, n));
    }
    function compact(arr) {
      return arr.filter((n) => n === 0 || n);
    }
    function shuffle(arr, rnd = Math.random) {
      let i;
      let t;
      let m = arr.length;
      while (m) {
        i = Math.floor(rnd() * m--);
        t = arr[m];
        arr[m] = arr[i];
        arr[i] = t;
      }
      return arr;
    }
    function permutations(arr) {
      if (arr.length === 0) {
        return [[]];
      }
      return permutations(arr.slice(1)).reduce((acc, perm) => {
        return acc.concat(
          arr.map((e, pos) => {
            const newPerm = perm.slice();
            newPerm.splice(pos, 0, arr[0]);
            return newPerm;
          })
        );
      }, []);
    }
    var collection_default = {
      compact,
      permutations,
      range,
      rotate,
      shuffle
    };
  }
});

// node_modules/.pnpm/@tonaljs+pcset@4.10.1/node_modules/@tonaljs/pcset/dist/index.js
var require_dist8 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pcset@4.10.1/node_modules/@tonaljs/pcset/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var pcset_exports = {};
    __export(pcset_exports, {
      EmptyPcset: () => EmptyPcset,
      chroma: () => chroma,
      chromas: () => chromas,
      default: () => pcset_default,
      filter: () => filter,
      get: () => get,
      includes: () => includes,
      intervals: () => intervals,
      isChroma: () => isChroma,
      isEqual: () => isEqual,
      isNoteIncludedIn: () => isNoteIncludedIn,
      isSubsetOf: () => isSubsetOf,
      isSupersetOf: () => isSupersetOf,
      modes: () => modes,
      notes: () => notes,
      num: () => num,
      pcset: () => pcset
    });
    module.exports = __toCommonJS(pcset_exports);
    var import_collection = require_dist7();
    var import_pitch_distance = require_dist4();
    var import_pitch_interval = require_dist2();
    var import_pitch_note = require_dist3();
    var EmptyPcset = {
      empty: true,
      name: "",
      setNum: 0,
      chroma: "000000000000",
      normalized: "000000000000",
      intervals: []
    };
    var setNumToChroma = (num2) => Number(num2).toString(2).padStart(12, "0");
    var chromaToNumber = (chroma2) => parseInt(chroma2, 2);
    var REGEX = /^[01]{12}$/;
    function isChroma(set) {
      return REGEX.test(set);
    }
    var isPcsetNum = (set) => typeof set === "number" && set >= 0 && set <= 4095;
    var isPcset = (set) => set && isChroma(set.chroma);
    var cache = { [EmptyPcset.chroma]: EmptyPcset };
    function get(src) {
      const chroma2 = isChroma(src) ? src : isPcsetNum(src) ? setNumToChroma(src) : Array.isArray(src) ? listToChroma(src) : isPcset(src) ? src.chroma : EmptyPcset.chroma;
      return cache[chroma2] = cache[chroma2] || chromaToPcset(chroma2);
    }
    var pcset = get;
    var chroma = (set) => get(set).chroma;
    var intervals = (set) => get(set).intervals;
    var num = (set) => get(set).setNum;
    var IVLS = [
      "1P",
      "2m",
      "2M",
      "3m",
      "3M",
      "4P",
      "5d",
      "5P",
      "6m",
      "6M",
      "7m",
      "7M"
    ];
    function chromaToIntervals(chroma2) {
      const intervals2 = [];
      for (let i = 0; i < 12; i++) {
        if (chroma2.charAt(i) === "1") intervals2.push(IVLS[i]);
      }
      return intervals2;
    }
    function notes(set) {
      return get(set).intervals.map((ivl) => (0, import_pitch_distance.transpose)("C", ivl));
    }
    function chromas() {
      return (0, import_collection.range)(2048, 4095).map(setNumToChroma);
    }
    function modes(set, normalize = true) {
      const pcs2 = get(set);
      const binary = pcs2.chroma.split("");
      return (0, import_collection.compact)(
        binary.map((_, i) => {
          const r = (0, import_collection.rotate)(i, binary);
          return normalize && r[0] === "0" ? null : r.join("");
        })
      );
    }
    function isEqual(s1, s2) {
      return get(s1).setNum === get(s2).setNum;
    }
    function isSubsetOf(set) {
      const s = get(set).setNum;
      return (notes2) => {
        const o = get(notes2).setNum;
        return s && s !== o && (o & s) === o;
      };
    }
    function isSupersetOf(set) {
      const s = get(set).setNum;
      return (notes2) => {
        const o = get(notes2).setNum;
        return s && s !== o && (o | s) === o;
      };
    }
    function isNoteIncludedIn(set) {
      const s = get(set);
      return (noteName) => {
        const n = (0, import_pitch_note.note)(noteName);
        return s && !n.empty && s.chroma.charAt(n.chroma) === "1";
      };
    }
    var includes = isNoteIncludedIn;
    function filter(set) {
      const isIncluded = isNoteIncludedIn(set);
      return (notes2) => {
        return notes2.filter(isIncluded);
      };
    }
    var pcset_default = {
      get,
      chroma,
      num,
      intervals,
      chromas,
      isSupersetOf,
      isSubsetOf,
      isNoteIncludedIn,
      isEqual,
      filter,
      modes,
      notes,
      // deprecated
      pcset
    };
    function chromaRotations(chroma2) {
      const binary = chroma2.split("");
      return binary.map((_, i) => (0, import_collection.rotate)(i, binary).join(""));
    }
    function chromaToPcset(chroma2) {
      const setNum = chromaToNumber(chroma2);
      const normalizedNum = chromaRotations(chroma2).map(chromaToNumber).filter((n) => n >= 2048).sort()[0];
      const normalized = setNumToChroma(normalizedNum);
      const intervals2 = chromaToIntervals(chroma2);
      return {
        empty: false,
        name: "",
        setNum,
        chroma: chroma2,
        normalized,
        intervals: intervals2
      };
    }
    function listToChroma(set) {
      if (set.length === 0) {
        return EmptyPcset.chroma;
      }
      let pitch;
      const binary = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < set.length; i++) {
        pitch = (0, import_pitch_note.note)(set[i]);
        if (pitch.empty) pitch = (0, import_pitch_interval.interval)(set[i]);
        if (!pitch.empty) binary[pitch.chroma] = 1;
      }
      return binary.join("");
    }
  }
});

// node_modules/.pnpm/@tonaljs+chord-type@5.1.1/node_modules/@tonaljs/chord-type/dist/index.js
var require_dist9 = __commonJS({
  "node_modules/.pnpm/@tonaljs+chord-type@5.1.1/node_modules/@tonaljs/chord-type/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all2) => {
      for (var name in all2)
        __defProp(target, name, { get: all2[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var chord_type_exports = {};
    __export(chord_type_exports, {
      add: () => add,
      addAlias: () => addAlias,
      all: () => all,
      chordType: () => chordType,
      default: () => chord_type_default,
      entries: () => entries,
      get: () => get,
      keys: () => keys,
      names: () => names,
      removeAll: () => removeAll,
      symbols: () => symbols
    });
    module.exports = __toCommonJS(chord_type_exports);
    var import_pcset = require_dist8();
    var CHORDS = [
      // ==Major==
      ["1P 3M 5P", "major", "M ^  maj"],
      ["1P 3M 5P 7M", "major seventh", "maj7 \u0394 ma7 M7 Maj7 ^7"],
      ["1P 3M 5P 7M 9M", "major ninth", "maj9 \u03949 ^9"],
      ["1P 3M 5P 7M 9M 13M", "major thirteenth", "maj13 Maj13 ^13"],
      ["1P 3M 5P 6M", "sixth", "6 add6 add13 M6"],
      ["1P 3M 5P 6M 9M", "sixth added ninth", "6add9 6/9 69 M69"],
      ["1P 3M 6m 7M", "major seventh flat sixth", "M7b6 ^7b6"],
      [
        "1P 3M 5P 7M 11A",
        "major seventh sharp eleventh",
        "maj#4 \u0394#4 \u0394#11 M7#11 ^7#11 maj7#11"
      ],
      // ==Minor==
      // '''Normal'''
      ["1P 3m 5P", "minor", "m min -"],
      ["1P 3m 5P 7m", "minor seventh", "m7 min7 mi7 -7"],
      [
        "1P 3m 5P 7M",
        "minor/major seventh",
        "m/ma7 m/maj7 mM7 mMaj7 m/M7 -\u03947 m\u0394 -^7 -maj7"
      ],
      ["1P 3m 5P 6M", "minor sixth", "m6 -6"],
      ["1P 3m 5P 7m 9M", "minor ninth", "m9 -9"],
      ["1P 3m 5P 7M 9M", "minor/major ninth", "mM9 mMaj9 -^9"],
      ["1P 3m 5P 7m 9M 11P", "minor eleventh", "m11 -11"],
      ["1P 3m 5P 7m 9M 13M", "minor thirteenth", "m13 -13"],
      // '''Diminished'''
      ["1P 3m 5d", "diminished", "dim \xB0 o"],
      ["1P 3m 5d 7d", "diminished seventh", "dim7 \xB07 o7"],
      ["1P 3m 5d 7m", "half-diminished", "m7b5 \xF8 -7b5 h7 h"],
      // ==Dominant/Seventh==
      // '''Normal'''
      ["1P 3M 5P 7m", "dominant seventh", "7 dom"],
      ["1P 3M 5P 7m 9M", "dominant ninth", "9"],
      ["1P 3M 5P 7m 9M 13M", "dominant thirteenth", "13"],
      ["1P 3M 5P 7m 11A", "lydian dominant seventh", "7#11 7#4"],
      // '''Altered'''
      ["1P 3M 5P 7m 9m", "dominant flat ninth", "7b9"],
      ["1P 3M 5P 7m 9A", "dominant sharp ninth", "7#9"],
      ["1P 3M 7m 9m", "altered", "alt7"],
      // '''Suspended'''
      ["1P 4P 5P", "suspended fourth", "sus4 sus"],
      ["1P 2M 5P", "suspended second", "sus2"],
      ["1P 4P 5P 7m", "suspended fourth seventh", "7sus4 7sus"],
      ["1P 5P 7m 9M 11P", "eleventh", "11"],
      [
        "1P 4P 5P 7m 9m",
        "suspended fourth flat ninth",
        "b9sus phryg 7b9sus 7b9sus4"
      ],
      // ==Other==
      ["1P 5P", "fifth", "5"],
      ["1P 3M 5A", "augmented", "aug + +5 ^#5"],
      ["1P 3m 5A", "minor augmented", "m#5 -#5 m+"],
      ["1P 3M 5A 7M", "augmented seventh", "maj7#5 maj7+5 +maj7 ^7#5"],
      [
        "1P 3M 5P 7M 9M 11A",
        "major sharp eleventh (lydian)",
        "maj9#11 \u03949#11 ^9#11"
      ],
      // ==Legacy==
      ["1P 2M 4P 5P", "", "sus24 sus4add9"],
      ["1P 3M 5A 7M 9M", "", "maj9#5 Maj9#5"],
      ["1P 3M 5A 7m", "", "7#5 +7 7+ 7aug aug7"],
      ["1P 3M 5A 7m 9A", "", "7#5#9 7#9#5 7alt"],
      ["1P 3M 5A 7m 9M", "", "9#5 9+"],
      ["1P 3M 5A 7m 9M 11A", "", "9#5#11"],
      ["1P 3M 5A 7m 9m", "", "7#5b9 7b9#5"],
      ["1P 3M 5A 7m 9m 11A", "", "7#5b9#11"],
      ["1P 3M 5A 9A", "", "+add#9"],
      ["1P 3M 5A 9M", "", "M#5add9 +add9"],
      ["1P 3M 5P 6M 11A", "", "M6#11 M6b5 6#11 6b5"],
      ["1P 3M 5P 6M 7M 9M", "", "M7add13"],
      ["1P 3M 5P 6M 9M 11A", "", "69#11"],
      ["1P 3m 5P 6M 9M", "", "m69 -69"],
      ["1P 3M 5P 6m 7m", "", "7b6"],
      ["1P 3M 5P 7M 9A 11A", "", "maj7#9#11"],
      ["1P 3M 5P 7M 9M 11A 13M", "", "M13#11 maj13#11 M13+4 M13#4"],
      ["1P 3M 5P 7M 9m", "", "M7b9"],
      ["1P 3M 5P 7m 11A 13m", "", "7#11b13 7b5b13"],
      ["1P 3M 5P 7m 13M", "", "7add6 67 7add13"],
      ["1P 3M 5P 7m 9A 11A", "", "7#9#11 7b5#9 7#9b5"],
      ["1P 3M 5P 7m 9A 11A 13M", "", "13#9#11"],
      ["1P 3M 5P 7m 9A 11A 13m", "", "7#9#11b13"],
      ["1P 3M 5P 7m 9A 13M", "", "13#9"],
      ["1P 3M 5P 7m 9A 13m", "", "7#9b13"],
      ["1P 3M 5P 7m 9M 11A", "", "9#11 9+4 9#4"],
      ["1P 3M 5P 7m 9M 11A 13M", "", "13#11 13+4 13#4"],
      ["1P 3M 5P 7m 9M 11A 13m", "", "9#11b13 9b5b13"],
      ["1P 3M 5P 7m 9m 11A", "", "7b9#11 7b5b9 7b9b5"],
      ["1P 3M 5P 7m 9m 11A 13M", "", "13b9#11"],
      ["1P 3M 5P 7m 9m 11A 13m", "", "7b9b13#11 7b9#11b13 7b5b9b13"],
      ["1P 3M 5P 7m 9m 13M", "", "13b9"],
      ["1P 3M 5P 7m 9m 13m", "", "7b9b13"],
      ["1P 3M 5P 7m 9m 9A", "", "7b9#9"],
      ["1P 3M 5P 9M", "", "Madd9 2 add9 add2"],
      ["1P 3M 5P 9m", "", "Maddb9"],
      ["1P 3M 5d", "", "Mb5"],
      ["1P 3M 5d 6M 7m 9M", "", "13b5"],
      ["1P 3M 5d 7M", "", "M7b5"],
      ["1P 3M 5d 7M 9M", "", "M9b5"],
      ["1P 3M 5d 7m", "", "7b5"],
      ["1P 3M 5d 7m 9M", "", "9b5"],
      ["1P 3M 7m", "", "7no5"],
      ["1P 3M 7m 13m", "", "7b13"],
      ["1P 3M 7m 9M", "", "9no5"],
      ["1P 3M 7m 9M 13M", "", "13no5"],
      ["1P 3M 7m 9M 13m", "", "9b13"],
      ["1P 3m 4P 5P", "", "madd4"],
      ["1P 3m 5P 6m 7M", "", "mMaj7b6"],
      ["1P 3m 5P 6m 7M 9M", "", "mMaj9b6"],
      ["1P 3m 5P 7m 11P", "", "m7add11 m7add4"],
      ["1P 3m 5P 9M", "", "madd9"],
      ["1P 3m 5d 6M 7M", "", "o7M7"],
      ["1P 3m 5d 7M", "", "oM7"],
      ["1P 3m 6m 7M", "", "mb6M7"],
      ["1P 3m 6m 7m", "", "m7#5"],
      ["1P 3m 6m 7m 9M", "", "m9#5"],
      ["1P 3m 5A 7m 9M 11P", "", "m11A"],
      ["1P 3m 6m 9m", "", "mb6b9"],
      ["1P 2M 3m 5d 7m", "", "m9b5"],
      ["1P 4P 5A 7M", "", "M7#5sus4"],
      ["1P 4P 5A 7M 9M", "", "M9#5sus4"],
      ["1P 4P 5A 7m", "", "7#5sus4"],
      ["1P 4P 5P 7M", "", "M7sus4"],
      ["1P 4P 5P 7M 9M", "", "M9sus4"],
      ["1P 4P 5P 7m 9M", "", "9sus4 9sus"],
      ["1P 4P 5P 7m 9M 13M", "", "13sus4 13sus"],
      ["1P 4P 5P 7m 9m 13m", "", "7sus4b9b13 7b9b13sus4"],
      ["1P 4P 7m 10m", "", "4 quartal"],
      ["1P 5P 7m 9m 11P", "", "11b9"]
    ];
    var data_default = CHORDS;
    var NoChordType = {
      ...import_pcset.EmptyPcset,
      name: "",
      quality: "Unknown",
      intervals: [],
      aliases: []
    };
    var dictionary = [];
    var index = {};
    function get(type) {
      return index[type] || NoChordType;
    }
    var chordType = get;
    function names() {
      return dictionary.map((chord) => chord.name).filter((x) => x);
    }
    function symbols() {
      return dictionary.map((chord) => chord.aliases[0]).filter((x) => x);
    }
    function keys() {
      return Object.keys(index);
    }
    function all() {
      return dictionary.slice();
    }
    var entries = all;
    function removeAll() {
      dictionary = [];
      index = {};
    }
    function add(intervals, aliases, fullName) {
      const quality = getQuality(intervals);
      const chord = {
        ...(0, import_pcset.get)(intervals),
        name: fullName || "",
        quality,
        intervals,
        aliases
      };
      dictionary.push(chord);
      if (chord.name) {
        index[chord.name] = chord;
      }
      index[chord.setNum] = chord;
      index[chord.chroma] = chord;
      chord.aliases.forEach((alias) => addAlias(chord, alias));
    }
    function addAlias(chord, alias) {
      index[alias] = chord;
    }
    function getQuality(intervals) {
      const has = (interval) => intervals.indexOf(interval) !== -1;
      return has("5A") ? "Augmented" : has("3M") ? "Major" : has("5d") ? "Diminished" : has("3m") ? "Minor" : "Unknown";
    }
    data_default.forEach(
      ([ivls, fullName, names2]) => add(ivls.split(" "), names2.split(" "), fullName)
    );
    dictionary.sort((a, b) => a.setNum - b.setNum);
    var chord_type_default = {
      names,
      symbols,
      get,
      all,
      add,
      removeAll,
      keys,
      // deprecated
      entries,
      chordType
    };
  }
});

// node_modules/.pnpm/@tonaljs+chord-detect@4.9.1/node_modules/@tonaljs/chord-detect/dist/index.js
var require_dist10 = __commonJS({
  "node_modules/.pnpm/@tonaljs+chord-detect@4.9.1/node_modules/@tonaljs/chord-detect/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all2) => {
      for (var name in all2)
        __defProp(target, name, { get: all2[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var chord_detect_exports = {};
    __export(chord_detect_exports, {
      default: () => chord_detect_default,
      detect: () => detect2
    });
    module.exports = __toCommonJS(chord_detect_exports);
    var import_chord_type = require_dist9();
    var import_pcset = require_dist8();
    var import_pitch_note = require_dist3();
    var namedSet = (notes) => {
      const pcToName = notes.reduce((record, n) => {
        const chroma = (0, import_pitch_note.note)(n).chroma;
        if (chroma !== void 0) {
          record[chroma] = record[chroma] || (0, import_pitch_note.note)(n).name;
        }
        return record;
      }, {});
      return (chroma) => pcToName[chroma];
    };
    function detect2(source, options = {}) {
      const notes = source.map((n) => (0, import_pitch_note.note)(n).pc).filter((x) => x);
      if (import_pitch_note.note.length === 0) {
        return [];
      }
      const found = findMatches(notes, 1, options);
      return found.filter((chord) => chord.weight).sort((a, b) => b.weight - a.weight).map((chord) => chord.name);
    }
    var BITMASK = {
      // 3m 000100000000
      // 3M 000010000000
      anyThirds: 384,
      // 5P 000000010000
      perfectFifth: 16,
      // 5d 000000100000
      // 5A 000000001000
      nonPerfectFifths: 40,
      anySeventh: 3
    };
    var testChromaNumber = (bitmask) => (chromaNumber) => Boolean(chromaNumber & bitmask);
    var hasAnyThird = testChromaNumber(BITMASK.anyThirds);
    var hasPerfectFifth = testChromaNumber(BITMASK.perfectFifth);
    var hasAnySeventh = testChromaNumber(BITMASK.anySeventh);
    var hasNonPerfectFifth = testChromaNumber(BITMASK.nonPerfectFifths);
    function hasAnyThirdAndPerfectFifthAndAnySeventh(chordType) {
      const chromaNumber = parseInt(chordType.chroma, 2);
      return hasAnyThird(chromaNumber) && hasPerfectFifth(chromaNumber) && hasAnySeventh(chromaNumber);
    }
    function withPerfectFifth(chroma) {
      const chromaNumber = parseInt(chroma, 2);
      return hasNonPerfectFifth(chromaNumber) ? chroma : (chromaNumber | 16).toString(2);
    }
    function findMatches(notes, weight, options) {
      const tonic = notes[0];
      const tonicChroma = (0, import_pitch_note.note)(tonic).chroma;
      const noteName = namedSet(notes);
      const allModes = (0, import_pcset.modes)(notes, false);
      const found = [];
      allModes.forEach((mode, index) => {
        const modeWithPerfectFifth = options.assumePerfectFifth && withPerfectFifth(mode);
        const chordTypes = (0, import_chord_type.all)().filter((chordType) => {
          if (options.assumePerfectFifth && hasAnyThirdAndPerfectFifthAndAnySeventh(chordType)) {
            return chordType.chroma === modeWithPerfectFifth;
          }
          return chordType.chroma === mode;
        });
        chordTypes.forEach((chordType) => {
          const chordName = chordType.aliases[0];
          const baseNote = noteName(index);
          const isInversion = index !== tonicChroma;
          if (isInversion) {
            found.push({
              weight: 0.5 * weight,
              name: `${baseNote}${chordName}/${tonic}`
            });
          } else {
            found.push({ weight: 1 * weight, name: `${baseNote}${chordName}` });
          }
        });
      });
      return found;
    }
    var chord_detect_default = { detect: detect2 };
  }
});

// node_modules/.pnpm/@tonaljs+pitch@5.0.1/node_modules/@tonaljs/pitch/dist/index.js
var require_dist11 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch@5.0.1/node_modules/@tonaljs/pitch/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var pitch_exports = {};
    __export(pitch_exports, {
      chroma: () => chroma,
      coordinates: () => coordinates,
      height: () => height,
      isNamedPitch: () => isNamedPitch,
      isPitch: () => isPitch,
      midi: () => midi,
      pitch: () => pitch
    });
    module.exports = __toCommonJS(pitch_exports);
    function isNamedPitch(src) {
      return src !== null && typeof src === "object" && "name" in src && typeof src.name === "string" ? true : false;
    }
    var SIZES = [0, 2, 4, 5, 7, 9, 11];
    var chroma = ({ step, alt }) => (SIZES[step] + alt + 120) % 12;
    var height = ({ step, alt, oct, dir = 1 }) => dir * (SIZES[step] + alt + 12 * (oct === void 0 ? -100 : oct));
    var midi = (pitch2) => {
      const h = height(pitch2);
      return pitch2.oct !== void 0 && h >= -12 && h <= 115 ? h + 12 : null;
    };
    function isPitch(pitch2) {
      return pitch2 !== null && typeof pitch2 === "object" && "step" in pitch2 && typeof pitch2.step === "number" && "alt" in pitch2 && typeof pitch2.alt === "number" ? true : false;
    }
    var FIFTHS = [0, 2, 4, -1, 1, 3, 5];
    var STEPS_TO_OCTS = FIFTHS.map(
      (fifths) => Math.floor(fifths * 7 / 12)
    );
    function coordinates(pitch2) {
      const { step, alt, oct, dir = 1 } = pitch2;
      const f = FIFTHS[step] + 7 * alt;
      if (oct === void 0) {
        return [dir * f];
      }
      const o = oct - STEPS_TO_OCTS[step] - 4 * alt;
      return [dir * f, dir * o];
    }
    var FIFTHS_TO_STEPS = [3, 0, 4, 1, 5, 2, 6];
    function pitch(coord) {
      const [f, o, dir] = coord;
      const step = FIFTHS_TO_STEPS[unaltered(f)];
      const alt = Math.floor((f + 1) / 7);
      if (o === void 0) {
        return { step, alt, dir };
      }
      const oct = o + 4 * alt + STEPS_TO_OCTS[step];
      return { step, alt, oct, dir };
    }
    function unaltered(f) {
      const i = (f + 1) % 7;
      return i < 0 ? 7 + i : i;
    }
  }
});

// node_modules/.pnpm/@tonaljs+pitch-interval@5.0.2/node_modules/@tonaljs/pitch-interval/dist/index.js
var require_dist12 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch-interval@5.0.2/node_modules/@tonaljs/pitch-interval/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var pitch_interval_exports = {};
    __export(pitch_interval_exports, {
      coordToInterval: () => coordToInterval,
      interval: () => interval,
      tokenizeInterval: () => tokenizeInterval
    });
    module.exports = __toCommonJS(pitch_interval_exports);
    var import_pitch = require_dist11();
    var fillStr = (s, n) => Array(Math.abs(n) + 1).join(s);
    var NoInterval = { empty: true, name: "", acc: "" };
    var INTERVAL_TONAL_REGEX = "([-+]?\\d+)(d{1,4}|m|M|P|A{1,4})";
    var INTERVAL_SHORTHAND_REGEX = "(AA|A|P|M|m|d|dd)([-+]?\\d+)";
    var REGEX = new RegExp(
      "^" + INTERVAL_TONAL_REGEX + "|" + INTERVAL_SHORTHAND_REGEX + "$"
    );
    function tokenizeInterval(str) {
      const m = REGEX.exec(`${str}`);
      if (m === null) {
        return ["", ""];
      }
      return m[1] ? [m[1], m[2]] : [m[4], m[3]];
    }
    var cache = {};
    function interval(src) {
      return typeof src === "string" ? cache[src] || (cache[src] = parse(src)) : (0, import_pitch.isPitch)(src) ? interval(pitchName(src)) : (0, import_pitch.isNamedPitch)(src) ? interval(src.name) : NoInterval;
    }
    var SIZES = [0, 2, 4, 5, 7, 9, 11];
    var TYPES = "PMMPPMM";
    function parse(str) {
      const tokens = tokenizeInterval(str);
      if (tokens[0] === "") {
        return NoInterval;
      }
      const num = +tokens[0];
      const q = tokens[1];
      const step = (Math.abs(num) - 1) % 7;
      const t = TYPES[step];
      if (t === "M" && q === "P") {
        return NoInterval;
      }
      const type = t === "M" ? "majorable" : "perfectable";
      const name = "" + num + q;
      const dir = num < 0 ? -1 : 1;
      const simple2 = num === 8 || num === -8 ? num : dir * (step + 1);
      const alt = qToAlt(type, q);
      const oct = Math.floor((Math.abs(num) - 1) / 7);
      const semitones = dir * (SIZES[step] + alt + 12 * oct);
      const chroma = (dir * (SIZES[step] + alt) % 12 + 12) % 12;
      const coord = (0, import_pitch.coordinates)({ step, alt, oct, dir });
      return {
        empty: false,
        name,
        num,
        q,
        step,
        alt,
        dir,
        type,
        simple: simple2,
        semitones,
        chroma,
        coord,
        oct
      };
    }
    function coordToInterval(coord, forceDescending) {
      const [f, o = 0] = coord;
      const isDescending = f * 7 + o * 12 < 0;
      const ivl = forceDescending || isDescending ? [-f, -o, -1] : [f, o, 1];
      return interval((0, import_pitch.pitch)(ivl));
    }
    function qToAlt(type, q) {
      return q === "M" && type === "majorable" || q === "P" && type === "perfectable" ? 0 : q === "m" && type === "majorable" ? -1 : /^A+$/.test(q) ? q.length : /^d+$/.test(q) ? -1 * (type === "perfectable" ? q.length : q.length + 1) : 0;
    }
    function pitchName(props) {
      const { step, alt, oct = 0, dir } = props;
      if (!dir) {
        return "";
      }
      const calcNum = step + 1 + 7 * oct;
      const num = calcNum === 0 ? step + 1 : calcNum;
      const d = dir < 0 ? "-" : "";
      const type = TYPES[step] === "M" ? "majorable" : "perfectable";
      const name = d + num + altToQ(type, alt);
      return name;
    }
    function altToQ(type, alt) {
      if (alt === 0) {
        return type === "majorable" ? "M" : "P";
      } else if (alt === -1 && type === "majorable") {
        return "m";
      } else if (alt > 0) {
        return fillStr("A", alt);
      } else {
        return fillStr("d", type === "perfectable" ? alt : alt + 1);
      }
    }
  }
});

// node_modules/.pnpm/@tonaljs+pitch-note@5.0.3/node_modules/@tonaljs/pitch-note/dist/index.js
var require_dist13 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch-note@5.0.3/node_modules/@tonaljs/pitch-note/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
    var pitch_note_exports = {};
    __export(pitch_note_exports, {
      accToAlt: () => accToAlt,
      altToAcc: () => altToAcc,
      coordToNote: () => coordToNote,
      note: () => note,
      stepToLetter: () => stepToLetter,
      tokenizeNote: () => tokenizeNote2
    });
    module.exports = __toCommonJS(pitch_note_exports);
    var import_pitch = require_dist11();
    var fillStr = (s, n) => Array(Math.abs(n) + 1).join(s);
    var NoNote = { empty: true, name: "", pc: "", acc: "" };
    var cache = /* @__PURE__ */ new Map();
    var stepToLetter = (step) => "CDEFGAB".charAt(step);
    var altToAcc = (alt) => alt < 0 ? fillStr("b", -alt) : fillStr("#", alt);
    var accToAlt = (acc) => acc[0] === "b" ? -acc.length : acc.length;
    function note(src) {
      const stringSrc = JSON.stringify(src);
      const cached = cache.get(stringSrc);
      if (cached) {
        return cached;
      }
      const value = typeof src === "string" ? parse(src) : (0, import_pitch.isPitch)(src) ? note(pitchName(src)) : (0, import_pitch.isNamedPitch)(src) ? note(src.name) : NoNote;
      cache.set(stringSrc, value);
      return value;
    }
    var REGEX = /^([a-gA-G]?)(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)$/;
    function tokenizeNote2(str) {
      const m = REGEX.exec(str);
      return m ? [m[1].toUpperCase(), m[2].replace(/x/g, "##"), m[3], m[4]] : ["", "", "", ""];
    }
    function coordToNote(noteCoord) {
      return note((0, import_pitch.pitch)(noteCoord));
    }
    var mod = (n, m) => (n % m + m) % m;
    var SEMI = [0, 2, 4, 5, 7, 9, 11];
    function parse(noteName) {
      const tokens = tokenizeNote2(noteName);
      if (tokens[0] === "" || tokens[3] !== "") {
        return NoNote;
      }
      const letter = tokens[0];
      const acc = tokens[1];
      const octStr = tokens[2];
      const step = (letter.charCodeAt(0) + 3) % 7;
      const alt = accToAlt(acc);
      const oct = octStr.length ? +octStr : void 0;
      const coord = (0, import_pitch.coordinates)({ step, alt, oct });
      const name = letter + acc + octStr;
      const pc = letter + acc;
      const chroma = (SEMI[step] + alt + 120) % 12;
      const height = oct === void 0 ? mod(SEMI[step] + alt, 12) - 12 * 99 : SEMI[step] + alt + 12 * (oct + 1);
      const midi = height >= 0 && height <= 127 ? height : null;
      const freq = oct === void 0 ? null : Math.pow(2, (height - 69) / 12) * 440;
      return {
        empty: false,
        acc,
        alt,
        chroma,
        coord,
        freq,
        height,
        letter,
        midi,
        name,
        oct,
        pc,
        step
      };
    }
    function pitchName(props) {
      const { step, alt, oct } = props;
      const letter = stepToLetter(step);
      if (!letter) {
        return "";
      }
      const pc = letter + altToAcc(alt);
      return oct || oct === 0 ? pc + oct : pc;
    }
  }
});

// node_modules/.pnpm/@tonaljs+pitch-distance@5.0.2/node_modules/@tonaljs/pitch-distance/dist/index.js
var require_dist14 = __commonJS({
  "node_modules/.pnpm/@tonaljs+pitch-distance@5.0.2/node_modules/@tonaljs/pitch-distance/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var pitch_distance_exports = {};
    __export(pitch_distance_exports, {
      distance: () => distance,
      tonicIntervalsTransposer: () => tonicIntervalsTransposer,
      transpose: () => transpose2
    });
    module.exports = __toCommonJS(pitch_distance_exports);
    var import_pitch_interval = require_dist12();
    var import_pitch_note = require_dist13();
    function transpose2(noteName, intervalName) {
      const note = (0, import_pitch_note.note)(noteName);
      const intervalCoord = Array.isArray(intervalName) ? intervalName : (0, import_pitch_interval.interval)(intervalName).coord;
      if (note.empty || !intervalCoord || intervalCoord.length < 2) {
        return "";
      }
      const noteCoord = note.coord;
      const tr = noteCoord.length === 1 ? [noteCoord[0] + intervalCoord[0]] : [noteCoord[0] + intervalCoord[0], noteCoord[1] + intervalCoord[1]];
      return (0, import_pitch_note.coordToNote)(tr).name;
    }
    function tonicIntervalsTransposer(intervals, tonic) {
      const len = intervals.length;
      return (normalized) => {
        if (!tonic)
          return "";
        const index = normalized < 0 ? (len - -normalized % len) % len : normalized % len;
        const octaves = Math.floor(normalized / len);
        const root = transpose2(tonic, [0, octaves]);
        return transpose2(root, intervals[index]);
      };
    }
    function distance(fromNote, toNote) {
      const from = (0, import_pitch_note.note)(fromNote);
      const to = (0, import_pitch_note.note)(toNote);
      if (from.empty || to.empty) {
        return "";
      }
      const fcoord = from.coord;
      const tcoord = to.coord;
      const fifths = tcoord[0] - fcoord[0];
      const octs = fcoord.length === 2 && tcoord.length === 2 ? tcoord[1] - fcoord[1] : -Math.floor(fifths * 7 / 12);
      const forceDescending = to.height === from.height && to.midi !== null && from.midi !== null && from.step > to.step;
      return (0, import_pitch_interval.coordToInterval)([fifths, octs], forceDescending).name;
    }
  }
});

// node_modules/.pnpm/@tonaljs+core@4.10.4/node_modules/@tonaljs/core/dist/index.js
var require_dist15 = __commonJS({
  "node_modules/.pnpm/@tonaljs+core@4.10.4/node_modules/@tonaljs/core/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var core_exports = {};
    __export(core_exports, {
      deprecate: () => deprecate,
      fillStr: () => fillStr,
      isNamed: () => isNamed
    });
    module.exports = __toCommonJS(core_exports);
    var import_pitch = require_dist11();
    __reExport(core_exports, require_dist11(), module.exports);
    __reExport(core_exports, require_dist14(), module.exports);
    __reExport(core_exports, require_dist12(), module.exports);
    __reExport(core_exports, require_dist13(), module.exports);
    var fillStr = (s, n) => Array(Math.abs(n) + 1).join(s);
    function deprecate(original, alternative, fn) {
      return function(...args) {
        console.warn(`${original} is deprecated. Use ${alternative}.`);
        return fn.apply(this, args);
      };
    }
    var isNamed = deprecate("isNamed", "isNamedPitch", import_pitch.isNamedPitch);
  }
});

// node_modules/.pnpm/@tonaljs+chord-type@4.8.2/node_modules/@tonaljs/chord-type/dist/index.js
var require_dist16 = __commonJS({
  "node_modules/.pnpm/@tonaljs+chord-type@4.8.2/node_modules/@tonaljs/chord-type/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all2) => {
      for (var name in all2)
        __defProp(target, name, { get: all2[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var chord_type_exports = {};
    __export(chord_type_exports, {
      add: () => add,
      addAlias: () => addAlias,
      all: () => all,
      chordType: () => chordType,
      default: () => chord_type_default,
      entries: () => entries,
      get: () => get,
      keys: () => keys,
      names: () => names,
      removeAll: () => removeAll,
      symbols: () => symbols
    });
    module.exports = __toCommonJS(chord_type_exports);
    var import_core4 = require_dist15();
    var import_pcset = require_dist8();
    var CHORDS = [
      ["1P 3M 5P", "major", "M ^  maj"],
      ["1P 3M 5P 7M", "major seventh", "maj7 \u0394 ma7 M7 Maj7 ^7"],
      ["1P 3M 5P 7M 9M", "major ninth", "maj9 \u03949 ^9"],
      ["1P 3M 5P 7M 9M 13M", "major thirteenth", "maj13 Maj13 ^13"],
      ["1P 3M 5P 6M", "sixth", "6 add6 add13 M6"],
      ["1P 3M 5P 6M 9M", "sixth added ninth", "6add9 6/9 69 M69"],
      ["1P 3M 6m 7M", "major seventh flat sixth", "M7b6 ^7b6"],
      [
        "1P 3M 5P 7M 11A",
        "major seventh sharp eleventh",
        "maj#4 \u0394#4 \u0394#11 M7#11 ^7#11 maj7#11"
      ],
      ["1P 3m 5P", "minor", "m min -"],
      ["1P 3m 5P 7m", "minor seventh", "m7 min7 mi7 -7"],
      [
        "1P 3m 5P 7M",
        "minor/major seventh",
        "m/ma7 m/maj7 mM7 mMaj7 m/M7 -\u03947 m\u0394 -^7"
      ],
      ["1P 3m 5P 6M", "minor sixth", "m6 -6"],
      ["1P 3m 5P 7m 9M", "minor ninth", "m9 -9"],
      ["1P 3m 5P 7M 9M", "minor/major ninth", "mM9 mMaj9 -^9"],
      ["1P 3m 5P 7m 9M 11P", "minor eleventh", "m11 -11"],
      ["1P 3m 5P 7m 9M 13M", "minor thirteenth", "m13 -13"],
      ["1P 3m 5d", "diminished", "dim \xB0 o"],
      ["1P 3m 5d 7d", "diminished seventh", "dim7 \xB07 o7"],
      ["1P 3m 5d 7m", "half-diminished", "m7b5 \xF8 -7b5 h7 h"],
      ["1P 3M 5P 7m", "dominant seventh", "7 dom"],
      ["1P 3M 5P 7m 9M", "dominant ninth", "9"],
      ["1P 3M 5P 7m 9M 13M", "dominant thirteenth", "13"],
      ["1P 3M 5P 7m 11A", "lydian dominant seventh", "7#11 7#4"],
      ["1P 3M 5P 7m 9m", "dominant flat ninth", "7b9"],
      ["1P 3M 5P 7m 9A", "dominant sharp ninth", "7#9"],
      ["1P 3M 7m 9m", "altered", "alt7"],
      ["1P 4P 5P", "suspended fourth", "sus4 sus"],
      ["1P 2M 5P", "suspended second", "sus2"],
      ["1P 4P 5P 7m", "suspended fourth seventh", "7sus4 7sus"],
      ["1P 5P 7m 9M 11P", "eleventh", "11"],
      [
        "1P 4P 5P 7m 9m",
        "suspended fourth flat ninth",
        "b9sus phryg 7b9sus 7b9sus4"
      ],
      ["1P 5P", "fifth", "5"],
      ["1P 3M 5A", "augmented", "aug + +5 ^#5"],
      ["1P 3m 5A", "minor augmented", "m#5 -#5 m+"],
      ["1P 3M 5A 7M", "augmented seventh", "maj7#5 maj7+5 +maj7 ^7#5"],
      [
        "1P 3M 5P 7M 9M 11A",
        "major sharp eleventh (lydian)",
        "maj9#11 \u03949#11 ^9#11"
      ],
      ["1P 2M 4P 5P", "", "sus24 sus4add9"],
      ["1P 3M 5A 7M 9M", "", "maj9#5 Maj9#5"],
      ["1P 3M 5A 7m", "", "7#5 +7 7+ 7aug aug7"],
      ["1P 3M 5A 7m 9A", "", "7#5#9 7#9#5 7alt"],
      ["1P 3M 5A 7m 9M", "", "9#5 9+"],
      ["1P 3M 5A 7m 9M 11A", "", "9#5#11"],
      ["1P 3M 5A 7m 9m", "", "7#5b9 7b9#5"],
      ["1P 3M 5A 7m 9m 11A", "", "7#5b9#11"],
      ["1P 3M 5A 9A", "", "+add#9"],
      ["1P 3M 5A 9M", "", "M#5add9 +add9"],
      ["1P 3M 5P 6M 11A", "", "M6#11 M6b5 6#11 6b5"],
      ["1P 3M 5P 6M 7M 9M", "", "M7add13"],
      ["1P 3M 5P 6M 9M 11A", "", "69#11"],
      ["1P 3m 5P 6M 9M", "", "m69 -69"],
      ["1P 3M 5P 6m 7m", "", "7b6"],
      ["1P 3M 5P 7M 9A 11A", "", "maj7#9#11"],
      ["1P 3M 5P 7M 9M 11A 13M", "", "M13#11 maj13#11 M13+4 M13#4"],
      ["1P 3M 5P 7M 9m", "", "M7b9"],
      ["1P 3M 5P 7m 11A 13m", "", "7#11b13 7b5b13"],
      ["1P 3M 5P 7m 13M", "", "7add6 67 7add13"],
      ["1P 3M 5P 7m 9A 11A", "", "7#9#11 7b5#9 7#9b5"],
      ["1P 3M 5P 7m 9A 11A 13M", "", "13#9#11"],
      ["1P 3M 5P 7m 9A 11A 13m", "", "7#9#11b13"],
      ["1P 3M 5P 7m 9A 13M", "", "13#9"],
      ["1P 3M 5P 7m 9A 13m", "", "7#9b13"],
      ["1P 3M 5P 7m 9M 11A", "", "9#11 9+4 9#4"],
      ["1P 3M 5P 7m 9M 11A 13M", "", "13#11 13+4 13#4"],
      ["1P 3M 5P 7m 9M 11A 13m", "", "9#11b13 9b5b13"],
      ["1P 3M 5P 7m 9m 11A", "", "7b9#11 7b5b9 7b9b5"],
      ["1P 3M 5P 7m 9m 11A 13M", "", "13b9#11"],
      ["1P 3M 5P 7m 9m 11A 13m", "", "7b9b13#11 7b9#11b13 7b5b9b13"],
      ["1P 3M 5P 7m 9m 13M", "", "13b9"],
      ["1P 3M 5P 7m 9m 13m", "", "7b9b13"],
      ["1P 3M 5P 7m 9m 9A", "", "7b9#9"],
      ["1P 3M 5P 9M", "", "Madd9 2 add9 add2"],
      ["1P 3M 5P 9m", "", "Maddb9"],
      ["1P 3M 5d", "", "Mb5"],
      ["1P 3M 5d 6M 7m 9M", "", "13b5"],
      ["1P 3M 5d 7M", "", "M7b5"],
      ["1P 3M 5d 7M 9M", "", "M9b5"],
      ["1P 3M 5d 7m", "", "7b5"],
      ["1P 3M 5d 7m 9M", "", "9b5"],
      ["1P 3M 7m", "", "7no5"],
      ["1P 3M 7m 13m", "", "7b13"],
      ["1P 3M 7m 9M", "", "9no5"],
      ["1P 3M 7m 9M 13M", "", "13no5"],
      ["1P 3M 7m 9M 13m", "", "9b13"],
      ["1P 3m 4P 5P", "", "madd4"],
      ["1P 3m 5P 6m 7M", "", "mMaj7b6"],
      ["1P 3m 5P 6m 7M 9M", "", "mMaj9b6"],
      ["1P 3m 5P 7m 11P", "", "m7add11 m7add4"],
      ["1P 3m 5P 9M", "", "madd9"],
      ["1P 3m 5d 6M 7M", "", "o7M7"],
      ["1P 3m 5d 7M", "", "oM7"],
      ["1P 3m 6m 7M", "", "mb6M7"],
      ["1P 3m 6m 7m", "", "m7#5"],
      ["1P 3m 6m 7m 9M", "", "m9#5"],
      ["1P 3m 5A 7m 9M 11P", "", "m11A"],
      ["1P 3m 6m 9m", "", "mb6b9"],
      ["1P 2M 3m 5d 7m", "", "m9b5"],
      ["1P 4P 5A 7M", "", "M7#5sus4"],
      ["1P 4P 5A 7M 9M", "", "M9#5sus4"],
      ["1P 4P 5A 7m", "", "7#5sus4"],
      ["1P 4P 5P 7M", "", "M7sus4"],
      ["1P 4P 5P 7M 9M", "", "M9sus4"],
      ["1P 4P 5P 7m 9M", "", "9sus4 9sus"],
      ["1P 4P 5P 7m 9M 13M", "", "13sus4 13sus"],
      ["1P 4P 5P 7m 9m 13m", "", "7sus4b9b13 7b9b13sus4"],
      ["1P 4P 7m 10m", "", "4 quartal"],
      ["1P 5P 7m 9m 11P", "", "11b9"]
    ];
    var data_default = CHORDS;
    var NoChordType = {
      ...import_pcset.EmptyPcset,
      name: "",
      quality: "Unknown",
      intervals: [],
      aliases: []
    };
    var dictionary = [];
    var index = {};
    function get(type) {
      return index[type] || NoChordType;
    }
    var chordType = (0, import_core4.deprecate)("ChordType.chordType", "ChordType.get", get);
    function names() {
      return dictionary.map((chord) => chord.name).filter((x) => x);
    }
    function symbols() {
      return dictionary.map((chord) => chord.aliases[0]).filter((x) => x);
    }
    function keys() {
      return Object.keys(index);
    }
    function all() {
      return dictionary.slice();
    }
    var entries = (0, import_core4.deprecate)("ChordType.entries", "ChordType.all", all);
    function removeAll() {
      dictionary = [];
      index = {};
    }
    function add(intervals, aliases, fullName) {
      const quality = getQuality(intervals);
      const chord = {
        ...(0, import_pcset.get)(intervals),
        name: fullName || "",
        quality,
        intervals,
        aliases
      };
      dictionary.push(chord);
      if (chord.name) {
        index[chord.name] = chord;
      }
      index[chord.setNum] = chord;
      index[chord.chroma] = chord;
      chord.aliases.forEach((alias) => addAlias(chord, alias));
    }
    function addAlias(chord, alias) {
      index[alias] = chord;
    }
    function getQuality(intervals) {
      const has = (interval) => intervals.indexOf(interval) !== -1;
      return has("5A") ? "Augmented" : has("3M") ? "Major" : has("5d") ? "Diminished" : has("3m") ? "Minor" : "Unknown";
    }
    data_default.forEach(
      ([ivls, fullName, names2]) => add(ivls.split(" "), names2.split(" "), fullName)
    );
    dictionary.sort((a, b) => a.setNum - b.setNum);
    var chord_type_default = {
      names,
      symbols,
      get,
      all,
      add,
      removeAll,
      keys,
      entries,
      chordType
    };
  }
});

// node_modules/.pnpm/@tonaljs+scale-type@4.9.2/node_modules/@tonaljs/scale-type/dist/index.js
var require_dist17 = __commonJS({
  "node_modules/.pnpm/@tonaljs+scale-type@4.9.2/node_modules/@tonaljs/scale-type/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all2) => {
      for (var name in all2)
        __defProp(target, name, { get: all2[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      NoScaleType: () => NoScaleType,
      add: () => add,
      addAlias: () => addAlias,
      all: () => all,
      default: () => index_default,
      entries: () => entries,
      get: () => get,
      keys: () => keys,
      names: () => names,
      removeAll: () => removeAll,
      scaleType: () => scaleType
    });
    module.exports = __toCommonJS(index_exports);
    var import_pcset = require_dist8();
    var SCALES = [
      // Basic scales
      ["1P 2M 3M 5P 6M", "major pentatonic", "pentatonic"],
      ["1P 2M 3M 4P 5P 6M 7M", "major", "ionian"],
      ["1P 2M 3m 4P 5P 6m 7m", "minor", "aeolian"],
      // Jazz common scales
      ["1P 2M 3m 3M 5P 6M", "major blues"],
      ["1P 3m 4P 5d 5P 7m", "minor blues", "blues"],
      ["1P 2M 3m 4P 5P 6M 7M", "melodic minor"],
      ["1P 2M 3m 4P 5P 6m 7M", "harmonic minor"],
      ["1P 2M 3M 4P 5P 6M 7m 7M", "bebop"],
      ["1P 2M 3m 4P 5d 6m 6M 7M", "diminished", "whole-half diminished"],
      // Modes
      ["1P 2M 3m 4P 5P 6M 7m", "dorian"],
      ["1P 2M 3M 4A 5P 6M 7M", "lydian"],
      ["1P 2M 3M 4P 5P 6M 7m", "mixolydian", "dominant"],
      ["1P 2m 3m 4P 5P 6m 7m", "phrygian"],
      ["1P 2m 3m 4P 5d 6m 7m", "locrian"],
      // 5-note scales
      ["1P 3M 4P 5P 7M", "ionian pentatonic"],
      ["1P 3M 4P 5P 7m", "mixolydian pentatonic", "indian"],
      ["1P 2M 4P 5P 6M", "ritusen"],
      ["1P 2M 4P 5P 7m", "egyptian"],
      // Source: https://en.wikipedia.org/wiki/Neapolitan_scale
      ["1P 3M 4P 5d 7m", "neapolitan major pentatonic"],
      ["1P 3m 4P 5P 6m", "vietnamese 1"],
      ["1P 2m 3m 5P 6m", "pelog"],
      ["1P 2m 4P 5P 6m", "kumoijoshi"],
      ["1P 2M 3m 5P 6m", "hirajoshi"],
      ["1P 2m 4P 5d 7m", "iwato"],
      ["1P 2m 4P 5P 7m", "in-sen"],
      ["1P 3M 4A 5P 7M", "lydian pentatonic", "chinese"],
      ["1P 3m 4P 6m 7m", "malkos raga"],
      ["1P 3m 4P 5d 7m", "locrian pentatonic", "minor seven flat five pentatonic"],
      ["1P 3m 4P 5P 7m", "minor pentatonic", "vietnamese 2"],
      ["1P 3m 4P 5P 6M", "minor six pentatonic"],
      ["1P 2M 3m 5P 6M", "flat three pentatonic", "kumoi"],
      ["1P 2M 3M 5P 6m", "flat six pentatonic"],
      ["1P 2m 3M 5P 6M", "scriabin"],
      ["1P 3M 5d 6m 7m", "whole tone pentatonic"],
      ["1P 3M 4A 5A 7M", "lydian #5p pentatonic"],
      ["1P 3M 4A 5P 7m", "lydian dominant pentatonic"],
      ["1P 3m 4P 5P 7M", "minor #7m pentatonic"],
      ["1P 3m 4d 5d 7m", "super locrian pentatonic"],
      // 6-note scales
      ["1P 2M 3m 4P 5P 7M", "minor hexatonic"],
      ["1P 2A 3M 5P 5A 7M", "augmented"],
      ["1P 2M 4P 5P 6M 7m", "piongio"],
      // Source: https://en.wikipedia.org/wiki/Neapolitan_scale
      ["1P 2m 3M 4A 6M 7m", "prometheus neapolitan"],
      ["1P 2M 3M 4A 6M 7m", "prometheus"],
      ["1P 2m 3M 5d 6m 7m", "mystery #1"],
      ["1P 2m 3M 4P 5A 6M", "six tone symmetric"],
      ["1P 2M 3M 4A 5A 6A", "whole tone", "messiaen's mode #1"],
      ["1P 2m 4P 4A 5P 7M", "messiaen's mode #5"],
      // 7-note scales
      ["1P 2M 3M 4P 5d 6m 7m", "locrian major", "arabian"],
      ["1P 2m 3M 4A 5P 6m 7M", "double harmonic lydian"],
      [
        "1P 2m 2A 3M 4A 6m 7m",
        "altered",
        "super locrian",
        "diminished whole tone",
        "pomeroy"
      ],
      ["1P 2M 3m 4P 5d 6m 7m", "locrian #2", "half-diminished", "aeolian b5"],
      [
        "1P 2M 3M 4P 5P 6m 7m",
        "mixolydian b6",
        "melodic minor fifth mode",
        "hindu"
      ],
      ["1P 2M 3M 4A 5P 6M 7m", "lydian dominant", "lydian b7", "overtone"],
      ["1P 2M 3M 4A 5A 6M 7M", "lydian augmented"],
      [
        "1P 2m 3m 4P 5P 6M 7m",
        "dorian b2",
        "phrygian #6",
        "melodic minor second mode"
      ],
      [
        "1P 2m 3m 4d 5d 6m 7d",
        "ultralocrian",
        "superlocrian bb7",
        "superlocrian diminished"
      ],
      ["1P 2m 3m 4P 5d 6M 7m", "locrian 6", "locrian natural 6", "locrian sharp 6"],
      ["1P 2A 3M 4P 5P 5A 7M", "augmented heptatonic"],
      // Source https://en.wikipedia.org/wiki/Ukrainian_Dorian_scale
      [
        "1P 2M 3m 4A 5P 6M 7m",
        "dorian #4",
        "ukrainian dorian",
        "romanian minor",
        "altered dorian"
      ],
      ["1P 2M 3m 4A 5P 6M 7M", "lydian diminished"],
      ["1P 2M 3M 4A 5A 7m 7M", "leading whole tone"],
      ["1P 2M 3M 4A 5P 6m 7m", "lydian minor"],
      ["1P 2m 3M 4P 5P 6m 7m", "phrygian dominant", "spanish", "phrygian major"],
      ["1P 2m 3m 4P 5P 6m 7M", "balinese"],
      // Source: https://en.wikipedia.org/wiki/Neapolitan_scale
      ["1P 2m 3m 4P 5P 6M 7M", "neapolitan major"],
      ["1P 2M 3M 4P 5P 6m 7M", "harmonic major"],
      ["1P 2m 3M 4P 5P 6m 7M", "double harmonic major", "gypsy"],
      ["1P 2M 3m 4A 5P 6m 7M", "hungarian minor"],
      ["1P 2A 3M 4A 5P 6M 7m", "hungarian major"],
      ["1P 2m 3M 4P 5d 6M 7m", "oriental"],
      ["1P 2m 3m 3M 4A 5P 7m", "flamenco"],
      ["1P 2m 3m 4A 5P 6m 7M", "todi raga"],
      ["1P 2m 3M 4P 5d 6m 7M", "persian"],
      ["1P 2m 3M 5d 6m 7m 7M", "enigmatic"],
      [
        "1P 2M 3M 4P 5A 6M 7M",
        "major augmented",
        "major #5",
        "ionian augmented",
        "ionian #5"
      ],
      ["1P 2A 3M 4A 5P 6M 7M", "lydian #9"],
      // 8-note scales
      ["1P 2m 2M 4P 4A 5P 6m 7M", "messiaen's mode #4"],
      ["1P 2m 3M 4P 4A 5P 6m 7M", "purvi raga"],
      ["1P 2m 3m 3M 4P 5P 6m 7m", "spanish heptatonic"],
      ["1P 2M 3m 3M 4P 5P 6M 7m", "bebop minor"],
      ["1P 2M 3M 4P 5P 5A 6M 7M", "bebop major"],
      ["1P 2m 3m 4P 5d 5P 6m 7m", "bebop locrian"],
      ["1P 2M 3m 4P 5P 6m 7m 7M", "minor bebop"],
      ["1P 2M 3M 4P 5d 5P 6M 7M", "ichikosucho"],
      ["1P 2M 3m 4P 5P 6m 6M 7M", "minor six diminished"],
      [
        "1P 2m 3m 3M 4A 5P 6M 7m",
        "half-whole diminished",
        "dominant diminished",
        "messiaen's mode #2"
      ],
      ["1P 3m 3M 4P 5P 6M 7m 7M", "kafi raga"],
      ["1P 2M 3M 4P 4A 5A 6A 7M", "messiaen's mode #6"],
      // 9-note scales
      ["1P 2M 3m 3M 4P 5d 5P 6M 7m", "composite blues"],
      ["1P 2M 3m 3M 4A 5P 6m 7m 7M", "messiaen's mode #3"],
      // 10-note scales
      ["1P 2m 2M 3m 4P 4A 5P 6m 6M 7M", "messiaen's mode #7"],
      // 12-note scales
      ["1P 2m 2M 3m 3M 4P 5d 5P 6m 6M 7m 7M", "chromatic"]
    ];
    var data_default = SCALES;
    var NoScaleType = {
      ...import_pcset.EmptyPcset,
      intervals: [],
      aliases: []
    };
    var dictionary = [];
    var index = {};
    function names() {
      return dictionary.map((scale2) => scale2.name);
    }
    function get(type) {
      return index[type] || NoScaleType;
    }
    var scaleType = get;
    function all() {
      return dictionary.slice();
    }
    var entries = all;
    function keys() {
      return Object.keys(index);
    }
    function removeAll() {
      dictionary = [];
      index = {};
    }
    function add(intervals, name, aliases = []) {
      const scale2 = { ...(0, import_pcset.get)(intervals), name, intervals, aliases };
      dictionary.push(scale2);
      index[scale2.name] = scale2;
      index[scale2.setNum] = scale2;
      index[scale2.chroma] = scale2;
      scale2.aliases.forEach((alias) => addAlias(scale2, alias));
      return scale2;
    }
    function addAlias(scale2, alias) {
      index[alias] = scale2;
    }
    data_default.forEach(
      ([ivls, name, ...aliases]) => add(ivls.split(" "), name, aliases)
    );
    var index_default = {
      names,
      get,
      all,
      add,
      removeAll,
      keys,
      // deprecated
      entries,
      scaleType
    };
  }
});

// node_modules/.pnpm/@tonaljs+chord@4.10.2/node_modules/@tonaljs/chord/dist/index.js
var require_dist18 = __commonJS({
  "node_modules/.pnpm/@tonaljs+chord@4.10.2/node_modules/@tonaljs/chord/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var chord_exports = {};
    __export(chord_exports, {
      chord: () => chord,
      chordScales: () => chordScales,
      default: () => chord_default,
      degrees: () => degrees,
      detect: () => import_chord_detect2.detect,
      extended: () => extended,
      get: () => get,
      getChord: () => getChord,
      reduced: () => reduced,
      steps: () => steps,
      tokenize: () => tokenize,
      transpose: () => transpose2
    });
    module.exports = __toCommonJS(chord_exports);
    var import_chord_detect = require_dist10();
    var import_chord_type = require_dist16();
    var import_core4 = require_dist15();
    var import_core22 = require_dist15();
    var import_pcset = require_dist8();
    var import_scale_type = require_dist17();
    var import_chord_detect2 = require_dist10();
    var NoChord = {
      empty: true,
      name: "",
      symbol: "",
      root: "",
      rootDegree: 0,
      type: "",
      tonic: null,
      setNum: NaN,
      quality: "Unknown",
      chroma: "",
      normalized: "",
      aliases: [],
      notes: [],
      intervals: []
    };
    function tokenize(name) {
      const [letter, acc, oct, type] = (0, import_core22.tokenizeNote)(name);
      if (letter === "") {
        return ["", name];
      }
      if (letter === "A" && type === "ug") {
        return ["", "aug"];
      }
      return [letter + acc, oct + type];
    }
    function get(src) {
      if (src === "") {
        return NoChord;
      }
      if (Array.isArray(src) && src.length === 2) {
        return getChord(src[1], src[0]);
      } else {
        const [tonic, type] = tokenize(src);
        const chord2 = getChord(type, tonic);
        return chord2.empty ? getChord(src) : chord2;
      }
    }
    function getChord(typeName, optionalTonic, optionalRoot) {
      const type = (0, import_chord_type.get)(typeName);
      const tonic = (0, import_core22.note)(optionalTonic || "");
      const root = (0, import_core22.note)(optionalRoot || "");
      if (type.empty || optionalTonic && tonic.empty || optionalRoot && root.empty) {
        return NoChord;
      }
      const rootInterval = (0, import_core22.distance)(tonic.pc, root.pc);
      const rootDegree = type.intervals.indexOf(rootInterval) + 1;
      if (!root.empty && !rootDegree) {
        return NoChord;
      }
      const intervals = Array.from(type.intervals);
      for (let i = 1; i < rootDegree; i++) {
        const num = intervals[0][0];
        const quality = intervals[0][1];
        const newNum = parseInt(num, 10) + 7;
        intervals.push(`${newNum}${quality}`);
        intervals.shift();
      }
      const notes = tonic.empty ? [] : intervals.map((i) => (0, import_core22.transpose)(tonic, i));
      typeName = type.aliases.indexOf(typeName) !== -1 ? typeName : type.aliases[0];
      const symbol = `${tonic.empty ? "" : tonic.pc}${typeName}${root.empty || rootDegree <= 1 ? "" : "/" + root.pc}`;
      const name = `${optionalTonic ? tonic.pc + " " : ""}${type.name}${rootDegree > 1 && optionalRoot ? " over " + root.pc : ""}`;
      return {
        ...type,
        name,
        symbol,
        type: type.name,
        root: root.name,
        intervals,
        rootDegree,
        tonic: tonic.name,
        notes
      };
    }
    var chord = (0, import_core22.deprecate)("Chord.chord", "Chord.get", get);
    function transpose2(chordName, interval) {
      const [tonic, type] = tokenize(chordName);
      if (!tonic) {
        return chordName;
      }
      return (0, import_core22.transpose)(tonic, interval) + type;
    }
    function chordScales(name) {
      const s = get(name);
      const isChordIncluded = (0, import_pcset.isSupersetOf)(s.chroma);
      return (0, import_scale_type.all)().filter((scale2) => isChordIncluded(scale2.chroma)).map((scale2) => scale2.name);
    }
    function extended(chordName) {
      const s = get(chordName);
      const isSuperset = (0, import_pcset.isSupersetOf)(s.chroma);
      return (0, import_chord_type.all)().filter((chord2) => isSuperset(chord2.chroma)).map((chord2) => s.tonic + chord2.aliases[0]);
    }
    function reduced(chordName) {
      const s = get(chordName);
      const isSubset = (0, import_pcset.isSubsetOf)(s.chroma);
      return (0, import_chord_type.all)().filter((chord2) => isSubset(chord2.chroma)).map((chord2) => s.tonic + chord2.aliases[0]);
    }
    function degrees(chordName) {
      const { intervals, tonic } = get(chordName);
      const transpose22 = (0, import_core4.tonicIntervalsTransposer)(intervals, tonic);
      return (degree) => degree ? transpose22(degree > 0 ? degree - 1 : degree) : "";
    }
    function steps(chordName) {
      const { intervals, tonic } = get(chordName);
      return (0, import_core4.tonicIntervalsTransposer)(intervals, tonic);
    }
    var chord_default = {
      getChord,
      get,
      detect: import_chord_detect.detect,
      chordScales,
      extended,
      reduced,
      tokenize,
      transpose: transpose2,
      degrees,
      steps,
      chord
    };
  }
});

// node_modules/.pnpm/@tonaljs+duration-value@4.9.0/node_modules/@tonaljs/duration-value/dist/index.js
var require_dist19 = __commonJS({
  "node_modules/.pnpm/@tonaljs+duration-value@4.9.0/node_modules/@tonaljs/duration-value/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var duration_value_exports = {};
    __export(duration_value_exports, {
      default: () => duration_value_default,
      fraction: () => fraction,
      get: () => get,
      names: () => names,
      shorthands: () => shorthands,
      value: () => value
    });
    module.exports = __toCommonJS(duration_value_exports);
    var DATA = [
      [
        0.125,
        "dl",
        ["large", "duplex longa", "maxima", "octuple", "octuple whole"]
      ],
      [0.25, "l", ["long", "longa"]],
      [0.5, "d", ["double whole", "double", "breve"]],
      [1, "w", ["whole", "semibreve"]],
      [2, "h", ["half", "minim"]],
      [4, "q", ["quarter", "crotchet"]],
      [8, "e", ["eighth", "quaver"]],
      [16, "s", ["sixteenth", "semiquaver"]],
      [32, "t", ["thirty-second", "demisemiquaver"]],
      [64, "sf", ["sixty-fourth", "hemidemisemiquaver"]],
      [128, "h", ["hundred twenty-eighth"]],
      [256, "th", ["two hundred fifty-sixth"]]
    ];
    var data_default = DATA;
    var VALUES = [];
    data_default.forEach(
      ([denominator, shorthand, names2]) => add(denominator, shorthand, names2)
    );
    var NoDuration = {
      empty: true,
      name: "",
      value: 0,
      fraction: [0, 0],
      shorthand: "",
      dots: "",
      names: []
    };
    function names() {
      return VALUES.reduce((names2, duration) => {
        duration.names.forEach((name) => names2.push(name));
        return names2;
      }, []);
    }
    function shorthands() {
      return VALUES.map((dur) => dur.shorthand);
    }
    var REGEX = /^([^.]+)(\.*)$/;
    function get(name) {
      const [_, simple2, dots] = REGEX.exec(name) || [];
      const base = VALUES.find(
        (dur) => dur.shorthand === simple2 || dur.names.includes(simple2)
      );
      if (!base) {
        return NoDuration;
      }
      const fraction2 = calcDots(base.fraction, dots.length);
      const value2 = fraction2[0] / fraction2[1];
      return { ...base, name, dots, value: value2, fraction: fraction2 };
    }
    var value = (name) => get(name).value;
    var fraction = (name) => get(name).fraction;
    var duration_value_default = { names, shorthands, get, value, fraction };
    function add(denominator, shorthand, names2) {
      VALUES.push({
        empty: false,
        dots: "",
        name: "",
        value: 1 / denominator,
        fraction: denominator < 1 ? [1 / denominator, 1] : [1, denominator],
        shorthand,
        names: names2
      });
    }
    function calcDots(fraction2, dots) {
      const pow = Math.pow(2, dots);
      let numerator = fraction2[0] * pow;
      let denominator = fraction2[1] * pow;
      const base = numerator;
      for (let i = 0; i < dots; i++) {
        numerator += base / Math.pow(2, i + 1);
      }
      while (numerator % 2 === 0 && denominator % 2 === 0) {
        numerator /= 2;
        denominator /= 2;
      }
      return [numerator, denominator];
    }
  }
});

// node_modules/.pnpm/@tonaljs+interval@4.8.2/node_modules/@tonaljs/interval/dist/index.js
var require_dist20 = __commonJS({
  "node_modules/.pnpm/@tonaljs+interval@4.8.2/node_modules/@tonaljs/interval/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name2 in all)
        __defProp(target, name2, { get: all[name2], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var interval_exports = {};
    __export(interval_exports, {
      add: () => add,
      addTo: () => addTo,
      default: () => interval_default,
      distance: () => distance,
      fromSemitones: () => fromSemitones,
      get: () => get,
      invert: () => invert,
      name: () => name,
      names: () => names,
      num: () => num,
      quality: () => quality,
      semitones: () => semitones,
      simplify: () => simplify,
      substract: () => substract,
      transposeFifths: () => transposeFifths
    });
    module.exports = __toCommonJS(interval_exports);
    var import_pitch_distance = require_dist4();
    var import_pitch_interval = require_dist12();
    function names() {
      return "1P 2M 3M 4P 5P 6m 7m".split(" ");
    }
    var get = import_pitch_interval.interval;
    var name = (name2) => (0, import_pitch_interval.interval)(name2).name;
    var semitones = (name2) => (0, import_pitch_interval.interval)(name2).semitones;
    var quality = (name2) => (0, import_pitch_interval.interval)(name2).q;
    var num = (name2) => (0, import_pitch_interval.interval)(name2).num;
    function simplify(name2) {
      const i = (0, import_pitch_interval.interval)(name2);
      return i.empty ? "" : i.simple + i.q;
    }
    function invert(name2) {
      const i = (0, import_pitch_interval.interval)(name2);
      if (i.empty) {
        return "";
      }
      const step = (7 - i.step) % 7;
      const alt = i.type === "perfectable" ? -i.alt : -(i.alt + 1);
      return (0, import_pitch_interval.interval)({ step, alt, oct: i.oct, dir: i.dir }).name;
    }
    var IN = [1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7];
    var IQ = "P m M m M P d P m M m M".split(" ");
    function fromSemitones(semitones2) {
      const d = semitones2 < 0 ? -1 : 1;
      const n = Math.abs(semitones2);
      const c = n % 12;
      const o = Math.floor(n / 12);
      return d * (IN[c] + 7 * o) + IQ[c];
    }
    var distance = import_pitch_distance.distance;
    var add = combinator((a, b) => [a[0] + b[0], a[1] + b[1]]);
    var addTo = (interval) => (other) => add(interval, other);
    var substract = combinator((a, b) => [a[0] - b[0], a[1] - b[1]]);
    function transposeFifths(interval, fifths) {
      const ivl = get(interval);
      if (ivl.empty)
        return "";
      const [nFifths, nOcts, dir] = ivl.coord;
      return (0, import_pitch_interval.coordToInterval)([nFifths + fifths, nOcts, dir]).name;
    }
    var interval_default = {
      names,
      get,
      name,
      num,
      semitones,
      quality,
      fromSemitones,
      distance,
      invert,
      simplify,
      add,
      addTo,
      substract,
      transposeFifths
    };
    function combinator(fn) {
      return (a, b) => {
        const coordA = (0, import_pitch_interval.interval)(a).coord;
        const coordB = (0, import_pitch_interval.interval)(b).coord;
        if (coordA && coordB) {
          const coord = fn(coordA, coordB);
          return (0, import_pitch_interval.coordToInterval)(coord).name;
        }
      };
    }
  }
});

// node_modules/.pnpm/@tonaljs+midi@4.10.2/node_modules/@tonaljs/midi/dist/index.js
var require_dist21 = __commonJS({
  "node_modules/.pnpm/@tonaljs+midi@4.10.2/node_modules/@tonaljs/midi/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      chroma: () => chroma,
      default: () => index_default,
      freqToMidi: () => freqToMidi,
      isMidi: () => isMidi,
      midiToFreq: () => midiToFreq,
      midiToNoteName: () => midiToNoteName,
      pcset: () => pcset,
      pcsetDegrees: () => pcsetDegrees,
      pcsetNearest: () => pcsetNearest,
      pcsetSteps: () => pcsetSteps,
      toMidi: () => toMidi
    });
    module.exports = __toCommonJS(index_exports);
    var import_pitch_note = require_dist3();
    function isMidi(arg) {
      return +arg >= 0 && +arg <= 127;
    }
    function toMidi(note) {
      if (isMidi(note)) {
        return +note;
      }
      const n = (0, import_pitch_note.note)(note);
      return n.empty ? null : n.midi;
    }
    function midiToFreq(midi, tuning = 440) {
      return Math.pow(2, (midi - 69) / 12) * tuning;
    }
    var L2 = Math.log(2);
    var L440 = Math.log(440);
    function freqToMidi(freq) {
      const v = 12 * (Math.log(freq) - L440) / L2 + 69;
      return Math.round(v * 100) / 100;
    }
    var SHARPS = "C C# D D# E F F# G G# A A# B".split(" ");
    var FLATS = "C Db D Eb E F Gb G Ab A Bb B".split(" ");
    function midiToNoteName(midi, options = {}) {
      if (isNaN(midi) || midi === -Infinity || midi === Infinity) return "";
      midi = Math.round(midi);
      const pcs2 = options.sharps === true ? SHARPS : FLATS;
      const pc = pcs2[midi % 12];
      if (options.pitchClass) {
        return pc;
      }
      const o = Math.floor(midi / 12) - 1;
      return pc + o;
    }
    function chroma(midi) {
      return midi % 12;
    }
    function pcsetFromChroma(chroma2) {
      return chroma2.split("").reduce((pcset2, val, index) => {
        if (index < 12 && val === "1") pcset2.push(index);
        return pcset2;
      }, []);
    }
    function pcsetFromMidi(midi) {
      return midi.map(chroma).sort((a, b) => a - b).filter((n, i, a) => i === 0 || n !== a[i - 1]);
    }
    function pcset(notes) {
      return Array.isArray(notes) ? pcsetFromMidi(notes) : pcsetFromChroma(notes);
    }
    function pcsetNearest(notes) {
      const set = pcset(notes);
      return (midi) => {
        const ch = chroma(midi);
        for (let i = 0; i < 12; i++) {
          if (set.includes(ch + i)) return midi + i;
          if (set.includes(ch - i)) return midi - i;
        }
        return void 0;
      };
    }
    function pcsetSteps(notes, tonic) {
      const set = pcset(notes);
      const len = set.length;
      return (step) => {
        const index = step < 0 ? (len - -step % len) % len : step % len;
        const octaves = Math.floor(step / len);
        return set[index] + octaves * 12 + tonic;
      };
    }
    function pcsetDegrees(notes, tonic) {
      const steps = pcsetSteps(notes, tonic);
      return (degree) => {
        if (degree === 0) return void 0;
        return steps(degree > 0 ? degree - 1 : degree);
      };
    }
    var index_default = {
      chroma,
      freqToMidi,
      isMidi,
      midiToFreq,
      midiToNoteName,
      pcsetNearest,
      pcset,
      pcsetDegrees,
      pcsetSteps,
      toMidi
    };
  }
});

// node_modules/.pnpm/@tonaljs+note@4.12.1/node_modules/@tonaljs/note/dist/index.js
var require_dist22 = __commonJS({
  "node_modules/.pnpm/@tonaljs+note@4.12.1/node_modules/@tonaljs/note/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name2 in all)
        __defProp(target, name2, { get: all[name2], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      accidentals: () => accidentals,
      ascending: () => ascending,
      chroma: () => chroma,
      default: () => index_default,
      descending: () => descending,
      distance: () => distance,
      enharmonic: () => enharmonic,
      freq: () => freq,
      fromFreq: () => fromFreq,
      fromFreqSharps: () => fromFreqSharps,
      fromMidi: () => fromMidi,
      fromMidiSharps: () => fromMidiSharps,
      get: () => get,
      midi: () => midi,
      name: () => name,
      names: () => names,
      octave: () => octave,
      pitchClass: () => pitchClass,
      simplify: () => simplify,
      sortedNames: () => sortedNames,
      sortedUniqNames: () => sortedUniqNames,
      tr: () => tr,
      trBy: () => trBy,
      trFifths: () => trFifths,
      trFrom: () => trFrom,
      transpose: () => transpose2,
      transposeBy: () => transposeBy,
      transposeFifths: () => transposeFifths,
      transposeFrom: () => transposeFrom,
      transposeOctaves: () => transposeOctaves
    });
    module.exports = __toCommonJS(index_exports);
    var import_midi = require_dist21();
    var import_pitch_distance = require_dist4();
    var import_pitch_note = require_dist3();
    var NAMES = ["C", "D", "E", "F", "G", "A", "B"];
    var toName = (n) => n.name;
    var onlyNotes = (array) => array.map(import_pitch_note.note).filter((n) => !n.empty);
    function names(array) {
      if (array === void 0) {
        return NAMES.slice();
      } else if (!Array.isArray(array)) {
        return [];
      } else {
        return onlyNotes(array).map(toName);
      }
    }
    var get = import_pitch_note.note;
    var name = (note) => get(note).name;
    var pitchClass = (note) => get(note).pc;
    var accidentals = (note) => get(note).acc;
    var octave = (note) => get(note).oct;
    var midi = (note) => get(note).midi;
    var freq = (note) => get(note).freq;
    var chroma = (note) => get(note).chroma;
    function fromMidi(midi2) {
      return (0, import_midi.midiToNoteName)(midi2);
    }
    function fromFreq(freq2) {
      return (0, import_midi.midiToNoteName)((0, import_midi.freqToMidi)(freq2));
    }
    function fromFreqSharps(freq2) {
      return (0, import_midi.midiToNoteName)((0, import_midi.freqToMidi)(freq2), { sharps: true });
    }
    function fromMidiSharps(midi2) {
      return (0, import_midi.midiToNoteName)(midi2, { sharps: true });
    }
    var distance = import_pitch_distance.distance;
    var transpose2 = import_pitch_distance.transpose;
    var tr = import_pitch_distance.transpose;
    var transposeBy = (interval) => (note) => transpose2(note, interval);
    var trBy = transposeBy;
    var transposeFrom = (note) => (interval) => transpose2(note, interval);
    var trFrom = transposeFrom;
    function transposeFifths(noteName, fifths) {
      return transpose2(noteName, [fifths, 0]);
    }
    var trFifths = transposeFifths;
    function transposeOctaves(noteName, octaves) {
      return transpose2(noteName, [0, octaves]);
    }
    var ascending = (a, b) => a.height - b.height;
    var descending = (a, b) => b.height - a.height;
    function sortedNames(notes, comparator) {
      comparator = comparator || ascending;
      return onlyNotes(notes).sort(comparator).map(toName);
    }
    function sortedUniqNames(notes) {
      return sortedNames(notes, ascending).filter(
        (n, i, a) => i === 0 || n !== a[i - 1]
      );
    }
    var simplify = (noteName) => {
      const note = get(noteName);
      if (note.empty) {
        return "";
      }
      return (0, import_midi.midiToNoteName)(note.midi || note.chroma, {
        sharps: note.alt > 0,
        pitchClass: note.midi === null
      });
    };
    function enharmonic(noteName, destName) {
      const src = get(noteName);
      if (src.empty) {
        return "";
      }
      const dest = get(
        destName || (0, import_midi.midiToNoteName)(src.midi || src.chroma, {
          sharps: src.alt < 0,
          pitchClass: true
        })
      );
      if (dest.empty || dest.chroma !== src.chroma) {
        return "";
      }
      if (src.oct === void 0) {
        return dest.pc;
      }
      const srcChroma = src.chroma - src.alt;
      const destChroma = dest.chroma - dest.alt;
      const destOctOffset = srcChroma > 11 || destChroma < 0 ? -1 : srcChroma < 0 || destChroma > 11 ? 1 : 0;
      const destOct = src.oct + destOctOffset;
      return dest.pc + destOct;
    }
    var index_default = {
      names,
      get,
      name,
      pitchClass,
      accidentals,
      octave,
      midi,
      ascending,
      descending,
      distance,
      sortedNames,
      sortedUniqNames,
      fromMidi,
      fromMidiSharps,
      freq,
      fromFreq,
      fromFreqSharps,
      chroma,
      transpose: transpose2,
      tr,
      transposeBy,
      trBy,
      transposeFrom,
      trFrom,
      transposeFifths,
      transposeOctaves,
      trFifths,
      simplify,
      enharmonic
    };
  }
});

// node_modules/.pnpm/@tonaljs+roman-numeral@4.9.1/node_modules/@tonaljs/roman-numeral/dist/index.js
var require_dist23 = __commonJS({
  "node_modules/.pnpm/@tonaljs+roman-numeral@4.9.1/node_modules/@tonaljs/roman-numeral/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var roman_numeral_exports = {};
    __export(roman_numeral_exports, {
      default: () => roman_numeral_default,
      get: () => get,
      names: () => names,
      romanNumeral: () => romanNumeral,
      tokenize: () => tokenize
    });
    module.exports = __toCommonJS(roman_numeral_exports);
    var import_pitch = require_dist();
    var import_pitch_interval = require_dist2();
    var import_pitch_note = require_dist3();
    var NoRomanNumeral = { empty: true, name: "", chordType: "" };
    var cache = {};
    function get(src) {
      return typeof src === "string" ? cache[src] || (cache[src] = parse(src)) : typeof src === "number" ? get(NAMES[src] || "") : (0, import_pitch.isPitch)(src) ? fromPitch(src) : (0, import_pitch.isNamedPitch)(src) ? get(src.name) : NoRomanNumeral;
    }
    var romanNumeral = get;
    function names(major = true) {
      return (major ? NAMES : NAMES_MINOR).slice();
    }
    function fromPitch(pitch) {
      return get((0, import_pitch_note.altToAcc)(pitch.alt) + NAMES[pitch.step]);
    }
    var REGEX = /^(#{1,}|b{1,}|x{1,}|)(IV|I{1,3}|VI{0,2}|iv|i{1,3}|vi{0,2})([^IViv]*)$/;
    function tokenize(str) {
      return REGEX.exec(str) || ["", "", "", ""];
    }
    var ROMANS = "I II III IV V VI VII";
    var NAMES = ROMANS.split(" ");
    var NAMES_MINOR = ROMANS.toLowerCase().split(" ");
    function parse(src) {
      const [name, acc, roman, chordType] = tokenize(src);
      if (!roman) {
        return NoRomanNumeral;
      }
      const upperRoman = roman.toUpperCase();
      const step = NAMES.indexOf(upperRoman);
      const alt = (0, import_pitch_note.accToAlt)(acc);
      const dir = 1;
      return {
        empty: false,
        name,
        roman,
        interval: (0, import_pitch_interval.interval)({ step, alt, dir }).name,
        acc,
        chordType,
        alt,
        step,
        major: roman === upperRoman,
        oct: 0,
        dir
      };
    }
    var roman_numeral_default = {
      names,
      get,
      // deprecated
      romanNumeral
    };
  }
});

// node_modules/.pnpm/@tonaljs+key@4.11.2/node_modules/@tonaljs/key/dist/index.js
var require_dist24 = __commonJS({
  "node_modules/.pnpm/@tonaljs+key@4.11.2/node_modules/@tonaljs/key/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      default: () => index_default,
      majorKey: () => majorKey,
      majorKeyChords: () => majorKeyChords,
      majorTonicFromKeySignature: () => majorTonicFromKeySignature,
      minorKey: () => minorKey,
      minorKeyChords: () => minorKeyChords
    });
    module.exports = __toCommonJS(index_exports);
    var import_note = require_dist22();
    var import_pitch_note = require_dist3();
    var import_roman_numeral = require_dist23();
    var Empty = Object.freeze([]);
    var NoKey = {
      type: "major",
      tonic: "",
      alteration: 0,
      keySignature: ""
    };
    var NoKeyScale = {
      tonic: "",
      grades: Empty,
      intervals: Empty,
      scale: Empty,
      triads: Empty,
      chords: Empty,
      chordsHarmonicFunction: Empty,
      chordScales: Empty,
      secondaryDominants: Empty,
      secondaryDominantSupertonics: Empty,
      substituteDominantsMinorRelative: Empty,
      substituteDominants: Empty,
      substituteDominantSupertonics: Empty,
      secondaryDominantsMinorRelative: Empty
    };
    var NoMajorKey = {
      ...NoKey,
      ...NoKeyScale,
      type: "major",
      minorRelative: "",
      scale: Empty,
      substituteDominants: Empty,
      secondaryDominantSupertonics: Empty,
      substituteDominantsMinorRelative: Empty
    };
    var NoMinorKey = {
      ...NoKey,
      type: "minor",
      relativeMajor: "",
      natural: NoKeyScale,
      harmonic: NoKeyScale,
      melodic: NoKeyScale
    };
    var mapScaleToType = (scale2, list, sep = "") => list.map((type, i) => `${scale2[i]}${sep}${type}`);
    function keyScale(grades, triads2, chordTypes, harmonicFunctions, chordScales) {
      return (tonic) => {
        const intervals = grades.map((gr) => (0, import_roman_numeral.get)(gr).interval || "");
        const scale2 = intervals.map((interval) => (0, import_note.transpose)(tonic, interval));
        const chords = mapScaleToType(scale2, chordTypes);
        const secondaryDominants = scale2.map((note2) => (0, import_note.transpose)(note2, "5P")).map(
          (note2) => (
            // A secondary dominant is a V chord which:
            // 1. is not diatonic to the key,
            // 2. it must have a diatonic root.
            scale2.includes(note2) && !chords.includes(note2 + "7") ? note2 + "7" : ""
          )
        );
        const secondaryDominantSupertonics = supertonics(
          secondaryDominants,
          triads2
        );
        const substituteDominants = secondaryDominants.map((chord) => {
          if (!chord) return "";
          const domRoot = chord.slice(0, -1);
          const subRoot = (0, import_note.transpose)(domRoot, "5d");
          return subRoot + "7";
        });
        const substituteDominantSupertonics = supertonics(
          substituteDominants,
          triads2
        );
        return {
          tonic,
          grades,
          intervals,
          scale: scale2,
          triads: mapScaleToType(scale2, triads2),
          chords,
          chordsHarmonicFunction: harmonicFunctions.slice(),
          chordScales: mapScaleToType(scale2, chordScales, " "),
          secondaryDominants,
          secondaryDominantSupertonics,
          substituteDominants,
          substituteDominantSupertonics,
          // @deprecated use secondaryDominantsSupertonic
          secondaryDominantsMinorRelative: secondaryDominantSupertonics,
          // @deprecated use secondaryDominantsSupertonic
          substituteDominantsMinorRelative: substituteDominantSupertonics
        };
      };
    }
    var supertonics = (dominants, targetTriads) => {
      return dominants.map((chord, index) => {
        if (!chord) return "";
        const domRoot = chord.slice(0, -1);
        const minorRoot = (0, import_note.transpose)(domRoot, "5P");
        const target = targetTriads[index];
        const isMinor = target.endsWith("m");
        return isMinor ? minorRoot + "m7" : minorRoot + "m7b5";
      });
    };
    var distInFifths = (from, to) => {
      const f = (0, import_pitch_note.note)(from);
      const t = (0, import_pitch_note.note)(to);
      return f.empty || t.empty ? 0 : t.coord[0] - f.coord[0];
    };
    var MajorScale = keyScale(
      "I II III IV V VI VII".split(" "),
      " m m   m dim".split(" "),
      "maj7 m7 m7 maj7 7 m7 m7b5".split(" "),
      "T SD T SD D T D".split(" "),
      "major,dorian,phrygian,lydian,mixolydian,minor,locrian".split(",")
    );
    var NaturalScale = keyScale(
      "I II bIII IV V bVI bVII".split(" "),
      "m dim  m m  ".split(" "),
      "m7 m7b5 maj7 m7 m7 maj7 7".split(" "),
      "T SD T SD D SD SD".split(" "),
      "minor,locrian,major,dorian,phrygian,lydian,mixolydian".split(",")
    );
    var HarmonicScale = keyScale(
      "I II bIII IV V bVI VII".split(" "),
      "m dim aug m   dim".split(" "),
      "mMaj7 m7b5 +maj7 m7 7 maj7 o7".split(" "),
      "T SD T SD D SD D".split(" "),
      "harmonic minor,locrian 6,major augmented,lydian diminished,phrygian dominant,lydian #9,ultralocrian".split(
        ","
      )
    );
    var MelodicScale = keyScale(
      "I II bIII IV V VI VII".split(" "),
      "m m aug   dim dim".split(" "),
      "m6 m7 +maj7 7 7 m7b5 m7b5".split(" "),
      "T SD T SD D  ".split(" "),
      "melodic minor,dorian b2,lydian augmented,lydian dominant,mixolydian b6,locrian #2,altered".split(
        ","
      )
    );
    function majorKey(tonic) {
      const pc = (0, import_pitch_note.note)(tonic).pc;
      if (!pc) return NoMajorKey;
      const keyScale2 = MajorScale(pc);
      const alteration = distInFifths("C", pc);
      return {
        ...keyScale2,
        type: "major",
        minorRelative: (0, import_note.transpose)(pc, "-3m"),
        alteration,
        keySignature: (0, import_pitch_note.altToAcc)(alteration)
      };
    }
    function majorKeyChords(tonic) {
      const key = majorKey(tonic);
      const chords = [];
      keyChordsOf(key, chords);
      return chords;
    }
    function minorKeyChords(tonic) {
      const key = minorKey(tonic);
      const chords = [];
      keyChordsOf(key.natural, chords);
      keyChordsOf(key.harmonic, chords);
      keyChordsOf(key.melodic, chords);
      return chords;
    }
    function keyChordsOf(key, chords) {
      const updateChord = (name, newRole) => {
        if (!name) return;
        let keyChord = chords.find((chord) => chord.name === name);
        if (!keyChord) {
          keyChord = { name, roles: [] };
          chords.push(keyChord);
        }
        if (newRole && !keyChord.roles.includes(newRole)) {
          keyChord.roles.push(newRole);
        }
      };
      key.chords.forEach(
        (chordName, index) => updateChord(chordName, key.chordsHarmonicFunction[index])
      );
      key.secondaryDominants.forEach(
        (chordName, index) => updateChord(chordName, `V/${key.grades[index]}`)
      );
      key.secondaryDominantSupertonics.forEach(
        (chordName, index) => updateChord(chordName, `ii/${key.grades[index]}`)
      );
      key.substituteDominants.forEach(
        (chordName, index) => updateChord(chordName, `subV/${key.grades[index]}`)
      );
      key.substituteDominantSupertonics.forEach(
        (chordName, index) => updateChord(chordName, `subii/${key.grades[index]}`)
      );
    }
    function minorKey(tnc) {
      const pc = (0, import_pitch_note.note)(tnc).pc;
      if (!pc) return NoMinorKey;
      const alteration = distInFifths("C", pc) - 3;
      return {
        type: "minor",
        tonic: pc,
        relativeMajor: (0, import_note.transpose)(pc, "3m"),
        alteration,
        keySignature: (0, import_pitch_note.altToAcc)(alteration),
        natural: NaturalScale(pc),
        harmonic: HarmonicScale(pc),
        melodic: MelodicScale(pc)
      };
    }
    function majorTonicFromKeySignature(sig) {
      if (typeof sig === "number") {
        return (0, import_note.transposeFifths)("C", sig);
      } else if (typeof sig === "string" && /^b+|#+$/.test(sig)) {
        return (0, import_note.transposeFifths)("C", (0, import_pitch_note.accToAlt)(sig));
      }
      return null;
    }
    var index_default = { majorKey, majorTonicFromKeySignature, minorKey };
  }
});

// node_modules/.pnpm/@tonaljs+interval@5.1.0/node_modules/@tonaljs/interval/dist/index.js
var require_dist25 = __commonJS({
  "node_modules/.pnpm/@tonaljs+interval@5.1.0/node_modules/@tonaljs/interval/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name2 in all)
        __defProp(target, name2, { get: all[name2], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var interval_exports = {};
    __export(interval_exports, {
      add: () => add,
      addTo: () => addTo,
      default: () => interval_default,
      distance: () => distance,
      fromSemitones: () => fromSemitones,
      get: () => get,
      invert: () => invert,
      name: () => name,
      names: () => names,
      num: () => num,
      quality: () => quality,
      semitones: () => semitones,
      simplify: () => simplify,
      subtract: () => subtract,
      transposeFifths: () => transposeFifths
    });
    module.exports = __toCommonJS(interval_exports);
    var import_pitch_distance = require_dist4();
    var import_pitch_interval = require_dist2();
    function names() {
      return "1P 2M 3M 4P 5P 6m 7m".split(" ");
    }
    var get = import_pitch_interval.interval;
    var name = (name2) => (0, import_pitch_interval.interval)(name2).name;
    var semitones = (name2) => (0, import_pitch_interval.interval)(name2).semitones;
    var quality = (name2) => (0, import_pitch_interval.interval)(name2).q;
    var num = (name2) => (0, import_pitch_interval.interval)(name2).num;
    function simplify(name2) {
      const i = (0, import_pitch_interval.interval)(name2);
      return i.empty ? "" : i.simple + i.q;
    }
    function invert(name2) {
      const i = (0, import_pitch_interval.interval)(name2);
      if (i.empty) {
        return "";
      }
      const step = (7 - i.step) % 7;
      const alt = i.type === "perfectable" ? -i.alt : -(i.alt + 1);
      return (0, import_pitch_interval.interval)({ step, alt, oct: i.oct, dir: i.dir }).name;
    }
    var IN = [1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 7];
    var IQ = "P m M m M P d P m M m M".split(" ");
    function fromSemitones(semitones2) {
      const d = semitones2 < 0 ? -1 : 1;
      const n = Math.abs(semitones2);
      const c = n % 12;
      const o = Math.floor(n / 12);
      return d * (IN[c] + 7 * o) + IQ[c];
    }
    var distance = import_pitch_distance.distance;
    var add = combinator((a, b) => [a[0] + b[0], a[1] + b[1]]);
    var addTo = (interval) => (other) => add(interval, other);
    var subtract = combinator((a, b) => [a[0] - b[0], a[1] - b[1]]);
    function transposeFifths(interval, fifths) {
      const ivl = get(interval);
      if (ivl.empty) return "";
      const [nFifths, nOcts, dir] = ivl.coord;
      return (0, import_pitch_interval.coordToInterval)([nFifths + fifths, nOcts, dir]).name;
    }
    var interval_default = {
      names,
      get,
      name,
      num,
      semitones,
      quality,
      fromSemitones,
      distance,
      invert,
      simplify,
      add,
      addTo,
      subtract,
      transposeFifths
    };
    function combinator(fn) {
      return (a, b) => {
        const coordA = (0, import_pitch_interval.interval)(a).coord;
        const coordB = (0, import_pitch_interval.interval)(b).coord;
        if (coordA && coordB) {
          const coord = fn(coordA, coordB);
          return (0, import_pitch_interval.coordToInterval)(coord).name;
        }
      };
    }
  }
});

// node_modules/.pnpm/@tonaljs+mode@4.9.2/node_modules/@tonaljs/mode/dist/index.js
var require_dist26 = __commonJS({
  "node_modules/.pnpm/@tonaljs+mode@4.9.2/node_modules/@tonaljs/mode/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all2) => {
      for (var name in all2)
        __defProp(target, name, { get: all2[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      all: () => all,
      default: () => index_default,
      distance: () => distance,
      entries: () => entries,
      get: () => get,
      mode: () => mode,
      names: () => names,
      notes: () => notes,
      relativeTonic: () => relativeTonic,
      seventhChords: () => seventhChords,
      triads: () => triads2
    });
    module.exports = __toCommonJS(index_exports);
    var import_collection = require_dist7();
    var import_interval = require_dist25();
    var import_pcset = require_dist8();
    var import_pitch_distance = require_dist4();
    var import_scale_type = require_dist17();
    var MODES = [
      [0, 2773, 0, "ionian", "", "Maj7", "major"],
      [1, 2902, 2, "dorian", "m", "m7"],
      [2, 3418, 4, "phrygian", "m", "m7"],
      [3, 2741, -1, "lydian", "", "Maj7"],
      [4, 2774, 1, "mixolydian", "", "7"],
      [5, 2906, 3, "aeolian", "m", "m7", "minor"],
      [6, 3434, 5, "locrian", "dim", "m7b5"]
    ];
    var NoMode = {
      ...import_pcset.EmptyPcset,
      name: "",
      alt: 0,
      modeNum: NaN,
      triad: "",
      seventh: "",
      aliases: []
    };
    var modes = MODES.map(toMode);
    var index = {};
    modes.forEach((mode2) => {
      index[mode2.name] = mode2;
      mode2.aliases.forEach((alias) => {
        index[alias] = mode2;
      });
    });
    function get(name) {
      return typeof name === "string" ? index[name.toLowerCase()] || NoMode : name && name.name ? get(name.name) : NoMode;
    }
    var mode = get;
    function all() {
      return modes.slice();
    }
    var entries = all;
    function names() {
      return modes.map((mode2) => mode2.name);
    }
    function toMode(mode2) {
      const [modeNum, setNum, alt, name, triad, seventh, alias] = mode2;
      const aliases = alias ? [alias] : [];
      const chroma = Number(setNum).toString(2);
      const intervals = (0, import_scale_type.get)(name).intervals;
      return {
        empty: false,
        intervals,
        modeNum,
        chroma,
        normalized: chroma,
        name,
        setNum,
        alt,
        triad,
        seventh,
        aliases
      };
    }
    function notes(modeName, tonic) {
      return get(modeName).intervals.map((ivl) => (0, import_pitch_distance.transpose)(tonic, ivl));
    }
    function chords(chords2) {
      return (modeName, tonic) => {
        const mode2 = get(modeName);
        if (mode2.empty) return [];
        const triads22 = (0, import_collection.rotate)(mode2.modeNum, chords2);
        const tonics = mode2.intervals.map((i) => (0, import_pitch_distance.transpose)(tonic, i));
        return triads22.map((triad, i) => tonics[i] + triad);
      };
    }
    var triads2 = chords(MODES.map((x) => x[4]));
    var seventhChords = chords(MODES.map((x) => x[5]));
    function distance(destination, source) {
      const from = get(source);
      const to = get(destination);
      if (from.empty || to.empty) return "";
      return (0, import_interval.simplify)((0, import_interval.transposeFifths)("1P", to.alt - from.alt));
    }
    function relativeTonic(destination, source, tonic) {
      return (0, import_pitch_distance.transpose)(tonic, distance(destination, source));
    }
    var index_default = {
      get,
      names,
      all,
      distance,
      relativeTonic,
      notes,
      triads: triads2,
      seventhChords,
      // deprecated
      entries,
      mode
    };
  }
});

// node_modules/.pnpm/@tonaljs+chord@6.1.2/node_modules/@tonaljs/chord/dist/index.js
var require_dist27 = __commonJS({
  "node_modules/.pnpm/@tonaljs+chord@6.1.2/node_modules/@tonaljs/chord/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      chord: () => chord,
      chordScales: () => chordScales,
      default: () => index_default,
      degrees: () => degrees,
      detect: () => import_chord_detect2.detect,
      extended: () => extended,
      get: () => get,
      getChord: () => getChord,
      notes: () => notes,
      reduced: () => reduced,
      steps: () => steps,
      tokenize: () => tokenize,
      transpose: () => transpose2
    });
    module.exports = __toCommonJS(index_exports);
    var import_chord_detect = require_dist10();
    var import_chord_type = require_dist9();
    var import_interval = require_dist25();
    var import_pcset = require_dist8();
    var import_pitch_distance = require_dist4();
    var import_pitch_note = require_dist3();
    var import_scale_type = require_dist17();
    var import_chord_detect2 = require_dist10();
    var NoChord = {
      empty: true,
      name: "",
      symbol: "",
      root: "",
      bass: "",
      rootDegree: 0,
      type: "",
      tonic: null,
      setNum: NaN,
      quality: "Unknown",
      chroma: "",
      normalized: "",
      aliases: [],
      notes: [],
      intervals: []
    };
    function tokenize(name) {
      const [letter, acc, oct, type] = (0, import_pitch_note.tokenizeNote)(name);
      if (letter === "") {
        return tokenizeBass("", name);
      } else if (letter === "A" && type === "ug") {
        return tokenizeBass("", "aug");
      } else {
        return tokenizeBass(letter + acc, oct + type);
      }
    }
    function tokenizeBass(note2, chord2) {
      const split = chord2.split("/");
      if (split.length === 1) {
        return [note2, split[0], ""];
      }
      const [letter, acc, oct, type] = (0, import_pitch_note.tokenizeNote)(split[1]);
      if (letter !== "" && oct === "" && type === "") {
        return [note2, split[0], letter + acc];
      } else {
        return [note2, chord2, ""];
      }
    }
    function get(src) {
      if (Array.isArray(src)) {
        return getChord(src[1] || "", src[0], src[2]);
      } else if (src === "") {
        return NoChord;
      } else {
        const [tonic, type, bass] = tokenize(src);
        const chord2 = getChord(type, tonic, bass);
        return chord2.empty ? getChord(src) : chord2;
      }
    }
    function getChord(typeName, optionalTonic, optionalBass) {
      const type = (0, import_chord_type.get)(typeName);
      const tonic = (0, import_pitch_note.note)(optionalTonic || "");
      const bass = (0, import_pitch_note.note)(optionalBass || "");
      if (type.empty || optionalTonic && tonic.empty || optionalBass && bass.empty) {
        return NoChord;
      }
      const bassInterval = (0, import_pitch_distance.distance)(tonic.pc, bass.pc);
      const bassIndex = type.intervals.indexOf(bassInterval);
      const hasRoot = bassIndex >= 0;
      const root = hasRoot ? bass : (0, import_pitch_note.note)("");
      const rootDegree = bassIndex === -1 ? NaN : bassIndex + 1;
      const hasBass = bass.pc && bass.pc !== tonic.pc;
      const intervals = Array.from(type.intervals);
      if (hasRoot) {
        for (let i = 1; i < rootDegree; i++) {
          const num = intervals[0][0];
          const quality = intervals[0][1];
          const newNum = parseInt(num, 10) + 7;
          intervals.push(`${newNum}${quality}`);
          intervals.shift();
        }
      } else if (hasBass) {
        const ivl = (0, import_interval.subtract)((0, import_pitch_distance.distance)(tonic.pc, bass.pc), "8P");
        if (ivl) intervals.unshift(ivl);
      }
      const notes2 = tonic.empty ? [] : intervals.map((i) => (0, import_pitch_distance.transpose)(tonic.pc, i));
      typeName = type.aliases.indexOf(typeName) !== -1 ? typeName : type.aliases[0];
      const symbol = `${tonic.empty ? "" : tonic.pc}${typeName}${hasRoot && rootDegree > 1 ? "/" + root.pc : hasBass ? "/" + bass.pc : ""}`;
      const name = `${optionalTonic ? tonic.pc + " " : ""}${type.name}${hasRoot && rootDegree > 1 ? " over " + root.pc : hasBass ? " over " + bass.pc : ""}`;
      return {
        ...type,
        name,
        symbol,
        tonic: tonic.pc,
        type: type.name,
        root: root.pc,
        bass: hasBass ? bass.pc : "",
        intervals,
        rootDegree,
        notes: notes2
      };
    }
    var chord = get;
    function transpose2(chordName, interval) {
      const [tonic, type, bass] = tokenize(chordName);
      if (!tonic) {
        return chordName;
      }
      const tr = (0, import_pitch_distance.transpose)(bass, interval);
      const slash = tr ? "/" + tr : "";
      return (0, import_pitch_distance.transpose)(tonic, interval) + type + slash;
    }
    function chordScales(name) {
      const s = get(name);
      const isChordIncluded = (0, import_pcset.isSupersetOf)(s.chroma);
      return (0, import_scale_type.all)().filter((scale2) => isChordIncluded(scale2.chroma)).map((scale2) => scale2.name);
    }
    function extended(chordName) {
      const s = get(chordName);
      const isSuperset = (0, import_pcset.isSupersetOf)(s.chroma);
      return (0, import_chord_type.all)().filter((chord2) => isSuperset(chord2.chroma)).map((chord2) => s.tonic + chord2.aliases[0]);
    }
    function reduced(chordName) {
      const s = get(chordName);
      const isSubset = (0, import_pcset.isSubsetOf)(s.chroma);
      return (0, import_chord_type.all)().filter((chord2) => isSubset(chord2.chroma)).map((chord2) => s.tonic + chord2.aliases[0]);
    }
    function notes(chordName, tonic) {
      const chord2 = get(chordName);
      const note2 = tonic || chord2.tonic;
      if (!note2 || chord2.empty) return [];
      return chord2.intervals.map((ivl) => (0, import_pitch_distance.transpose)(note2, ivl));
    }
    function degrees(chordName, tonic) {
      const chord2 = get(chordName);
      const note2 = tonic || chord2.tonic;
      const transpose22 = (0, import_pitch_distance.tonicIntervalsTransposer)(chord2.intervals, note2);
      return (degree) => degree ? transpose22(degree > 0 ? degree - 1 : degree) : "";
    }
    function steps(chordName, tonic) {
      const chord2 = get(chordName);
      const note2 = tonic || chord2.tonic;
      return (0, import_pitch_distance.tonicIntervalsTransposer)(chord2.intervals, note2);
    }
    var index_default = {
      getChord,
      get,
      detect: import_chord_detect.detect,
      chordScales,
      extended,
      reduced,
      tokenize,
      transpose: transpose2,
      degrees,
      steps,
      notes,
      chord
    };
  }
});

// node_modules/.pnpm/@tonaljs+progression@4.9.2/node_modules/@tonaljs/progression/dist/index.js
var require_dist28 = __commonJS({
  "node_modules/.pnpm/@tonaljs+progression@4.9.2/node_modules/@tonaljs/progression/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      default: () => index_default,
      fromRomanNumerals: () => fromRomanNumerals,
      toRomanNumerals: () => toRomanNumerals
    });
    module.exports = __toCommonJS(index_exports);
    var import_chord = require_dist27();
    var import_pitch_distance = require_dist4();
    var import_pitch_interval = require_dist2();
    var import_roman_numeral = require_dist23();
    function fromRomanNumerals(tonic, chords) {
      const romanNumerals = chords.map(import_roman_numeral.get);
      return romanNumerals.map(
        (rn) => (0, import_pitch_distance.transpose)(tonic, (0, import_pitch_interval.interval)(rn)) + rn.chordType
      );
    }
    function toRomanNumerals(tonic, chords) {
      return chords.map((chord) => {
        const [note, chordType] = (0, import_chord.tokenize)(chord);
        const intervalName = (0, import_pitch_distance.distance)(tonic, note);
        const roman = (0, import_roman_numeral.get)((0, import_pitch_interval.interval)(intervalName));
        return roman.name + chordType;
      });
    }
    var index_default = { fromRomanNumerals, toRomanNumerals };
  }
});

// node_modules/.pnpm/@tonaljs+range@4.9.2/node_modules/@tonaljs/range/dist/index.js
var require_dist29 = __commonJS({
  "node_modules/.pnpm/@tonaljs+range@4.9.2/node_modules/@tonaljs/range/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      chromatic: () => chromatic,
      default: () => index_default,
      numeric: () => numeric
    });
    module.exports = __toCommonJS(index_exports);
    var import_collection = require_dist7();
    var import_midi = require_dist21();
    function numeric(notes) {
      const midi = (0, import_collection.compact)(
        notes.map((note) => typeof note === "number" ? note : (0, import_midi.toMidi)(note))
      );
      if (!notes.length || midi.length !== notes.length) {
        return [];
      }
      return midi.reduce(
        (result, note) => {
          const last = result[result.length - 1];
          return result.concat((0, import_collection.range)(last, note).slice(1));
        },
        [midi[0]]
      );
    }
    function chromatic(notes, options) {
      return numeric(notes).map((midi) => (0, import_midi.midiToNoteName)(midi, options));
    }
    var index_default = { numeric, chromatic };
  }
});

// node_modules/.pnpm/@tonaljs+scale@4.13.4/node_modules/@tonaljs/scale/dist/index.js
var require_dist30 = __commonJS({
  "node_modules/.pnpm/@tonaljs+scale@4.13.4/node_modules/@tonaljs/scale/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all2) => {
      for (var name in all2)
        __defProp(target, name, { get: all2[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var index_exports = {};
    __export(index_exports, {
      default: () => index_default,
      degrees: () => degrees,
      detect: () => detect2,
      extended: () => extended,
      get: () => get,
      modeNames: () => modeNames,
      names: () => names,
      rangeOf: () => rangeOf,
      reduced: () => reduced,
      scale: () => scale2,
      scaleChords: () => scaleChords,
      scaleNotes: () => scaleNotes,
      steps: () => steps,
      tokenize: () => tokenize
    });
    module.exports = __toCommonJS(index_exports);
    var import_chord_type = require_dist9();
    var import_collection = require_dist7();
    var import_note = require_dist22();
    var import_pcset = require_dist8();
    var import_pitch_distance = require_dist4();
    var import_pitch_note = require_dist3();
    var import_scale_type = require_dist17();
    var NoScale = {
      empty: true,
      name: "",
      type: "",
      tonic: null,
      setNum: NaN,
      chroma: "",
      normalized: "",
      aliases: [],
      notes: [],
      intervals: []
    };
    function tokenize(name) {
      if (typeof name !== "string") {
        return ["", ""];
      }
      const i = name.indexOf(" ");
      const tonic = (0, import_pitch_note.note)(name.substring(0, i));
      if (tonic.empty) {
        const n = (0, import_pitch_note.note)(name);
        return n.empty ? ["", name.toLowerCase()] : [n.name, ""];
      }
      const type = name.substring(tonic.name.length + 1).toLowerCase();
      return [tonic.name, type.length ? type : ""];
    }
    var names = import_scale_type.names;
    function get(src) {
      const tokens = Array.isArray(src) ? src : tokenize(src);
      const tonic = (0, import_pitch_note.note)(tokens[0]).name;
      const st = (0, import_scale_type.get)(tokens[1]);
      if (st.empty) {
        return NoScale;
      }
      const type = st.name;
      const notes = tonic ? st.intervals.map((i) => (0, import_pitch_distance.transpose)(tonic, i)) : [];
      const name = tonic ? tonic + " " + type : type;
      return { ...st, name, type, tonic, notes };
    }
    var scale2 = get;
    function detect2(notes, options = {}) {
      const notesChroma = (0, import_pcset.chroma)(notes);
      const tonic = (0, import_pitch_note.note)(options.tonic ?? notes[0] ?? "");
      const tonicChroma = tonic.chroma;
      if (tonicChroma === void 0) {
        return [];
      }
      const pitchClasses = notesChroma.split("");
      pitchClasses[tonicChroma] = "1";
      const scaleChroma = (0, import_collection.rotate)(tonicChroma, pitchClasses).join("");
      const match = (0, import_scale_type.all)().find((scaleType) => scaleType.chroma === scaleChroma);
      const results = [];
      if (match) {
        results.push(tonic.name + " " + match.name);
      }
      if (options.match === "exact") {
        return results;
      }
      extended(scaleChroma).forEach((scaleName) => {
        results.push(tonic.name + " " + scaleName);
      });
      return results;
    }
    function scaleChords(name) {
      const s = get(name);
      const inScale = (0, import_pcset.isSubsetOf)(s.chroma);
      return (0, import_chord_type.all)().filter((chord) => inScale(chord.chroma)).map((chord) => chord.aliases[0]);
    }
    function extended(name) {
      const chroma2 = (0, import_pcset.isChroma)(name) ? name : get(name).chroma;
      const isSuperset = (0, import_pcset.isSupersetOf)(chroma2);
      return (0, import_scale_type.all)().filter((scale22) => isSuperset(scale22.chroma)).map((scale22) => scale22.name);
    }
    function reduced(name) {
      const isSubset = (0, import_pcset.isSubsetOf)(get(name).chroma);
      return (0, import_scale_type.all)().filter((scale22) => isSubset(scale22.chroma)).map((scale22) => scale22.name);
    }
    function scaleNotes(notes) {
      const pcset = notes.map((n) => (0, import_pitch_note.note)(n).pc).filter((x) => x);
      const tonic = pcset[0];
      const scale22 = (0, import_note.sortedUniqNames)(pcset);
      return (0, import_collection.rotate)(scale22.indexOf(tonic), scale22);
    }
    function modeNames(name) {
      const s = get(name);
      if (s.empty) {
        return [];
      }
      const tonics = s.tonic ? s.notes : s.intervals;
      return (0, import_pcset.modes)(s.chroma).map((chroma2, i) => {
        const modeName = get(chroma2).name;
        return modeName ? [tonics[i], modeName] : ["", ""];
      }).filter((x) => x[0]);
    }
    function getNoteNameOf(scale22) {
      const names2 = Array.isArray(scale22) ? scaleNotes(scale22) : get(scale22).notes;
      const chromas = names2.map((name) => (0, import_pitch_note.note)(name).chroma);
      return (noteOrMidi) => {
        const currNote = typeof noteOrMidi === "number" ? (0, import_pitch_note.note)((0, import_note.fromMidi)(noteOrMidi)) : (0, import_pitch_note.note)(noteOrMidi);
        const height = currNote.height;
        if (height === void 0) return void 0;
        const chroma2 = height % 12;
        const position = chromas.indexOf(chroma2);
        if (position === -1) return void 0;
        return (0, import_note.enharmonic)(currNote.name, names2[position]);
      };
    }
    function rangeOf(scale22) {
      const getName = getNoteNameOf(scale22);
      return (fromNote, toNote) => {
        const from = (0, import_pitch_note.note)(fromNote).height;
        const to = (0, import_pitch_note.note)(toNote).height;
        if (from === void 0 || to === void 0) return [];
        return (0, import_collection.range)(from, to).map(getName).filter((x) => x);
      };
    }
    function degrees(scaleName) {
      const { intervals, tonic } = get(scaleName);
      const transpose2 = (0, import_pitch_distance.tonicIntervalsTransposer)(intervals, tonic);
      return (degree) => degree ? transpose2(degree > 0 ? degree - 1 : degree) : "";
    }
    function steps(scaleName) {
      const { intervals, tonic } = get(scaleName);
      return (0, import_pitch_distance.tonicIntervalsTransposer)(intervals, tonic);
    }
    var index_default = {
      degrees,
      detect: detect2,
      extended,
      get,
      modeNames,
      names,
      rangeOf,
      reduced,
      scaleChords,
      scaleNotes,
      steps,
      tokenize,
      // deprecated
      scale: scale2
    };
  }
});

// node_modules/.pnpm/@tonaljs+time-signature@4.9.0/node_modules/@tonaljs/time-signature/dist/index.js
var require_dist31 = __commonJS({
  "node_modules/.pnpm/@tonaljs+time-signature@4.9.0/node_modules/@tonaljs/time-signature/dist/index.js"(exports, module) {
    "use strict";
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var time_signature_exports = {};
    __export(time_signature_exports, {
      default: () => time_signature_default,
      get: () => get,
      names: () => names,
      parse: () => parse
    });
    module.exports = __toCommonJS(time_signature_exports);
    var NONE = {
      empty: true,
      name: "",
      upper: void 0,
      lower: void 0,
      type: void 0,
      additive: []
    };
    var NAMES = ["4/4", "3/4", "2/4", "2/2", "12/8", "9/8", "6/8", "3/8"];
    function names() {
      return NAMES.slice();
    }
    var REGEX = /^(\d*\d(?:\+\d)*)\/(\d+)$/;
    var CACHE = /* @__PURE__ */ new Map();
    function get(literal) {
      const stringifiedLiteral = JSON.stringify(literal);
      const cached = CACHE.get(stringifiedLiteral);
      if (cached) {
        return cached;
      }
      const ts = build(parse(literal));
      CACHE.set(stringifiedLiteral, ts);
      return ts;
    }
    function parse(literal) {
      if (typeof literal === "string") {
        const [_, up2, low] = REGEX.exec(literal) || [];
        return parse([up2, low]);
      }
      const [up, down] = literal;
      const denominator = +down;
      if (typeof up === "number") {
        return [up, denominator];
      }
      const list = up.split("+").map((n) => +n);
      return list.length === 1 ? [list[0], denominator] : [list, denominator];
    }
    var time_signature_default = { names, parse, get };
    var isPowerOfTwo = (x) => Math.log(x) / Math.log(2) % 1 === 0;
    function build([up, down]) {
      const upper = Array.isArray(up) ? up.reduce((a, b) => a + b, 0) : up;
      const lower = down;
      if (upper === 0 || lower === 0) {
        return NONE;
      }
      const name = Array.isArray(up) ? `${up.join("+")}/${down}` : `${up}/${down}`;
      const additive = Array.isArray(up) ? up : [];
      const type = lower === 4 || lower === 2 ? "simple" : lower === 8 && upper % 3 === 0 ? "compound" : isPowerOfTwo(lower) ? "irregular" : "irrational";
      return {
        empty: false,
        name,
        type,
        upper,
        lower,
        additive
      };
    }
  }
});

// node_modules/.pnpm/@tonaljs+tonal@4.10.0/node_modules/@tonaljs/tonal/dist/index.js
var require_dist32 = __commonJS({
  "node_modules/.pnpm/@tonaljs+tonal@4.10.0/node_modules/@tonaljs/tonal/dist/index.js"(exports, module) {
    "use strict";
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
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
    var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
      isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var tonal_tonal_exports = {};
    __export(tonal_tonal_exports, {
      AbcNotation: () => import_abc_notation.default,
      Array: () => Array2,
      Chord: () => import_chord.default,
      ChordDictionary: () => ChordDictionary,
      ChordType: () => import_chord_type.default,
      Collection: () => import_collection.default,
      Core: () => Core,
      DurationValue: () => import_duration_value.default,
      Interval: () => import_interval.default,
      Key: () => import_key.default,
      Midi: () => import_midi.default,
      Mode: () => import_mode.default,
      Note: () => import_note.default,
      PcSet: () => PcSet,
      Pcset: () => import_pcset.default,
      Progression: () => import_progression.default,
      Range: () => import_range.default,
      RomanNumeral: () => import_roman_numeral.default,
      Scale: () => import_scale.default,
      ScaleDictionary: () => ScaleDictionary,
      ScaleType: () => import_scale_type.default,
      TimeSignature: () => import_time_signature.default,
      Tonal: () => Tonal
    });
    module.exports = __toCommonJS(tonal_tonal_exports);
    var import_abc_notation = __toESM2(require_dist5());
    var Array2 = __toESM2(require_dist6());
    var import_chord = __toESM2(require_dist18());
    var import_chord_type = __toESM2(require_dist16());
    var import_collection = __toESM2(require_dist7());
    var Core = __toESM2(require_dist15());
    var import_duration_value = __toESM2(require_dist19());
    var import_interval = __toESM2(require_dist20());
    var import_key = __toESM2(require_dist24());
    var import_midi = __toESM2(require_dist21());
    var import_mode = __toESM2(require_dist26());
    var import_note = __toESM2(require_dist22());
    var import_pcset = __toESM2(require_dist8());
    var import_progression = __toESM2(require_dist28());
    var import_range = __toESM2(require_dist29());
    var import_roman_numeral = __toESM2(require_dist23());
    var import_scale = __toESM2(require_dist30());
    var import_scale_type = __toESM2(require_dist17());
    var import_time_signature = __toESM2(require_dist31());
    __reExport(tonal_tonal_exports, require_dist15(), module.exports);
    var Tonal = Core;
    var PcSet = import_pcset.default;
    var ChordDictionary = import_chord_type.default;
    var ScaleDictionary = import_scale_type.default;
  }
});

// node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/getBestVoicing.js
var require_getBestVoicing = __commonJS({
  "node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/getBestVoicing.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.getBestVoicing = void 0;
    function getBestVoicing(voicingOptions) {
      var chord = voicingOptions.chord, range = voicingOptions.range, finder = voicingOptions.finder, picker = voicingOptions.picker, lastVoicing2 = voicingOptions.lastVoicing;
      var voicings2 = finder(chord, range);
      if (!voicings2.length) {
        return [];
      }
      return picker(voicings2, lastVoicing2);
    }
    exports.getBestVoicing = getBestVoicing;
  }
});

// node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/tokenizeChord.js
var require_tokenizeChord = __commonJS({
  "node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/tokenizeChord.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.tokenizeChord = void 0;
    function tokenizeChord2(chord) {
      var match = (chord || "").match(/^([A-G][b#]*)([^\/]*)[\/]?([A-G][b#]*)?$/);
      if (!match) {
        return [];
      }
      return match.slice(1);
    }
    exports.tokenizeChord = tokenizeChord2;
  }
});

// node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/voicingsInRange.js
var require_voicingsInRange = __commonJS({
  "node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/voicingsInRange.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.voicingsInRange = void 0;
    var tonal_1 = require_dist32();
    var dictionaryVoicing_1 = require_dictionaryVoicing();
    var tokenizeChord_1 = require_tokenizeChord();
    function voicingsInRange(chord, dictionary, range) {
      if (dictionary === void 0) {
        dictionary = dictionaryVoicing_1.lefthand;
      }
      if (range === void 0) {
        range = ["D3", "A4"];
      }
      var _a = (0, tokenizeChord_1.tokenizeChord)(chord), tonic = _a[0], symbol = _a[1];
      if (!dictionary[symbol]) {
        return [];
      }
      var voicings2 = dictionary[symbol].map(function(intervals) {
        return intervals.split(" ");
      });
      var notesInRange = tonal_1.Range.chromatic(range);
      return voicings2.reduce(function(voiced, voicing2) {
        var relativeIntervals = voicing2.map(function(interval) {
          return tonal_1.Interval.substract(interval, voicing2[0]);
        });
        var bottomPitchClass = tonal_1.Note.transpose(tonic, voicing2[0]);
        var starts = notesInRange.filter(function(note) {
          return tonal_1.Note.chroma(note) === tonal_1.Note.chroma(bottomPitchClass);
        }).filter(function(note) {
          return tonal_1.Note.midi(tonal_1.Note.transpose(note, relativeIntervals[relativeIntervals.length - 1])) <= tonal_1.Note.midi(range[1]);
        }).map(function(note) {
          return tonal_1.Note.enharmonic(note, bottomPitchClass);
        });
        var notes = starts.map(function(start) {
          return relativeIntervals.map(function(interval) {
            return tonal_1.Note.transpose(start, interval);
          });
        });
        return voiced.concat(notes);
      }, []);
    }
    exports.voicingsInRange = voicingsInRange;
  }
});

// node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/dictionaryVoicing.js
var require_dictionaryVoicing = __commonJS({
  "node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/dictionaryVoicing.js"(exports) {
    "use strict";
    var __assign = exports && exports.__assign || function() {
      __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
        }
        return t;
      };
      return __assign.apply(this, arguments);
    };
    var __rest = exports && exports.__rest || function(s, e) {
      var t = {};
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
      if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
            t[p[i]] = s[p[i]];
        }
      return t;
    };
    exports.__esModule = true;
    exports.dictionaryVoicing = exports.dictionaryVoicingFinder = exports.triads = exports.guidetones = exports.lefthand = void 0;
    var getBestVoicing_1 = require_getBestVoicing();
    var voicingsInRange_1 = require_voicingsInRange();
    exports.lefthand = {
      m7: ["3m 5P 7m 9M", "7m 9M 10m 12P"],
      "7": ["3M 6M 7m 9M", "7m 9M 10M 13M"],
      "^7": ["3M 5P 7M 9M", "7M 9M 10M 12P"],
      "69": ["3M 5P 6A 9M"],
      m7b5: ["3m 5d 7m 8P", "7m 8P 10m 12d"],
      "7b9": ["3M 6m 7m 9m", "7m 9m 10M 13m"],
      "7b13": ["3M 6m 7m 9m", "7m 9m 10M 13m"],
      o7: ["1P 3m 5d 6M", "5d 6M 8P 10m"],
      "7#11": ["7m 9M 11A 13A"],
      "7#9": ["3M 7m 9A"],
      mM7: ["3m 5P 7M 9M", "7M 9M 10m 12P"],
      m6: ["3m 5P 6M 9M", "6M 9M 10m 12P"]
    };
    exports.guidetones = {
      m7: ["3m 7m", "7m 10m"],
      m9: ["3m 7m", "7m 10m"],
      "7": ["3M 7m", "7m 10M"],
      "^7": ["3M 7M", "7M 10M"],
      "^9": ["3M 7M", "7M 10M"],
      "69": ["3M 6M"],
      "6": ["3M 6M", "6M 10M"],
      m7b5: ["3m 7m", "7m 10m"],
      "7b9": ["3M 7m", "7m 10M"],
      "7b13": ["3M 7m", "7m 10M"],
      o7: ["3m 6M", "6M 10m"],
      "7#11": ["3M 7m", "7m 10M"],
      "7#9": ["3M 7m", "7m 10M"],
      mM7: ["3m 7M", "7M 10m"],
      m6: ["3m 6M", "6M 10m"]
    };
    exports.triads = {
      M: ["1P 3M 5P", "3M 5P 8P", "5P 8P 10M"],
      m: ["1P 3m 5P", "3m 5P 8P", "5P 8P 10m"],
      o: ["1P 3m 5d", "3m 5d 8P", "5d 8P 10m"],
      aug: ["1P 3m 5A", "3m 5A 8P", "5A 8P 10m"]
    };
    var dictionaryVoicingFinder = function(dictionary) {
      return function(chordSymbol, range) {
        return (0, voicingsInRange_1.voicingsInRange)(chordSymbol, dictionary, range);
      };
    };
    exports.dictionaryVoicingFinder = dictionaryVoicingFinder;
    var dictionaryVoicing2 = function(props) {
      var dictionary = props.dictionary, range = props.range, rest = __rest(props, ["dictionary", "range"]);
      return (0, getBestVoicing_1.getBestVoicing)(__assign(__assign({}, rest), { range, finder: (0, exports.dictionaryVoicingFinder)(dictionary) }));
    };
    exports.dictionaryVoicing = dictionaryVoicing2;
  }
});

// node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/minTopNoteDiff.js
var require_minTopNoteDiff = __commonJS({
  "node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/minTopNoteDiff.js"(exports) {
    "use strict";
    exports.__esModule = true;
    exports.minTopNoteDiff = void 0;
    var tonal_1 = require_dist32();
    function minTopNoteDiff2(voicings2, lastVoicing2) {
      if (!lastVoicing2) {
        return voicings2[0];
      }
      var diff = function(voicing2) {
        return Math.abs(tonal_1.Note.midi(lastVoicing2[lastVoicing2.length - 1]) - tonal_1.Note.midi(voicing2[voicing2.length - 1]));
      };
      return voicings2.reduce(function(best, current) {
        return diff(current) < diff(best) ? current : best;
      }, voicings2[0]);
    }
    exports.minTopNoteDiff = minTopNoteDiff2;
  }
});

// node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/index.js
var require_dist33 = __commonJS({
  "node_modules/.pnpm/chord-voicings@0.0.1/node_modules/chord-voicings/dist/index.js"(exports) {
    "use strict";
    exports.__esModule = true;
    var dictionaryVoicing_1 = require_dictionaryVoicing();
    var minTopNoteDiff_1 = require_minTopNoteDiff();
    var getBestVoicing_1 = require_getBestVoicing();
    var tokenizeChord_1 = require_tokenizeChord();
    exports["default"] = {
      tokenizeChord: tokenizeChord_1.tokenizeChord,
      getBestVoicing: getBestVoicing_1.getBestVoicing,
      dictionaryVoicing: dictionaryVoicing_1.dictionaryVoicing,
      dictionaryVoicingFinder: dictionaryVoicing_1.dictionaryVoicingFinder,
      lefthand: dictionaryVoicing_1.lefthand,
      guidetones: dictionaryVoicing_1.guidetones,
      triads: dictionaryVoicing_1.triads,
      minTopNoteDiff: minTopNoteDiff_1.minTopNoteDiff
    };
  }
});

// strudel/packages/tonal/tonal.mjs
var import_tonal2 = __toESM(require_dist32(), 1);

// strudel/packages/tonal/tonleiter.mjs
var import_tonal = __toESM(require_dist32(), 1);
var flats = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
var pcs = ["c", "db", "d", "eb", "e", "f", "gb", "g", "ab", "a", "bb", "b"];
var sharps = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var accs = { b: -1, "#": 1 };
var pc2chroma = (pc) => {
  const [letter, ...rest] = pc.split("");
  return pcs.indexOf(letter.toLowerCase()) + rest.reduce((sum, sign) => sum + accs[sign], 0);
};
function tokenizeChord(chord) {
  const match = (chord || "").match(/^([A-G][b#]*)([^/]*)[/]?([A-G][b#]*)?$/);
  if (!match) {
    return [];
  }
  return match.slice(1);
}
var midi2chroma = (midi) => midi % 12;
var step2semitones = (x) => {
  let num = Number(x);
  if (!isNaN(num)) {
    return num;
  }
  return import_tonal.Interval.semitones(x);
};
var x2midi = (x, defaultOctave) => {
  if (typeof x === "number") {
    return x;
  }
  if (typeof x === "string") {
    return noteToMidi(x, defaultOctave);
  }
};
var midi2note = (midi, sharp = false) => {
  const oct = Math.floor(midi / 12) - 1;
  const pc = (sharp ? sharps : flats)[midi % 12];
  return pc + oct;
};
function scaleStep(notes, offset, octaves = 1) {
  notes = notes.map((note) => typeof note === "string" ? noteToMidi(note) : note);
  const octOffset = Math.floor(offset / notes.length) * octaves * 12;
  offset = _mod(offset, notes.length);
  return notes[offset] + octOffset;
}
function nearestNumberIndex(target, numbers, preferHigher) {
  let bestIndex = 0, bestDiff = Infinity;
  numbers.forEach((s, i) => {
    const diff = Math.abs(s - target);
    if (!preferHigher && diff < bestDiff || preferHigher && diff <= bestDiff) {
      bestIndex = i;
      bestDiff = diff;
    }
  });
  return bestIndex;
}
var scaleSteps = {};
function stepInNamedScale(step, scale2, anchor, preferHigher) {
  const [root, scaleName] = import_tonal.Scale.tokenize(scale2);
  const rootMidi = x2midi(root);
  const rootChroma = midi2chroma(rootMidi);
  if (!scaleSteps[scaleName]) {
    const { intervals } = import_tonal.Scale.get(`C ${scaleName}`);
    scaleSteps[scaleName] = intervals.map(step2semitones);
  }
  const steps = scaleSteps[scaleName];
  if (!steps) {
    return null;
  }
  let transpose2 = rootMidi;
  if (anchor) {
    anchor = x2midi(anchor, 3);
    const anchorChroma = midi2chroma(anchor);
    const anchorDiff = _mod(anchorChroma - rootChroma, 12);
    const zeroIndex = nearestNumberIndex(anchorDiff, steps, preferHigher);
    step = step + zeroIndex;
    transpose2 = anchor - anchorDiff;
  }
  const octOffset = Math.floor(step / steps.length) * 12;
  step = _mod(step, steps.length);
  const targetMidi = steps[step] + transpose2;
  return targetMidi + octOffset;
}
var modeTarget = {
  below: (v) => v.slice(-1)[0],
  duck: (v) => v.slice(-1)[0],
  above: (v) => v[0],
  root: (v) => v[0]
};
function renderVoicing({ chord, dictionary, offset = 0, n, mode = "below", anchor = "c5", octaves = 1 }) {
  const [root, symbol] = tokenizeChord(chord);
  const rootChroma = pc2chroma(root);
  anchor = x2midi(anchor?.note || anchor, 4);
  const anchorChroma = midi2chroma(anchor);
  const voicings2 = dictionary[symbol].map(
    (voicing3) => (typeof voicing3 === "string" ? voicing3.split(" ") : voicing3).map(step2semitones)
  );
  let minDistance, bestIndex;
  let chromaDiffs = voicings2.map((v, i) => {
    const targetStep2 = modeTarget[mode](v);
    const diff = _mod(anchorChroma - targetStep2 - rootChroma, 12);
    if (minDistance === void 0 || diff < minDistance) {
      minDistance = diff;
      bestIndex = i;
    }
    return diff;
  });
  if (mode === "root") {
    bestIndex = 0;
  }
  const octDiff = Math.ceil(offset / voicings2.length) * 12;
  const indexWithOffset = _mod(bestIndex + offset, voicings2.length);
  const voicing2 = voicings2[indexWithOffset];
  const targetStep = modeTarget[mode](voicing2);
  const anchorMidi = anchor - chromaDiffs[indexWithOffset] + octDiff;
  const voicingMidi = voicing2.map((v) => anchorMidi - targetStep + v);
  let notes = voicingMidi.map((n2) => midi2note(n2));
  if (mode === "duck") {
    notes = notes.filter((_, i) => voicingMidi[i] !== anchor);
  }
  if (n !== void 0) {
    return [scaleStep(notes, n, octaves)];
  }
  return notes;
}

// strudel/packages/tonal/tonal.mjs
var octavesInterval = (octaves) => (octaves <= 0 ? -1 : 1) + octaves * 7 + "P";
function getScale(scaleName) {
  scaleName = scaleName.replaceAll(":", " ");
  const scale2 = import_tonal2.Scale.get(scaleName);
  const { tonic, empty } = scale2;
  if (empty && isNote(scaleName) || empty && !tonic) {
    throw new Error(
      `Scale name ${scaleName} is incomplete. Make sure to use ":" instead of spaces, example: .scale("C:major")`
    );
  } else if (empty) {
    throw new Error(`Invalid scale name "${scaleName}"`);
  }
  return scale2;
}
function scaleStep2(step, scale2) {
  step = Math.ceil(step);
  let { intervals, tonic } = getScale(scale2);
  tonic = tonic || "C";
  const { pc, oct = 3 } = import_tonal2.Note.get(tonic);
  const octaveOffset = Math.floor(step / intervals.length);
  const scaleStep3 = _mod(step, intervals.length);
  const interval = import_tonal2.Interval.add(intervals[scaleStep3], octavesInterval(octaveOffset));
  return import_tonal2.Note.transpose(pc + oct, interval);
}
function scaleOffset(scale2, offset, note) {
  let { notes } = getScale(scale2);
  notes = notes.map((note2) => import_tonal2.Note.get(note2).pc);
  offset = Number(offset);
  if (isNaN(offset)) {
    throw new Error(`scale offset "${offset}" not a number`);
  }
  const { pc: fromPc, oct = 3 } = import_tonal2.Note.get(note);
  const noteIndex = notes.indexOf(fromPc);
  if (noteIndex === -1) {
    throw new Error(`note "${note}" is not in scale "${scale2}"`);
  }
  let i = noteIndex, o = oct, n = fromPc;
  const direction = Math.sign(offset);
  while (Math.abs(i - noteIndex) < Math.abs(offset)) {
    i += direction;
    const index = _mod(i, notes.length);
    if (direction < 0 && n[0] === "C") {
      o += direction;
    }
    n = notes[index];
    if (direction > 0 && n[0] === "C") {
      o += direction;
    }
  }
  return n + o;
}
var { transpose, trans } = register(["transpose", "trans"], function transposeFn(intervalOrSemitones, pat) {
  return pat.withHap((hap) => {
    const note = hap.value.note ?? hap.value;
    if (typeof note === "number") {
      let semitones;
      if (typeof intervalOrSemitones === "number") {
        semitones = intervalOrSemitones;
      } else if (typeof intervalOrSemitones === "string") {
        semitones = import_tonal2.Interval.semitones(intervalOrSemitones) || 0;
      }
      const targetNote2 = note + semitones;
      if (typeof hap.value === "object") {
        return hap.withValue(() => ({ ...hap.value, note: targetNote2 }));
      }
      return hap.withValue(() => targetNote2);
    }
    if (typeof note !== "string" || !isNote(note)) {
      logger(`[tonal] transpose: not a note "${note}"`, "warning");
      return hap;
    }
    const interval = !isNaN(Number(intervalOrSemitones)) ? import_tonal2.Interval.fromSemitones(intervalOrSemitones) : String(intervalOrSemitones);
    const targetNote = import_tonal2.Note.transpose(note, interval);
    if (typeof hap.value === "object") {
      return hap.withValue(() => ({ ...hap.value, note: targetNote }));
    }
    return hap.withValue(() => targetNote);
  });
});
var { scaleTranspose, scaleTrans, strans } = register(
  ["scaleTranspose", "scaleTrans", "strans"],
  function(offset, pat) {
    return pat.withHap((hap) => {
      if (!hap.context.scale) {
        throw new Error("can only use scaleTranspose after .scale");
      }
      if (typeof hap.value === "object")
        return hap.withValue(() => ({
          ...hap.value,
          note: scaleOffset(hap.context.scale, Number(offset), hap.value.note)
        }));
      if (typeof hap.value !== "string") {
        throw new Error("can only use scaleTranspose with notes");
      }
      return hap.withValue(() => scaleOffset(hap.context.scale, Number(offset), hap.value));
    });
  }
);
function _convertStepToNumberAndOffset(step) {
  let asNumber = Number(step);
  let offset = 0;
  if (isNaN(asNumber)) {
    step = String(step);
    const match = /^(-?\d+)([#bsf]*)$/.exec(step);
    if (!match) {
      throw new Error(`invalid scale step "${step}", expected number or integer with optional # b suffixes`);
    }
    asNumber = Number(match[1]);
    const accidentals = match[2] || "";
    offset = getAccidentalsOffset(accidentals);
  }
  return [asNumber, offset];
}
var scaleToMidisAndNotes = {};
function _getNearestScaleNote(scaleName, note, preferHigher = true) {
  let noteMidi = typeof note === "string" ? noteToMidi(note) : note;
  if (scaleToMidisAndNotes[scaleName] === void 0) {
    const { intervals, tonic } = getScale(scaleName);
    const { pc } = import_tonal2.Note.get(tonic);
    const expandedIntervals = intervals.concat("8P");
    const sNotes = expandedIntervals.map((interval) => import_tonal2.Note.transpose(pc + "0", interval));
    const sMidi = sNotes.map(noteToMidi);
    scaleToMidisAndNotes[scaleName] = [sMidi, sNotes];
  }
  const [scaleMidis, scaleNotes] = scaleToMidisAndNotes[scaleName];
  const rootMidi = scaleMidis[0];
  const octaveDiff = Math.floor((noteMidi - rootMidi) / 12);
  const alignedMidis = scaleMidis.map((m) => m + 12 * octaveDiff);
  const noteIdx = nearestNumberIndex(noteMidi, alignedMidis, preferHigher);
  const noteMatch = scaleNotes[noteIdx];
  return import_tonal2.Note.transpose(noteMatch, import_tonal2.Interval.fromSemitones(12 * octaveDiff));
}
var scale = register(
  "scale",
  function(scale2, pat) {
    if (Array.isArray(scale2)) {
      scale2 = scale2.flat().join(" ");
    }
    return pat.withHaps((haps) => {
      haps = haps.map((hap) => {
        let hVal = hap.value;
        const isObject = typeof hVal === "object";
        hVal = isObject ? hVal : { n: hVal };
        const { note, n, value, ...otherValues } = hVal;
        const noteOrStep = note ?? n ?? value;
        if (noteOrStep === void 0) {
          logger(
            `[tonal] Invalid value format for 'scale'. Value must contain n, note, or value but received keys [${Object.keys(hVal).join(", ")}]`,
            "error"
          );
          return hap;
        }
        let scaleNote;
        if (isNote(noteOrStep)) {
          scaleNote = _getNearestScaleNote(scale2, noteOrStep);
          hap.value = { ...otherValues, note: scaleNote };
        } else {
          try {
            const [number, offset] = _convertStepToNumberAndOffset(noteOrStep);
            if (otherValues.anchor) {
              scaleNote = stepInNamedScale(number, scale2, otherValues.anchor);
            } else {
              scaleNote = scaleStep2(number, scale2);
            }
            if (offset != 0) scaleNote = import_tonal2.Note.transpose(scaleNote, import_tonal2.Interval.fromSemitones(offset));
          } catch (err) {
            errorLogger(err, "tonal");
            return;
          }
        }
        hap.value = isObject ? { ...otherValues, note: scaleNote } : scaleNote;
        return hap.setContext({ ...hap.context, scale: scale2 });
      });
      return removeUndefineds(haps);
    });
  },
  true,
  true
  // preserve step count
);

// strudel/packages/tonal/voicings.mjs
var import_chord_voicings = __toESM(require_dist33(), 1);

// strudel/packages/tonal/ireal.mjs
var simple = {
  2: ["1P 5P 8P 9M", "1P 5P 8P 9M 12P", "5P 8P 9M 12P"],
  5: ["1P 5P 8P 12P", "5P 8P 12P 15P"],
  6: ["1P 5P 6M 8P 10M", "1P 5P 8P 10M 13M", "3M 5P 8P 10M 13M", "5P 8P 10M 12P 13M"],
  7: [
    "1P 5P 7m 8P 10M",
    "1P 7m 8P 10M 12P",
    "3M 7m 8P 10M 12P",
    "3M 7m 8P 10M 14m",
    "3M 7m 10M 12P 15P",
    "7m 10M 12P 14m 15P",
    "7m 10M 12P 15P 17M"
  ],
  9: [
    "1P 5P 7m 9M 10M",
    "1P 7m 9M 10M 12P",
    "3M 7m 8P 9M 12P",
    "7m 9M 10M 14m 15P",
    "3M 7m 8P 12P 16M",
    "7m 10M 12P 15P 16M"
  ],
  11: ["1P 5P 7m 9M 11P", "5P 7m 8P 9M 11P", "7m 8P 9M 11P 12P", "7m 8P 11P 12P 16M"],
  13: ["1P 6M 7m 9M 10M", "1P 7m 9M 10M 13M", "3M 7m 8P 9M 13M", "7m 8P 9M 10M 13M", "7m 9M 10M 13M 15P"],
  69: ["1P 5P 6M 9M 10M", "1P 5P 9M 10M 13M", "3M 5P 8P 9M 13M", "5P 8P 9M 10M 13M"],
  add9: ["1P 5P 8P 9M 10M", "1P 5P 9M 10M 12P", "3M 8P 9M 10M 12P", "3M 8P 9M 12P 15P", "5P 8P 9M 12P 17M"],
  "+": [
    "1P 3M 6m 8P 10M",
    "1P 6m 8P 10M 13m",
    "3M 6m 8P 10M 13m",
    "3M 8P 10M 13m 15P",
    "6m 8P 10M 13m 15P",
    "6m 10M 13m 15P 17M"
  ],
  o: ["1P 5d 8P 10m 12d", "3m 8P 10m 12d 15P", "5d 8P 10m 12d 15P"],
  h: [
    "3m 5d 7m 8P 10m",
    "1P 5d 7m 10m 12d",
    "3m 7m 8P 10m 12d",
    "3m 7m 8P 12d 14m",
    "5d 7m 8P 10m 14m",
    "5d 8P 10m 12d 14m",
    "7m 10m 12d 14m 15P",
    "5d 8P 10m 14m 17m"
  ],
  sus: ["1P 4P 5P 8P", "1P 4P 5P 8P 11P", "5P 8P 11P 12P", "5P 8P 11P 12P 15P"],
  "^": ["1P 5P 8P 10M", "1P 5P 8P 10M 12P", "3M 5P 8P 10M 12P", "3M 8P 10M 12P 15P", "5P 8P 10M 12P 15P"],
  "-": ["1P 3m 5P 8P 10m", "1P 5P 8P 10m 12P", "3m 5P 8P 10m 12P", "5P 8P 10m 12P 15P"],
  "^7": ["1P 5P 7M 10M 12P", "1P 10M 12P 14M", "3M 8P 10M 12P 14M", "5P 8P 10M 12P 14M", "5P 8P 10M 14M 17M"],
  "-7": [
    "1P 3m 5P 7m 10m",
    "1P 5P 7m 10m 12P",
    "3m 7m 8P 10m 12P",
    "3m 7m 8P 10m 14m",
    "5P 7m 8P 10m 14m",
    "7m 10m 12P 14m 15P",
    "5P 8P 10m 14m 17m",
    "7m 10m 12P 15P 17m"
  ],
  "7sus": ["1P 5P 7m 8P 11P", "5P 8P 11P 12P 14m", "7m 8P 11P 12P 14m", "7m 11P 12P 14m 18P"],
  h7: [
    "3m 5d 7m 8P 10m",
    "1P 5d 7m 10m 12d",
    "1P 7m 10m 12d",
    "3m 7m 8P 10m 12d",
    "3m 7m 8P 12d 14m",
    "5d 7m 8P 10m 14m",
    "5d 8P 10m 12d 14m",
    "7m 10m 12d 14m 15P",
    "5d 8P 10m 14m 17m"
  ],
  o7: [
    "1P 6M 8P 10m 12d",
    "1P 6M 10m 12d 13M",
    "3m 8P 10m 12d 13M",
    "3m 8P 12d 13M 15P",
    "5d 10m 12d 13M 15P",
    "5d 10m 13M 15P 17m",
    "6M 12d 13M 15P 17m",
    "6M 12d 15P 17m 19d"
  ],
  "^9": [
    "1P 5P 7M 9M 10M",
    "1P 7M 9M 10M 12P",
    "3M 7M 8P 9M 12P",
    "3M 7M 8P 12P 16M",
    "5P 8P 10M 14M 16M",
    "7M 8P 10M 12P 16M"
  ],
  "^13": ["1P 6M 7M 9M 10M", "1P 7M 9M 10M 13M", "3M 7M 8P 9M 13M", "3M 7M 8P 13M 16M", "7M 8P 10M 13M 16M"],
  "^7#11": ["1P 5P 7M 10M 12d", "3M 7M 8P 10M 12d", "1P 7M 10M 12d 14M", "3M 7M 8P 12d 14M", "5P 8P 10M 12d 14M"],
  "^9#11": ["1P 3M 5d 7M 9M", "1P 7M 9M 10M 12d", "3M 7M 8P 9M 12d", "3M 8P 9M 12d 14M"],
  "^7#5": ["1P 6m 7M 10M 13m", "3M 7M 8P 10M 13m", "6m 7M 8P 10M 13m"],
  "-6": [
    "1P 3m 5P 6M 8P",
    "1P 5P 6M 8P 10m",
    "3m 5P 6M 8P 10m",
    "1P 5P 8P 10m 13M",
    "3m 5P 8P 10m 13M",
    "5P 8P 10m 12P 13M",
    "5P 8P 10m 13M 15P"
  ],
  "-69": [
    "1P 3m 5P 6M 9M",
    "3m 5P 6M 8P 9M",
    "3m 6M 9M 10m 12P",
    "1P 5P 9M 10m 13M",
    "3m 5P 8P 9M 13M",
    "5P 8P 9M 10m 13M",
    "5P 8P 10m 13M 16M"
  ],
  "-^7": ["1P 3m 5P 7M 10m", "1P 5P 7M 10m 12P", "3m 7M 8P 10m 12P", "5P 7M 8P 10m 14M", "5P 8P 10m 14M 17m"],
  "-^9": ["1P 3m 5P 7M 9M", "1P 7M 9M 10m 12P", "3m 7M 8P 9M 12P", "5P 8P 9M 10m 14M"],
  "-9": [
    "1P 3m 5P 7m 9M",
    "3m 5P 7m 8P 9M",
    "3m 7m 8P 9M 12P",
    "5P 8P 9M 10m 14m",
    "3m 7m 9M 12P 15P",
    "7m 10m 12P 15P 16M"
  ],
  "-add9": ["1P 2M 3m 5P 8P", "1P 3m 5P 9M", "3m 5P 8P 9M 12P", "5P 8P 9M 10m 12P"],
  "-11": [
    "1P 3m 7m 9M 11P",
    "3m 7m 8P 9M 11P",
    "1P 4P 7m 10m 12P",
    "5P 8P 11P 14m",
    "3m 7m 9M 11P 15P",
    "5P 8P 11P 14m 16M",
    "7m 10m 12P 15P 18P"
  ],
  "-7b5": [
    "3m 5d 7m 8P 10m",
    "1P 7m 10m 12d",
    "1P 5d 7m 10m 12d",
    "3m 7m 8P 10m 12d",
    "3m 7m 8P 12d 14m",
    "5d 7m 8P 10m 14m",
    "5d 8P 10m 12d 14m",
    "7m 10m 12d 14m 15P",
    "5d 8P 10m 14m 17m"
  ],
  h9: ["1P 7m 9M 10m 12d", "3m 7m 8P 9M 12d", "5d 8P 9M 10m 14m", "7m 10m 12d 15P 16M"],
  "-b6": ["1P 5P 6m 8P 10m", "1P 5P 8P 10m 13m", "3m 5P 8P 10m 13m", "5P 8P 10m 13m", "5P 8P 10m 13m 15P"],
  "-#5": ["1P 6m 8P 10m 13m", "3m 6m 8P 10m 13m", "6m 8P 10m 13m 15P"],
  "7b9": ["1P 3M 7m 9m 10M", "3M 7m 8P 9m 10M", "3M 7m 8P 9m 14m", "7m 9m 10M 14m 15P"],
  "7#9": ["1P 3M 7m 10m", "3M 7m 8P 10m 14m", "7m 10m 10M 14m 15P"],
  "7#11": ["1P 3M 7m 10M 12d", "3M 7m 8P 10M 12d", "7m 10M 12d 14m 15P"],
  "7b5": ["1P 3M 7m 10M 12d", "3M 7m 8P 10M 12d", "7m 10M 12d 14m 15P"],
  "7#5": ["1P 3M 7m 10M 13m", "3M 7m 8P 10M 13m", "3M 7m 8P 13m 14m", "7m 10M 13m 14m 15P"],
  "9#11": ["1P 7m 9M 10M 12d", "3M 7m 8P 9M 12d", "7m 10M 12d 15P 16M"],
  "9b5": ["1P 7m 9M 10M 12d", "3M 7m 8P 9M 12d", "7m 10M 12d 15P 16M"],
  "9#5": ["1P 7m 9M 10M 13m", "3M 7m 9M 10M 13m", "3M 7m 9M 13m 14m", "7m 10M 13m 14m 16M", "7m 10M 13m 16M 17M"],
  "7b13": ["1P 3M 7m 10M 13m", "3M 7m 8P 10M 13m", "3M 7m 8P 13m 14m", "7m 10M 13m 14m 15P"],
  "7#9#5": ["1P 3M 7m 10m 13m", "3M 7m 10m 13m 15P", "7m 10M 13m 15P 17m"],
  "7#9b5": ["1P 3M 7m 10m 12d", "3M 7m 10m 12d 15P", "7m 10M 12d 15P 17m"],
  "7#9#11": ["1P 3M 7m 10m 12d", "3M 7m 10m 12d 15P", "7m 10M 12d 15P 17m"],
  "7b9#11": ["1P 7m 9m 10M 12d", "3M 7m 8P 9m 12d", "7m 8P 10M 12d 16m"],
  "7b9b5": ["1P 7m 9m 10M 12d", "3M 7m 8P 9m 12d", "7m 8P 10M 12d 16m"],
  "7b9#5": ["1P 7m 9m 10M 13m", "3M 7m 8P 9m 13m", "7m 9m 10M 13m 15P"],
  "7b9#9": ["1P 3M 7m 9m 10m", "3M 7m 8P 9m 10m", "7m 8P 10M 16m 17m"],
  "7b9b13": ["1P 7m 9m 10M 13m", "3M 7m 8P 9m 13m", "7m 9m 10M 13m 15P"],
  "7alt": [
    "3M 7m 8P 9m 12d",
    "1P 7m 10m 10M 13m",
    "3M 7m 8P 10m 13m",
    "3M 7m 9m 12d 15P",
    "3M 7m 10m 13m 15P",
    "7m 10M 12d 15P 17m",
    "7m 10M 13m 15P 17m"
  ],
  "13#11": ["1P 6M 7m 10M 12d", "3M 7m 9M 12d 13M", "7m 10M 12d 13M 16M"],
  "13b9": ["1P 3M 6M 7m 9m", "1P 6M 7m 9m 10M", "3M 7m 9m 10M 13M", "3M 7m 10M 13M 16m", "7m 10M 13M 16m 17M"],
  "13#9": ["1P 3M 6M 7m 10m", "3M 7m 8P 10m 13M", "7m 10M 13M 14m 17m"],
  "7b9sus": ["1P 5P 7m 9m 11P", "5P 7m 8P 9m 11P", "7m 8P 11P 14m 16m"],
  "7susadd3": ["1P 4P 5P 7m 10M", "5P 8P 10M 11P 14m", "7m 11P 12P 15P 17M"],
  "9sus": ["1P 5P 7m 9M 11P", "5P 7m 8P 9M 11P", "7m 8P 9M 11P 12P", "7m 8P 11P 12P 16M"],
  "13sus": ["1P 4P 6M 7m 9M", "1P 7m 9M 11P 13M", "5P 7m 9M 11P 13M", "7m 9M 11P 13M 15P"],
  "7b13sus": ["1P 5P 7m 11P 13m", "5P 7m 8P 11P 13m", "7m 11P 13m 14m 15P"]
};
var complex = {
  2: ["1P 5P 6M 8P 9M", "1P 5P 8P 9M 12P", "5P 8P 9M 12P 13M", "5P 8P 9M 12P 15P"],
  5: ["1P 5P 8P 12P", "1P 5P 8P 9M 12P", "5P 8P 12P 15P", "5P 8P 12P 15P 16M"],
  6: ["1P 5P 6M 9M 10M", "1P 5P 9M 10M 13M", "3M 5P 9M 10M 13M", "5P 8P 9M 10M 13M", "3M 6M 9M 12P 15P"],
  7: [
    "1P 5P 7m 8P 10M",
    "1P 7m 8P 10M 12P",
    "3M 7m 8P 10M 12P",
    "3M 7m 8P 10M 14m",
    "3M 7m 10M 12P 15P",
    "7m 10M 12P 14m 15P",
    "7m 10M 12P 15P 17M",
    "7m 10M 14m 17M 19P"
  ],
  9: [
    "1P 6M 7m 9M 10M",
    "3M 7m 9M 10M 12P",
    "1P 7m 9M 10M 13M",
    "3M 7m 9M 10M 13M",
    "3M 7m 9M 12P 15P",
    "7m 10M 12P 13M 16M",
    "7m 10M 13M 16M 17M",
    "7m 10M 13M 16M 19P"
  ],
  11: [
    "1P 4P 6M 7m 9M",
    "1P 5P 7m 9M 11P",
    "4P 6M 7m 9M 11P",
    "5P 8P 9M 11P 14m",
    "7m 9M 11P 13M 15P",
    "7m 11P 12P 14m 18P"
  ],
  13: [
    "3M 7m 9M 10M 13M",
    "3M 7m 9M 13M 15P",
    "3M 7m 10M 13M 16M",
    "7m 10M 12P 13M 16M",
    "7m 10M 13M 16M 17M",
    "7m 10M 13M 16M 19P"
  ],
  69: ["1P 5P 6M 9M 10M", "1P 5P 9M 10M 13M", "3M 5P 9M 10M 13M", "5P 8P 9M 10M 13M", "3M 6M 9M 12P 15P"],
  add9: [
    "1P 5P 8P 9M 10M",
    "1P 5P 9M 10M 12P",
    "3M 8P 9M 10M 12P",
    "3M 8P 9M 12P 15P",
    "5P 8P 9M 10M 15P",
    "5P 8P 9M 12P 17M"
  ],
  "+": [
    "1P 6m 8P 9M 10M",
    "1P 6m 8P 10M 13m",
    "3M 8P 9M 10M 13m",
    "3M 8P 10M 13m 15P",
    "6m 10M 13m 15P 16M",
    "6m 10M 13m 15P 17M"
  ],
  o: [
    "1P 6M 8P 10m 12d",
    "1P 6M 10m 12d 13M",
    "3m 8P 10m 12d 13M",
    "3m 8P 12d 13M 15P",
    "5d 10m 12d 13M 15P",
    "5d 10m 13M 15P 17m",
    "6M 12d 13M 15P 17m",
    "6M 12d 15P 17m 19d"
  ],
  h: [
    "1P 5d 7m 10m 11P",
    "3m 5d 7m 8P 11P",
    "5d 7m 8P 10m 11P",
    "1P 7m 10m 12d",
    "3m 7m 8P 12d 14m",
    "5d 8P 10m 11P 14m",
    "7m 10m 11P 12d 14m",
    "7m 10m 12d 14m 15P",
    "5d 8P 10m 14m 17m"
  ],
  sus: [
    "1P 4P 5P 8P 9M",
    "1P 4P 5P 8P 11P",
    "1P 5P 8P 9M 11P",
    "5P 8P 9M 11P 12P",
    "5P 8P 11P 12P 13M",
    "5P 8P 11P 13M 15P"
  ],
  "^": [
    "1P 3M 5P 6M 9M",
    "1P 5P 8P 10M 12P",
    "3M 5P 9M 10M 12P",
    "1P 5P 8P 10M 13M",
    "3M 8P 10M 13M 15P",
    "5P 9M 10M 12P 15P"
  ],
  "-": [
    "1P 3m 5P 8P 10m",
    "1P 3m 5P 9M 11P",
    "3m 5P 8P 9M 11P",
    "5P 8P 9M 10m 11P",
    "1P 5P 9M 10m 12P",
    "3m 5P 8P 10m 12P",
    "5P 8P 10m 12P 15P"
  ],
  "^7": [
    "1P 6M 7M 9M 10M",
    "3M 7M 9M 10M 12P",
    "1P 7M 9M 10M 13M",
    "3M 7M 9M 10M 13M",
    "3M 7M 9M 12P 13M",
    "3M 7M 9M 13M 14M",
    "3M 7M 10M 13M 16M",
    "7M 10M 13M 14M 16M",
    "7M 10M 13M 16M 17M",
    "7M 10M 13M 16M 19P"
  ],
  "-7": [
    "1P 3m 5P 7m 9M",
    "1P 3m 5P 7m 10m",
    "1P 5P 7m 10m 11P",
    "3m 7m 8P 10m 11P",
    "1P 5P 7m 10m 12P",
    "3m 7m 9M 10m 12P",
    "3m 7m 8P 10m 14m",
    "5P 7m 9M 10m 14m",
    "7m 10m 11P 14m 15P",
    "7m 10m 12P 15P 16M",
    "5P 8P 11P 14m 17m",
    "7m 10m 12P 15P 17m"
  ],
  "7sus": [
    "1P 4P 6M 7m 9M",
    "1P 5P 7m 9M 11P",
    "4P 6M 7m 9M 11P",
    "5P 8P 9M 11P 14m",
    "7m 9M 11P 13M 15P",
    "7m 11P 12P 14m 18P"
  ],
  h7: [
    "1P 5d 7m 10m 11P",
    "3m 5d 7m 8P 11P",
    "5d 7m 8P 10m 11P",
    "1P 7m 10m 12d",
    "3m 7m 8P 10m 12d",
    "3m 7m 8P 12d 14m",
    "5d 8P 10m 11P 14m",
    "7m 10m 11P 12d 14m",
    "7m 10m 12d 14m 15P",
    "5d 8P 10m 14m 17m"
  ],
  o7: [
    "1P 6M 8P 10m 12d",
    "1P 6M 10m 12d 13M",
    "3m 8P 10m 12d 13M",
    "3m 8P 12d 13M 15P",
    "5d 10m 12d 13M 15P",
    "5d 10m 13M 15P 17m",
    "6M 12d 13M 15P 17m",
    "6M 12d 15P 17m 19d"
  ],
  "^9": [
    "1P 6M 7M 9M 10M",
    "1P 7M 9M 10M 13M",
    "3M 7M 9M 10M 13M",
    "3M 7M 9M 12P 13M",
    "3M 7M 8P 9M 13M",
    "3M 7M 9M 13M 14M",
    "3M 7M 10M 13M 16M",
    "7M 10M 13M 14M 16M",
    "7M 10M 13M 16M 17M",
    "7M 10M 13M 16M 19P"
  ],
  "^13": [
    "1P 6M 7M 9M 10M",
    "1P 7M 9M 10M 13M",
    "3M 7M 9M 12P 13M",
    "3M 7M 9M 10M 13M",
    "3M 7M 8P 9M 13M",
    "3M 7M 9M 13M 14M",
    "3M 7M 10M 13M 16M",
    "7M 10M 13M 14M 16M",
    "7M 10M 13M 16M 17M",
    "7M 10M 13M 16M 19P"
  ],
  "^7#11": [
    "1P 3M 5d 7M 9M",
    "1P 7M 9M 10M 12d",
    "3M 7M 9M 10M 12d",
    "3M 7M 9M 12d 13M",
    "3M 7M 10M 12d 14M",
    "7M 10M 12d 13M 14M",
    "7M 10M 12d 13M 16M",
    "7M 10M 12d 14M 17M"
  ],
  "^9#11": [
    "1P 3M 5d 7M 9M",
    "1P 7M 9M 10M 12d",
    "3M 7M 9M 10M 12d",
    "3M 7M 9M 12d 13M",
    "3M 7M 9M 12d 14M",
    "7M 10M 12d 14M 16M",
    "7M 10M 12d 13M 16M"
  ],
  "^7#5": ["1P 6m 7M 10M 13m", "3M 7M 9M 10M 13m", "3M 7M 10M 13m 14M", "7M 10M 13m 14M 16M", "7M 10M 13m 14M 17M"],
  "-6": [
    "1P 3m 5P 6M 9M",
    "3m 5P 6M 8P 9M",
    "1P 5P 6M 10m 11P",
    "3m 5P 6M 8P 11P",
    "1P 5P 9M 10m 13M",
    "3m 5P 8P 9M 13M",
    "5P 8P 10m 11P 13M",
    "5P 8P 10m 13M 16M"
  ],
  "-69": [
    "1P 3m 5P 6M 9M",
    "3m 5P 6M 8P 9M",
    "3m 6M 9M 10m 12P",
    "1P 5P 9M 10m 13M",
    "3m 5P 8P 9M 13M",
    "5P 8P 9M 10m 13M",
    "5P 8P 10m 13M 16M"
  ],
  "-^7": [
    "1P 3m 5P 7M 9M",
    "1P 5P 7M 10m 11P",
    "3m 7M 9M 10m 11P",
    "3m 7M 9M 10m 12P",
    "3m 7M 9M 12P 14M",
    "7M 10m 11P 12P 14M",
    "7M 10m 12P 14M 16M"
  ],
  "-^9": [
    "1P 3m 5P 7M 9M",
    "1P 5P 7M 10m 11P",
    "3m 7M 9M 10m 11P",
    "3m 7M 9M 10m 12P",
    "3m 7M 9M 12P 14M",
    "7M 10m 11P 12P 14M",
    "7M 10m 12P 14M 16M"
  ],
  "-9": [
    "1P 3m 5P 7m 9M",
    "1P 3m 7m 9M 11P",
    "3m 7m 9M 10m 11P",
    "3m 7m 9M 10m 12P",
    "3m 7m 9M 10m 14m",
    "3m 7m 9M 12P 15P",
    "7m 10m 11P 14m 16M",
    "7m 10m 12P 16M 18P"
  ],
  "-add9": ["1P 2M 3m 5P 8P", "1P 3m 5P 9M", "3m 5P 8P 9M 12P", "5P 8P 9M 10m 12P"],
  "-11": [
    "3m 5P 7m 9M 11P",
    "7m 9M 10m 11P",
    "1P 4P 7m 10m 12P",
    "3m 7m 9M 11P 12P",
    "7m 9M 10m 11P 12P",
    "3m 7m 9M 11P 14m",
    "4P 10m 12P 14m",
    "5P 8P 11P 14m",
    "5P 8P 11P 14m 16M",
    "7m 10m 12P 16M 18P",
    "7m 10m 11P 16M 21m"
  ],
  "-7b5": [
    "1P 5d 7m 10m 11P",
    "3m 5d 7m 8P 11P",
    "5d 7m 8P 10m 11P",
    "1P 7m 10m 12d",
    "3m 7m 8P 10m 12d",
    "3m 7m 8P 12d 14m",
    "5d 8P 10m 11P 14m",
    "7m 10m 11P 12d 14m",
    "7m 10m 12d 14m 15P",
    "5d 8P 10m 14m 17m"
  ],
  h9: [
    "3m 5d 7m 9M 11P",
    "1P 7m 9M 10m 12d",
    "3m 7m 9M 12d 14m",
    "5d 8P 9M 10m 14m",
    "7m 10m 11P 12d 14m",
    "7m 10m 12d 14m 16M"
  ],
  "-b6": ["1P 3m 5P 6m 8P", "3m 5P 8P 11P 13m", "5P 8P 10m 11P 13m"],
  "-#5": ["1P 6m 8P 10m 13m", "3m 6m 8P 11P 13m", "6m 8P 10m 13m 15P"],
  "7b9": ["1P 3M 7m 9m 10M", "3M 7m 8P 9m 10M", "3M 7m 8P 9m 14m", "7m 9m 10M 14m 15P"],
  "7#9": ["1P 3M 7m 10m", "3M 7m 10m 10M 12P", "3M 7m 10m 12P 14m", "7m 10M 12P 14m 17m"],
  "7#11": ["1P 3M 7m 9M 12d", "3M 7m 9M 12d 13M", "7m 10M 12d 13M 16M"],
  "7b5": ["1P 3M 7m 9M 12d", "3M 7m 9M 12d 13M", "7m 10M 12d 13M 16M"],
  "7#5": ["1P 3M 7m 10M 13m", "3M 7m 8P 10M 13m", "3M 7m 8P 13m 14m", "7m 10M 13m 14m 15P", "7m 10M 13m 14m 17M"],
  "9#11": ["1P 7m 9M 10M 12d", "3M 7m 8P 9M 12d", "7m 10M 12d 15P 16M"],
  "9b5": ["1P 7m 9M 10M 12d", "3M 7m 8P 9M 12d", "7m 10M 12d 15P 16M"],
  "9#5": ["1P 7m 9M 10M 13m", "3M 7m 9M 10M 13m", "3M 7m 9M 13m 14m", "7m 10M 13m 14m 16M", "7m 10M 13m 16M 17M"],
  "7b13": ["1P 3M 7m 10M 13m", "3M 7m 8P 10M 13m", "3M 7m 8P 13m 14m", "7m 10M 13m 14m 15P", "7m 10M 13m 14m 17M"],
  "7#9#5": ["3M 7m 10m 10M 13m", "3M 7m 10m 13m 14m", "7m 10M 13m 14m 17m"],
  "7#9b5": ["3M 7m 10m 10M 12d", "3M 7m 10m 12d 14m", "7m 10M 12d 14m 17m"],
  "7#9#11": ["3M 7m 10m 10M 12d", "3M 7m 10m 12d 14m", "7m 10M 12d 14m 17m"],
  "7b9#11": ["3M 7m 9m 10M 12d", "3M 7m 9m 12d 14m", "7m 8P 10M 12d 16m", "7m 10M 12d 14m 16m"],
  "7b9b5": ["3M 7m 9m 10M 12d", "3M 7m 9m 12d 14m", "7m 8P 10M 12d 16m", "7m 10M 12d 14m 16m"],
  "7b9#5": ["1P 7m 9m 10M 13m", "3M 7m 9m 10M 13m", "3M 7m 10M 13m 16m", "7m 10M 13m 14m 16m", "7m 10M 13m 16m 17M"],
  "7b9#9": ["1P 3M 7m 9m 10m", "3M 7m 10m 13m 16m", "7m 10M 13m 16m 17m"],
  "7b9b13": ["1P 7m 9m 10M 13m", "3M 7m 9m 10M 13m", "3M 7m 10M 13m 16m", "7m 10M 13m 14m 16m", "7m 10M 13m 16m 17M"],
  "7alt": [
    "3M 7m 8P 10m 13m",
    "3M 7m 9m 12d 13m",
    "3M 7m 9m 10m 13m",
    "3M 7m 10m 13m 14m",
    "3M 7m 9m 12d 14m",
    "3M 7m 10m 13m 15P",
    "3M 7m 10m 13m 16m",
    "7m 10M 12d 14m 16m",
    "7m 10M 12d 13m 16m",
    "7m 10M 13m 15P 17m",
    "7m 10M 13m 16m 17m",
    "7m 10M 13m 16m 19d"
  ],
  "13#11": ["3M 7m 9M 12d 13M", "7m 10M 12d 13M 16M"],
  "13b9": ["3M 7m 9m 10M 13M", "3M 7m 10M 13M 16m", "7m 10M 13M 16m 17M"],
  "13#9": ["3M 7m 10m 10M 13M", "7m 10M 13M 14m 17m"],
  "7b9sus": ["1P 5P 7m 9m 11P", "5P 7m 8P 9m 11P", "7m 8P 11P 14m 16m"],
  "7susadd3": ["1P 4P 5P 7m 10M", "5P 8P 10M 11P 14m", "7m 11P 12P 15P 17M"],
  "9sus": [
    "1P 4P 6M 7m 9M",
    "1P 5P 7m 9M 11P",
    "4P 6M 7m 9M 11P",
    "5P 8P 9M 11P 14m",
    "7m 9M 11P 13M 15P",
    "7m 11P 12P 14m 18P"
  ],
  "13sus": [
    "1P 4P 6M 7m 9M",
    "1P 7m 9M 11P 13M",
    "4P 7m 9M 11P 13M",
    "7m 9M 11P 13M 15P",
    "7m 11P 13M 14m 16M",
    "7m 11P 13M 16M 18P"
  ],
  "7b13sus": ["1P 5P 7m 11P 13m", "5P 7m 8P 11P 13m", "7m 11P 13m 14m 15P"]
};

// strudel/packages/tonal/voicings.mjs
var { dictionaryVoicing, minTopNoteDiff } = import_chord_voicings.default.default || import_chord_voicings.default;
var lefthand = {
  m7: ["3m 5P 7m 9M", "7m 9M 10m 12P"],
  7: ["3M 6M 7m 9M", "7m 9M 10M 13M"],
  "^7": ["3M 5P 7M 9M", "7M 9M 10M 12P"],
  69: ["3M 5P 6A 9M"],
  m7b5: ["3m 5d 7m 8P", "7m 8P 10m 12d"],
  "7b9": ["3M 6m 7m 9m", "7m 9m 10M 13m"],
  "7b13": ["3M 6m 7m 9m", "7m 9m 10M 13m"],
  o7: ["1P 3m 5d 6M", "5d 6M 8P 10m"],
  "7#11": ["7m 9M 11A 13A"],
  "7#9": ["3M 7m 9A"],
  mM7: ["3m 5P 7M 9M", "7M 9M 10m 12P"],
  m6: ["3m 5P 6M 9M", "6M 9M 10m 12P"]
};
var guidetones = {
  m7: ["3m 7m", "7m 10m"],
  m9: ["3m 7m", "7m 10m"],
  7: ["3M 7m", "7m 10M"],
  "^7": ["3M 7M", "7M 10M"],
  "^9": ["3M 7M", "7M 10M"],
  69: ["3M 6M"],
  6: ["3M 6M", "6M 10M"],
  m7b5: ["3m 7m", "7m 10m"],
  "7b9": ["3M 7m", "7m 10M"],
  "7b13": ["3M 7m", "7m 10M"],
  o7: ["3m 6M", "6M 10m"],
  "7#11": ["3M 7m", "7m 10M"],
  "7#9": ["3M 7m", "7m 10M"],
  mM7: ["3m 7M", "7M 10m"],
  m6: ["3m 6M", "6M 10m"]
};
var triads = {
  "": ["1P 3M 5P", "3M 5P 8P", "5P 8P 10M"],
  M: ["1P 3M 5P", "3M 5P 8P", "5P 8P 10M"],
  m: ["1P 3m 5P", "3m 5P 8P", "5P 8P 10m"],
  o: ["1P 3m 5d", "3m 5d 8P", "5d 8P 10m"],
  aug: ["1P 3m 5A", "3m 5A 8P", "5A 8P 10m"]
};
var defaultDictionary = {
  // triads
  "": ["1P 3M 5P", "3M 5P 8P", "5P 8P 10M"],
  M: ["1P 3M 5P", "3M 5P 8P", "5P 8P 10M"],
  m: ["1P 3m 5P", "3m 5P 8P", "5P 8P 10m"],
  o: ["1P 3m 5d", "3m 5d 8P", "5d 8P 10m"],
  aug: ["1P 3m 5A", "3m 5A 8P", "5A 8P 10m"],
  // sevenths chords
  m7: ["3m 5P 7m 9M", "7m 9M 10m 12P"],
  7: ["3M 6M 7m 9M", "7m 9M 10M 13M"],
  "^7": ["3M 5P 7M 9M", "7M 9M 10M 12P"],
  69: ["3M 5P 6A 9M"],
  m7b5: ["3m 5d 7m 8P", "7m 8P 10m 12d"],
  "7b9": ["3M 6m 7m 9m", "7m 9m 10M 13m"],
  "7b13": ["3M 6m 7m 9m", "7m 9m 10M 13m"],
  o7: ["1P 3m 5d 6M", "5d 6M 8P 10m"],
  "7#11": ["7m 9M 11A 13A"],
  "7#9": ["3M 7m 9A"],
  mM7: ["3m 5P 7M 9M", "7M 9M 10m 12P"],
  m6: ["3m 5P 6M 9M", "6M 9M 10m 12P"]
};
var voicingRegistry = {
  lefthand: { dictionary: lefthand, range: ["F3", "A4"], mode: "below", anchor: "a4" },
  triads: { dictionary: triads, mode: "below", anchor: "a4" },
  guidetones: { dictionary: guidetones, mode: "above", anchor: "a4" },
  legacy: { dictionary: defaultDictionary, mode: "below", anchor: "a4" }
};
var defaultDict = "ireal";
var setDefaultVoicings = (dict) => defaultDict = dict;
var setVoicingRange = (name, range) => addVoicings(name, voicingRegistry[name].dictionary, range);
var addVoicings = (name, dictionary, range = ["F3", "A4"]) => {
  Object.assign(voicingRegistry, { [name]: { dictionary, range } });
};
var registerVoicings = (name, dictionary, options = {}) => {
  Object.assign(voicingRegistry, { [name]: { dictionary, ...options } });
};
var getVoicing = (chord, dictionaryName, lastVoicing2) => {
  const { dictionary, range } = voicingRegistry[dictionaryName];
  return dictionaryVoicing({
    chord,
    dictionary,
    range,
    picker: minTopNoteDiff,
    lastVoicing: lastVoicing2
  });
};
var lastVoicing;
var voicings = register("voicings", function(dictionary, pat) {
  return pat.fmap((value) => {
    lastVoicing = getVoicing(value, dictionary, lastVoicing);
    return stack(...lastVoicing);
  }).outerJoin();
});
var rootNotes = register("rootNotes", function(octave, pat) {
  return pat.fmap((value) => {
    const chord = value.chord || value;
    const root = chord.match(/^([a-gA-G][b#]?).*$/)[1];
    const note = root + octave;
    return value.chord ? { note } : note;
  });
});
var voicing = register("voicing", function(pat) {
  return pat.fmap((value) => {
    value = typeof value === "string" ? { chord: value } : value;
    let { dictionary = defaultDict, chord, anchor, offset, mode, n, octaves, ...rest } = value;
    dictionary = typeof dictionary === "string" ? voicingRegistry[dictionary] : { dictionary, mode: "below", anchor: "c5" };
    try {
      let notes = renderVoicing({ ...dictionary, chord, anchor, offset, mode, n, octaves });
      return stack(...notes).note().set(rest);
    } catch (err) {
      logger(`[voicing]: unknown chord "${chord}"`);
      return silence;
    }
  }).outerJoin();
});
function voicingAlias(symbol, alias, setOrSets) {
  setOrSets = !Array.isArray(setOrSets) ? [setOrSets] : setOrSets;
  setOrSets.forEach((set) => {
    set[alias] = set[symbol];
  });
}
voicingAlias("^", "", [simple, complex]);
Object.keys(simple).forEach((symbol) => {
  if (symbol.includes("-")) {
    let alias = symbol.replace("-", "m");
    voicingAlias(symbol, alias, [complex, simple]);
  }
  if (symbol.includes("^")) {
    let alias = symbol.replace("^", "M");
    voicingAlias(symbol, alias, [complex, simple]);
  }
  if (symbol.includes("+")) {
    let alias = symbol.replace("+", "aug");
    voicingAlias(symbol, alias, [complex, simple]);
  }
});
registerVoicings("ireal", simple);
registerVoicings("ireal-ext", complex);
function resetVoicings() {
  lastVoicing = void 0;
  setDefaultVoicings("ireal");
}

// strudel/packages/tonal/index.mjs
var packageName = "@strudel/tonal";
export {
  addVoicings,
  complex,
  packageName,
  registerVoicings,
  resetVoicings,
  rootNotes,
  scale,
  scaleTrans,
  scaleTranspose,
  setDefaultVoicings,
  setVoicingRange,
  simple,
  strans,
  trans,
  transpose,
  voicing,
  voicingAlias,
  voicingRegistry,
  voicings
};
