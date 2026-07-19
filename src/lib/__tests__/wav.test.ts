import { describe, it, expect } from "vitest";
import { audioBufferToWav } from "@/lib/render/wav";

/** Minimal AudioBuffer stand-in - the encoder only calls these three members. */
function fakeBuffer(channels: number[][], sampleRate = 44100): AudioBuffer {
  return {
    numberOfChannels: channels.length,
    sampleRate,
    length: channels[0].length,
    getChannelData: (i: number) => Float32Array.from(channels[i]),
  } as unknown as AudioBuffer;
}

const str = (v: DataView, off: number, len: number) =>
  Array.from({ length: len }, (_, i) => String.fromCharCode(v.getUint8(off + i))).join("");

describe("audioBufferToWav", () => {
  it("writes a well-formed 16-bit stereo RIFF/WAVE header", () => {
    const wav = audioBufferToWav(fakeBuffer([[0, 0.5], [0, -0.5]], 48000));
    const v = new DataView(wav);
    expect(str(v, 0, 4)).toBe("RIFF");
    expect(str(v, 8, 4)).toBe("WAVE");
    expect(str(v, 12, 4)).toBe("fmt ");
    expect(str(v, 36, 4)).toBe("data");
    expect(v.getUint16(20, true)).toBe(1); // PCM
    expect(v.getUint16(22, true)).toBe(2); // stereo
    expect(v.getUint32(24, true)).toBe(48000); // sample rate
    expect(v.getUint16(34, true)).toBe(16); // bit depth
    // 2 frames * 2 channels * 2 bytes = 8 data bytes; 44 header + 8 = 52 total.
    expect(v.getUint32(40, true)).toBe(8);
    expect(wav.byteLength).toBe(52);
  });

  it("interleaves L/R and quantizes to signed 16-bit", () => {
    const wav = audioBufferToWav(fakeBuffer([[1], [-1]]));
    const v = new DataView(wav);
    // sample 0 = L(+1) => 0x7fff, sample 1 = R(-1) => -0x8000
    expect(v.getInt16(44, true)).toBe(0x7fff);
    expect(v.getInt16(46, true)).toBe(-0x8000);
  });

  it("clamps out-of-range floats", () => {
    const wav = audioBufferToWav(fakeBuffer([[2], [2]]));
    const v = new DataView(wav);
    expect(v.getInt16(44, true)).toBe(0x7fff);
  });
});
