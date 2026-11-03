import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "~/shared/lib/cn";

type BackButtonProps = {
	label?: string;
	className?: string;
} & (
	| { href: string; onClick?: never; disabled?: never }
	| { href?: never; onClick: () => void; disabled?: boolean }
);

export function BackButton({
	label = "Back",
	className,
	...props
}: BackButtonProps) {
	const classes = cn(
		"grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-tile-sunken text-ink transition-[background-color,transform] duration-150 hover:bg-tile-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink-soft active:scale-95 disabled:pointer-events-none disabled:opacity-45",
		className,
	);
	const icon = <ArrowLeft size={18} strokeWidth={1.8} aria-hidden />;

	if (props.href !== undefined) {
		return (
			<Link href={props.href} aria-label={label} className={classes}>
				{icon}
			</Link>
		);
	}

	return (
		<button
			type="button"
			onClick={props.onClick}
			disabled={props.disabled}
			aria-label={label}
			className={classes}
		>
			{icon}
		</button>
	);
}
