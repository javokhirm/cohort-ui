import { useMutation, useQueryClient } from '@tanstack/react-query';

import { subscriptionKeys, type BillingInterval } from '@repo/api-client';

import { manageApi } from '@/api/apiClient';

import type {
	SubscriptionInvoice,
	SubscriptionPayment,
	SubscriptionPaymentMethod,
} from './subscription.queries';

export interface RenewSubscriptionInput {
	method: SubscriptionPaymentMethod;
	/** Omit to renew the current plan unchanged. */
	subscriptionTierId?: number;
	/** Omit to keep the subscription's current interval. */
	billingInterval?: BillingInterval;
}

export interface RenewSubscriptionResult {
	invoice: SubscriptionInvoice;
	payment: SubscriptionPayment;
	/** Hand this to the payment gateway — it is the settlement webhook's lookup key. */
	idempotencyKey: string;
}

/**
 * `POST /manage/subscription/renew` — issues a renewal invoice and its
 * pending payment. **Access does not change here**: the period only moves
 * once the gateway webhook settles the payment server-side, so this never
 * touches the session store's `subscription` — the caller polls
 * `useSubscription({ refetchInterval })` for that (§5, never optimistic).
 */
export function useRenewSubscription() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: RenewSubscriptionInput) =>
			manageApi.post<RenewSubscriptionResult>('/subscription/renew', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: subscriptionKeys.all });
		},
	});
}
