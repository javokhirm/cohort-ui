import { useState } from 'react';

import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { plansKeys } from '@/api/plans/keys';
import { listPlans } from '@/api/plans/plans.queries';
import { tenantsKeys } from '@/api/tenants/keys';
import { onboardTenant } from '@/api/tenants/tenants.mutations';
import { BranchStep } from '@/features/tenants/components/onboarding/BranchStep';
import { BusinessStep } from '@/features/tenants/components/onboarding/BusinessStep';
import { OwnerStep } from '@/features/tenants/components/onboarding/OwnerStep';
import { PlanStep } from '@/features/tenants/components/onboarding/PlanStep';
import { ReviewStep } from '@/features/tenants/components/onboarding/ReviewStep';
import { StepIndicator } from '@/features/tenants/components/onboarding/StepIndicator';
import { SubdomainStep } from '@/features/tenants/components/onboarding/SubdomainStep';
import { EMPTY_FORM } from '@/features/tenants/components/onboarding/types';
import type {
	OnboardFormData,
	OnboardStep,
} from '@/features/tenants/components/onboarding/types';

export function OnboardTenantPage() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [step, setStep] = useState<OnboardStep>(1);
	const [form, setForm] = useState<OnboardFormData>(EMPTY_FORM);

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

	function patch(update: Partial<OnboardFormData>) {
		setForm((prev) => ({ ...prev, ...update }));
	}

	function next() {
		setStep((s) => Math.min(s + 1, 6) as OnboardStep);
	}

	function back() {
		setStep((s) => Math.max(s - 1, 1) as OnboardStep);
	}

	return (
		<div className="mx-auto flex max-w-2xl flex-col gap-6">
			<Link
				to="/tenants"
				className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← Cancel onboarding
			</Link>

			<div>
				<h1 className="text-2xl font-bold tracking-tight">
					Onboard a new center
				</h1>
				<p className="text-sm text-muted-foreground">
					Set up a new tenant on the Cohort platform.
				</p>
			</div>

			<StepIndicator current={step} />

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
