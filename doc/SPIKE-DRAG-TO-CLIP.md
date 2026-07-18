# SPIKE: drag a sample from the browser into a Live clip

**Status: REOPENED (2026-07-18). A new, untested approach - `DownloadURL` - with a
concrete plan below. The earlier attempt was inconclusive, not a true negative.**

The sample browser downloads a WAV to disk and the natural ask is "let me drag the row
straight into a clip / a Simpler / an audio track." Live accepts a native OS file drop
(`CF_HDROP` on Windows) - exactly what `explorer.exe` produces when you drag a `.wav`.
The question this spike settles: **can `[jweb]` produce that native file drop?**

---

## What we already know

- **The LOM cannot create an audio clip from a file.** `ClipSlot.create_clip(length)`
  is MIDI-only; there is no `create_audio_clip`. Putting audio into a clip is a
  drag-and-drop gesture in the application, with no scripting path. So a real OS drag is
  the ONLY route better than reveal-in-folder. (Live 12.)
- **`[jweb]` DOES promote an HTML5 drag to an OS drag.** Tested 2026-07 (Windows):
  dragging a row into `notepad.exe` pastes the payload, so the drag crosses the
  embedded-Chromium/OS boundary. What landed was the `text/plain` STRING (a path). Live's
  audio lane rejects a string path - it wants a file.
- **Our earlier `DownloadURL` test was VOID.** `startFileDrag` did set `DownloadURL`, but
  with a `file://` URL. Chromium's download-to-temp handoff does not fire for `file://`
  (security), so that payload could never have worked, even in a full browser. We never
  actually exercised the mechanism. That is why this spike reopens.

## The mechanism we will test: `DownloadURL`

`DownloadURL` is a Chromium drag type of the form `mime:filename:url`. When the drop
lands OUTSIDE the browser window, the browser process:

1. downloads the `url` to the OS temp folder (`%TEMP%`), then
2. synthesizes a native `CF_HDROP` pointing at that temp file, and
3. hands it to the drop target.

To Ableton it looks exactly like a file from `explorer.exe`, because - by the time
Ableton sees it - it IS a real file coming from the OS. This is the same trick that lets
you drag a Gmail attachment onto your desktop.

**The load-bearing unknown:** this behaviour lives in Chrome's *browser shell*, and
`[jweb]` is an **embedded Chromium (CEF)**, not Chrome. Embedded webviews (Electron,
WebView2, JUCE, CEF hosts) frequently DO NOT implement the `DownloadURL` desktop-drop
handoff. So the spike's real question is narrow and empirical: **does Max's `[jweb]`
carry it?** Nothing but a test tells us.

## What we PLAN to implement

Change `startFileDrag` (`src/app/sampler-browser/App.tsx`) to set `DownloadURL` with a
URL scheme the handoff actually accepts. In priority order:

1. **Remote http(s) URL (primary).** Every sample in a Strudel map came FROM a remote
   URL (`variationUrl(sound, n)` - a raw GitHub / dough-samples URL). Pass THAT as the
   `DownloadURL` target:

   ```js
   // remote http(s) URL we already fetched the sample from
   const remote = variationUrl(sound, n);         // https://.../808_0.wav
   const name   = "808_0.wav";
   e.dataTransfer.setData("DownloadURL", `audio/wav:${name}:${remote}`);
   ```

   Ready synchronously at dragstart (it is just a string), no Blob, no base64. Chromium
   re-downloads it to temp on drop and hands Ableton the temp file.

2. **Base64 `data:` URI (fallback, for local/custom samples with no remote URL).** Read
   the file's bytes, base64 them into a `data:audio/wav;base64,...` URI, and use that as
   the `DownloadURL` target. Robust for SMALL files (drum one-shots), because a data URI
   needs no second fetch and no CORS. NOT for large files (base64 of a many-MB file
   blocks the UI thread). Reading the local bytes inside `[jweb]` may itself be
   restricted (`fetch("file://...")`) - to be probed as part of the spike.
   - Avoid a `blob:` object URL: Chromium is known to struggle to resolve `blob:` into a
     native temp file during the async native-drop handoff. Data URI or remote URL only.

3. Keep `text/uri-list` and `text/plain` set as they are, harmlessly, for targets that
   read a string (a text field, some plugins). Live's audio lane is not one of them, so
   they are not what this spike rides on.

Reveal-in-folder stays as the guaranteed fallback either way.

## Test protocol

Build + `install:device`, then in Live:

1. **Primary (remote URL).** Audition a sample so it is on disk and its row is a drag
   source. Drag the row onto:
   - an empty **audio track** lane (should create an audio clip),
   - a **Simpler**, and
   - a **Drum Rack** pad.
   Success = a clip/sample appears, referencing a file. Watch `%TEMP%` for the downloaded
   WAV to confirm the handoff fired.
2. **Fallback (data URI).** Repeat with the base64 path forced, to see whether a data URI
   lands where a remote URL might be blocked by CORS or offline.
3. **Negative control.** Drag onto `notepad.exe`: with `DownloadURL` working we expect a
   FILE behaviour differing from the plain `text/plain` paste we saw before; if it still
   only pastes text, `[jweb]`'s CEF is stripping `DownloadURL` (the likely failure mode).

## Possible outcomes and what each means

- **Works with the remote URL.** Ship it: the row becomes a real drag-to-clip source.
  Note the caveat below about the temp-file location.
- **Works only with the data URI.** Ship the data-URI path for small samples (all drum
  one-shots qualify); fall back to reveal-in-folder for anything large.
- **Neither works, `notepad` still only gets text.** `[jweb]`'s CEF does not implement
  the `DownloadURL` handoff. THEN the earlier verdict stands and this is genuinely a dead
  end from the page - move this entry to `DRAWER_OF_FAILED_IDEAS.md` and keep
  reveal-in-folder as the shipping answer.

## Caveats to remember when reading the result

- **Temp-file location.** `DownloadURL` downloads to `%TEMP%`, so the created clip
  references a temp file, NOT our device-folder copy. The user should "Collect All and
  Save" to fold it into the project, or we later re-point the clip. Worth surfacing in
  the UI if this ships.
- **CORS.** For the remote-URL path, Chromium must be allowed to fetch the sample to temp.
  Public sample repos (raw GitHub, dough-samples) are open; a locked-down custom map
  could fail, which is what the data-URI fallback is for.
- **Firefox N/A.** `DownloadURL` is Chromium-only. `[jweb]` is Chromium, so this is moot
  here, but do not expect the same code to work in a Firefox-based host.
- **Async generation rule.** The `DownloadURL` value must be READY at `dragstart` - you
  cannot compute it while the mouse button is held. The remote URL is a plain string
  (fine); the data URI must be pre-computed when the sample loads, not on the drag.
