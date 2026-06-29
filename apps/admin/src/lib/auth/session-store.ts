import { create } from 'zustand';

import type { AuthResult, AuthUserSummary } from './types';
import { clearStoredRefreshToken, setStoredRefreshToken } from './token-storage';

/** `unknown` until the boot refresh resolves — the router waits for this. */
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface SessionState {
	/** Access token — memory only, never persisted. */
	accessToken: string | null;
	user: AuthUserSummary | null;
	status: SessionStatus;
	/** Store a fresh token pair: access + user in memory, refresh in localStorage. */
	setSession: (result: AuthResult) => void;
	/** Boot check finished with no usable session. */
	setAnonymous: () => void;
	/** Wipe the session (logout / failed refresh). */
	clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
	accessToken: null,
	user: null,
	status: 'unknown',
	setSession: (result) => {
		setStoredRefreshToken(result.refreshToken);
		set({
			accessToken: result.accessToken,
			user: result.user,
			status: 'authenticated',
		});
	},
	setAnonymous: () => set({ accessToken: null, user: null, status: 'anonymous' }),
	clear: () => {
		clearStoredRefreshToken();
		set({ accessToken: null, user: null, status: 'anonymous' });
	},
}));

/** Non-React access for the api-client token getter and route guards. */
export const getAccessToken = (): string | null => useSessionStore.getState().accessToken;

/** Whether the current operator holds at least one of the given roles. */
export const hasRole = (roles: string[]): boolean => {
	const { user } = useSessionStore.getState();
	return !!user && roles.some((role) => user.roles.includes(role));
};
