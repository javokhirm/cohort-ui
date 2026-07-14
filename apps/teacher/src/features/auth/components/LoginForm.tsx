import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import { LoginCard, type LoginCredentials } from '@repo/ui';

import { loginSchema } from '../schemas';
import { useLogin } from '../hooks';
import { isRoleNotAllowedError } from '@/lib/auth/errors';

interface LoginFormProps {
	onAuthenticated: () => void;
}

/**
 * Single-step teacher sign-in: phone + password → POST /public/auth/login.
 * Router-agnostic; navigation happens via `onAuthenticated`. The card itself is
 * the shared `@repo/ui` `LoginCard` — this owns only the mutation and session.
 */
export function LoginForm({ onAuthenticated }: LoginFormProps) {
	const loginMutation = useLogin();

	async function onSubmit(values: LoginCredentials) {
		try {
			await loginMutation.mutateAsync(values);
			onAuthenticated();
		} catch {
			/* surfaced via loginMutation.error below */
		}
	}

	const serverError = loginMutation.isError
		? isRoleNotAllowedError(loginMutation.error) || isApiError(loginMutation.error)
			? loginMutation.error.message
			: 'Invalid phone number or password.'
		: null;

	return (
		<LoginCard
			brand={{
				initial: 'C',
				title: 'Cohort',
				subtitle: 'Teacher console',
				badge: { icon: <GraduationCap />, label: 'Teacher sign-in' },
			}}
			resolver={zodResolver(loginSchema)}
			onSubmit={onSubmit}
			isPending={loginMutation.isPending}
			error={serverError}
		/>
	);
}
