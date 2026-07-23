import { isApiError } from '@repo/api-client';
import { toast } from '@repo/ui';
import { translate } from '@repo/i18n';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

/**
 * Cross-cutting error handling (docs/api-integration.md §5):
 *  - 401: the session store is already cleared by `runRefresh` after a failed
 *    refresh; the authed layout reacts to the status change and redirects, and
 *    login surfaces its own inline errors — so stay silent here.
 *  - 403: a "not permitted" toast.
 *  - everything else: a generic error toast (fall back to the server message).
 */
function notifyError(error: unknown): void {
	if (!isApiError(error)) {
		toast.error(translate('common', 'error.unknown'));
		return;
	}
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
