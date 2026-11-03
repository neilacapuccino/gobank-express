import { cn } from "~/shared/lib/cn";

export function OrDivider({ className }: { className?: string }) {
	return (
		<div className={cn("flex items-center gap-3", className)}>
			<span aria-hidden className="bg-line h-px flex-1" />
			<span>or</span>
			<span aria-hidden className="bg-line h-px flex-1" />
		</div>
	);
}
