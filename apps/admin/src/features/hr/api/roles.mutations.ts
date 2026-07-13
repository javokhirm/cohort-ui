import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { hrKeys } from './keys';
import type { RoleAssignment } from './roles.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface GrantRoleInput {
	userId: number;
	roleId: number;
	/** Omit or null for a tenant-wide grant (all branches). */
	branchId?: number | null;
}

export interface RevokeRoleInput {
	userId: number;
	assignmentId: number;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Grant a role. Additive — the user keeps every role they already hold, which is
 * what lets an owner also be a teacher.
 *
 * Both queries are invalidated because the grant shows up in two places: the
 * assignment list, and the `roles` array on the staff record that drives the
 * header badge and the `role=TEACHER` staff filters.
 */
export function useGrantRole() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, ...body }: GrantRoleInput) =>
			manageApi.post<RoleAssignment>(`/users/${userId}/role-assignments`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: hrKeys.userRoles(variables.userId) });
			void qc.invalidateQueries({ queryKey: hrKeys.staff() });
		},
	});
}

/** Revoke one grant; the user's other roles are untouched. */
export function useRevokeRole() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ userId, assignmentId }: RevokeRoleInput) =>
			manageApi.delete(`/users/${userId}/role-assignments/${assignmentId}`),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: hrKeys.userRoles(variables.userId) });
			void qc.invalidateQueries({ queryKey: hrKeys.staff() });
		},
	});
}
