# SPIKE: the sample browser with no network

**Concern:** with no network, does the browser block jweb's main UI thread? And more
broadly, does the device stay usable offline, or does it hang?

**Short answer, and the reason this is a short spike:** the UI thread is **not** blocked
by the network, and cannot be, because every network call the device makes is
asynchronous. The real offline risk was never a frozen thread - it was a promise that
**hangs**, leaving a row stuck on "Fetching..." with no way out. That is now bounded by
timeouts. What is left is a verification pass in Live, below.

---

## Why the main thread is not the risk

jweb is Chromium, and its UI runs on one thread - the same one React renders on. A call
blocks that thread only if it is **synchronous** and long. The browser makes exactly two
kinds of network call, and both are async:

- **`fetch()`** for the catalog JSON (`src/lib/samples.ts`). A promise. It yields the
  thread the instant it is called; React keeps rendering, the list keeps scrolling.
- **`fetchToFile()`** for the audio (the `download` chain). Not even in-process - it is a
  Max message to `[maxurl]`, which does the work in libcurl and answers with another
  message. Nothing about it runs on jweb's thread at all.

The only synchronous work in the whole path is parsing the catalog JSON once it arrives,
which is small and instant. **There is no synchronous network, no busy-wait, no big sync
loop.** So an offline device does not freeze; it stays responsive. That is the property to
confirm in Stage 1 below, not to engineer - it is already true.

## What WAS the risk, and the fix

A promise that never settles. With no route to the host, neither `fetch()` nor `[maxurl]`
rejects promptly - each waits out an OS-level connect timeout that can run to a minute or
more, and `[maxurl]` gives the app no handle to cancel it. During that time the UI is
fine, but the *operation* is stuck: the map shows "Loading..." or a row shows
"Fetching..." indefinitely, and to the user that reads as broken.

The fix bounds the **wait**, not the work (the work cannot be cancelled from here):

- `fetchWithTimeout()` - the catalog fetch aborts after 12 s via `AbortController`, and
  reports "offline?" rather than "404".
- `withDeadline()` - the download is raced against a 30 s deadline; on timeout the row
  unsticks and `onDisk` is left unmarked, so a retry re-fetches. If the abandoned
  `[maxurl]` later finishes, its reply falls on the floor harmlessly.

Both are unit-tested (`src/lib/__tests__/samples.test.ts`). Neither "unblocks the thread"
- the thread was never blocked - each just decides how long the app waits before it can
tell the user the truth.

---

## The verification pass (needs a real Live session, network pulled)

Turn the machine's network OFF (airplane mode, or unplug), then:

1. **Responsiveness.** Open the device. The list, the search box and the dropdown must all
   stay live - typing filters, arrows move, panels open. This is the "thread not blocked"
   claim; if any of it stutters, something synchronous slipped in.
2. **Catalog fails fast and clearly.** Pick a map. Within ~12 s the status must read an
   offline/timeout message, not spin forever, and the device must still be usable
   afterwards (pick another map, open Custom...).
3. **Download fails fast and clearly.** Audition a sound that is NOT already on disk.
   Within ~30 s the status must report the timeout and the row must unstick (no permanent
   "Fetching...").
4. **Cached samples still play offline.** Audition something you fetched earlier this
   session, or in a previous one - the file is in `samples/` next to the device, and
   `[buffer~]` reads it locally. It must load and loop with no network at all. This is a
   feature worth confirming: once downloaded, a sample is yours.
5. **Captive-portal case (optional).** On a network that intercepts with a login page, the
   catalog fetch returns HTML with a 200. `JSON.parse` throws, and it must surface as a
   load error, not a crash. (Cheap to trigger on many public wifis; skip if awkward.)

## Outcomes

| Finding | Meaning | Action |
|---|---|---|
| All five pass | The device degrades cleanly offline | Nothing. Delete this doc's "risk" framing and keep it as the record. |
| Stage 1 stutters | Something synchronous is on the network path | Find it - it should not exist. That is the real bug, not the timeouts. |
| Stage 2/3 hang past the deadline | The timeout is not firing (or `[maxurl]` swallows the abort) | Check `withDeadline`/`fetchWithTimeout` are actually in the path; the unit tests pass, so suspect the wiring, not the helpers. |
| Stage 4 fails | A cached sample will not play offline | Then the preview is reaching for the network when it should not - `onDisk` or the path resolution is wrong. |

---

*Related: [SPIKE-DRAG-TO-CLIP.md](SPIKE-DRAG-TO-CLIP.md) (the other open browser question),
and [ARCHITECTURE.md](ARCHITECTURE.md) §3d (the whole preview path).*
