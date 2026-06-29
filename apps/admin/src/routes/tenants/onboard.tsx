// TODO: wire to POST /admin/tenants once the backend onboarding endpoint is ready.

import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { Check, Info } from 'lucide-react';

import { Button, Card, CardContent, Input, Label, cn } from '@repo/ui';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type PlanId = 'starter' | 'growth' | 'scale';

type FormData = {
	centerName: string;
	city: string;
	subdomain: string;
	ownerName: string;
	ownerPhone: string;
	planId: PlanId | '';
	branchName: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_LABELS = ['Business', 'Subdomain', 'Owner', 'Plan', 'Branch', 'Review'];

type PlanOption = { id: PlanId; label: string; limits: string; price: number };

const PLANS: PlanOption[] = [
	{
		id: 'starter',
		label: 'Starter',
		limits: '1 branch · 300 students',
		price: 900_000,
	},
	{
		id: 'growth',
		label: 'Growth',
		limits: '5 branches · 1,500 students',
		price: 2_400_000,
	},
	{
		id: 'scale',
		label: 'Scale',
		limits: 'Unlimited branches · Unlimited students',
		price: 4_800_000,
	},
];

const EMPTY_FORM: FormData = {
	centerName: '',
	city: 'Tashkent',
	subdomain: '',
	ownerName: '',
	ownerPhone: '',
	planId: '',
	branchName: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUZS(amount: number): string {
	return new Intl.NumberFormat('ru-RU').format(amount) + ' UZS';
}

function planOption(id: PlanId): PlanOption {
	return PLANS.find((p) => p.id === id)!;
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
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-name">Full name</Label>
						<Input
							id="owner-name"
							value={data.ownerName}
							onChange={(e) => onChange({ ownerName: e.target.value })}
							placeholder="e.g. Aziz Yusupov"
						/>
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
						<p className="text-xs text-muted-foreground">
							An SMS invite with a temporary password will be sent on
							creation.
						</p>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button
						onClick={onNext}
						disabled={!data.ownerName.trim() || !data.ownerPhone.trim()}
					>
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
					<p className="text-base font-semibold">Select a plan tier</p>
					<p className="text-sm text-muted-foreground">
						The center starts with a 14-day trial of the selected tier.
					</p>
				</div>

				<div className="flex flex-col gap-3">
					{PLANS.map((plan) => {
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
									<p className="text-sm font-semibold">{plan.label}</p>
									<p className="text-xs text-muted-foreground">
										{plan.limits}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-sm font-semibold tabular-nums">
										{formatUZS(plan.price)}
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
					})}
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button onClick={onNext} disabled={!data.planId}>
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

				<div className="flex flex-col gap-1.5">
					<Label htmlFor="branch-name">Branch name</Label>
					<Input
						id="branch-name"
						value={data.branchName}
						onChange={(e) => onChange({ branchName: e.target.value })}
						placeholder="e.g. Main Campus"
					/>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button onClick={onNext} disabled={!data.branchName.trim()}>
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
}: {
	data: FormData;
	onBack: () => void;
	onSubmit: () => void;
}) {
	const plan = planOption(data.planId as PlanId);

	const rows: { label: string; value: string }[] = [
		{ label: 'Center name', value: data.centerName },
		{ label: 'Subdomain', value: `${data.subdomain}.educore.uz` },
		{ label: 'Owner', value: data.ownerName },
		{ label: 'Owner phone', value: data.ownerPhone },
		{
			label: 'Plan',
			value: `${plan.label} (14-day trial)`,
		},
		{ label: 'Initial branch', value: data.branchName },
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
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button
						className="bg-green-600 text-white hover:bg-green-700"
						onClick={onSubmit}
					>
						Create tenant
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function OnboardTenantPage() {
	const navigate = useNavigate();
	const [step, setStep] = useState<Step>(1);
	const [form, setForm] = useState<FormData>(EMPTY_FORM);

	function patch(update: Partial<FormData>) {
		setForm((prev) => ({ ...prev, ...update }));
	}

	function next() {
		setStep((s) => Math.min(s + 1, 6) as Step);
	}

	function back() {
		setStep((s) => Math.max(s - 1, 1) as Step);
	}

	function handleSubmit() {
		// TODO: call POST /admin/tenants mutation and redirect on success
		void navigate({ to: '/tenants' });
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
				<PlanStep data={form} onChange={patch} onBack={back} onNext={next} />
			)}
			{step === 5 && (
				<BranchStep data={form} onChange={patch} onBack={back} onNext={next} />
			)}
			{step === 6 && (
				<ReviewStep data={form} onBack={back} onSubmit={handleSubmit} />
			)}
		</div>
	);
}
