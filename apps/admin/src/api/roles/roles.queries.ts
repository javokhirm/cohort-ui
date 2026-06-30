import { adminApi } from '@/api/apiClient';
import type { PermissionCatalog, RoleView } from './types';

export function listRoles(): Promise<RoleView[]> {
	return adminApi.get<RoleView[]>('/roles');
}

export function listPermissions(): Promise<PermissionCatalog> {
	return adminApi.get<PermissionCatalog>('/permissions');
}
