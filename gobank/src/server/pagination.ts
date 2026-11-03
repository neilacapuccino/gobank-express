export const pageArgs = (cursor: string | null | undefined, limit: number) => ({
	take: limit + 1,
	...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
});

export function toPage<T extends { id: string }>(rows: T[], limit: number) {
	const items = rows.slice(0, limit);
	const next = rows.length > limit ? (items.at(-1)?.id ?? null) : null;

	return { items, next };
}
