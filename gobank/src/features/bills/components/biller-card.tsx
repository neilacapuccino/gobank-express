import { Check, type LucideIcon } from "lucide-react";
import { cn } from "~/shared/lib/cn";
import type { Biller } from "../bill-categories";

export function BillerCard({
	biller,
	icon: Icon,
	selected,
	onClick,
}: {
	biller: Biller;
	icon: LucideIcon;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-pressed={selected}
			className={cn(
				"flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
				selected
					? "border-brand bg-brand-soft"
					: "border-line hover:bg-surface-sunken",
			)}
		>
			<Icon size={20} className="text-ink-muted shrink-0" aria-hidden />
			<span className="min-w-0 flex-1">
				<span className="text-ink block text-[14px] font-medium break-words">
					{biller.name}
				</span>
				{biller.description ? (
					<span className="text-ink-muted mt-1 block text-[12px] break-words">
						{biller.description}
					</span>
				) : null}
			</span>
			{selected ? (
				<Check size={18} className="text-brand shrink-0" aria-hidden />
			) : null}
		</button>
	);
}
