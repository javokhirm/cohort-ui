import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { runRefresh } from './api';
import { useSessionStore } from './auth/session-store';
import { getStoredRefreshToken, setStoredRefreshToken } from './auth/token-storage';
import { authResult } from '@/test/handlers';
import { server } from '@/test/server';

beforeEach(() => {
	localStorage.clear();
	useSessionStore.setState({ accessToken: null, user: null, status: 'unknown' });
});

describe('runRefresh', () => {
	it('returns false and goes anonymous when no refresh token is stored', async () => {
		const ok = await runRefresh();

		expect(ok).toBe(false);
		expect(useSessionStore.getState().status).toBe('anonymous');
		expect(useSessionStore.getState().accessToken).toBeNull();
	});

	it('refreshes the session from a valid stored refresh token', async () => {
		setStoredRefreshToken('refresh-token-1');

		const ok = await runRefresh();

		const state = useSessionStore.getState();
		expect(ok).toBe(true);
		expect(state.status).toBe('authenticated');
		expect(state.accessToken).toBe(authResult.accessToken);
		expect(state.user?.roles).toContain('SUPER_ADMIN');
		expect(getStoredRefreshToken()).toBe(authResult.refreshToken);
	});

	it('clears the session when the refresh request fails', async () => {
		setStoredRefreshToken('expired-token');
		server.use(
			http.post('http://localhost:5050/api/v1/public/auth/refresh', () =>
				HttpResponse.json(
					{ success: false, error: { code: 'INVALID_TOKEN', message: 'expired' }, meta: {} },
					{ status: 401 },
				),
			),
		);

		const ok = await runRefresh();

		expect(ok).toBe(false);
		expect(useSessionStore.getState().status).toBe('anonymous');
		expect(getStoredRefreshToken()).toBeNull();
	});
});
