import { isApiError } from '@repo/api-client';
import { toast } from '@repo/ui';
import { translate } from '@repo/i18n';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

function notifyError(error: unknown): void {
	if (!isApiError(error)) {
		toast.error(translate('common', 'error.unknown'));
		return;
	}
	// 401 is handled by the silent refresh / redirect, not a toast.
	if (error.status === 401) return;
	if (error.status === 403) {
		toast.error(translate('common', 'error.forbidden'));
		return;
	}
	toast.error(error.message || translate('common', 'error.requestFailed'));
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
