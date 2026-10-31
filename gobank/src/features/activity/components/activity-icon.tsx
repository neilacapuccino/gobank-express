import type { LucideIcon } from "lucide-react";
import {
	ArrowDownLeft,
	ArrowDownToLine,
	ArrowLeftRight,
	ArrowUpRight,
	PiggyBank,
	Receipt,
	Smartphone,
	Sparkles,
	TrendingUp,
} from "lucide-react";
import type { ActivityEntry } from "../activity.fields";

const ICONS: Record<ActivityEntry["kind"], LucideIcon> = {
	deposit: ArrowDownToLine,
	transfer: ArrowUpRight,
	bill: Receipt,
	load: Smartphone,
	stash: PiggyBank,
	reward: Sparkles,
	interest: TrendingUp,
	exchange: ArrowLeftRight,
};

export const activityIcon = (
	entry: Pick<ActivityEntry, "kind" | "amount">,
): LucideIcon =>
	entry.kind === "transfer" && entry.amount > 0
		? ArrowDownLeft
		: ICONS[entry.kind];
