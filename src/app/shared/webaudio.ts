/**
 * Native Web Audio playback, for devices built on the `webaudio` chain.
 *
 * Under jweb~ the page's AudioContext output IS the device's signal path: the
 * browser's stereo out arrives on jweb~'s signal outlets and the build sums it
 * into plugin~ -> plugout~. So "play a sample" is a plain AudioBufferSourceNode
 * here - no [buffer~], no [groove~], no bridge round-trip, and the decode
 * metadata (duration, channels) is measured by decodeAudioData instead of
 * [info~].
 */

let ctx: AudioContext | null = null;

/** The page's one AudioContext, created lazily so module import order (and
 *  autoplay policy outside Max) cannot leave it permanently suspended. */
export function audioContext(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === "suspended") void ctx.resume();
	return ctx;
}

export interface DecodedSample {
	buffer: AudioBuffer;
	durationMs: number;
	channels: number;
}

export async function decodeSample(bytes: ArrayBuffer): Promise<DecodedSample> {
	const buffer = await audioContext().decodeAudioData(bytes.slice(0));
	return { buffer, durationMs: buffer.duration * 1000, channels: buffer.numberOfChannels };
}

export interface PlayOptions {
	/** Playback rate: 1 = as recorded, 2 = an octave up. */
	rate?: number;
	/** Linear gain, 0..1. */
	gain?: number;
	/** Cut the voice after this many ms (with a short release ramp, no click). */
	durationMs?: number;
}

/** Start a buffer through the device output. Returns a stop function. */
export function playBuffer(buffer: AudioBuffer, opts: PlayOptions = {}): () => void {
	const ac = audioContext();
	const source = ac.createBufferSource();
	source.buffer = buffer;
	source.playbackRate.value = opts.rate ?? 1;

	const amp = ac.createGain();
	amp.gain.value = opts.gain ?? 1;
	source.connect(amp);
	amp.connect(ac.destination);

	source.start();
	const stop = () => {
		// 5 ms release ramp instead of a hard stop, or every cut is a click.
		const now = ac.currentTime;
		amp.gain.setValueAtTime(amp.gain.value, now);
		amp.gain.linearRampToValueAtTime(0, now + 0.005);
		source.stop(now + 0.006);
	};
	if (opts.durationMs != null) {
		const now = ac.currentTime;
		const end = now + opts.durationMs / 1000;
		amp.gain.setValueAtTime(amp.gain.value, end - 0.005);
		amp.gain.linearRampToValueAtTime(0, end);
		source.stop(end + 0.001);
	}
	source.onended = () => {
		source.disconnect();
		amp.disconnect();
	};
	return stop;
}
