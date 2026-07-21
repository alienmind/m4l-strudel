/**
 * The side-effect half of sampleCache.ts.
 *
 * It is a module of its own so the wrapping happens BEFORE any device code runs:
 * import statements execute in source order, so main.tsx imports this above
 * `@device/App` and superdough's first `fetch()` already sees the cache. A call from
 * inside a component would be too late for anything the module graph fetched on load.
 */
import { installSampleCache } from "./sampleCache";

installSampleCache();
