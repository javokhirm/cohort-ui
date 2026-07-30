import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useSessionStore } from '@/store/sessionStore';
import { login } from '@/api/auth/auth.mutations';

/** The one role this console serves — mirrors the backend's StudentApi guard. */
export const STUDENT_ROLE = 'STUDENT';

export function useAuth() {
	const user = useSessionStore((s) => s.user);
	const status = useSessionStore((s) => s.status);
	const clear = useSessionStore((s) => s.clear);
	const navigate = useNavigate();

	return {
		user,
		status,
		isAuthenticated: status === 'authenticated',
		hasRole: (roles: string[]) =>
			!!user && roles.some((role) => user.roles.includes(role)),
		logout: () => {
			clear();
			void navigate({ to: '/login' });
		},
	};
}

export function useLogin() {
	const setSession = useSessionStore((s) => s.setSession);

	return useMutation({
		mutationFn: async (input: Parameters<typeof login>[0]) => {
			const result = await login(input);
			setSession(result);
			return result;
		},
	});
}
