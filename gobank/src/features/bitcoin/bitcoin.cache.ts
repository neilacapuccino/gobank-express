type Entry<Value> = {
	expiresAt: number | null;
	promise: Promise<Value>;
};

export function createRequestCache<Key, Value>(
	ttlMs: (key: Key) => number,
	now: () => number = Date.now,
) {
	const entries = new Map<Key, Entry<Value>>();

	return (key: Key, load: () => Promise<Value>): Promise<Value> => {
		const existing = entries.get(key);
		if (
			existing &&
			(existing.expiresAt === null || existing.expiresAt > now())
		) {
			return existing.promise;
		}
		const entry: Entry<Value> = {
			expiresAt: null,
			promise: Promise.resolve()
				.then(load)
				.then((value) => {
					entry.expiresAt = now() + ttlMs(key);
					return value;
				})
				.catch((error: unknown) => {
					entries.delete(key);
					throw error;
				}),
		};
		entries.set(key, entry);
		return entry.promise;
	};
}
