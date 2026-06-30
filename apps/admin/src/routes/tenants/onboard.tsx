import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Info } from 'lucide-react';

import { Button, Card, CardContent, Input, Label, Skeleton, cn } from '@repo/ui';

import { plansKeys } from '@/features/plans/api/keys';
import { listPlans } from '@/features/plans/api/plans.queries';
import type { PlanView } from '@/features/plans/api/types';
import { tenantsKeys } from '@/features/tenants/api/keys';
import { onboardTenant } from '@/features/tenants/api/tenants.mutations';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6;

type FormData = {
	centerName: string;
	city: string;
	subdomain: string;
	ownerFirstName: string;
	ownerLastName: string;
	ownerPhone: string;
	ownerEmail: string;
	ownerPassword: string;
	planId: number | null;
	branchName: string;
	branchCode: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Business', 'Subdomain', 'Owner', 'Plan', 'Branch', 'Review'];

const EMPTY_FORM: FormData = {
	centerName: '',
	city: 'Tashkent',
	subdomain: '',
	ownerFirstName: '',
	ownerLastName: '',
	ownerPhone: '',
	ownerEmail: '',
	ownerPassword: '',
	planId: null,
	branchName: '',
	branchCode: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUZS(amount: number): string {
	if (amount === 0) return 'Custom pricing';
	return new Intl.NumberFormat('ru-RU').format(amount) + ' UZS';
}

function planLimits(plan: PlanView): string {
	const branches =
		plan.maxBranches === null
			? 'Unlimited branches'
			: `${plan.maxBranches} branch${plan.maxBranches === 1 ? '' : 'es'}`;
	const students =
		plan.maxStudents === null
			? 'Unlimited students'
			: `${plan.maxStudents.toLocaleString('ru-RU')} students`;
	return `${branches} · ${students}`;
}

// ─── StepIndicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
	return (
		<div className="flex w-full items-start">
			{STEP_LABELS.flatMap((label, i) => {
				const n = (i + 1) as Step;
				const done = n < current;
				const active = n === current;

				const circle = (
					<div key={`step-${n}`} className="flex flex-col items-center gap-1.5">
						<div
							className={cn(
								'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors',
								done && 'bg-primary text-primary-foreground',
								active && 'border-2 border-primary text-primary',
								!done &&
									!active &&
									'border-2 border-border text-muted-foreground',
							)}
						>
							{done ? <Check className="size-4" strokeWidth={2.5} /> : n}
						</div>
						<span
							className={cn(
								'hidden text-xs font-medium sm:block',
								active || done
									? 'text-foreground'
									: 'text-muted-foreground',
							)}
						>
							{label}
						</span>
					</div>
				);

				if (i === 0) return [circle];

				return [
					<div
						key={`connector-${i}`}
						className={cn(
							'mt-4 h-px flex-1',
							n <= current ? 'bg-primary' : 'bg-border',
						)}
					/>,
					circle,
				];
			})}
		</div>
	);
}

// ─── Step 1: Business ─────────────────────────────────────────────────────────

function BusinessStep({
	data,
	onChange,
	onNext,
}: {
	data: FormData;
	onChange: (patch: Partial<FormData>) => void;
	onNext: () => void;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Business information</p>
					<p className="text-sm text-muted-foreground">
						Tell us about the education center.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="center-name">Center name</Label>
						<Input
							id="center-name"
							value={data.centerName}
							onChange={(e) => onChange({ centerName: e.target.value })}
							placeholder="e.g. Zabon Language Center"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="city">City</Label>
						<Input
							id="city"
							value={data.city}
							onChange={(e) => onChange({ city: e.target.value })}
							placeholder="e.g. Tashkent"
						/>
					</div>
				</div>

				<div className="flex justify-end">
					<Button onClick={onNext} disabled={!data.centerName.trim()}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Step 2: Subdomain ────────────────────────────────────────────────────────

function SubdomainStep({
	data,
	onChange,
	onBack,
	onNext,
}: {
	data: FormData;
	onChange: (patch: Partial<FormData>) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Choose a subdomain</p>
					<p className="text-sm text-muted-foreground">
						This is where the center's staff and students will sign in.
					</p>
				</div>

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="subdomain">Subdomain</Label>
					<div className="flex rounded-md shadow-sm">
						<Input
							id="subdomain"
							className="rounded-r-none"
							value={data.subdomain}
							onChange={(e) =>
								onChange({
									subdomain: e.target.value
										.toLowerCase()
										.replace(/[^a-z0-9-]/g, ''),
								})
							}
							placeholder="zabon"
						/>
						<span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
							.educore.uz
						</span>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button onClick={onNext} disabled={!data.subdomain.trim()}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Step 3: Owner ────────────────────────────────────────────────────────────

function OwnerStep({
	data,
	onChange,
	onBack,
	onNext,
}: {
	data: FormData;
	onChange: (patch: Partial<FormData>) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	const canProceed =
		data.ownerFirstName.trim() &&
		data.ownerLastName.trim() &&
		data.ownerPhone.trim() &&
		data.ownerPassword.length >= 8;

	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Owner account</p>
					<p className="text-sm text-muted-foreground">
						The first account — receives the OWNER role with full access.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="owner-first-name">First name</Label>
							<Input
								id="owner-first-name"
								value={data.ownerFirstName}
								onChange={(e) =>
									onChange({ ownerFirstName: e.target.value })
								}
								placeholder="Aziz"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="owner-last-name">Last name</Label>
							<Input
								id="owner-last-name"
								value={data.ownerLastName}
								onChange={(e) =>
									onChange({ ownerLastName: e.target.value })
								}
								placeholder="Yusupov"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-phone">Phone number</Label>
						<Input
							id="owner-phone"
							type="tel"
							value={data.ownerPhone}
							onChange={(e) => onChange({ ownerPhone: e.target.value })}
							placeholder="+998 90 123 45 67"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-email">
							Email{' '}
							<span className="text-muted-foreground">(optional)</span>
						</Label>
						<Input
							id="owner-email"
							type="email"
							value={data.ownerEmail}
							onChange={(e) => onChange({ ownerEmail: e.target.value })}
							placeholder="aziz@zabon.uz"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-password">Temporary password</Label>
						<Input
							id="owner-password"
							type="password"
							value={data.ownerPassword}
							onChange={(e) => onChange({ ownerPassword: e.target.value })}
							placeholder="Min. 8 characters"
						/>
						<p className="text-xs text-muted-foreground">
							The owner should change this on first login.
						</p>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button onClick={onNext} disabled={!canProceed}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Step 4: Plan ─────────────────────────────────────────────────────────────

function PlanStep({
	data,
	onChange,
	onBack,
	onNext,
	plans,
	plansLoading,
}: {
	data: FormData;
	onChange: (patch: Partial<FormData>) => void;
	onBack: () => void;
	onNext: () => void;
	plans: PlanView[];
	plansLoading: boolean;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Select a plan tier</p>
					<p className="text-sm text-muted-foreground">
						The center starts with a 14-day trial of the selected tier.
					</p>
				</div>

				<div className="flex flex-col gap-3">
					{plansLoading ? (
						Array.from({ length: 3 }, (_, i) => (
							<Skeleton key={i} className="h-16 w-full rounded-lg" />
						))
					) : plans.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No active plans available. Create one first in Subscription
							Plans.
						</p>
					) : (
						plans.map((plan) => {
							const selected = data.planId === plan.id;
							return (
								<button
									key={plan.id}
									type="button"
									onClick={() => onChange({ planId: plan.id })}
									className={cn(
										'flex w-full items-center justify-between rounded-lg border px-4 py-3.5 text-left transition-colors',
										selected
											? 'border-primary bg-primary/5'
											: 'border-border hover:border-muted-foreground/50',
									)}
								>
									<div>
										<p className="text-sm font-semibold">
											{plan.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{planLimits(plan)}
										</p>
									</div>
									<div className="flex items-center gap-3">
										<span className="text-sm font-semibold tabular-nums">
											{formatUZS(plan.priceMonthly)}
											{plan.priceMonthly > 0 && (
												<span className="text-xs font-normal text-muted-foreground">
													{' '}
													/ mo
												</span>
											)}
										</span>
										<div
											className={cn(
												'flex size-4 items-center justify-center rounded-full border-2 transition-colors',
												selected
													? 'border-primary bg-primary'
													: 'border-muted-foreground/40',
											)}
										>
											{selected && (
												<div className="size-1.5 rounded-full bg-primary-foreground" />
											)}
										</div>
									</div>
								</button>
							);
						})
					)}
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button onClick={onNext} disabled={data.planId === null}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Step 5: Branch ───────────────────────────────────────────────────────────

function BranchStep({
	data,
	onChange,
	onBack,
	onNext,
}: {
	data: FormData;
	onChange: (patch: Partial<FormData>) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Initial branch</p>
					<p className="text-sm text-muted-foreground">
						Every center has at least one branch. You can add more later.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="branch-name">Branch name</Label>
						<Input
							id="branch-name"
							value={data.branchName}
							onChange={(e) => onChange({ branchName: e.target.value })}
							placeholder="e.g. Main Campus"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="branch-code">Branch code</Label>
						<Input
							id="branch-code"
							value={data.branchCode}
							onChange={(e) =>
								onChange({
									branchCode: e.target.value
										.toUpperCase()
										.replace(/[^A-Z0-9-]/g, ''),
								})
							}
							placeholder="e.g. BR-001"
						/>
						<p className="text-xs text-muted-foreground">
							Short unique identifier used in reports.
						</p>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button
						onClick={onNext}
						disabled={!data.branchName.trim() || !data.branchCode.trim()}
					>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Step 6: Review ───────────────────────────────────────────────────────────

function ReviewStep({
	data,
	onBack,
	onSubmit,
	submitting,
	plans,
}: {
	data: FormData;
	onBack: () => void;
	onSubmit: () => void;
	submitting: boolean;
	plans: PlanView[];
}) {
	const plan = plans.find((p) => p.id === data.planId);

	const rows: { label: string; value: string }[] = [
		{ label: 'Center name', value: data.centerName },
		{ label: 'City', value: data.city },
		{ label: 'Subdomain', value: `${data.subdomain}.educore.uz` },
		{ label: 'Owner', value: `${data.ownerFirstName} ${data.ownerLastName}` },
		{ label: 'Owner phone', value: data.ownerPhone },
		...(data.ownerEmail ? [{ label: 'Owner email', value: data.ownerEmail }] : []),
		{ label: 'Plan', value: plan ? `${plan.name} (14-day trial)` : '—' },
		{ label: 'Initial branch', value: data.branchName },
		{ label: 'Branch code', value: data.branchCode },
	];

	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Review & create</p>
					<p className="text-sm text-muted-foreground">
						Confirm the details before provisioning the tenant.
					</p>
				</div>

				<div className="overflow-hidden rounded-lg border border-border">
					{rows.map((row, i) => (
						<div
							key={row.label}
							className={cn(
								'flex items-center justify-between px-4 py-3 text-sm',
								i > 0 && 'border-t border-border',
							)}
						>
							<span className="text-muted-foreground">{row.label}</span>
							<span className="font-medium">{row.value}</span>
						</div>
					))}
				</div>

				<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
					<Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
					<p className="text-sm text-blue-700 dark:text-blue-300">
						A welcome SMS & default role templates will be provisioned
						automatically.
					</p>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack} disabled={submitting}>
						Back
					</Button>
					<Button
						className="bg-green-600 text-white hover:bg-green-700"
						onClick={onSubmit}
						disabled={submitting}
					>
						{submitting ? 'Creating…' : 'Create tenant'}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OnboardTenantPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [step, setStep] = useState<Step>(1);
	const [form, setForm] = useState<FormData>(EMPTY_FORM);

	const { data: plansPage, isLoading: plansLoading } = useQuery({
		queryKey: plansKeys.list({ isActive: true }),
		queryFn: () => listPlans({ isActive: true, limit: 100 }),
	});

	const activePlans = plansPage?.rows ?? [];

	const mutation = useMutation({
		mutationFn: () =>
			onboardTenant({
				name: form.centerName,
				subdomain: form.subdomain,
				city: form.city || undefined,
				subscriptionTierId: form.planId!,
				mainBranch: {
					name: form.branchName,
					code: form.branchCode,
				},
				ownerUser: {
					firstName: form.ownerFirstName,
					lastName: form.ownerLastName,
					phone: form.ownerPhone,
					email: form.ownerEmail || undefined,
					password: form.ownerPassword,
				},
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tenantsKeys.all });
			void navigate({ to: '/tenants' });
		},
	});

	function patch(update: Partial<FormData>) {
		setForm((prev) => ({ ...prev, ...update }));
	}

	function next() {
		setStep((s) => Math.min(s + 1, 6) as Step);
	}

	function back() {
		setStep((s) => Math.max(s - 1, 1) as Step);
	}

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6">
			{/* Cancel link */}
			<Link
				to="/tenants"
				className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← Cancel onboarding
			</Link>

			{/* Page header */}
			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Onboard a new center
				</h1>
				<p className="text-sm text-muted-foreground">
					Set up a new tenant on the EduCore platform.
				</p>
			</div>

			{/* Step indicator */}
			<StepIndicator current={step} />

			{/* Step content */}
			{step === 1 && <BusinessStep data={form} onChange={patch} onNext={next} />}
			{step === 2 && (
				<SubdomainStep data={form} onChange={patch} onBack={back} onNext={next} />
			)}
			{step === 3 && (
				<OwnerStep data={form} onChange={patch} onBack={back} onNext={next} />
			)}
			{step === 4 && (
				<PlanStep
					data={form}
					onChange={patch}
					onBack={back}
					onNext={next}
					plans={activePlans}
					plansLoading={plansLoading}
				/>
			)}
			{step === 5 && (
				<BranchStep data={form} onChange={patch} onBack={back} onNext={next} />
			)}
			{step === 6 && (
				<ReviewStep
					data={form}
					onBack={back}
					onSubmit={() => mutation.mutate()}
					submitting={mutation.isPending}
					plans={activePlans}
				/>
			)}

			{/* Mutation error */}
			{mutation.isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{mutation.error instanceof Error
						? mutation.error.message
						: 'Failed to create tenant. Please try again.'}
				</div>
			)}
		</div>
	);
}
