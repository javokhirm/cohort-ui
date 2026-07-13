import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { isApiError } from '@repo/api-client';
import {
	Alert,
	AlertDescription,
	Button,
	FieldGroup,
	Form,
	FormPasswordInput,
	FormPhoneInput,
	Spinner,
} from '@repo/ui';

import { loginSchema, type LoginInput } from '../schemas';
import { useLogin } from '../hooks';

interface LoginFormProps {
	onAuthenticated: () => void;
}

/**
 * Static product branding. The staff console is served from one fixed host for
 * every education center, so the center itself is
 * only known after login — the card brands Cohort, not a tenant.
 */
function CohortBrand() {
	return (
		<div className="flex flex-col items-center text-center">
			<div className="flex size-13 items-center justify-center rounded-[14px] bg-linear-to-br from-primary to-primary/70 text-[22px] font-bold text-primary-foreground shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--color-primary)_50%,transparent)]">
				C
			</div>
			<p className="mt-3.5 text-[19px] font-bold tracking-tight text-foreground">
				Cohort
			</p>
			<p className="mt-0.5 font-mono text-[12.5px] text-muted-foreground">
				Staff console
			</p>
		</div>
	);
}

/**
 * Single-step staff sign-in: phone + password → POST /public/auth/login.
 * Router-agnostic; navigation happens via `onAuthenticated`.
 */
export function LoginForm({ onAuthenticated }: LoginFormProps) {
	const loginMutation = useLogin();

	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { phone: '', password: '' },
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
			: 'Invalid phone number or password.'
		: null;

	return (
		<div className="flex min-h-svh items-center justify-center bg-[radial-gradient(1200px_600px_at_50%_-10%,#eef2ff_0%,#f1f5f9_55%)] px-6 py-10">
			<div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-[0_12px_40px_-12px_rgba(15,23,42,0.18)]">
				<div className="mb-6">
					<CohortBrand />
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
						<FieldGroup>
							<FormPhoneInput
								control={form.control}
								name="phone"
								label="Phone number"
								autoComplete="username"
							/>
							<FormPasswordInput
								control={form.control}
								name="password"
								label="Password"
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
								className="w-full shadow-[0_4px_12px_-3px_color-mix(in_srgb,var(--color-primary)_40%,transparent)]"
								disabled={loginMutation.isPending}
							>
								{loginMutation.isPending && (
									<Spinner className="size-4 text-primary-foreground" />
								)}
								Sign in
							</Button>
						</FieldGroup>
					</form>
				</Form>

				<p className="mt-6 border-t border-border pt-4 text-center text-[11.5px] text-muted-foreground">
					Powered by{' '}
					<span className="font-semibold text-foreground">Cohort</span>
				</p>
			</div>
		</div>
	);
}
