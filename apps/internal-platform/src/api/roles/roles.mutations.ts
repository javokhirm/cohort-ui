import { superAdminApi } from '@/api/apiClient';
import type { UpdateRolePermissionsInput } from './types';

export function updateRolePermissions(
	roleName: string,
	input: UpdateRolePermissionsInput,
): Promise<void> {
	return superAdminApi.patch<void>(`/roles/${roleName}/permissions`, input);
}
