import { ArrowRight, Gem } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { PocketIcon } from "~/shared/ui/pocket-art";

type Feature = {
	href: string;
	title: string;
	description: string;
	meta?: string;
	icon: ReactNode;
};

const SHORTCUTS = [
	{ href: "/load", label: "Buy load", icon: "phone" },
	{ href: "/bills", label: "Pay bills", icon: "bill" },
] as const;

const FOCUS_RING =
	"focus-visible:outline-brand focus-visible:outline-2 focus-visible:outline-offset-2";

function FeatureRow({ feature }: { feature: Feature }) {
	return (
		<Link
			href={feature.href}
			className={`border-line bg-surface hover:bg-surface-raised flex min-h-[116px] items-center gap-3 rounded-[28px] border p-5 shadow-[0_5px_18px_-10px_#00000080] transition-colors ${FOCUS_RING}`}
		>
			<span className="grid h-12 w-12 shrink-0 place-items-center">
				{feature.icon}
			</span>

			<span className="min-w-0 flex-1">
				<span className="text-ink block text-[19px] leading-6 font-bold tracking-tight">
					{feature.title}
				</span>
				<span className="text-ink-muted mt-1 block text-[12px] leading-5">
					{feature.description}
				</span>
				{feature.meta ? (
					<span className="text-ink-soft mt-2 block text-[10px] leading-4 font-semibold">
						{feature.meta}
					</span>
				) : null}
			</span>

			<ArrowRight size={18} className="text-ink-muted shrink-0" aria-hidden />
		</Link>
	);
}

export function FeatureGrid({
	points,
	stashCount,
	stashLimit,
}: {
	points: number;
	stashCount: number;
	stashLimit: number;
}) {
	const features: Feature[] = [
		{
			href: "/rewards",
			title: "GoRewards",
			description: `${points.toLocaleString("en-PH")} points`,
			icon: (
				<Gem
					size={26}
					strokeWidth={1.7}
					className="text-ink-soft"
					aria-hidden
				/>
			),
		},
		{
			href: "/stashes",
			title: "GoalSave",
			description: "Savings goals · 4% p.a.",
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
			href: "/bitcoin",
			title: "Bitcoin",
			description: "Live price and trades",
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
			{features.map((feature) => (
				<FeatureRow key={feature.href} feature={feature} />
			))}

			<div className="grid grid-cols-2 gap-3">
				{SHORTCUTS.map(({ href, label, icon }) => (
					<Link
						key={href}
						href={href}
						className={`border-line bg-surface text-ink hover:bg-surface-raised flex min-h-20 items-center justify-center gap-3 rounded-[24px] border px-3 py-4 text-[14px] font-medium transition-colors ${FOCUS_RING}`}
					>
						<PocketIcon
							name={icon}
							width={25}
							height={25}
							className="shrink-0"
						/>
						{label}
					</Link>
				))}
			</div>

			<Link
				href="/card"
				className={`text-ink grid min-h-16 grid-cols-[48px_minmax(0,1fr)_18px] items-center gap-3 px-5 py-3 text-[16px] font-medium transition-opacity hover:opacity-80 ${FOCUS_RING}`}
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
