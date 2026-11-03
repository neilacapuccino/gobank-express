"use client";

import { cn } from "~/shared/lib/cn";
import { GoalArt, type GoalIcon } from "./goal-art";

const progressOf = (balance: number, target: number | null) =>
	target ? Math.max(0, Math.min(1, balance / target)) : 0;

export function GoalBubble({
	icon,
	balance,
	target,
	label,
	large = false,
}: {
	icon: GoalIcon;
	balance: number;
	target: number | null;
	label: string;
	large?: boolean;
}) {
	const progress = progressOf(balance, target);
	const description = target
		? `${label}: ${Math.round(progress * 100)}% of target`
		: label;

	return (
		<div
			className={cn(
				"relative mx-auto grid aspect-square w-full place-items-center rounded-full bg-[#202022] text-[#e4e4e7]",
				large ? "max-w-64" : "max-w-40",
			)}
		>
			<svg
				viewBox="0 0 120 120"
				className="absolute inset-0 h-full w-full -rotate-90"
				role="img"
				aria-label={description}
			>
				<circle
					cx="60"
					cy="60"
					r="55"
					fill="none"
					stroke="#39393f"
					strokeWidth="4"
				/>
				<circle
					cx="60"
					cy="60"
					r="55"
					fill="none"
					className="stroke-sky"
					strokeWidth="4"
					strokeLinecap="round"
					pathLength="100"
					strokeDasharray={`${progress * 100} 100`}
				/>
			</svg>

			<GoalArt icon={icon} className="h-[42%] w-[42%]" />
		</div>
	);
}
