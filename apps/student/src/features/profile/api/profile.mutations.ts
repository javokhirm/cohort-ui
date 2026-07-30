import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';
import { profileKeys } from '@/features/profile/api/profile.queries';

/**
 * The writable slice of `PATCH /student/me`.
 *
 * `preferredLanguage` is not here: it is written by `useLocalePreference` (via
 * `api/preferences.ts`), which owns the language switch for the whole app.
 */
export interface UpdateMyProfileInput {
	phone?: string;
	email?: string;
	avatarUrl?: string;
}

/**
 * Persist the student's own contact details. The endpoint answers 200 with an empty
 * (`data: null`) envelope, so the cached profile is invalidated rather than patched from a
 * response body — never assume the write landed without that confirmation.
 */
export function useUpdateMyProfile() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: UpdateMyProfileInput) => studentApi.patch<null>('/me', input),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: profileKeys.me() }),
	});
}
