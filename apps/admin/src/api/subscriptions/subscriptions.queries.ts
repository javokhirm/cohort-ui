import type { PaginatedResult } from '@repo/api-client';

import { adminApi } from '@/api/apiClient';
import type {
	SubscriptionAnalyticsView,
	SubscriptionListFilters,
	SubscriptionView,
} from './types';

export function listSubscriptions(
	filters?: SubscriptionListFilters,
): Promise<PaginatedResult<SubscriptionView>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.status) params['status'] = filters.status;
	if (filters?.tierId != null) params['tierId'] = String(filters.tierId);
	return adminApi.getPaginated<SubscriptionView>('/subscriptions', { params });
}

export function getSubscriptionAnalytics(): Promise<SubscriptionAnalyticsView> {
	return adminApi.get<SubscriptionAnalyticsView>('/subscriptions/analytics');
}
