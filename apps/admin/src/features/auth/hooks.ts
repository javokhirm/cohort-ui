import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useSessionStore } from '@/store/sessionStore';
import { permitted, type PermissionRequirement } from '@/lib/auth/permissions';
import { login } from '@/api/auth/auth.mutations';
import { loadPermissions } from '@/api/me';

export function useAuth() {
	const user = useSessionStore((s) => s.user);
	const status = useSessionStore((s) => s.status);
	const permissions = useSessionStore((s) => s.permissions);
	const clear = useSessionStore((s) => s.clear);
	const navigate = useNavigate();

	const can = useCallback(
		(required: PermissionRequirement) => permitted(permissions, required),
		[permissions],
	);

	return {
		user,
		status,
		isAuthenticated: status === 'authenticated',
		hasRole: (roles: string[]) =>
			!!user && roles.some((role) => user.roles.includes(role)),
		/** Reactive any-of permission check against the resolved catalog codes. */
		can,
		logout: () => {
			clear();
			void navigate({ to: '/login' });
		},
	};
}

/**
 * Reactive permission access for gating UI. `can(...)` re-evaluates when the
 * resolved permissions load; `permissionsLoaded` lets callers distinguish
 * "still loading" from "loaded, holds nothing".
 */
export function usePermissions() {
	const permissions = useSessionStore((s) => s.permissions);
	const permissionsLoaded = useSessionStore((s) => s.permissionsLoaded);

	const can = useCallback(
		(required: PermissionRequirement) => permitted(permissions, required),
		[permissions],
	);

	return { can, permissions, permissionsLoaded };
}

export function useLogin() {
	const setSession = useSessionStore((s) => s.setSession);
	return useMutation({
		mutationFn: async (input: Parameters<typeof login>[0]) => {
			const result = await login(input);
			// Establish the session first so the manage client sends the fresh
			// access token, then resolve permissions before the caller navigates
			// — route guards then see the codes and don't fail open on entry.
			setSession(result);
			await loadPermissions();
			return result;
		},
	});
}
