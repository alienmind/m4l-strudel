import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * THE button, every device.
 *
 * One black-and-white affordance shared across MIDI, Drums, Sampler, FX and the sample
 * browser, so a control drawn on one device looks and behaves like the same control on
 * another. Grey by default (`bg-input`), never a coloured accent - the devices were each
 * inventing their own primary/accent/destructive buttons, which read as five different
 * apps. `active` is the one state that lifts: a toggle that is ON (Run while playing) gets
 * a faint primary wash, not a full colour, so the palette stays monochrome.
 *
 * `icon` takes a lucide component (not an element), rendered at a consistent size ahead of
 * the label. Size is controlled by `size`: "sm" for a top-bar chip, "md" for the primary
 * transport button.
 */
export function Button({
	onClick,
	title,
	active = false,
	disabled = false,
	icon: Icon,
	size = "sm",
	className,
	children,
}: {
	onClick?: () => void;
	title?: string;
	/** ON state of a toggle - a faint primary wash, the only non-grey the set allows. */
	active?: boolean;
	disabled?: boolean;
	icon?: LucideIcon;
	size?: "sm" | "md";
	className?: string;
	children?: ReactNode;
}) {
	return (
		<button
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={cn(
				"flex shrink-0 items-center justify-center gap-1 rounded transition-colors",
				size === "md" ? "px-2 py-1 text-sm font-semibold" : "px-1.5 py-0.5 text-[11px]",
				active
					? "bg-primary/25 text-foreground hover:bg-primary/35"
					: "bg-input/50 text-foreground hover:bg-input",
				"disabled:opacity-40 disabled:hover:bg-input/50",
				className,
			)}
		>
			{Icon && <Icon className={size === "md" ? "size-3.5" : "size-3"} />}
			{children}
		</button>
	);
}
