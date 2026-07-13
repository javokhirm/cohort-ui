export type StaffRoleFilter = 'TEACHER' | 'ADMIN' | 'MANAGER';

export interface StaffListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	department?: string;
	employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
	status?: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
	role?: StaffRoleFilter;
	search?: string;
}

export const hrKeys = {
	all: ['hr'] as const,

	staff: () => [...hrKeys.all, 'staff'] as const,
	staffList: (filters: StaffListFilters) =>
		[...hrKeys.staff(), 'list', filters] as const,
	staffDetail: (id: number) => [...hrKeys.staff(), 'detail', id] as const,

	/** The tenant's role catalog — reference data, not per-staff-member. */
	roleCatalog: () => [...hrKeys.all, 'roles'] as const,
	/** Role grants are keyed by `user.id`, not `staff.id`. */
	userRoles: (userId: number) => [...hrKeys.all, 'user-roles', userId] as const,
};
