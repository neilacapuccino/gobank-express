import type { LucideIcon } from "lucide-react";
import { cn } from "~/shared/lib/cn";

export function CategoryCard({
	label,
	icon: Icon,
	selected,
	onClick,
}: {
	label: string;
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
				"flex min-h-13 items-center gap-2 rounded-xl border px-3 py-3 text-left text-[13px] font-medium transition-colors",
				selected
					? "border-brand bg-brand-soft text-brand"
					: "border-line text-ink hover:bg-surface-sunken",
			)}
		>
			<Icon size={18} className="shrink-0" aria-hidden />
			<span>{label}</span>
		</button>
	);
}
