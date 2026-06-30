import type { PaginatedResult } from '@repo/api-client';

import { adminApi } from '@/lib/api';
import type { UserDetailView, UserDirectoryRow, UserListFilters } from './types';

export function listUsers(
	filters?: UserListFilters,
): Promise<PaginatedResult<UserDirectoryRow>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.search) params['search'] = filters.search;
	if (filters?.status) params['status'] = filters.status;
	return adminApi.getPaginated<UserDirectoryRow>('/users', { params });
}

export function getUser(id: number): Promise<UserDetailView> {
	return adminApi.get<UserDetailView>(`/users/${id}`);
}
