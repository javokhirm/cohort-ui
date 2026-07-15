import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

/**
 * The branches this teacher teaches at (`GET /teach/branches`, api-reference §4.8)
 * — the distinct branches of the groups in their teaching scope.
 *
 * It exists purely to *name* a branch. Every teach session and group carries a
 * `branchId`, but no teach payload carries a branch name, and `/manage/branches`
 * is gated to the back-office roles a teacher does not hold. Without this the
 * switcher could only offer "Branch 7".
 *
 * Shared at the app level, not inside a feature: both Today (sessions) and Groups
 * label and filter by branch, so it is cross-feature reference data.
 *
 * The response has no schema in the OpenAPI document (the teach controllers
 * declare no `@ApiOkResponse`), so this mirrors the backend's `TeachBranchDto`
 * by hand — the four fields §4.8 exposes, and no more.
 */
export interface TeachBranch {
	id: number;
	name: string;
	code: string;
	isActive: boolean;
}

export const branchesKeys = {
	all: ['branches'] as const,
	list: () => [...branchesKeys.all, 'list'] as const,
};

export function useTeachBranches() {
	return useQuery({
		queryKey: branchesKeys.list(),
		queryFn: () => teachApi.get<TeachBranch[]>('/branches'),
		staleTime: 5 * 60 * 1000,
	});
}
