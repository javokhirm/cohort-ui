import type { SubscriptionInvoiceListFilters } from './types';

export const subscriptionInvoicesKeys = {
	all: ['subscription-invoices'] as const,
	list: (filters?: SubscriptionInvoiceListFilters) =>
		[...subscriptionInvoicesKeys.all, 'list', filters ?? {}] as const,
	detail: (id: number) => [...subscriptionInvoicesKeys.all, 'detail', id] as const,
};
