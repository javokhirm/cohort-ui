import { create } from 'zustand';

import type { AuthResult, AuthUserSummary } from '@/lib/auth/types';
import { clearStoredRefreshToken, setStoredRefreshToken } from '@/lib/auth/tokenStorage';

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

export const getAccessToken = (): string | null => useSessionStore.getState().accessToken;

export const hasRole = (roles: string[]): boolean => {
	const { user } = useSessionStore.getState();
	return !!user && roles.some((role) => user.roles.includes(role));
};
