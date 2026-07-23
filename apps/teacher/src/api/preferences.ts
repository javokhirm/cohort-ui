import type { Locale } from '@repo/utils';

import { teachApi } from '@/api/apiClient';

/**
 * Persist the teacher's UI language to `PATCH /teach/me/preferences`. This is
 * the only call this console makes to `/teach/me` — a write, never a read: the
 * teacher's identity still comes solely from the login/refresh `user` summary
 * (see `lib/auth/types.ts`). The endpoint responds 200 with an empty body.
 */
export function updateMyPreferences(preferredLanguage: Locale): Promise<null> {
	return teachApi.patch<null>('/me/preferences', { preferredLanguage });
}
