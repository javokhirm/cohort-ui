import { superAdminApi } from '@/api/apiClient';
import type { PermissionCatalog, RoleView } from './types';

export function listRoles(): Promise<RoleView[]> {
	return superAdminApi.get<RoleView[]>('/roles');
}

export function listPermissions(): Promise<PermissionCatalog> {
	return superAdminApi.get<PermissionCatalog>('/permissions');
}
