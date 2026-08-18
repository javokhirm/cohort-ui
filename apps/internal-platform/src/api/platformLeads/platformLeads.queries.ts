import type { PaginatedResult } from '@repo/api-client';

import { superAdminApi } from '@/api/apiClient';
import type { PlatformLead, PlatformLeadListFilters } from './types';

export function listPlatformLeads(
	filters?: PlatformLeadListFilters,
): Promise<PaginatedResult<PlatformLead>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.search) params['search'] = filters.search;
	if (filters?.source) params['source'] = filters.source;
	if (filters?.from) params['from'] = filters.from;
	if (filters?.to) params['to'] = filters.to;
	return superAdminApi.getPaginated<PlatformLead>('/platform-leads', { params });
}

export function getPlatformLead(id: number): Promise<PlatformLead> {
	return superAdminApi.get<PlatformLead>(`/platform-leads/${id}`);
}
