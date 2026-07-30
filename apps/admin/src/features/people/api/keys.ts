export interface StudentListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
	search?: string;
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
	studentAttendances: (id: number, page: number) =>
		[...peopleKeys.students(), id, 'attendances', page] as const,
	studentAttendanceSummary: (id: number) =>
		[...peopleKeys.students(), id, 'attendances', 'summary'] as const,
	studentResults: (id: number, page: number) =>
		[...peopleKeys.students(), id, 'results', page] as const,
	studentInvoices: (id: number, page: number) =>
		[...peopleKeys.students(), id, 'invoices', page] as const,
	studentWallet: (id: number) => [...peopleKeys.students(), id, 'wallet'] as const,

	groups: (filters?: { branchIds?: number[]; status?: string }) =>
		[...peopleKeys.all, 'groups', filters] as const,
};
