import { useState } from 'react';

import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	PageHeader,
	Skeleton,
	toast,
} from '@repo/ui';
import type { SubscriptionAccessView } from '@repo/api-client';
import { formatDate, formatPrice } from '@repo/utils';
import { useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';

import type { RenewSubscriptionResult } from '../api/subscription.mutations';
import { useSubscription } from '../api/subscription.queries';
import { PlanFeaturesList } from '../components/PlanFeaturesList';
import { RenewSubscriptionDialog } from '../components/RenewSubscriptionDialog';
import { SubscriptionStateBadge } from '../components/SubscriptionStateBadge';

/**
 * The center's own subscription: what it is on, and — through the payment
 * modal — how to renew it. Invoices and payment history deliberately are not
 * here: the platform's ledger of what a center paid belongs to Super Admin, and
 * this app never shows a center its own subscription payments.
 */
export function SubscriptionPage() {
	const t = useAppT('subscription');
	const tc = useT('common');

	const [payOpen, setPayOpen] = useState(false);
	const [intent, setIntent] = useState<RenewSubscriptionResult | null>(null);

	const {
		data: subscription,
		isLoading,
		isError,
		refetch,
	} = useSubscription({
		// Poll only while the modal is up holding a started payment — closing it
		// is the admin saying they are done waiting here. The settlement itself
		// is unaffected: the webhook restores access server-side either way.
		awaitingPeriodEnd: payOpen ? (intent?.invoice.periodEnd ?? null) : null,
		onSettled: () => {
			closePayment();
			toast.success(t('renew.accessRestored'));
		},
	});

	const hasAccess = subscription?.hasAccess ?? false;

	function closePayment() {
		setPayOpen(false);
		setIntent(null);
	}

	return (
		<div className="mx-auto flex min-h-svh max-w-4xl flex-col gap-6 px-4 py-8 sm:px-6">
			<PageHeader title={t('pageTitle')} description={t('pageDescription')} />

			{isLoading && <Skeleton className="h-56 w-full rounded-xl" />}

			{isError && !subscription && (
				<Alert variant="destructive">
					<AlertDescription className="flex items-center justify-between gap-3">
						<span>{t('loadError')}</span>
						<Button
							size="sm"
							variant="outline"
							onClick={() => void refetch()}
						>
							{tc('action.retry')}
						</Button>
					</AlertDescription>
				</Alert>
			)}

			{subscription && (
				<>
					{hasAccess ? (
						<ActiveSubscriptionCard
							subscription={subscription}
							onRenew={() => setPayOpen(true)}
						/>
					) : (
						<BlockedSubscriptionCard
							subscription={subscription}
							onRenew={() => setPayOpen(true)}
						/>
					)}

					<RenewSubscriptionDialog
						open={payOpen}
						onOpenChange={(open) =>
							open ? setPayOpen(true) : closePayment()
						}
						subscription={subscription}
						intent={intent}
						onStarted={setIntent}
					/>
				</>
			)}
		</div>
	);
}

function ActiveSubscriptionCard({
	subscription,
	onRenew,
}: {
	subscription: SubscriptionAccessView;
	onRenew: () => void;
}) {
	const t = useAppT('subscription');

	return (
		<Card>
			<CardHeader className="flex-row items-start justify-between">
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center gap-2">
						<CardTitle className="text-lg">
							{subscription.plan?.name ?? '—'}
						</CardTitle>
						<SubscriptionStateBadge state={subscription.state} />
					</div>
					{subscription.currentPeriodStart && subscription.currentPeriodEnd && (
						<p className="text-sm text-muted-foreground">
							{t('active.period')}:{' '}
							{formatDate(subscription.currentPeriodStart)} –{' '}
							{formatDate(subscription.currentPeriodEnd)}
						</p>
					)}
				</div>
				<Can permission="subscription.renew">
					<Button variant="outline" size="sm" onClick={onRenew}>
						{t('renew.upgrade')}
					</Button>
				</Can>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{subscription.expiresSoon && subscription.currentPeriodEnd && (
					<Alert variant="warning">
						<AlertDescription>
							{t('banner.message', {
								date: formatDate(subscription.currentPeriodEnd),
							})}
						</AlertDescription>
					</Alert>
				)}

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">
							{t('active.renewsOn')}
						</span>
						<span className="text-sm font-semibold">
							{subscription.currentPeriodEnd
								? formatDate(subscription.currentPeriodEnd)
								: '—'}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">
							{t('renewalPrice')}
						</span>
						<span className="text-sm font-semibold tabular-nums">
							{subscription.renewalPrice != null
								? `${formatPrice(subscription.renewalPrice)} ${subscription.currency}`
								: '—'}
						</span>
					</div>
				</div>

				{subscription.plan && (
					<div>
						<h3 className="mb-2 text-sm font-semibold">
							{t('features.title')}
						</h3>
						<PlanFeaturesList
							features={subscription.plan.features}
							maxStudents={subscription.plan.maxStudents}
							maxBranches={subscription.plan.maxBranches}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function BlockedSubscriptionCard({
	subscription,
	onRenew,
}: {
	subscription: SubscriptionAccessView;
	onRenew: () => void;
}) {
	const t = useAppT('subscription');

	return (
		<Card className="border-destructive/30">
			<CardHeader>
				<div className="flex items-center gap-2">
					<CardTitle className="text-lg">{t('blocked.title')}</CardTitle>
					<SubscriptionStateBadge state={subscription.state} />
				</div>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				<p className="text-sm text-muted-foreground">
					{t('blocked.description')}
				</p>

				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">
							{t('blocked.expiredOn')}
						</span>
						<span className="text-sm font-semibold">
							{subscription.currentPeriodEnd
								? formatDate(subscription.currentPeriodEnd)
								: '—'}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">
							{t('blocked.currentPlan')}
						</span>
						<span className="text-sm font-semibold">
							{subscription.plan?.name ?? '—'}
						</span>
					</div>
					<div className="flex flex-col gap-1">
						<span className="text-xs text-muted-foreground">
							{t('renewalPrice')}
						</span>
						<span className="text-sm font-semibold tabular-nums">
							{subscription.renewalPrice != null
								? `${formatPrice(subscription.renewalPrice)} ${subscription.currency}`
								: '—'}
						</span>
					</div>
				</div>

				<Can
					permission="subscription.renew"
					fallback={
						<p className="text-sm text-muted-foreground">
							{t('blocked.ownerOnly')}
						</p>
					}
				>
					<Button onClick={onRenew} className="w-fit">
						{t('blocked.renew')}
					</Button>
				</Can>
			</CardContent>
		</Card>
	);
}
