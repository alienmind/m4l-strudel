/**
 * One-shot fixer for ableton-amxd/ableton-template.amxd. Parses the amxd
 * container (ampf/meta/ptch + mx@c-framed patcher JSON + dlst directory),
 * then rewrites the file so that:
 *  - the patcher opens in Presentation view ("openinpresentation": 1), so the
 *    device shows only the jweb UI, never the patch plumbing;
 *  - the jweb Initial URL is "about:blank" (wrapper.js sends the real
 *    file:// URL at runtime);
 *  - any embedded (frozen) dependencies are stripped, so Max always loads
 *    wrapper.js from disk, next to the .amxd.
 *
 * Usage: node scripts/patch-template.mjs [path/to/device.amxd]
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const amxdPath = process.argv[2] ?? path.join(root, "ableton-amxd", "ableton-template.amxd");

const buf = await readFile(amxdPath);

// --- parse container ----------------------------------------------------
if (buf.toString("ascii", 0, 4) !== "ampf") throw new Error("not an amxd (missing ampf)");
const deviceType = buf.toString("ascii", 8, 12); // e.g. "mmmm" = MIDI device
if (buf.toString("ascii", 12, 16) !== "meta") throw new Error("missing meta chunk");
const metaSize = buf.readUInt32LE(16);
const metaValue = buf.readUInt32LE(20);
const ptchTag = 20 + metaSize;
if (buf.toString("ascii", ptchTag, ptchTag + 4) !== "ptch") throw new Error("missing ptch chunk");
const mxOff = ptchTag + 8;
if (buf.toString("ascii", mxOff, mxOff + 4) !== "mx@c") throw new Error("missing mx@c frame");

// The dlst directory at the end of the ptch payload lists embedded files;
// its first dire entry is the patcher JSON (offset/size relative to mx@c).
const dlstOff = buf.indexOf(Buffer.from("dlst", "ascii"), mxOff);
if (dlstOff < 0) throw new Error("missing dlst directory");
const direOff = dlstOff + 8;
const direEnd = direOff + buf.readUInt32BE(direOff + 4);
const direField = (tag) => {
	const p = buf.indexOf(Buffer.from(tag, "ascii"), direOff);
	if (p < 0 || p >= direEnd) throw new Error(`missing ${tag} in dire entry`);
	return buf.readUInt32BE(p + 8);
};
const jsonSize = direField("sz32");
const jsonOff = direField("of32"); // relative to mx@c frame start
const mdat = direField("mdat");

const jsonText = buf.toString("utf8", mxOff + jsonOff, mxOff + jsonOff + jsonSize);
const json = JSON.parse(jsonText.slice(0, jsonText.lastIndexOf("}") + 1)); // sz32 may count a trailing NUL

// --- patch the patcher ----------------------------------------------------
json.patcher.openinpresentation = 1;
let jwebs = 0;
for (const { box } of json.patcher.boxes) {
	if (box.maxclass === "jweb") {
		box.url = "about:blank";
		jwebs++;
	}
}
if (jwebs === 0) console.warn("patch-template: warning - no jweb box found");

// --- rebuild (unfrozen: the patcher JSON is the only dlst entry) ----------
// Max NUL-terminates the patcher JSON and counts the NUL in sz32 — mimic that.
const jsonBuf = Buffer.from(JSON.stringify(json, null, 4) + "\0", "utf8");
const be = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
const le = (n) => { const b = Buffer.alloc(4); b.writeUInt32LE(n); return b; };
// chunk = 4-char tag + u32be size (size includes the 8-byte header)
const chunk = (tag, payload) => Buffer.concat([Buffer.from(tag, "ascii"), be(8 + payload.length), payload]);
const nameBuf = (() => {
	const raw = Buffer.from(path.basename(amxdPath), "utf8");
	return Buffer.concat([raw, Buffer.alloc(4 - (raw.length % 4) || 4)]); // NUL-pad to 4-byte boundary (min 1)
})();
const dire = chunk("dire", Buffer.concat([
	chunk("type", Buffer.from("JSON", "ascii")),
	chunk("fnam", nameBuf),
	chunk("sz32", be(jsonBuf.length)),
	chunk("of32", be(16)),
	chunk("vers", be(0)),
	chunk("flag", be(0x11)),
	chunk("mdat", be(mdat)),
]));
const dlst = chunk("dlst", dire);
const mxHeader = Buffer.concat([Buffer.from("mx@c", "ascii"), be(16), be(0), be(16 + jsonBuf.length)]);
const ptchPayload = Buffer.concat([mxHeader, jsonBuf, dlst]);
const out = Buffer.concat([
	Buffer.from("ampf", "ascii"), le(4), Buffer.from(deviceType, "ascii"),
	Buffer.from("meta", "ascii"), le(metaSize), le(metaValue),
	Buffer.from("ptch", "ascii"), le(ptchPayload.length),
	ptchPayload,
]);

await writeFile(amxdPath, out);
console.log(
	`patch-template: ${path.relative(root, amxdPath)} rewritten - ` +
	`openinpresentation=1, jweb url=about:blank, embedded deps stripped ` +
	`(${buf.length} -> ${out.length} bytes)`,
);
