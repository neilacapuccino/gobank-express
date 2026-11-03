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

export function activityIcon(
	entry: Pick<ActivityEntry, "kind" | "amount">,
): LucideIcon {
	const receivedTransfer = entry.kind === "transfer" && entry.amount > 0;

	return receivedTransfer ? ArrowDownLeft : ICONS[entry.kind];
}
