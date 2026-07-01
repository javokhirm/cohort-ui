export interface CourseListFilters {
	page?: number;
	limit?: number;
	branchId?: number;
	search?: string;
	isActive?: boolean;
}

export const coursesKeys = {
	all: ['courses'] as const,

	courses: () => [...coursesKeys.all, 'course'] as const,
	courseList: (filters: CourseListFilters) =>
		[...coursesKeys.courses(), 'list', filters] as const,
	courseDetail: (id: number) => [...coursesKeys.courses(), 'detail', id] as const,
	courseGroups: (id: number) => [...coursesKeys.courses(), 'groups', id] as const,
};
