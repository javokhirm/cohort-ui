import { beforeEach, describe, expect, it } from 'vitest';

import { fetchManageProfile, loadPermissions } from './me';
import { meHandlers } from '@/test/handlers';
import { server } from '@/test/server';
import { useSessionStore } from '@/store/sessionStore';

describe('manage profile + loadPermissions', () => {
	beforeEach(() => {
		useSessionStore.setState({
			accessToken: 'access-token-1',
			user: null,
			status: 'authenticated',
			permissions: [],
			permissionsLoaded: false,
		});
	});

	it('fetchManageProfile returns the profile with resolved permissions', async () => {
		const profile = await fetchManageProfile();
		expect(profile.roles).toContain('OWNER');
		expect(profile.permissions).toContain('payroll.approve');
	});

	it('loadPermissions pushes the resolved codes into the store', async () => {
		await loadPermissions();
		const state = useSessionStore.getState();
		expect(state.permissionsLoaded).toBe(true);
		expect(state.permissions).toContain('student.read');
	});

	it('loadPermissions applies a restricted permission set', async () => {
		server.use(meHandlers.withPermissions(['student.read', 'course.read']));
		await loadPermissions();
		expect(useSessionStore.getState().permissions).toEqual([
			'student.read',
			'course.read',
		]);
	});

	it('loadPermissions fails open when /me errors (server still enforces)', async () => {
		server.use(meHandlers.serverError);
		await loadPermissions();
		const state = useSessionStore.getState();
		expect(state.permissionsLoaded).toBe(false);
		expect(state.permissions).toEqual([]);
	});
});
