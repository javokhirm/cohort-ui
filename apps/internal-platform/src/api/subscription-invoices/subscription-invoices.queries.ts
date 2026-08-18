import type { PaginatedResult } from '@repo/api-client';

import { superAdminApi } from '@/api/apiClient';
import type { SubscriptionInvoiceListFilters, SubscriptionInvoiceView } from './types';

export function listSubscriptionInvoices(
	filters?: SubscriptionInvoiceListFilters,
): Promise<PaginatedResult<SubscriptionInvoiceView>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.tenantId != null) params['tenantId'] = String(filters.tenantId);
	if (filters?.status) params['status'] = filters.status;
	if (filters?.from) params['from'] = filters.from;
	if (filters?.to) params['to'] = filters.to;
	return superAdminApi.getPaginated<SubscriptionInvoiceView>('/subscription-invoices', {
		params,
	});
}

export function getSubscriptionInvoice(id: number): Promise<SubscriptionInvoiceView> {
	return superAdminApi.get<SubscriptionInvoiceView>(`/subscription-invoices/${id}`);
}
