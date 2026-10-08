import type { ReactNode } from "react";
import { cn } from "~/shared/lib/cn";
import { peso } from "~/shared/lib/format";

type Detail = { label: string; value: string };

export function TransactionSummary({
	amount,
	amountClassName,
	children,
	details = [],
}: {
	amount: number;
	amountClassName?: string;
	children?: ReactNode;
	details?: Detail[];
}) {
	return (
		<section className="border-line bg-surface-sunken rounded-2xl border p-5">
			<p
				className={cn(
					"text-[30px] font-semibold tracking-tight tabular-nums",
					amountClassName ?? "text-ink",
				)}
			>
				{peso(amount)}
			</p>
			{children ? <div className="mt-5">{children}</div> : null}
			{details.length ? (
				<dl className="border-line mt-5 space-y-3 border-t pt-4">
					{details.map(({ label, value }) => (
						<div
							key={label}
							className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.8fr)] gap-3 text-[12px]"
						>
							<dt className="text-ink-muted">{label}</dt>
							<dd className="text-ink min-w-0 text-right break-words">
								{value}
							</dd>
						</div>
					))}
				</dl>
			) : null}
		</section>
	);
}
