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
		"grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#202022] text-[#f4f4f5] transition-[background-color,transform] duration-150 hover:bg-[#2c2c30] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c4c4cc] active:scale-95 disabled:pointer-events-none disabled:opacity-45",
		className,
	);
	const icon = <ArrowLeft size={18} strokeWidth={1.8} aria-hidden />;

	return props.href !== undefined ? (
		<Link href={props.href} aria-label={label} className={classes}>
			{icon}
		</Link>
	) : (
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
