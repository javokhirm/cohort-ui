import type { PaginatedResult } from '@repo/api-client';

import { superAdminApi } from '@/api/apiClient';
import type { UserDetailView, UserDirectoryRow, UserListFilters } from './types';

export function listUsers(
	filters?: UserListFilters,
): Promise<PaginatedResult<UserDirectoryRow>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.search) params['search'] = filters.search;
	if (filters?.status) params['status'] = filters.status;
	return superAdminApi.getPaginated<UserDirectoryRow>('/users', { params });
}

export function getUser(id: number): Promise<UserDetailView> {
	return superAdminApi.get<UserDetailView>(`/users/${id}`);
}
