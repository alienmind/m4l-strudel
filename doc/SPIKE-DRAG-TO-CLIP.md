# SPIKE: drag a sample from the browser into a Live clip

**Status: not started. This is a plan, not a result.**

The sample browser downloads a file and wants to hand it to a track. The user's ask is
the natural one: "let me drag any row into the clip I want it in." This document is the
investigation that has to happen before we can promise that, because **we do not yet know
whether it is possible from a Max for Live device at all**, and one popular framing of it
(intercept what Splice drops) does not actually answer the question. Both halves are
below.

---

## What we already know, and why it forces a spike

**1. The LOM cannot create an audio clip from a file.** `ClipSlot.create_clip(length)` is
**MIDI only** - it makes an empty MIDI clip. There is no `create_audio_clip`, and no
property you can set to point an empty slot at a WAV. For *audio*, putting a file into a
clip is a drag-and-drop gesture in the application, and Ableton exposes no scripting path
to it. (Confirmed against the Live 12 LOM. If a future version adds one, this whole spike
is mooted and the feature becomes a one-line LOM call.)

So the ONLY mechanism that places our file into a clip is a real drag-and-drop. Which
raises the two unknowns this spike exists to settle.

**2. Does `[jweb]` even emit an OS drag?** Our row is HTML with `draggable`, and it sets
`text/uri-list`, `text/plain` and `DownloadURL` on the drag (see `startFileDrag` in
`src/app/sampler-browser/App.tsx`). Inside a browser that is a real drag. But `[jweb]` is
**embedded** Chromium inside a Max object, and an embedded webview does not necessarily
promote an HTML5 drag to a native OS drag session that another application (Live's track
lane) can receive. Many embeds swallow it. **If this fails, no payload format matters** -
the drag never leaves the view - and the answer is "not from the page."

**3. If it does emit one, which format does Live's audio lane accept?** Live's own
browser and third-party plugins drop files onto tracks; the drop target reads *some* set
of clipboard/drag types. We do not know which, and it may be a platform file-promise
(`NSFilenamesPboardType` on macOS, `CF_HDROP` on Windows) that a webview cannot synthesise
from JavaScript at all.

---

## The "intercept Splice" idea: what it can and cannot tell us

The proposal was: put a listener on an audio track, drop a sample from the Splice plugin,
and see what we can intercept. It is a reasonable instinct, and it is worth being precise
about what it yields, because the literal version does not answer question 3.

**What is NOT observable.** When Splice drops a file on a track, the drag payload travels
at the **OS level**, between Splice's own native window and Live's drop target. A Max for
Live device is not in that path - it has no hook for "a drag entered/left/dropped on this
track," and it cannot read the drag pasteboard of a gesture happening in another
application's windows. So we cannot sniff the MIME types Splice used. That is the part the
interception framing implies but cannot deliver.

**What IS observable, via the LOM - and it is genuinely useful.** After a successful drop,
Live has created an **audio clip**, and an audio clip exposes **`Clip.file_path`** (a
readable property). So a small observer device CAN see the aftermath:

- observe each `ClipSlot.has_clip` on the target track (or the track's `clip_slots`),
- when one flips to 1, read the new `Clip.file_path` and `Clip.length`.

This does not reveal the drag protocol, but it establishes the **destination API** we
would drive or verify against, and it confirms end to end that "a dropped file becomes a
clip pointing at that file." It is the measuring instrument for the real experiment, not
the experiment itself.

---

## The spike, staged. Stop at the first stage that fails.

Each stage is cheap and answers one question. Do them in order; a failure early makes the
later ones moot.

**Stage A - can a `[jweb]` drag leave the view at all?**
Build the smallest possible test: a page in a `[jweb]` with one `draggable` div that sets
`text/uri-list` to a known local file. Drag it onto:
  1. a text editor / the OS desktop (does ANY app receive it?),
  2. Live's own browser or a track.
Watch with a drag-inspector if one is handy, but the binary result is enough: does the
drop land anywhere outside the view? **If no: the page cannot be the drag source. Skip to
"If the page cannot drag."**

**Stage B - build the LOM aftermath observer.**
A throwaway device on an audio track that logs `file_path` and `length` whenever a clip
appears in any slot. Then drag a file in *by hand* from Live's browser and from Splice.
Confirm both produce a clip and a readable `file_path`. This gives us the oracle: for
Stage C we will know, from the LOM, whether OUR drag produced the same result.

**Stage C - does Live accept OUR drag, and in which format?**
With Stage A passing and Stage B watching, drag a real row from the sample browser onto
the track. Vary the payload in `startFileDrag`, one format at a time:
  - `text/uri-list` with `file://...`
  - `text/plain` with the raw absolute path
  - `DownloadURL`
  - (macOS/Windows file-promise types, IF the webview exposes any way to set them - it
    likely does not from JS, which is itself a finding)
The observer from Stage B tells us which, if any, created a clip. **The first format that
makes a clip is the answer**, and the feature is done.

---

## Outcomes, and the fallback for each

| Finding | What it means | What we ship |
|---|---|---|
| Stage A fails | `[jweb]` does not emit OS drags | No drag from the page. Fall back to the **"Show folder"** button (already built - see below); the user drags from the OS file manager, which we know Live accepts. |
| A passes, C finds a format | Live reads that drag type | Keep the row draggable, pin the winning format, delete the losers. Feature done. |
| A passes, C finds nothing | The view drags, but not in any type Live's audio lane reads (likely a native file-promise a webview cannot synthesise) | Same fallback: the "Show folder" button. Record the negative result here so nobody re-runs it. |

**The "Show folder" button already exists, as the honest floor under this feature.** It is
in the footer, enabled once a sample is on disk. The page cannot open a file manager
itself, so it sends `reveal_folder` to the wrapper, which calls
`messnamed("max", "launchbrowser", "file:///.../samples/")` - the JS form of a `; max
launchbrowser` message box, addressed to the Max application. **It has its own open
question:** `launchbrowser` is named for the web browser, and whether the OS default
handler for a `file://` *directory* is the native file manager (Finder/Explorer) or a
browser directory listing is unverified in Live. If it opens a browser, the fix is a
different Max object, not a different app; either way the file is exactly where the button
points. Verify it in the same session as Stage A.

---

## Notes for whoever runs this

- The device folder, and therefore the file's absolute path, only exists once the patcher
  has been saved - `deviceFolder()` derives it from `this.patcher.filepath`. Test in a
  saved set, not an `Untitled`.
- Do Stage A on BOTH macOS and Windows before concluding. Embedded-webview drag behaviour
  is a per-platform, per-Chromium-version thing; a pass on one is not a pass on the other.
- If Stage C ever needs a native file-promise, that is a wrapper/Max question (can `[js]`
  or a helper object start an OS drag with `CF_HDROP`/`NSFilenamesPboardType`?), not an app
  one - and it probably belongs upstream in m4l-jweb, not here.
