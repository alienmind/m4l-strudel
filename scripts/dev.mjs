/**
 * dev.mjs - run ONE device's UI in a browser, with the mocked-Live harness.
 *
 *   node scripts/dev.mjs <device>      (or: pnpm dev:midi / pnpm dev:sampler)
 *
 * The device must be in patcher/devices.mjs. With no argument, the first one in
 * the manifest is used.
 *
 * Sets DEVICE for vite.config.ts, which points the `@device` alias at
 * src/app/<device>/. Node rather than an inline env var in the npm script because
 * `DEVICE=x vite` is not portable to Windows shells, and cross-env is a
 * dependency this does not need.
 */
import { createServer } from "vite";
import { devices, resolveDevice } from "./devices.mjs";

const requested = process.argv[2] ?? devices[0]?.name;
const dir = resolveDevice(requested);
process.env.DEVICE = dir;

const server = await createServer({ server: { host: "127.0.0.1", port: 5175 } });
await server.listen();

console.log(
	`\n  device: ${requested} (src/app/${dir}/)   (others: ${devices.map((d) => d.name).filter((n) => n !== requested).join(", ") || "none"})`,
);
server.printUrls();
