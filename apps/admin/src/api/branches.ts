import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

/**
 * The accessible branches (docs/auth-and-rbac.md §6). `GET /manage/branches`
 * returns only the branches the user can reach with a back-office role — the
 * backend applies the surface-specific scope — so this list is the source of
 * truth for the global branch selector and for every branch picker. Shared at
 * the app level because branches are cross-feature reference data, not a
 * `people` concern.
 */
export interface Branch {
	id: number;
	name: string;
	code: string;
	address: string | null;
	phone: string | null;
	email: string | null;
	timezone: string | null;
	isMain: boolean;
	isActive: boolean;
}

export const branchesKeys = {
	all: ['branches'] as const,
	list: () => [...branchesKeys.all, 'list'] as const,
};

export function useBranches() {
	return useQuery({
		queryKey: branchesKeys.list(),
		queryFn: () => manageApi.get<Branch[]>('/branches'),
		staleTime: 5 * 60 * 1000,
	});
}
