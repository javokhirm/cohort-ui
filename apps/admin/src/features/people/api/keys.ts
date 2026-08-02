export interface StudentListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
	search?: string;
}

/**
 * Performance-tab filters, as sent to the API. The period is an explicit
 * `from`/`to` window — the tab's presets are resolved client-side because they
 * are relative to the branch clock and the request carries no timezone.
 *
 * `status` narrows the session list only, never the KPI cards, which is why the
 * two query keys below take different slices of this shape.
 */
export interface StudentPerformanceFilters {
	from?: string;
	to?: string;
	groupId?: number;
	status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export const peopleKeys = {
	all: ['people'] as const,

	students: () => [...peopleKeys.all, 'students'] as const,
	studentList: (filters: StudentListFilters) =>
		[...peopleKeys.students(), 'list', filters] as const,
	student: (id: number) => [...peopleKeys.students(), 'detail', id] as const,
	studentGuardians: (id: number) =>
		[...peopleKeys.students(), id, 'guardians'] as const,
	studentEnrollments: (id: number) =>
		[...peopleKeys.students(), id, 'enrollments'] as const,
	// The summary key deliberately omits `status` and `page`: the cards aggregate
	// the whole window, so neither paging nor the status select may refetch them.
	studentPerformance: (
		id: number,
		filters: Omit<StudentPerformanceFilters, 'status'>,
	) => [...peopleKeys.students(), id, 'performance', filters] as const,
	studentPerformanceSessions: (
		id: number,
		filters: StudentPerformanceFilters,
		page: number,
	) =>
		[...peopleKeys.students(), id, 'performance', 'sessions', filters, page] as const,
	studentResults: (id: number, page: number) =>
		[...peopleKeys.students(), id, 'results', page] as const,
	studentInvoices: (id: number, page: number) =>
		[...peopleKeys.students(), id, 'invoices', page] as const,
	studentWallet: (id: number) => [...peopleKeys.students(), id, 'wallet'] as const,

	groups: (filters?: { branchIds?: number[]; status?: string }) =>
		[...peopleKeys.all, 'groups', filters] as const,
};
