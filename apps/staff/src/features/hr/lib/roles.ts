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

/** "TEACHER" → "Teacher" */
export function roleLabel(role: string): string {
	return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export const ROLE_FILTERS: { value: StaffRoleFilter | undefined; label: string }[] = [
	{ value: undefined, label: 'All' },
	{ value: 'TEACHER', label: 'Teachers' },
	{ value: 'MANAGER', label: 'Managers' },
	{ value: 'ADMIN', label: 'Admins' },
];
