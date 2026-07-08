import { useRouter, useSearch } from '@tanstack/react-router';

import { LoginForm } from '@/features/auth/components/LoginForm';

/**
 * `/login` route wrapper. Reads the `next` search param (set by `requireAuth`)
 * and, once authenticated, restores that destination — or falls back to `/`.
 * `next` is validated to a same-origin path in the route's `validateSearch`,
 * so this cannot be used as an open redirect.
 */
export function LoginRoute() {
	const router = useRouter();
	const { next } = useSearch({ from: '/login' });

	return <LoginForm onAuthenticated={() => router.history.push(next ?? '/')} />;
}
