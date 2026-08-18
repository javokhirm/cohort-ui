import { defaultQueryRetry, isApiError, isSubscriptionError } from '@repo/api-client';
import { toast } from '@repo/ui';
import { translate } from '@repo/i18n';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { router } from '@/router';
import { useSessionStore } from '@/store/sessionStore';

function notifyError(error: unknown): void {
	if (!isApiError(error)) {
		toast.error(translate('common', 'error.unknown'));
		return;
	}
	if (isSubscriptionError(error)) {
		// The global 402 block: capture the renewal essentials so `/subscription`
		// can render from this rejection alone, then take the user there — a
		// full-page state, never a toast. `authedRoute`'s guard covers re-entry
		// by URL; this is what catches a request that 402s mid-session, wherever
		// the user currently is.
		useSessionStore.getState().setSubscriptionBlock(error.details);
		if (router.state.location.pathname !== '/subscription') {
			void router.navigate({ to: '/subscription' });
		}
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
			retry: defaultQueryRetry,
			staleTime: 30_000,
			refetchOnWindowFocus: false,
		},
	},
	queryCache: new QueryCache({ onError: notifyError }),
	mutationCache: new MutationCache({ onError: notifyError }),
});
