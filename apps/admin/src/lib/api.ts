import { createApiClient } from '@repo/api-client';

import { env } from './env';
import { getAccessToken, useSessionStore } from './auth/session-store';
import type { AuthResult } from './auth/types';
import { getStoredRefreshToken } from './auth/token-storage';

const apiBase = `${env.VITE_API_ORIGIN}/api/v1`;

/**
 * Unauthenticated surface: admin login, OTP verification, and token refresh.
 * No bearer token and no refresh-on-401 — these *are* the auth endpoints.
 */
export const publicApi = createApiClient({
	baseUrl: `${apiBase}/public`,
	getAccessToken: () => null,
	onUnauthorized: async () => false,
});

/**
 * Silent refresh (docs/auth-and-rbac.md §4): exchange the stored refresh token
 * for a new JWT pair. Returns `true` when a new access token is ready. Used both
 * on app boot and as the admin client's 401 hook (single-flight is handled
 * inside the api-client). A missing/invalid token clears the session.
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
 * Authenticated platform surface (`/api/v1/admin/*`). Attaches the in-memory
 * access token and, on 401, runs one shared refresh then replays the request.
 */
export const adminApi = createApiClient({
	baseUrl: `${apiBase}/admin`,
	getAccessToken,
	onUnauthorized: runRefresh,
});
