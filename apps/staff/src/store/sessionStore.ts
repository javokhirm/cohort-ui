import { create } from 'zustand';

import type { AuthResult, AuthUserSummary } from '@/lib/auth/types';
import { permitted, type PermissionRequirement } from '@/lib/auth/permissions';
import { clearStoredRefreshToken, setStoredRefreshToken } from '@/lib/auth/tokenStorage';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface SessionState {
	/** Access token — memory only, never persisted. */
	accessToken: string | null;
	user: AuthUserSummary | null;
	status: SessionStatus;
	/**
	 * Effective permission codes resolved from `GET /manage/me`. Empty until the
	 * profile loads; `permissionsLoaded` distinguishes "not yet fetched" from
	 * "fetched, holds nothing".
	 */
	permissions: string[];
	permissionsLoaded: boolean;
	setSession: (result: AuthResult) => void;
	/** Store the resolved permission codes (from `/manage/me`). */
	setPermissions: (codes: string[]) => void;
	setAnonymous: () => void;
	clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
	accessToken: null,
	user: null,
	status: 'unknown',
	permissions: [],
	permissionsLoaded: false,
	setSession: (result) => {
		setStoredRefreshToken(result.refreshToken);
		set({
			accessToken: result.accessToken,
			user: result.user,
			status: 'authenticated',
		});
	},
	setPermissions: (codes) => set({ permissions: codes, permissionsLoaded: true }),
	setAnonymous: () =>
		set({
			accessToken: null,
			user: null,
			status: 'anonymous',
			permissions: [],
			permissionsLoaded: false,
		}),
	clear: () => {
		clearStoredRefreshToken();
		set({
			accessToken: null,
			user: null,
			status: 'anonymous',
			permissions: [],
			permissionsLoaded: false,
		});
	},
}));

export const getAccessToken = (): string | null => useSessionStore.getState().accessToken;

export const hasRole = (roles: string[]): boolean => {
	const { user } = useSessionStore.getState();
	return !!user && roles.some((role) => user.roles.includes(role));
};

/**
 * Non-reactive permission check (any-of) against the resolved catalog codes —
 * for use outside React (route guards). Components should prefer the reactive
 * `usePermissions()` / `<Can>` so they update when the profile loads.
 */
export const hasPermission = (required: PermissionRequirement): boolean => {
	return permitted(useSessionStore.getState().permissions, required);
};
