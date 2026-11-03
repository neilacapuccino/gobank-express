import {
	CarFront,
	Gift,
	Heart,
	House,
	Plane,
	type LucideIcon,
} from "lucide-react";
import { PocketIcon } from "~/shared/ui/pocket-art";

export type GoalIcon = "safe" | "travel" | "home" | "gift" | "car" | "heart";

export const goalIcons: {
	value: GoalIcon;
	label: string;
	Icon: LucideIcon | null;
}[] = [
	{ value: "safe", label: "Savings", Icon: null },
	{ value: "travel", label: "Travel", Icon: Plane },
	{ value: "home", label: "Home", Icon: House },
	{ value: "gift", label: "Gifts", Icon: Gift },
	{ value: "car", label: "Car", Icon: CarFront },
	{ value: "heart", label: "Health", Icon: Heart },
];

const NAME_HINTS: [RegExp, GoalIcon][] = [
	[/trip|travel|holiday|vacation/i, "travel"],
	[/home|house|rent/i, "home"],
	[/car|drive/i, "car"],
	[/birthday|gift|wedding|party/i, "gift"],
	[/health|emergency|family/i, "heart"],
];

export function iconForGoal(name: string): GoalIcon {
	const match = NAME_HINTS.find(([pattern]) => pattern.test(name));
	return match ? match[1] : "safe";
}

export function GoalArt({
	icon = "safe",
	className,
}: {
	icon?: GoalIcon;
	className?: string;
}) {
	const Icon = goalIcons.find((item) => item.value === icon)?.Icon;

	if (!Icon) {
		return <PocketIcon name="goal" className={className} strokeWidth={1.7} />;
	}

	return <Icon className={className} strokeWidth={1.6} aria-hidden />;
}
