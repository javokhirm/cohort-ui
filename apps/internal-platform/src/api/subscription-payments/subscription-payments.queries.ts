import type { PaginatedResult } from '@repo/api-client';

import { superAdminApi } from '@/api/apiClient';
import type { SubscriptionPaymentListFilters, SubscriptionPaymentView } from './types';

export function listSubscriptionPayments(
	filters?: SubscriptionPaymentListFilters,
): Promise<PaginatedResult<SubscriptionPaymentView>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.tenantId != null) params['tenantId'] = String(filters.tenantId);
	if (filters?.status) params['status'] = filters.status;
	if (filters?.method) params['method'] = filters.method;
	if (filters?.provider) params['provider'] = filters.provider;
	if (filters?.search) params['search'] = filters.search;
	if (filters?.from) params['from'] = filters.from;
	if (filters?.to) params['to'] = filters.to;
	return superAdminApi.getPaginated<SubscriptionPaymentView>('/subscription-payments', {
		params,
	});
}

export function getSubscriptionPayment(id: number): Promise<SubscriptionPaymentView> {
	return superAdminApi.get<SubscriptionPaymentView>(`/subscription-payments/${id}`);
}
