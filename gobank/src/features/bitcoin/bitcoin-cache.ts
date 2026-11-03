type CacheEntry<Value> = {
	expiresAt: number | null;
	promise: Promise<Value>;
};

export function createRequestCache<Key, Value>(
	ttlMs: (key: Key) => number,
	now: () => number = Date.now,
) {
	const entries = new Map<Key, CacheEntry<Value>>();

	const stillLoading = (entry: CacheEntry<Value>) => entry.expiresAt === null;
	const notExpired = (entry: CacheEntry<Value>) =>
		entry.expiresAt !== null && entry.expiresAt > now();

	return (key: Key, load: () => Promise<Value>): Promise<Value> => {
		const existing = entries.get(key);
		if (existing && (stillLoading(existing) || notExpired(existing))) {
			return existing.promise;
		}

		const entry: CacheEntry<Value> = {
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
