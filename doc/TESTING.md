# TESTING - what a human still has to check in Live

The test suites pin what the generated patcher SAYS; nothing in CI can hear a filter,
watch a window open, or see a Push encoder page. This file holds **only the open
checks**. Everything already confirmed - and the recipe to re-check it if the code
underneath changes - lives in [ARCHITECTURE.md](ARCHITECTURE.md) under "Verified in
Live".

## Before you start

```bash
cd m4l-strudel
pnpm install            # deps: see the dependency note at the end
pnpm build              # writes dist/m4l-strudel/*.amxd
pnpm install:device     # copies them into the User Library
```

Then in Live: **File > New Live Set**, drag each device from the User Library. If a
device shows a stale build stamp, quit Live entirely and reopen - **Live caches
`.amxd` metadata by filename**, and a same-named device can keep serving cached
parameter data (this cost a whole debugging session; when in doubt, copy the amxd to
a new filename and drag that).

---

## No open checks

Everything shipped for 0.9.0 has been confirmed in Live and the slate is clean for 1.0.0.
The standing re-check recipes (what to look at should the code underneath change) live in
[ARCHITECTURE.md](ARCHITECTURE.md) under "Verified in Live"; ideas tried and parked are in
[DRAWER_OF_FAILED_IDEAS.md](DRAWER_OF_FAILED_IDEAS.md). New behaviour lands its own check
here as it ships.

# The dependency note

`package.json` points `@m4l-jweb/*` at `^0.9.0`, and m4l-jweb 0.9.0 is published to
npm - a fresh clone or CI installs the published packages, no local link needed.

(In-progress cross-repo work bumps to a not-yet-published 0.9.1 and temporarily
consumes it via `link:../m4l-jweb/packages/*` on disk; that link is dropped and
0.9.1 published once the round is confirmed working.)
