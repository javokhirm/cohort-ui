import type { StaffRoleFilter } from '../api/keys';

/** Display precedence when a staff member carries multiple role names. */
const ROLE_PRIORITY = ['OWNER', 'ADMIN', 'MANAGER', 'TEACHER'];

/** Pick the most significant role name to show as the staff member's badge. */
export function primaryRole(roles: string[]): string | null {
	for (const name of ROLE_PRIORITY) {
		if (roles.includes(name)) return name;
	}
	return roles[0] ?? null;
}

/**
 * Role filter chips — **values only, never display text**. A label captured at
 * module load would freeze in whatever language was active when the module first
 * evaluated (conventions.md §7); screens resolve `hr:roleFilter.*` at render.
 *
 * A role *name* on a badge (`OWNER` → "Egasi") comes from `useStatusLabel('role',
 * name)`, the same `enums.domain.role.*` catalog `@repo/ui` colors against.
 */
export const ROLE_FILTERS: { value: StaffRoleFilter | undefined }[] = [
	{ value: undefined },
	{ value: 'TEACHER' },
	{ value: 'MANAGER' },
	{ value: 'ADMIN' },
];
