import { CircleHelp } from "lucide-react";

/**
 * The `?` that opens the reference window - one button, every device.
 *
 * It is shared so the four devices cannot drift into four different affordances for
 * the same thing: a user who learns the `?` on the MIDI device should find it in the
 * same place, doing the same thing, on the FX device.
 *
 * `onOpen` is `useWindow(surface, "help").open` from the device - the hook has to be
 * called in the device's own component, against the device's own surface, so it is
 * passed in rather than reached for here.
 */
export function HelpButton({ onOpen }: { onOpen: () => void }) {
	return (
		<button
			onClick={onOpen}
			title="What this device understands - the Strudel reference"
			aria-label="Open the Strudel reference"
			className="flex size-4 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-input/60 hover:text-foreground"
		>
			<CircleHelp className="size-3.5" />
		</button>
	);
}
