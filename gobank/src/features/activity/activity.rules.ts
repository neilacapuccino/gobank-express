export const ACTIVITY_FILTERS = ["all", "in", "out"] as const;
export type ActivityFilter = (typeof ACTIVITY_FILTERS)[number];

export const FILTER_LABELS: Record<ActivityFilter, string> = {
	all: "All",
	in: "Money in",
	out: "Money out",
};

type AmountWhere = { amount?: { gt: number } | { lt: number } };

export const filterWhere = (filter: ActivityFilter): AmountWhere =>
	filter === "in"
		? { amount: { gt: 0 } }
		: filter === "out"
			? { amount: { lt: 0 } }
			: {};

const dayKey = (date: Date) =>
	`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

export function dayLabel(date: Date, now: Date = new Date()) {
	const yesterday = new Date(now);
	yesterday.setDate(now.getDate() - 1);
	if (dayKey(date) === dayKey(now)) return "Today";
	if (dayKey(date) === dayKey(yesterday)) return "Yesterday";
	return date.toLocaleDateString("en-PH", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export function groupByDay<T extends { createdAt: Date }>(
	items: T[],
	now: Date = new Date(),
) {
	const groups: { key: string; label: string; items: T[] }[] = [];
	for (const item of items) {
		const key = dayKey(item.createdAt);
		const last = groups.at(-1);
		if (last?.key === key) last.items.push(item);
		else
			groups.push({ key, label: dayLabel(item.createdAt, now), items: [item] });
	}
	return groups;
}
