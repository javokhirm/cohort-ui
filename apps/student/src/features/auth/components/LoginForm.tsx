import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { isApiError } from '@repo/api-client';
import {
	Alert,
	AlertDescription,
	Button,
	FieldGroup,
	Form,
	FormInput,
	FormPasswordInput,
	LocaleSwitcher,
	Spinner,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { loginSchema, type LoginInput } from '../schemas';
import { useLogin } from '../hooks';
import { useLocalePreference } from '@/hooks/useLocalePreference';

interface LoginFormProps {
	onAuthenticated: () => void;
}

/**
 * Single-step student sign-in: student code + password → POST
 * /public/auth/student/login. Router-agnostic; navigation happens via
 * `onAuthenticated`. Student credentials (student code) don't fit the shared
 * `@repo/ui` `LoginCard`, which is phone-only for the staff consoles, so this
 * app owns its own sign-in form rather than forcing that shape.
 */
export function LoginForm({ onAuthenticated }: LoginFormProps) {
	const t = useT('auth');
	const loginMutation = useLogin();
	const { locale, changeLocale } = useLocalePreference();
	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { studentCode: '', password: '' },
	});

	async function onSubmit(values: LoginInput) {
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
		<div className="relative flex min-h-svh flex-col items-center justify-center bg-[radial-gradient(130%_55%_at_50%_-8%,var(--sidebar-accent)_0%,var(--background)_62%)] px-5 py-9">
			<div className="absolute right-5 top-5">
				<LocaleSwitcher locale={locale} onLocaleChange={changeLocale} />
			</div>
			<div className="w-full max-w-[362px]">
				<div className="mb-5.5 flex flex-col items-center text-center">
					<div className="flex size-13.5 items-center justify-center rounded-[15px] bg-linear-to-br from-primary to-primary/70 text-[23px] font-bold text-primary-foreground shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
						C
					</div>
					<p className="mt-3.5 text-[20px] font-bold tracking-tight text-foreground">
						Cohort
					</p>
					<p className="mt-0.5 font-mono text-[12.5px] text-muted-foreground">
						{t('studentConsole')}
					</p>
					<span className="mt-2.5 inline-flex items-center gap-1.5 rounded-[7px] bg-sidebar-accent px-2.5 py-1 text-[11px] font-semibold text-sidebar-accent-foreground [&>svg]:size-3.5">
						<GraduationCap />
						{t('studentSignIn')}
					</span>
				</div>

				<div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
							<FieldGroup className="gap-3.5">
								<FormInput
									control={form.control}
									name="studentCode"
									label={t('studentCode')}
									autoComplete="username"
									placeholder={t('studentCodePlaceholder')}
								/>
								<FormPasswordInput
									control={form.control}
									name="password"
									label={t('password')}
									autoComplete="current-password"
									placeholder="••••••••••"
								/>

								{serverError && (
									<Alert variant="destructive">
										<AlertDescription>{serverError}</AlertDescription>
									</Alert>
								)}

								<Button
									type="submit"
									disabled={loginMutation.isPending}
									className="h-11.5 w-full shadow-[0_6px_16px_-5px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
								>
									{loginMutation.isPending && (
										<Spinner className="size-4 text-primary-foreground" />
									)}
									{loginMutation.isPending
										? t('signingIn')
										: t('signIn')}
								</Button>
							</FieldGroup>
						</form>
					</Form>
				</div>

				<p className="mt-4.5 text-center text-[11.5px] text-muted-foreground">
					{t('poweredBy')}{' '}
					<span className="font-semibold text-foreground">Cohort</span>
				</p>
			</div>
		</div>
	);
}
