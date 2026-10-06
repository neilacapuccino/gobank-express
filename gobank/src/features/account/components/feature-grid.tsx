import { ArrowRight, Gem } from "lucide-react";
import Link from "next/link";
import { PocketIcon } from "~/shared/ui/pocket-art";
export function FeatureGrid({
	points,
	stashCount,
	stashLimit,
}: {
	points: number;
	stashCount: number;
	stashLimit: number;
}) {
	const rows = [
		{
			href: "/stashes",
			icon: "goal" as const,
			title: "GoalSave",
			description: "A little saved. A lot to look forward to.",
			meta: `${stashCount} of ${stashLimit} goals`,
		},
		{
			href: "/stocks",
			icon: "chart" as const,
			title: "Bitcoin",
			description: "Live market. Your Bitcoin portfolio.",
			meta: null,
		},
	];
	return (
		<section className="flex flex-col gap-3">
			<Link
				href="/rewards"
				className="group flex min-h-[88px] items-center justify-between gap-3 rounded-[26px] border border-[#e6c17a]/10 bg-linear-to-r from-[#211f1b] via-[#1c1c1f] to-[#18181b] px-5 py-4 shadow-[0_5px_18px_-10px_#00000080] transition-colors hover:border-[#e6c17a]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e6c17a]"
			>
				<div className="flex items-center gap-3">
					<span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#e6c17a]/20 bg-linear-to-br from-[#373025] to-[#211d17] text-[#e6c17a] shadow-[inset_0_1px_0_#ffffff08] transition-transform duration-200 group-hover:-rotate-6">
						<Gem
							size={26}
							strokeWidth={1.7}
							fill="currentColor"
							fillOpacity={0.08}
							aria-hidden
						/>
					</span>
					<span>
						<span className="text-ink block text-[16px] font-bold">
							GoRewards
						</span>
						<span className="text-ink-muted text-[12px]">
							{points.toLocaleString()} points to enjoy
						</span>
					</span>
				</div>
				<ArrowRight
					size={18}
					className="shrink-0 text-[#aa9b80] transition-transform duration-200 group-hover:translate-x-0.5"
					aria-hidden
				/>
			</Link>
			{rows.map((row) => (
				<Link
					key={row.href}
					href={row.href}
					className="bg-surface flex min-h-24 items-center gap-4 rounded-[26px] p-5 shadow-[0_5px_18px_-10px_#00000080] transition-transform hover:-translate-y-0.5"
				>
					<PocketIcon
						name={row.icon}
						className="text-ink-soft shrink-0"
						width={28}
						height={28}
					/>
					<span className="min-w-0 flex-1">
						<span className="text-ink block text-[19px] font-bold tracking-tight">
							{row.title}
						</span>
						<span className="text-ink-muted mt-1 block text-[12px] leading-relaxed">
							{row.description}
						</span>
						{row.meta && (
							<span className="text-ink-soft mt-2 block text-[10px] font-semibold">
								{row.meta}
							</span>
						)}
					</span>
					<ArrowRight
						size={18}
						className="text-ink-soft shrink-0"
						aria-hidden
					/>
				</Link>
			))}
			<div className="grid grid-cols-2 gap-3">
				{[
					{ href: "/load", label: "Buy load", icon: "phone" as const },
					{ href: "/bills", label: "Pay bills", icon: "bill" as const },
				].map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className="flex min-h-20 items-center justify-center gap-3 rounded-[24px] bg-white px-3 py-4 text-[14px] font-bold text-[#282938] shadow-[0_5px_18px_-10px_#256d8035]"
					>
						<PocketIcon name={item.icon} width={25} height={25} />
						{item.label}
					</Link>
				))}
			</div>
			<Link
				href="/card"
				className="text-ink mt-1 flex items-center justify-between rounded-2xl px-2 py-3 text-[16px] font-semibold"
			>
				<span className="flex items-center gap-3">
					<PocketIcon name="card" />
					My card
				</span>
				<ArrowRight size={18} aria-hidden />
			</Link>
		</section>
	);
}
