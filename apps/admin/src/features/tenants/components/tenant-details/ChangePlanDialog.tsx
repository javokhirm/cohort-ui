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

function planLimitLabel(plan: PlanView): string {
	const students =
		plan.maxStudents != null ? `${plan.maxStudents} students` : 'Unlimited students';
	const branches =
		plan.maxBranches != null ? `${plan.maxBranches} branches` : 'Unlimited branches';
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
							<DialogTitle>Change subscription plan</DialogTitle>
							<DialogDescription>
								Choose a plan and billing interval for this tenant.
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
										{interval === 'MONTHLY' ? 'Monthly' : 'Annual'}
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
									No active plans available.
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
															Current
														</span>
													)}
													{savings != null && (
														<span className="rounded-full bg-tone-green-bg px-2 py-0.5 text-[11px] font-medium text-tone-green-fg">
															Save {savings}%
														</span>
													)}
												</div>
												<p className="text-xs text-muted-foreground">
													{planLimitLabel(plan)}
												</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="text-right">
													<p className="text-sm font-semibold tabular-nums">
														{price === 0
															? 'Custom'
															: `${new Intl.NumberFormat('ru-RU').format(price)} UZS`}
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
								Cancel
							</Button>
							<Button
								disabled={
									selectedPlanId === null || plansLoading || isUnchanged
								}
								onClick={() => setStep('confirm')}
							>
								Continue
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Confirm plan change</DialogTitle>
							<DialogDescription>
								Review the details before applying this change.
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-4">
							<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-muted/30 px-5 py-4">
								<div className="text-center">
									<p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
										From
									</p>
									<p className="text-sm font-semibold">
										{currentPlan?.name ?? 'No plan'}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{currentBillingInterval === 'ANNUAL'
											? 'Annual billing'
											: 'Monthly billing'}
									</p>
								</div>
								<div className="text-lg text-muted-foreground">→</div>
								<div className="text-center">
									<p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
										To
									</p>
									<p className="text-sm font-semibold text-primary">
										{selectedPlan?.name}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{billingInterval === 'ANNUAL'
											? 'Annual billing'
											: 'Monthly billing'}
									</p>
								</div>
							</div>

							{selectedPlan && (
								<div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
									<span className="text-sm text-muted-foreground">
										New charge
									</span>
									<span className="text-base font-bold tabular-nums">
										{priceFor(selectedPlan) === 0
											? 'Custom pricing'
											: `${new Intl.NumberFormat('ru-RU').format(priceFor(selectedPlan))} UZS${priceSuffix}`}
									</span>
								</div>
							)}

							<p className="text-xs text-muted-foreground">
								This change takes effect immediately. Billing adjustments
								will be prorated for the current period.
							</p>
						</div>

						{mutation.isError && (
							<p className="text-sm text-destructive">
								{mutation.error instanceof Error
									? mutation.error.message
									: 'Failed to apply the plan change. Please try again.'}
							</p>
						)}

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setStep('select')}
								disabled={mutation.isPending}
							>
								Back
							</Button>
							<Button
								disabled={mutation.isPending}
								onClick={() => mutation.mutate()}
							>
								{mutation.isPending ? 'Applying…' : 'Confirm change'}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}
