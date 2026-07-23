import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import { LoginCard, LocaleSwitcher, type LoginCredentials } from '@repo/ui';
import { useT } from '@repo/i18n';

import { loginSchema } from '../schemas';
import { useLogin } from '../hooks';
import { isRoleNotAllowedError } from '@/lib/auth/errors';
import { useLocalePreference } from '@/hooks/useLocalePreference';

interface LoginFormProps {
	onAuthenticated: () => void;
}

/**
 * Single-step teacher sign-in: phone + password → POST /public/auth/login.
 * Router-agnostic; navigation happens via `onAuthenticated`. The card itself is
 * the shared `@repo/ui` `LoginCard` — this owns only the mutation and session.
 */
export function LoginForm({ onAuthenticated }: LoginFormProps) {
	const t = useT('auth');
	const loginMutation = useLogin();
	const { locale, changeLocale } = useLocalePreference();

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
			: t('invalidCredentials')
		: null;

	return (
		<LoginCard
			brand={{
				initial: 'C',
				title: 'Cohort',
				subtitle: t('teacherConsole'),
				badge: { icon: <GraduationCap />, label: t('teacherSignIn') },
			}}
			resolver={zodResolver(loginSchema)}
			onSubmit={onSubmit}
			isPending={loginMutation.isPending}
			error={serverError}
			labels={{
				phone: t('phone'),
				password: t('password'),
				signIn: t('signIn'),
				signingIn: t('signingIn'),
				poweredBy: t('poweredBy'),
			}}
			topRight={<LocaleSwitcher locale={locale} onLocaleChange={changeLocale} />}
		/>
	);
}
