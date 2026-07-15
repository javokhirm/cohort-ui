import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

/**
 * The signed-in teacher's own profile (`GET /teach/me`, api-reference §4.9) — the
 * identity fields the profile screen shows (`phone`, `email`, `avatarUrl`) plus
 * the `roles`/`branchScope` snapshot.
 */
export interface TeacherProfile {
	id: number;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string;
	avatarUrl: string | null;
	/** Role names — always includes `TEACHER`. */
	roles: string[];
	/** Branch ids the teacher is scoped to, or `null` for all branches. */
	branchScope: number[] | null;
}

export const profileKeys = {
	all: ['profile'] as const,
	me: () => [...profileKeys.all, 'me'] as const,
};

export function useProfile() {
	return useQuery({
		queryKey: profileKeys.me(),
		queryFn: () => teachApi.get<TeacherProfile>('/me'),
		staleTime: 5 * 60 * 1000,
	});
}
