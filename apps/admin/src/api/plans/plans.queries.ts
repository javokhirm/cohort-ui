import type { PaginatedResult } from '@repo/api-client';

import { adminApi } from '@/api/apiClient';
import type { PlanListFilters, PlanView } from './types';

export function listPlans(filters?: PlanListFilters): Promise<PaginatedResult<PlanView>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.isActive != null) params['isActive'] = String(filters.isActive);
	return adminApi.getPaginated<PlanView>('/plans', { params });
}

export function getPlan(id: number): Promise<PlanView> {
	return adminApi.get<PlanView>(`/plans/${id}`);
}
