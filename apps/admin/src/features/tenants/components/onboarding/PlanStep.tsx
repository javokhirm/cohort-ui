import { Button, Card, CardContent, Skeleton, cn } from '@repo/ui';

import type { PlanView } from '@/api/plans/types';

import type { OnboardFormData } from './types';
import { planLimits } from './types';
import { formatPrice } from '@/lib/formatters/currency';

export function PlanStep({
	data,
	onChange,
	onBack,
	onNext,
	plans,
	plansLoading,
}: {
	data: OnboardFormData;
	onChange: (patch: Partial<OnboardFormData>) => void;
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
											{formatPrice(plan.priceMonthly)}
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
