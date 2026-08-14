import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { subscriptionInvoicesKeys } from '@/api/subscription-invoices/keys';
import {
	getSubscriptionInvoice,
	listSubscriptionInvoices,
} from '@/api/subscription-invoices/subscription-invoices.queries';
import type { SubscriptionInvoiceListFilters } from '@/api/subscription-invoices/types';

export function useSubscriptionInvoices(filters: SubscriptionInvoiceListFilters) {
	return useQuery({
		queryKey: subscriptionInvoicesKeys.list(filters),
		queryFn: () => listSubscriptionInvoices(filters),
		placeholderData: keepPreviousData,
	});
}

export function useSubscriptionInvoice(id: number | null) {
	return useQuery({
		queryKey: subscriptionInvoicesKeys.detail(id ?? 0),
		queryFn: () => getSubscriptionInvoice(id as number),
		enabled: id != null,
	});
}
