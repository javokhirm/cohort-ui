import type { Locale } from '@repo/utils';

import { studentApi } from '@/api/apiClient';

/**
 * Persist the student's UI language to `PATCH /student/me`. Unlike the teach surface
 * there is no separate `/me/preferences` sub-route — `MeController.update` accepts
 * `preferredLanguage` directly alongside the (unused here) `email`/`avatarUrl` fields.
 * This is the only call this console makes to `/student/me` — a write, never a read: the
 * student's identity still comes solely from the login/refresh `user` summary (see
 * `lib/auth/types.ts`). The endpoint responds 200 with an empty body.
 */
export function updateMyPreferences(preferredLanguage: Locale): Promise<null> {
	return studentApi.patch<null>('/me', { preferredLanguage });
}
