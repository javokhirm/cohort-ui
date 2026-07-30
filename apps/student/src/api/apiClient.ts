import { createApiClient } from '@repo/api-client';
import { getLocale } from '@repo/i18n';

import { env } from '@/lib/env';
import { getAccessToken, useSessionStore } from '@/store/sessionStore';
import type { AuthResult } from '@/lib/auth/types';
import { getStoredRefreshToken } from '@/lib/auth/tokenStorage';

const apiBase = `${env.VITE_API_ORIGIN}/api/v1`;

/**
 * Unauthenticated surface: login and token refresh. Students sign in via the dedicated
 * `/auth/student/login` (student code + password), not the shared phone-based
 * `/auth/login` every staff console uses. Refresh is the shared endpoint.
 * No bearer token and no refresh-on-401 — these *are* the auth endpoints.
 * Still sends `x-lang` so pre-login errors come back localised.
 */
export const publicApi = createApiClient({
	baseUrl: `${apiBase}/public`,
	getAccessToken: () => null,
	onUnauthorized: async () => false,
	getLocale,
});

/**
 * Silent refresh (docs/auth-and-rbac.md §4): exchange the stored refresh token for a new
 * JWT pair. Returns true when a new access token is ready. Used on app boot and as the
 * student client's 401 hook (single-flight is inside api-client).
 */
export async function runRefresh(): Promise<boolean> {
	const refreshToken = getStoredRefreshToken();
	if (!refreshToken) {
		useSessionStore.getState().clear();
		return false;
	}
	try {
		const result = await publicApi.post<AuthResult>('/auth/refresh', {
			refreshToken,
		});
		useSessionStore.getState().setSession(result);
		return true;
	} catch {
		useSessionStore.getState().clear();
		return false;
	}
}

/**
 * Authenticated student surface (`/api/v1/student/*`). Attaches the in-memory access
 * token and, on 401, runs one shared refresh then replays the request.
 */
export const studentApi = createApiClient({
	baseUrl: `${apiBase}/student`,
	getAccessToken,
	onUnauthorized: runRefresh,
	getLocale,
});
