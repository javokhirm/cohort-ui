import type { SubscriptionPaymentListFilters } from './types';

export const subscriptionPaymentsKeys = {
	all: ['subscription-payments'] as const,
	list: (filters?: SubscriptionPaymentListFilters) =>
		[...subscriptionPaymentsKeys.all, 'list', filters ?? {}] as const,
	detail: (id: number) => [...subscriptionPaymentsKeys.all, 'detail', id] as const,
};
