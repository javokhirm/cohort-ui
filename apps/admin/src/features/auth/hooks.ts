import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { useSessionStore } from '@/lib/auth/session-store';
import { requestOtp, verifyOtp } from './api/auth.mutations';
import { getOperator } from './api/auth.queries';
import { authKeys } from './api/keys';

/** Session-aware view of the current operator + auth actions. */
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

/** Step 1 mutation — request the email OTP. */
export function useRequestOtp() {
	return useMutation({ mutationFn: requestOtp });
}

/** Step 2 mutation — verify the OTP and persist the session. */
export function useVerifyOtp() {
	const setSession = useSessionStore((s) => s.setSession);
	return useMutation({
		mutationFn: verifyOtp,
		onSuccess: (result) => setSession(result),
	});
}

/** The authenticated operator's profile (`GET /admin/me`). */
export function useOperator() {
	const isAuthenticated = useSessionStore((s) => s.status === 'authenticated');
	return useQuery({
		queryKey: authKeys.me(),
		queryFn: getOperator,
		enabled: isAuthenticated,
	});
}
