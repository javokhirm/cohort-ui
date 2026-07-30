import { useQuery } from '@tanstack/react-query';

import type { Locale } from '@repo/utils';

import { studentApi } from '@/api/apiClient';

/** The student's own branch — named contact info the Profile screen shows. */
export interface StudentBranch {
	id: number;
	name: string;
	phone: string | null;
	address: string | null;
}

/** The tenant's own top-level contact info. */
export interface StudentCenter {
	name: string;
	phone: string | null;
}

/**
 * The signed-in student's own profile (`GET /student/me`, api-reference §5.1).
 *
 * Hand-mirrored from the backend's `StudentMeDto` — the student controllers declare no
 * `@ApiOkResponse`, so the OpenAPI document carries no response schema to generate from
 * (same convention as `features/home`'s `StudentHome`).
 *
 * This is the app's **only** read of `/student/me`, and it is route-scoped: nothing fetches
 * it until the Profile screen is entered. The signed-in student's identity still comes
 * solely from the login/refresh `user` summary — do not turn this into a boot fetch.
 */
export interface StudentMe {
	id: number;
	firstName: string;
	lastName: string;
	/** The login identifier. Read-only here: only an admin may change it. */
	phone: string;
	email: string | null;
	avatarUrl: string | null;
	preferredLanguage: Locale | null;
	/** Role names — always `['STUDENT']` on this surface. */
	roles: string[];
	branchScope: number[] | null;
	studentCode: string;
	status: string;
	/** `YYYY-MM-DD`. */
	enrolledAt: string;
	branch: StudentBranch;
	center: StudentCenter;
}

export const profileKeys = {
	all: ['profile'] as const,
	me: () => [...profileKeys.all, 'me'] as const,
};

export function useMe(options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: profileKeys.me(),
		queryFn: () => studentApi.get<StudentMe>('/me'),
		staleTime: 5 * 60 * 1000,
		enabled: options?.enabled ?? true,
	});
}
