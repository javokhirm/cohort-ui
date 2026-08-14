import { defaultQueryRetry, isApiError, isSubscriptionError } from '@repo/api-client';
import { toast } from '@repo/ui';
import { translate } from '@repo/i18n';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { useSessionStore } from '@/store/sessionStore';

function notifyError(error: unknown): void {
	if (!isApiError(error)) {
		toast.error(translate('common', 'error.unknown'));
		return;
	}
	if (isSubscriptionError(error)) {
		// The 402 subscription block: the account is valid, the center's plan has
		// lapsed. Capture the renewal essentials so the full-screen block renders
		// from this rejection alone — the authed layout gates on it. Never a toast,
		// and never clear the session (unlike a 401).
		useSessionStore.getState().setSubscriptionBlock(error.details);
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
			retry: defaultQueryRetry,
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		},
	},
	queryCache: new QueryCache({ onError: notifyError }),
	mutationCache: new MutationCache({ onError: notifyError }),
});
