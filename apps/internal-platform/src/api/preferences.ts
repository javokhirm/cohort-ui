import type { Locale } from '@repo/utils';

import { superAdminApi } from './apiClient';

/**
 * Persist the operator's UI language to `PATCH /super-admin/me/preferences`.
 * The endpoint responds 200 with an empty body; the local switch is applied
 * optimistically by `useLocalePreference`.
 */
export function updateMyPreferences(preferredLanguage: Locale): Promise<null> {
	return superAdminApi.patch<null>('/me/preferences', { preferredLanguage });
}
