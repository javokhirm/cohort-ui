import { useMutation } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

export interface ChangeMyPasswordInput {
	newPassword: string;
}

/**
 * Change the signed-in staff member's own password (`PATCH /manage/me/password`).
 * The route always acts on the caller, so it takes no id and needs no permission —
 * changing *another* member's password is done from the staff detail page, which is
 * gated by `staff.update`.
 *
 * Nothing is cached from this call, so there is no query to invalidate: the session
 * keeps its existing tokens (the backend does not revoke them), and the new password
 * applies from the next login.
 */
export function useChangeMyPassword(options?: { onSuccess?: () => void }) {
	return useMutation({
		mutationFn: (input: ChangeMyPasswordInput) =>
			manageApi.patch<null>('/me/password', input),
		onSuccess: options?.onSuccess,
	});
}
