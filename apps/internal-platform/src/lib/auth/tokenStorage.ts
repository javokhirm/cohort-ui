/**
 * Refresh-token persistence. Per docs/auth-and-rbac.md §3 the refresh token lives
 * in `localStorage` (survives reloads / new tabs for a daily-use back-office)
 * while the access token stays in memory (the Zustand session store). The key is
 * admin-scoped to avoid clashing with future sibling apps on the same origin.
 */
const REFRESH_TOKEN_KEY = 'cohort.admin.refreshToken';

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
		/* storage unavailable (private mode) — the session just won't persist */
	}
}

export function clearStoredRefreshToken(): void {
	try {
		localStorage.removeItem(REFRESH_TOKEN_KEY);
	} catch {
		/* ignore */
	}
}
