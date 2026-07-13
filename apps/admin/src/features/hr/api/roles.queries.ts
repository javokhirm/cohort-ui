import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { hrKeys } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Hand-written to match the `/manage` RBAC endpoints (api-reference §3.5), for
// the same reason as the staff shapes: the generated OpenAPI types are stale.

export interface RoleCatalogItem {
	id: number;
	name: string;
	description: string | null;
	/** System roles are shared across tenants and read-only. */
	isSystem: boolean;
	/** False for OWNER/SUPER_ADMIN — the server refuses to grant them here. */
	isAssignable: boolean;
}

export interface RoleAssignment {
	id: number;
	userId: number;
	roleId: number;
	roleName: string;
	/** Null = the grant applies across every branch. */
	branchId: number | null;
	branchName: string | null;
	isActive: boolean;
	createdAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** The roles this tenant can hand out. Reference data — cached like branches. */
export function useRoleCatalog() {
	return useQuery({
		queryKey: hrKeys.roleCatalog(),
		queryFn: () => manageApi.get<RoleCatalogItem[]>('/roles'),
		staleTime: 5 * 60 * 1000,
	});
}

/**
 * Every role a user holds, with its branch scope. Grants are additive, so this
 * is a list, not a single value — an owner who also teaches shows both.
 *
 * Keyed by `user.id` (from `staff.user.id`), not `staff.id`.
 */
export function useUserRoleAssignments(userId: number) {
	return useQuery({
		queryKey: hrKeys.userRoles(userId),
		queryFn: () =>
			manageApi.get<RoleAssignment[]>(`/users/${userId}/role-assignments`),
		enabled: userId > 0,
	});
}
