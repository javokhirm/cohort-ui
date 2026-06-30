import { adminApi } from '@/api/apiClient';
import type { UpdateRolePermissionsInput } from './types';

export function updateRolePermissions(
	roleName: string,
	input: UpdateRolePermissionsInput,
): Promise<void> {
	return adminApi.patch<void>(`/roles/${roleName}/permissions`, input);
}
