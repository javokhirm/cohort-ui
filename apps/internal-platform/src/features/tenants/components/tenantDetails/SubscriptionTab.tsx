import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button, Card, CardContent, CardHeader, StatusBadge } from '@repo/ui';
import type { StatusTone } from '@repo/ui';

import { plansKeys } from '@/api/plans/keys';
import { listPlans } from '@/api/plans/plans.queries';
import type { TenantDetailView } from '@/api/tenants/types';
import { TenantInvoiceHistory } from '@/features/subscription-invoices/components/TenantInvoiceHistory';
import { RecordOfflinePaymentDialog } from '@/features/subscription-payments/components/RecordOfflinePaymentDialog';
import { TenantPaymentHistory } from '@/features/subscription-payments/components/TenantPaymentHistory';
import { formatDate, formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';

const SUB_STATUS_TONE: Record<string, StatusTone> = {
	TRIALING: 'blue',
	ACTIVE: 'green',
	PAST_DUE: 'amber',
	EXPIRED: 'orange',
	CANCELLED: 'slate',
};

/** Localized subscription-status label — keeps the enum→key mapping type-safe. */
function subStatusLabel(
	ts: ReturnType<typeof useAppT<'subscriptions'>>,
	status: string,
): string {
	switch (status) {
		case 'TRIALING':
			return ts('statusLabel.trialing');
		case 'ACTIVE':
			return ts('statusLabel.active');
		case 'PAST_DUE':
			return ts('statusLabel.pastDue');
		case 'EXPIRED':
			return ts('statusLabel.expired');
		case 'CANCELLED':
			return ts('statusLabel.cancelled');
		default:
			return status;
	}
}

export function SubscriptionTab({
	tenant,
	subscriptionTierId,
	onChangePlan,
}: {
	tenant: TenantDetailView;
	subscriptionTierId: number | null;
	onChangePlan: () => void;
}) {
	const ts = useAppT('subscriptions');
	const [recordOpen, setRecordOpen] = useState(false);

	const { data: plansPage } = useQuery({
		queryKey: plansKeys.list({ isActive: true }),
		queryFn: () => listPlans({ isActive: true, limit: 100 }),
	});
	const plan = (plansPage?.rows ?? []).find((p) => p.id === subscriptionTierId) ?? null;

	const { subscription, stats } = tenant;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="gap-0 py-0">
					<CardHeader className="px-5 pb-0">
						<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							{ts('currentPlan')}
						</p>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 px-5 pt-3 pb-5">
						<div>
							<p className="text-2xl font-bold">{plan?.name ?? '—'}</p>
							{plan && (
								<p className="text-sm text-muted-foreground">
									{formatPrice(plan.priceMonthly)}
									{ts('perMonth')}
								</p>
							)}
						</div>
						{subscription ? (
							<dl className="flex flex-col gap-2 text-sm">
								{[
									{
										label: ts('column.status'),
										value: (
											<StatusBadge
												tone={
													SUB_STATUS_TONE[
														subscription.status
													] ?? 'slate'
												}
											>
												{subStatusLabel(ts, subscription.status)}
											</StatusBadge>
										),
									},
									{
										label: ts('mrr'),
										value: formatPrice(stats.monthlyRevenue),
									},
									{
										label: ts('periodStart'),
										value: formatDate(
											subscription.currentPeriodStart,
										),
									},
									{
										label: ts('renews'),
										value: formatDate(subscription.currentPeriodEnd),
									},
								].map(({ label, value }) => (
									<div
										key={label}
										className="flex items-center justify-between gap-4"
									>
										<dt className="text-muted-foreground">{label}</dt>
										<dd className="font-medium">{value}</dd>
									</div>
								))}
							</dl>
						) : (
							<p className="text-sm text-muted-foreground">
								{ts('noSubscription')}
							</p>
						)}
						<div className="flex flex-col gap-2">
							<Button className="w-full" onClick={onChangePlan}>
								{ts('changePlan')}
							</Button>
							<Button
								variant="outline"
								className="w-full"
								onClick={() => setRecordOpen(true)}
							>
								{ts('recordPayment')}
							</Button>
						</div>
					</CardContent>
				</Card>

				<TenantInvoiceHistory tenantId={tenant.id} />
			</div>

			<TenantPaymentHistory tenantId={tenant.id} />

			<RecordOfflinePaymentDialog
				key={recordOpen ? 'open' : 'closed'}
				tenantId={tenant.id}
				currentTierId={subscriptionTierId}
				open={recordOpen}
				onOpenChange={setRecordOpen}
			/>
		</div>
	);
}
