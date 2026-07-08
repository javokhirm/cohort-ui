import type { PaginatedResult } from '@repo/api-client';

import { superAdminApi } from '@/api/apiClient';
import type {
	TenantDetailView,
	TenantDirectorySummary,
	TenantListFilters,
	TenantListRow,
} from './types';

export function listTenants(
	filters?: TenantListFilters,
): Promise<PaginatedResult<TenantListRow>> {
	const params: Record<string, string> = {};
	if (filters?.status) params['status'] = filters.status;
	if (filters?.search) params['search'] = filters.search;
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	return superAdminApi.getPaginated<TenantListRow>('/tenants', { params });
}

export function getTenantSummary(): Promise<TenantDirectorySummary> {
	return superAdminApi.get<TenantDirectorySummary>('/tenants/summary');
}

export function getTenant(id: number): Promise<TenantDetailView> {
	return superAdminApi.get<TenantDetailView>(`/tenants/${id}`);
}
