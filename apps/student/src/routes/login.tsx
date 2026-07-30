import { useRouter, useSearch } from '@tanstack/react-router';

import { LoginForm } from '@/features/auth/components/LoginForm';

export function LoginRoute() {
	const router = useRouter();
	const { next } = useSearch({ from: '/login' });

	return <LoginForm onAuthenticated={() => router.history.push(next ?? '/')} />;
}
