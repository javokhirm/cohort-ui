import { zodResolver } from '@hookform/resolvers/zod';

import { isApiError } from '@repo/api-client';
import { LoginCard, LocaleSwitcher, type LoginCredentials } from '@repo/ui';
import { useT } from '@repo/i18n';

import { loginSchema } from '../schemas';
import { useLogin } from '../hooks';
import { useLocalePreference } from '@/hooks/useLocalePreference';

interface LoginFormProps {
	onAuthenticated: () => void;
}

/**
 * Single-step staff sign-in: phone + password → POST /public/auth/login.
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
		? isApiError(loginMutation.error)
			? loginMutation.error.message
			: t('invalidCredentials')
		: null;

	return (
		<LoginCard
			brand={{ initial: 'C', title: 'Cohort', subtitle: t('staffConsole') }}
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
