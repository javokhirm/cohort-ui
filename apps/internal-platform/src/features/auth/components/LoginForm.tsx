import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import {
	Alert,
	AlertDescription,
	Button,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormPasswordInput,
	Input,
	LocaleSwitcher,
	OtpInput,
	Spinner,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { credentialsSchema, otpSchema, type CredentialsInput } from '../schemas';
import { useRequestOtp, useVerifyOtp } from '../hooks';
import { useLocalePreference } from '@/hooks/useLocalePreference';
import { useAppT } from '@/locales';

function errorMessage(error: unknown, fallback: string): string {
	return isApiError(error) ? error.message : fallback;
}

/** Cohort "E" mark + wordmark + INTERNAL badge — shared by the rail and the mobile header. */
function BrandLockup({ compact = false }: { compact?: boolean }) {
	const t = useAppT('shell');

	return (
		<div className="flex items-center gap-2.5">
			<span
				className={`flex items-center justify-center rounded-[9px] bg-linear-to-br from-primary to-primary/60 font-extrabold text-primary-foreground ${
					compact ? 'size-8 text-sm' : 'size-8.5 text-base'
				}`}
			>
				E
			</span>
			<span className="text-[15px] font-bold tracking-tight text-foreground">
				{t('brand')}
			</span>
			<span className="rounded-[5px] border border-tone-amber-fg/25 bg-tone-amber-bg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-tone-amber-fg">
				{t('brandSurface')}
			</span>
		</div>
	);
}

/**
 * "Platform Console" marketing rail shown beside the form on large screens.
 * Follows the app theme; the indigo wash reads on both palettes.
 */
function ConsoleRail() {
	const t = useT('auth');
	return (
		<aside className="relative hidden overflow-hidden border-r border-border bg-background lg:flex lg:w-[46%] lg:max-w-140 lg:flex-col lg:justify-between lg:px-11 lg:py-10">
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(700px_380px_at_80%_-5%,var(--color-primary)_0%,transparent_60%)] opacity-40"
			/>
			<div className="relative">
				<BrandLockup />
			</div>
			<div className="relative">
				<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
					{t('operator.railKicker')}
				</p>
				<h2 className="mt-3.5 text-[30px] font-extrabold leading-[1.15] tracking-tight text-foreground">
					{t('operator.railHeadline')}
				</h2>
				<p className="mt-3.5 max-w-95 text-sm leading-relaxed text-muted-foreground">
					{t('operator.railBody')}
				</p>
			</div>
			<div className="relative flex items-center gap-4.5 text-xs text-muted-foreground">
				<span className="flex items-center gap-1.5">
					<Lock className="size-3.5" />
					{t('operator.twoFactorEnforced')}
				</span>
				<span className="flex items-center gap-1.5">
					<ShieldCheck className="size-3.5" />
					{t('operator.auditedAccess')}
				</span>
			</div>
		</aside>
	);
}

interface LoginFormProps {
	/** Called after a successful OTP verification (the session is already set). */
	onAuthenticated: () => void;
}

/**
 * Two-step super-admin sign in (matches the backend contract):
 *   1. email + password  → `POST /public/super-admin/auth/login`  (emails a 6-digit OTP)
 *   2. 6-digit code      → `POST /public/super-admin/auth/verify-otp`  → JWT pair
 * Router-agnostic: navigation happens via `onAuthenticated`.
 */
export function LoginForm({ onAuthenticated }: LoginFormProps) {
	const t = useT('auth');
	const tCommon = useT('common');
	const { locale, changeLocale } = useLocalePreference();

	const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [code, setCode] = useState('');
	const [otpFormatError, setOtpFormatError] = useState<string | null>(null);

	const requestOtp = useRequestOtp();
	const verifyOtp = useVerifyOtp();

	const credForm = useForm<CredentialsInput>({
		resolver: zodResolver(credentialsSchema),
		defaultValues: { email: '', password: '' },
	});

	async function onSubmitCredentials(values: CredentialsInput) {
		try {
			await requestOtp.mutateAsync(values);
			setEmail(values.email);
			setPassword(values.password);
			setCode('');
			setOtpFormatError(null);
			verifyOtp.reset();
			setStep('otp');
		} catch {
			/* surfaced via requestOtp.error below */
		}
	}

	async function onSubmitOtp(event: React.FormEvent) {
		event.preventDefault();
		const parsed = otpSchema.safeParse({ code });
		if (!parsed.success) {
			setOtpFormatError(
				parsed.error.issues[0]?.message ?? t('operator.invalidCode'),
			);
			return;
		}
		setOtpFormatError(null);
		try {
			await verifyOtp.mutateAsync({ email, code });
			onAuthenticated();
		} catch {
			/* surfaced via verifyOtp.error below */
		}
	}

	async function resendCode() {
		setCode('');
		setOtpFormatError(null);
		verifyOtp.reset();
		try {
			await requestOtp.mutateAsync({ email, password });
		} catch {
			/* surfaced via requestOtp.error below */
		}
	}

	function backToCredentials() {
		setStep('credentials');
		setCode('');
		setOtpFormatError(null);
		verifyOtp.reset();
	}

	const otpError =
		otpFormatError ??
		(verifyOtp.isError
			? errorMessage(verifyOtp.error, t('operator.invalidOrExpired'))
			: null);

	return (
		<div className="flex min-h-svh flex-col bg-background lg:flex-row">
			<ConsoleRail />

			{/* Right panel — slightly elevated surface to separate from the dark rail */}
			<main className="relative flex flex-1 items-center justify-center bg-card px-6 py-10">
				<div className="absolute right-5 top-5">
					<LocaleSwitcher locale={locale} onLocaleChange={changeLocale} />
				</div>
				<div className="w-full max-w-95">
					<div className="mb-8 lg:hidden">
						<BrandLockup compact />
					</div>

					{step === 'credentials' ? (
						<div className="animate-in fade-in-0 zoom-in-[0.98] duration-300">
							<span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
								<ShieldCheck className="size-3.5" />
								{t('operator.badge')}
							</span>
							<h1 className="mt-4.5 text-[23px] font-extrabold tracking-tight text-foreground">
								{t('operator.title')}
							</h1>
							<p className="mt-1.5 text-[13.5px] text-muted-foreground">
								{t('operator.subtitle')}
							</p>

							<Form {...credForm}>
								<form
									onSubmit={credForm.handleSubmit(onSubmitCredentials)}
									className="mt-5.5"
									noValidate
								>
									<FieldGroup>
										<FormField
											control={credForm.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>
														{t('workEmail')}
													</FormLabel>
													<FormControl>
														<Input
															type="email"
															autoComplete="username"
															placeholder="you@cohort.uz"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormPasswordInput
											control={credForm.control}
											label={t('password')}
											name="password"
											autoComplete="current-password"
											placeholder="••••••••••"
										/>
										{requestOtp.isError && (
											<Alert variant="destructive">
												<AlertDescription>
													{errorMessage(
														requestOtp.error,
														t('couldNotSignIn'),
													)}
												</AlertDescription>
											</Alert>
										)}
										<Button
											type="submit"
											className="w-full shadow-[0_4px_12px_-3px_var(--color-primary)]/30"
											disabled={requestOtp.isPending}
										>
											{requestOtp.isPending && (
												<Spinner className="size-4 text-primary-foreground" />
											)}
											{t('continue')}
										</Button>
									</FieldGroup>
								</form>
							</Form>
						</div>
					) : (
						<div className="animate-in fade-in-0 zoom-in-[0.98] duration-300">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="-ml-2 mb-4 h-auto px-2 py-1 text-muted-foreground"
								onClick={backToCredentials}
							>
								<ArrowLeft className="size-4" />
								{tCommon('action.back')}
							</Button>
							<span className="flex size-11.5 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
								<Lock className="size-5" />
							</span>
							<h1 className="mt-3.5 text-[22px] font-extrabold tracking-tight text-foreground">
								{t('operator.twoFactorTitle')}
							</h1>
							<p className="mt-1.5 text-[13.5px] text-muted-foreground">
								{t('operator.otpSentTo', { email })}
							</p>

							<form onSubmit={onSubmitOtp} className="mt-5.5">
								<FieldGroup>
									<OtpInput
										value={code}
										onChange={setCode}
										autoFocus
										error={!!otpError}
										aria-label={t('operator.oneTimeCode')}
									/>
									{otpError && (
										<Alert variant="destructive">
											<AlertDescription>
												{otpError}
											</AlertDescription>
										</Alert>
									)}
									<Button
										type="submit"
										className="w-full"
										disabled={verifyOtp.isPending}
									>
										{verifyOtp.isPending && (
											<Spinner className="size-4 text-primary-foreground" />
										)}
										{t('operator.verifyAndContinue')}
									</Button>
									<p className="text-center text-[12.5px] text-muted-foreground">
										{t('operator.noCode')}{' '}
										<Button
											type="button"
											variant="link"
											size="sm"
											className="h-auto p-0"
											onClick={resendCode}
											disabled={requestOtp.isPending}
										>
											{t('otp.resend')}
										</Button>
									</p>
								</FieldGroup>
							</form>
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
