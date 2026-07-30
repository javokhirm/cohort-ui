import { useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

/**
 * A group the student is (or was) enrolled in (`GET /student/groups`, api-reference
 * §5.3) — backs the Progress screen's group filter chips. Hand-mirrored from the
 * backend's `StudentGroupDto`.
 */
export interface StudentGroup {
	id: number;
	name: string;
	courseName: string;
	teacherName: string | null;
	roomName: string | null;
	status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
	enrollmentStatus: 'ACTIVE' | 'SUSPENDED' | 'DROPPED' | 'COMPLETED' | 'TRANSFERRED';
}

export const groupKeys = {
	all: ['groups'] as const,
};

/** Groups the student is (or was) enrolled in — the filter-chip source. */
export function useMyGroups() {
	return useQuery({
		queryKey: groupKeys.all,
		queryFn: () => studentApi.get<StudentGroup[]>('/groups'),
	});
}
