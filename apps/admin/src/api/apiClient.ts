import { createApiClient } from '@repo/api-client';

import { env } from '@/lib/env';
import { getAccessToken, useSessionStore } from '@/store/sessionStore';
import type { AuthResult } from '@/lib/auth/types';
import { getStoredRefreshToken } from '@/lib/auth/tokenStorage';

const apiBase = `${env.VITE_API_ORIGIN}/api/v1`;

/**
 * Unauthenticated surface: staff login and token refresh.
 * No bearer token and no refresh-on-401 — these *are* the auth endpoints.
 */
export const publicApi = createApiClient({
	baseUrl: `${apiBase}/public`,
	getAccessToken: () => null,
	onUnauthorized: async () => false,
});

/**
 * Silent refresh (docs/auth-and-rbac.md §4): exchange the stored refresh token
 * for a new JWT pair. Returns true when a new access token is ready. Used on
 * app boot and as the manage client's 401 hook (single-flight is inside api-client).
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
 * Authenticated manage surface (`/api/v1/manage/*`). Attaches the in-memory
 * access token and, on 401, runs one shared refresh then replays the request.
 */
export const manageApi = createApiClient({
	baseUrl: `${apiBase}/manage`,
	getAccessToken,
	onUnauthorized: runRefresh,
});
