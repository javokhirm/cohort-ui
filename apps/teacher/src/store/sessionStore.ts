import { create } from 'zustand';

import type { AuthResult, AuthUserSummary } from '@/lib/auth/types';
import { clearStoredRefreshToken, setStoredRefreshToken } from '@/lib/auth/tokenStorage';

/** `unknown` until the boot refresh resolves — the router waits for this. */
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

interface SessionState {
	/** Access token — memory only, never persisted. */
	accessToken: string | null;
	user: AuthUserSummary | null;
	status: SessionStatus;
	setSession: (result: AuthResult) => void;
	setAnonymous: () => void;
	clear: () => void;
}

/**
 * The teach surface is gated by **role only** — it carries no permission codes,
 * and there is no `/teach/me` to resolve them from. So unlike the admin console,
 * this store holds no `permissions`: `user.roles` from the login/refresh
 * response is the whole authorization picture the client ever sees.
 */
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

export const hasRole = (roles: string[]): boolean => {
	const { user } = useSessionStore.getState();
	return !!user && roles.some((role) => user.roles.includes(role));
};
