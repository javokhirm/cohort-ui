/**
 * Refresh-token persistence. Per docs/auth-and-rbac.md §3, the refresh token
 * lives in localStorage while the access token stays in memory (Zustand store).
 * The key is teacher-scoped so it never clashes with a sibling console sharing
 * the same origin in local dev.
 */
const REFRESH_TOKEN_KEY = 'cohort.teacher.refreshToken';

export function getStoredRefreshToken(): string | null {
	try {
		return localStorage.getItem(REFRESH_TOKEN_KEY);
	} catch {
		return null;
	}
}

export function setStoredRefreshToken(token: string): void {
	try {
		localStorage.setItem(REFRESH_TOKEN_KEY, token);
	} catch {
		/* storage unavailable (private mode) — session won't persist across reloads */
	}
}

export function clearStoredRefreshToken(): void {
	try {
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	} catch {
		/* ignore */
	}
}
