import { beforeEach, describe, expect, it } from 'vitest';

import { hasPermission, useSessionStore } from './sessionStore';
import type { AuthResult } from '@/lib/auth/types';

const AUTH: AuthResult = {
	accessToken: 'access',
	refreshToken: 'refresh',
	expiresIn: 900,
	user: {
		id: 1,
		firstName: 'Olim',
		lastName: 'Owner',
		email: null,
		roles: ['OWNER'],
		branchScope: null,
		preferredLanguage: null,
	},
	tenant: { id: 1, name: 'Ravnaq Talim' },
	subscription: null,
};

describe('sessionStore — permissions', () => {
	beforeEach(() => {
		useSessionStore.setState({
			accessToken: null,
			user: null,
			tenant: null,
			status: 'unknown',
			permissions: [],
			permissionsLoaded: false,
			subscription: null,
			subscriptionBlock: null,
		});
		localStorage.clear();
	});

	it('starts with no permissions loaded', () => {
		expect(useSessionStore.getState().permissions).toEqual([]);
		expect(useSessionStore.getState().permissionsLoaded).toBe(false);
	});

	it('setPermissions stores codes and flips permissionsLoaded', () => {
		useSessionStore.getState().setPermissions(['student.read', 'course.read']);
		expect(useSessionStore.getState().permissions).toEqual([
			'student.read',
			'course.read',
		]);
		expect(useSessionStore.getState().permissionsLoaded).toBe(true);
	});

	it('hasPermission checks any-of against the resolved codes', () => {
		useSessionStore.getState().setPermissions(['student.read']);
		expect(hasPermission('student.read')).toBe(true);
		expect(hasPermission('student.create')).toBe(false);
		expect(hasPermission(['student.create', 'student.read'])).toBe(true);
	});

	it('clear resets permissions and the loaded flag', () => {
		useSessionStore.getState().setSession(AUTH);
		useSessionStore.getState().setPermissions(['student.read']);

		useSessionStore.getState().clear();

		expect(useSessionStore.getState().permissions).toEqual([]);
		expect(useSessionStore.getState().permissionsLoaded).toBe(false);
		expect(useSessionStore.getState().status).toBe('anonymous');
		expect(hasPermission('student.read')).toBe(false);
	});
});
