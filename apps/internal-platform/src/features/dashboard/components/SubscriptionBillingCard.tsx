import { AlertTriangle, Landmark } from 'lucide-react';

import { Card, CardContent, cn } from '@repo/ui';

import { formatNumber, formatPriceCompact } from '@repo/utils';
import type { DashboardSubscriptionBilling } from '@/api/dashboard/types';
import { useAppT } from '@/locales';

/**
 * The platform's OWN subscription income this month. Deliberately styled with a
 * primary accent so it never reads as part of the neutral GMV figures (the
 * `revenue` block is money processed *on centers' behalf* — a different thing).
 */
export function SubscriptionBillingCard({
	billing,
}: {
	billing: DashboardSubscriptionBilling;
}) {
	const t = useAppT('dashboard');
	const hasFailures = billing.failedPaymentsThisMonth > 0;

	return (
		<Card className="gap-0 border-primary/25 bg-primary/5 py-0">
			<CardContent className="flex flex-col gap-4 px-5 py-4">
				<div className="flex items-start justify-between gap-2">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wider text-primary">
							{t('card.subscriptionBilling')}
						</p>
						<p className="text-xs text-muted-foreground">
							{t('card.subscriptionBillingHint')}
						</p>
					</div>
					<Landmark className="size-4 shrink-0 text-primary" />
				</div>

				<div>
					<p className="text-3xl font-bold tabular-nums">
						{formatPriceCompact(billing.revenueThisMonth, billing.currency)}
					</p>
					<p className="text-xs text-muted-foreground">
						{t('platformIncomeThisMonth')}
					</p>
				</div>

				<div className="grid grid-cols-2 gap-3 border-t border-primary/15 pt-3">
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">
							{t('paymentsThisMonth')}
						</span>
						<span className="text-lg font-semibold tabular-nums">
							{formatNumber(billing.paymentsThisMonth)}
						</span>
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">
							{t('failedThisMonth')}
						</span>
						<span
							className={cn(
								'flex items-center gap-1 text-lg font-semibold tabular-nums',
								hasFailures
									? 'text-tone-red-fg'
									: 'text-muted-foreground',
							)}
						>
							{hasFailures && <AlertTriangle className="size-4" />}
							{formatNumber(billing.failedPaymentsThisMonth)}
						</span>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
