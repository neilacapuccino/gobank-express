import Link from "next/link";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";
import type { ActivityEntry } from "../activity.fields";
import { activityIcon } from "./activity-icon";

export function ActivityRow({
	entry,
	detail,
}: {
	entry: ActivityEntry;
	detail: string;
}) {
	const incoming = entry.amount > 0;
	const Icon = activityIcon(entry);

	return (
		<Link
			href={`/transactions/${entry.reference}`}
			className="group flex items-center gap-3.5"
		>
			<span className="bg-surface-sunken text-ink-soft grid h-10 w-10 shrink-0 place-items-center rounded-full">
				<Icon size={16} strokeWidth={1.9} aria-hidden />
			</span>

			<span className="min-w-0 flex-1">
				<span className="text-ink group-hover:text-brand block truncate text-[14px] font-medium transition-colors">
					{entry.title}
				</span>
				<span className="text-ink-muted block text-[12px]">{detail}</span>
			</span>

			<span
				className={cn(
					"shrink-0 text-[14px] font-semibold tabular-nums",
					incoming ? "text-brand" : "text-danger",
				)}
			>
				{incoming ? "+" : "−"}
				{peso(Math.abs(entry.amount))}
			</span>
		</Link>
	);
}
