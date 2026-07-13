import { useQuery } from '@tanstack/react-query';

import { fetchManageProfile } from '@/api/me';

export const profileKeys = {
	all: ['profile'] as const,
	me: () => [...profileKeys.all, 'me'] as const,
};

/**
 * The signed-in staff member's own profile (`GET /manage/me`). Reuses the existing
 * `fetchManageProfile` — the same call that seeds the session's permission codes on
 * boot — so the account page shows server truth rather than re-deriving it from the
 * token.
 */
export function useMyProfile() {
	return useQuery({
		queryKey: profileKeys.me(),
		queryFn: fetchManageProfile,
	});
}
