import { beforeEach, describe, expect, it } from 'vitest';

import { requirePermission } from './guards';
import { useSessionStore } from '@/store/sessionStore';

describe('requirePermission', () => {
	beforeEach(() => {
		useSessionStore.setState({
			accessToken: 'access',
			user: null,
			status: 'authenticated',
			permissions: [],
			permissionsLoaded: false,
		});
	});

	it('fails open while permissions are still loading (server enforces)', () => {
		// permissionsLoaded === false → never bounce on entry before /me resolves.
		expect(() => requirePermission('student.read')).not.toThrow();
	});

	it('redirects (throws) when loaded and the permission is missing', () => {
		useSessionStore.getState().setPermissions(['course.read']);
		expect(() => requirePermission('student.read')).toThrow();
	});

	it('passes when the required permission is held', () => {
		useSessionStore.getState().setPermissions(['student.read']);
		expect(() => requirePermission('student.read')).not.toThrow();
	});

	it('passes an any-of list when one code is held', () => {
		useSessionStore.getState().setPermissions(['expense.update']);
		expect(() =>
			requirePermission(['expense.create', 'expense.update', 'expense.delete']),
		).not.toThrow();
	});
});
