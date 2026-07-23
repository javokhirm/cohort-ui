import { useState } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	RadioGroup,
	RadioGroupItem,
	Skeleton,
	cn,
} from '@repo/ui';

import { plansKeys } from '@/api/plans/keys';
import { listPlans } from '@/api/plans/plans.queries';
import type { PlanView } from '@/api/plans/types';
import { tenantsKeys } from '@/api/tenants/keys';
import { changeTenantPlan } from '@/api/tenants/tenants.mutations';
import type { BillingInterval } from '@/api/tenants/types';
import { formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';
import { useT } from '@repo/i18n';

function planLimitLabel(
	t: ReturnType<typeof useAppT<'tenants'>>,
	plan: PlanView,
): string {
	const students =
		plan.maxStudents != null
			? t('limits.students', { count: plan.maxStudents })
			: t('limits.studentsUnlimited');
	const branches =
		plan.maxBranches != null
			? t('limits.branches', { count: plan.maxBranches })
			: t('limits.branchesUnlimited');
	return `${students} · ${branches}`;
}

function annualSavingsPct(plan: PlanView): number | null {
	if (plan.priceMonthly === 0 || plan.priceAnnual === 0) return null;
	const pct = Math.round(
		((plan.priceMonthly * 12 - plan.priceAnnual) / (plan.priceMonthly * 12)) * 100,
	);
	return pct > 0 ? pct : null;
}

interface ChangePlanDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: number;
	currentTierId: number | null;
	currentBillingInterval: BillingInterval | null;
}

export function ChangePlanDialog({
	open,
	onOpenChange,
	tenantId,
	currentTierId,
	currentBillingInterval,
}: ChangePlanDialogProps) {
	const t = useAppT('tenants');
	const ts = useAppT('subscriptions');
	const tc = useT('common');
	const [step, setStep] = useState<'select' | 'confirm'>('select');
	const [billingInterval, setBillingInterval] = useState<BillingInterval>(
		currentBillingInterval ?? 'MONTHLY',
	);
	const [selectedPlanId, setSelectedPlanId] = useState<number | null>(currentTierId);

	const queryClient = useQueryClient();

	const { data: plansPage, isLoading: plansLoading } = useQuery({
		queryKey: plansKeys.list({ isActive: true }),
		queryFn: () => listPlans({ isActive: true, limit: 100 }),
		enabled: open,
	});
	const plans = plansPage?.rows ?? [];

	const mutation = useMutation({
		mutationFn: () =>
			changeTenantPlan(tenantId, {
				subscriptionTierId: selectedPlanId!,
				billingInterval,
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(tenantId),
			});
			onOpenChange(false);
		},
	});

	function handleOpenChange(next: boolean) {
		if (!next) {
			setStep('select');
			mutation.reset();
		}
		onOpenChange(next);
	}

	const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
	const currentPlan = plans.find((p) => p.id === currentTierId) ?? null;

	const isUnchanged =
		selectedPlanId === currentTierId &&
		billingInterval === (currentBillingInterval ?? 'MONTHLY');

	function priceFor(plan: PlanView) {
		return billingInterval === 'ANNUAL' ? plan.priceAnnual : plan.priceMonthly;
	}

	const priceSuffix = billingInterval === 'ANNUAL' ? '/yr' : '/mo';

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[560px]">
				{step === 'select' ? (
					<>
						<DialogHeader>
							<DialogTitle>{ts('changePlanTitle')}</DialogTitle>
							<DialogDescription>
								{ts('changePlanDescription')}
							</DialogDescription>
						</DialogHeader>

						<div className="flex justify-center">
							<div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1">
								{(['MONTHLY', 'ANNUAL'] as const).map((interval) => (
									<button
										key={interval}
										type="button"
										onClick={() => setBillingInterval(interval)}
										className={cn(
											'rounded-md px-5 py-1.5 text-sm font-medium transition-all',
											billingInterval === interval
												? 'bg-background text-foreground shadow-sm'
												: 'text-muted-foreground hover:text-foreground',
										)}
									>
										{interval === 'MONTHLY'
											? ts('monthly')
											: ts('annual')}
									</button>
								))}
							</div>
						</div>

						<RadioGroup
							value={selectedPlanId != null ? String(selectedPlanId) : ''}
							onValueChange={(v) => setSelectedPlanId(Number(v))}
							className="gap-2.5"
						>
							{plansLoading ? (
								Array.from({ length: 3 }).map((_, i) => (
									<Skeleton
										key={i}
										className="h-[72px] w-full rounded-lg"
									/>
								))
							) : plans.length === 0 ? (
								<p className="py-6 text-center text-sm text-muted-foreground">
									{ts('noActivePlans')}
								</p>
							) : (
								plans.map((plan) => {
									const selected = selectedPlanId === plan.id;
									const isCurrent = plan.id === currentTierId;
									const price = priceFor(plan);
									const savings =
										billingInterval === 'ANNUAL'
											? annualSavingsPct(plan)
											: null;

									return (
										<Label
											key={plan.id}
											className={cn(
												'flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3.5 transition-colors',
												selected
													? 'border-primary bg-primary/5'
													: 'border-border hover:border-muted-foreground/40',
											)}
										>
											<RadioGroupItem
												value={String(plan.id)}
												className="sr-only"
											/>
											<div className="flex flex-col gap-0.5">
												<div className="flex items-center gap-2">
													<span className="text-sm font-semibold">
														{plan.name}
													</span>
													{isCurrent && (
														<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
															{ts('current')}
														</span>
													)}
													{savings != null && (
														<span className="rounded-full bg-tone-green-bg px-2 py-0.5 text-[11px] font-medium text-tone-green-fg">
															{ts('savePercent', {
																percent: savings,
															})}
														</span>
													)}
												</div>
												<p className="text-xs text-muted-foreground">
													{planLimitLabel(t, plan)}
												</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="text-right">
													<p className="text-sm font-semibold tabular-nums">
														{price === 0
															? ts('custom')
															: `${formatPrice(price)} UZS`}
													</p>
													{price > 0 && (
														<p className="text-xs text-muted-foreground">
															{priceSuffix}
														</p>
													)}
												</div>
												<div
													className={cn(
														'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
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
										</Label>
									);
								})
							)}
						</RadioGroup>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => handleOpenChange(false)}
							>
								{tc('action.cancel')}
							</Button>
							<Button
								disabled={
									selectedPlanId === null || plansLoading || isUnchanged
								}
								onClick={() => setStep('confirm')}
							>
								{t('onboarding.continue')}
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>{ts('confirmTitle')}</DialogTitle>
							<DialogDescription>
								{ts('confirmDescription')}
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-muted/30 px-5 py-4">
								<div className="text-center">
									<p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
										{ts('from')}
									</p>
									<p className="text-sm font-semibold">
										{currentPlan?.name ?? ts('noPlan')}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{currentBillingInterval === 'ANNUAL'
											? ts('annualBilling')
											: ts('monthlyBilling')}
									</p>
								</div>
								<div className="text-lg text-muted-foreground">→</div>
								<div className="text-center">
									<p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
										{ts('to')}
									</p>
									<p className="text-sm font-semibold text-primary">
										{selectedPlan?.name}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{billingInterval === 'ANNUAL'
											? ts('annualBilling')
											: ts('monthlyBilling')}
									</p>
								</div>
							</div>

							{selectedPlan && (
								<div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
									<span className="text-sm text-muted-foreground">
										{ts('newCharge')}
									</span>
									<span className="text-base font-bold tabular-nums">
										{priceFor(selectedPlan) === 0
											? ts('customPricing')
											: `${formatPrice(priceFor(selectedPlan))} UZS${priceSuffix}`}
									</span>
								</div>
							)}

							<p className="text-xs text-muted-foreground">
								{ts('prorationNote')}
							</p>
						</div>

						{mutation.isError && (
							<p className="text-sm text-destructive">
								{mutation.error instanceof Error
									? mutation.error.message
									: ts('applyError')}
							</p>
						)}

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setStep('select')}
								disabled={mutation.isPending}
							>
								{t('back')}
							</Button>
							<Button
								disabled={mutation.isPending}
								onClick={() => mutation.mutate()}
							>
								{mutation.isPending
									? ts('applying')
									: ts('confirmChange')}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
