import { beforeAll, describe, expect, it, vi } from "vitest";
import { installSampleCache } from "../sampleCache";

/**
 * The cache's behaviour with NO IndexedDB - which is both the node test environment and
 * the worst case in Live, so it is the one worth pinning. The in-memory fallback has to
 * give the same answers: a sample fetched once is not fetched again, a network failure
 * is served from what was already stored, and anything that is not a sample or a map
 * goes straight through.
 *
 * ONE install for the file: the wrapper captures the original `fetch` when it is
 * installed and refuses to wrap twice (wrapping a wrapper is how a cache turns into a
 * recursion), so every case here shares the same network mock.
 */

const network = vi.fn(async (input: unknown) => {
	const url = String(input);
	if (url.includes("dead")) throw new Error("offline");
	if (url.endsWith(".html")) return new Response("hi");
	return new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "audio/wav" } });
});

beforeAll(() => {
	globalThis.fetch = network as unknown as typeof fetch;
	installSampleCache();
});

describe("sample cache", () => {
	it("serves a repeated sample from the cache", async () => {
		const url = "https://example.test/bd.wav";
		const first = await fetch(url);
		expect((await first.arrayBuffer()).byteLength).toBe(3);
		const calls = network.mock.calls.length;

		const second = await fetch(url);
		expect(second.ok).toBe(true);
		expect((await second.arrayBuffer()).byteLength).toBe(3);
		expect(network.mock.calls.length).toBe(calls); // never reached the network
	});

	it("invents nothing for a URL it never stored", async () => {
		await expect(fetch("https://example.test/dead.wav")).rejects.toThrow("offline");
	});

	it("leaves anything that is not a sample or a map alone", async () => {
		const before = network.mock.calls.length;
		await fetch("https://example.test/page.html");
		await fetch("https://example.test/page.html");
		expect(network.mock.calls.length).toBe(before + 2);
	});
});
