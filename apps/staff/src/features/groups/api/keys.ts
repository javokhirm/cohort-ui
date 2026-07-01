import type { GroupStatus } from './groups.queries';

export interface GroupListFilters {
	page?: number;
	limit?: number;
	branchId?: number;
	courseId?: number;
	teacherId?: number;
	status?: GroupStatus;
}

export interface SessionCalendarFilters {
	from: string;
	to: string;
	branchId?: number;
	teacherId?: number;
	roomId?: number;
	status?: string;
}

export const groupsKeys = {
	all: ['groups'] as const,

	groups: () => [...groupsKeys.all, 'group'] as const,
	groupList: (filters: GroupListFilters) =>
		[...groupsKeys.groups(), 'list', filters] as const,
	groupDetail: (id: number) => [...groupsKeys.groups(), 'detail', id] as const,
	groupEnrollments: (id: number, status?: string) =>
		[...groupsKeys.groups(), 'enrollments', id, status ?? 'all'] as const,
	groupSessions: (id: number) => [...groupsKeys.groups(), 'sessions', id] as const,

	sessions: () => [...groupsKeys.all, 'session'] as const,
	sessionCalendar: (filters: SessionCalendarFilters) =>
		[...groupsKeys.sessions(), 'calendar', filters] as const,
	sessionDetail: (id: number) => [...groupsKeys.sessions(), 'detail', id] as const,
};
