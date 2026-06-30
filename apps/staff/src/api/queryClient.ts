import { isApiError } from '@repo/api-client';
import { toast } from '@repo/ui';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

function notifyError(error: unknown): void {
	if (!isApiError(error)) {
		toast.error('Something went wrong. Please try again.');
		return;
	}
	if (error.status === 401) return;
	if (error.status === 403) {
		toast.error('You do not have permission to do that.');
		return;
	}
	toast.error(error.message || 'Request failed.');
}

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 1,
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		},
	},
	queryCache: new QueryCache({ onError: notifyError }),
	mutationCache: new MutationCache({ onError: notifyError }),
});
