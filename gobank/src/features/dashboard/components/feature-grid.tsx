import { ArrowRight, Gem } from "lucide-react";
import Link from "next/link";
import { cn } from "~/shared/lib/cn";
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
			href: "/rewards",
			title: "GoRewards",
			accent: true,
			secondary: `${points.toLocaleString("en-PH")} points`,
			meta: null,
			icon: (
				<Gem
					size={26}
					strokeWidth={1.7}
					fill="currentColor"
					fillOpacity={0.08}
					className="text-[#e6c17a]"
					aria-hidden
				/>
			),
		},
		{
			href: "/stashes",
			title: "GoalSave",
			accent: false,
			secondary: "Earn interest",
			meta: `${stashCount} of ${stashLimit} goals`,
			icon: (
				<PocketIcon
					name="goal"
					width={32}
					height={32}
					className="text-ink-soft"
				/>
			),
		},
		{
			href: "/stocks",
			title: "Bitcoin",
			accent: false,
			secondary: "Live price and trades",
			meta: null,
			icon: (
				<PocketIcon
					name="chart"
					width={32}
					height={32}
					className="text-ink-soft"
				/>
			),
		},
	];

	return (
		<section className="flex flex-col gap-3">
			{rows.map((row) => (
				<Link
					key={row.href}
					href={row.href}
					className={cn(
						"focus-visible:outline-brand flex min-h-[116px] items-center gap-3 rounded-[28px] border p-5 shadow-[0_5px_18px_-10px_#00000080] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
						row.accent
							? "border-[#e6c17a]/15 bg-linear-to-r from-[#211f1b] via-[#1c1c1f] to-[#18181b] hover:border-[#e6c17a]/25"
							: "border-line bg-surface hover:bg-surface-raised",
					)}
				>
					<span
						className={cn(
							"grid h-12 w-12 shrink-0 place-items-center",
							row.accent
								? "rounded-2xl border border-[#e6c17a]/20 bg-linear-to-br from-[#373025] to-[#211d17]"
								: null,
						)}
					>
						{row.icon}
					</span>
					<span className="min-w-0 flex-1">
						<span className="text-ink block text-[19px] leading-6 font-bold tracking-tight">
							{row.title}
						</span>
						<span className="text-ink-muted mt-1 block text-[12px] leading-5">
							{row.secondary}
						</span>
						{row.meta ? (
							<span className="text-ink-soft mt-2 block text-[10px] leading-4 font-semibold">
								{row.meta}
							</span>
						) : null}
					</span>
					<ArrowRight
						size={18}
						className="text-ink-muted shrink-0"
						aria-hidden
					/>
				</Link>
			))}
			<div className="grid grid-cols-2 gap-3">
				{[
					{ href: "/load", label: "Buy load", icon: "phone" as const },
					{ href: "/bills", label: "Pay bills", icon: "bill" as const },
				].map((action) => (
					<Link
						key={action.href}
						href={action.href}
						className="border-line bg-surface text-ink hover:bg-surface-raised focus-visible:outline-brand flex min-h-20 items-center justify-center gap-3 rounded-[24px] border px-3 py-4 text-[14px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
					>
						<PocketIcon
							name={action.icon}
							width={25}
							height={25}
							className="shrink-0"
						/>
						{action.label}
					</Link>
				))}
			</div>
			<Link
				href="/card"
				className="text-ink focus-visible:outline-brand grid min-h-16 grid-cols-[48px_minmax(0,1fr)_18px] items-center gap-3 px-5 py-3 text-[16px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
			>
				<PocketIcon
					name="card"
					width={26}
					height={26}
					className="justify-self-center"
				/>
				<span>My card</span>
				<ArrowRight size={18} className="text-ink-muted shrink-0" aria-hidden />
			</Link>
		</section>
	);
}
