import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * THE button, every device.
 *
 * One affordance shared across Strudel, MIDI, Drums, Sampler, FX and the sample
 * browser, so a control drawn on one device behaves like the same control on another.
 *
 * It is shadcn's shape - a `cva` recipe of variants and sizes, `cn` merging in the
 * caller's classes - with this repo's own palette rather than shadcn's. The palette is
 * the point: MONOCHROME, driven by Live's own theme variables (index.css, where every
 * token falls back to a `--live-*` one), so a device looks like part of Live and not
 * like a web app pasted into it. The devices were each inventing their own
 * primary/accent/destructive buttons, which read as five different apps.
 *
 * `active` is the one state that lifts: a toggle that is ON (Run while playing) gets a
 * faint primary wash, never a full colour.
 */
const button = cva(
	"inline-flex shrink-0 items-center justify-center gap-1 rounded transition-colors " +
		"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring " +
		"disabled:pointer-events-none disabled:opacity-40",
	{
		variants: {
			variant: {
				/** The default: a grey chip that sits quietly in a header row. */
				solid: "bg-input/50 text-foreground hover:bg-input",
				/** No fill until hovered - for a strip of icons, where fills would be noise. */
				ghost: "text-muted-foreground hover:bg-input/50 hover:text-foreground",
				/** A link rendered as a button, because an <a> would navigate the webview. */
				link: "text-primary underline-offset-2 hover:underline",
			},
			size: {
				sm: "px-1.5 py-0.5 text-[11px]",
				md: "px-2 py-1 text-sm font-semibold",
				/** Square, for an icon with no label. */
				icon: "p-1",
			},
			active: { true: "", false: "" },
		},
		compoundVariants: [
			// The ON state, per variant: enough to read at a glance, never a full colour.
			{ active: true, variant: "solid", class: "bg-primary/25 hover:bg-primary/35" },
			{ active: true, variant: "ghost", class: "bg-primary/20 text-primary hover:bg-primary/30" },
		],
		defaultVariants: { variant: "solid", size: "sm", active: false },
	},
);

export function Button({
	onClick,
	title,
	active = false,
	disabled = false,
	icon: Icon,
	size,
	variant,
	className,
	children,
}: {
	onClick?: () => void;
	title?: string;
	/** ON state of a toggle - a faint primary wash, the only non-grey the set allows. */
	active?: boolean;
	disabled?: boolean;
	/** A lucide component, not an element. Rendered ahead of the label. */
	icon?: LucideIcon;
	className?: string;
	children?: ReactNode;
} & Pick<VariantProps<typeof button>, "size" | "variant">) {
	return (
		<button onClick={onClick} disabled={disabled} title={title} className={cn(button({ variant, size, active }), className)}>
			{Icon && <Icon className={size === "md" ? "size-3.5" : "size-3"} />}
			{children}
		</button>
	);
}
