import { MutationCache, QueryClient } from "@tanstack/react-query";

export const createQueryClient = () => {
	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 30 * 1000,
			},
		},
		mutationCache: new MutationCache({
			onSuccess: (_data, _variables, _context, mutation) => {
				const [path] = mutation.options.mutationKey ?? [];
				if (Array.isArray(path) && path[0] === "auth") return;
				void queryClient.invalidateQueries();
			},
		}),
	});
	return queryClient;
};
