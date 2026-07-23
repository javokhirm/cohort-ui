import * as React from 'react';
import { useForm, type Resolver } from 'react-hook-form';

import { Alert, AlertDescription } from '../alert';
import { Button } from '../button';
import { FieldGroup, Form } from '../form';
import { Spinner } from '../spinner';
import { FormPasswordInput } from './form-password-input';
import { FormPhoneInput } from './form-phone-input';

/** Phone + password — the credential pair every staff surface signs in with. */
export interface LoginCredentials {
	phone: string;
	password: string;
}

export interface LoginCardBrand {
	/** Single character rendered in the gradient logo tile (e.g. "C"). */
	initial: string;
	title: string;
	/** Monospace line under the title — the console's host or name. */
	subtitle: string;
	/** Tinted pill naming the surface being signed into (e.g. "Teacher sign-in"). */
	badge?: {
		icon?: React.ReactNode;
		label: string;
	};
}

/**
 * Translatable copy for the card. Injected as strings — this package stays free
 * of `@repo/i18n` (they are peers in the dependency graph), so each app passes
 * its own `useT('auth')` values and the defaults keep Storybook/tests English.
 */
export interface LoginCardLabels {
	phone: string;
	password: string;
	signIn: string;
	signingIn: string;
	poweredBy: string;
}

const DEFAULT_LABELS: LoginCardLabels = {
	phone: 'Phone number',
	password: 'Password',
	signIn: 'Sign in',
	signingIn: 'Signing in…',
	poweredBy: 'Powered by',
};

interface LoginCardProps {
	brand: LoginCardBrand;
	/**
	 * Validation for the credential pair. Injected so this package stays free of
	 * zod — each app passes `zodResolver(loginSchema)` built on the shared
	 * `UZ_PHONE_REGEX`.
	 */
	resolver: Resolver<LoginCredentials>;
	onSubmit: (values: LoginCredentials) => Promise<void> | void;
	isPending?: boolean;
	/** Server-side failure to surface above the submit button. */
	error?: string | null;
	/** Translated copy; anything omitted falls back to the English default. */
	labels?: Partial<LoginCardLabels>;
	/** Fixed to the top-right corner — used for the pre-login locale switcher. */
	topRight?: React.ReactNode;
}

/**
 * Single-step staff sign-in shared by every Cohort console (MANAGE, TEACH).
 * Purely presentational: the caller owns the mutation, the session, and where
 * to navigate afterwards — this renders the credential form and reports values.
 *
 * The staff consoles are each served from one fixed host for every education
 * center, so the center is only known *after* login — the card brands Cohort
 * and the surface, never a tenant.
 */
export function LoginCard({
	brand,
	resolver,
	onSubmit,
	isPending = false,
	error = null,
	labels,
	topRight,
}: LoginCardProps) {
	const l = { ...DEFAULT_LABELS, ...labels };
	const form = useForm<LoginCredentials>({
		resolver,
		defaultValues: { phone: '', password: '' },
	});

	return (
		<div className="relative flex min-h-svh flex-col items-center justify-center bg-[radial-gradient(130%_55%_at_50%_-8%,var(--sidebar-accent)_0%,var(--background)_62%)] px-5 py-9">
			{topRight && <div className="absolute right-5 top-5">{topRight}</div>}
			<div className="w-full max-w-[362px]">
				<div className="mb-5.5 flex flex-col items-center text-center">
					<div className="flex size-13.5 items-center justify-center rounded-[15px] bg-linear-to-br from-primary to-primary/70 text-[23px] font-bold text-primary-foreground shadow-[0_8px_20px_-6px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
						{brand.initial}
					</div>
					<p className="mt-3.5 text-[20px] font-bold tracking-tight text-foreground">
						{brand.title}
					</p>
					<p className="mt-0.5 font-mono text-[12.5px] text-muted-foreground">
						{brand.subtitle}
					</p>
					{brand.badge && (
						<span className="mt-2.5 inline-flex items-center gap-1.5 rounded-[7px] bg-sidebar-accent px-2.5 py-1 text-[11px] font-semibold text-sidebar-accent-foreground [&>svg]:size-3.5">
							{brand.badge.icon}
							{brand.badge.label}
						</span>
					)}
				</div>

				<div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} noValidate>
							<FieldGroup className="gap-3.5">
								<FormPhoneInput
									control={form.control}
									name="phone"
									label={l.phone}
									autoComplete="username"
								/>
								<FormPasswordInput
									control={form.control}
									name="password"
									label={l.password}
									autoComplete="current-password"
									placeholder="••••••••••"
								/>

								{error && (
									<Alert variant="destructive">
										<AlertDescription>{error}</AlertDescription>
									</Alert>
								)}

								<Button
									type="submit"
									disabled={isPending}
									className="h-11.5 w-full shadow-[0_6px_16px_-5px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]"
								>
									{isPending && (
										<Spinner className="size-4 text-primary-foreground" />
									)}
									{isPending ? l.signingIn : l.signIn}
								</Button>
							</FieldGroup>
						</form>
					</Form>
				</div>

				<p className="mt-4.5 text-center text-[11.5px] text-muted-foreground">
					{l.poweredBy}{' '}
					<span className="font-semibold text-foreground">Cohort</span>
				</p>
			</div>
		</div>
	);
}
