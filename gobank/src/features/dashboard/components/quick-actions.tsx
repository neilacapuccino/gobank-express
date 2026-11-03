import { Download, HandCoins, Send, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "~/shared/lib/cn";

type QuickAction = {
	href: string;
	label: string;
	icon: LucideIcon;
	tone: string;
};

const ACTIONS: QuickAction[] = [
	{
		href: "/transfer",
		label: "Send money",
		icon: Send,
		tone: "border-mint/20 from-[#222e29] to-[#151b18] text-mint group-hover:border-mint/40 group-hover:shadow-[0_8px_24px_-8px_#56e3b135]",
	},
	{
		href: "/deposit",
		label: "Deposit",
		icon: Download,
		tone: "border-sky/20 from-[#222c31] to-[#151a1e] text-sky group-hover:border-sky/40 group-hover:shadow-[0_8px_24px_-8px_#71d5f335]",
	},
	{
		href: "/request",
		label: "Request",
		icon: HandCoins,
		tone: "border-violet/20 from-[#2a2533] to-[#1a171f] text-violet group-hover:border-violet/40 group-hover:shadow-[0_8px_24px_-8px_#bda0fa35]",
	},
];

export function QuickActions() {
	return (
		<div className="grid grid-cols-3 gap-3">
			{ACTIONS.map(({ href, label, icon: Icon, tone }) => (
				<Link
					key={href}
					href={href}
					className="text-ink focus-visible:outline-mint group flex flex-col items-center gap-2.5 rounded-2xl py-2 focus-visible:outline-2 focus-visible:outline-offset-2"
				>
					<span
						className={cn(
							"grid h-[60px] w-[60px] place-items-center rounded-[20px] border bg-linear-to-br shadow-[0_6px_16px_-8px_#000000,inset_0_1px_0_#ffffff08] transition-all duration-200 group-hover:-translate-y-0.5 group-active:scale-95",
							tone,
						)}
					>
						<Icon size={25} strokeWidth={1.8} aria-hidden />
					</span>
					<span className="text-[11px] font-semibold">{label}</span>
				</Link>
			))}
		</div>
	);
}
