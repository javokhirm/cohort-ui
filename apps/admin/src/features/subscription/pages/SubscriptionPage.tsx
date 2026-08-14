import { useState } from 'react';
import { Copy } from 'lucide-react';

import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Pagination,
	PageHeader,
	Skeleton,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from '@repo/ui';
import type { SubscriptionAccessView } from '@repo/api-client';
import { formatDate, formatPrice } from '@repo/utils';
import { useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';

import type { RenewSubscriptionResult } from '../api/subscription.mutations';
import {
	useSubscription,
	useSubscriptionInvoices,
	useSubscriptionPayments,
} from '../api/subscription.queries';
import { PlanFeaturesList } from '../components/PlanFeaturesList';
import { RenewSubscriptionDialog } from '../components/RenewSubscriptionDialog';
import { SubscriptionInvoicesTable } from '../components/SubscriptionInvoicesTable';
import { SubscriptionPaymentsTable } from '../components/SubscriptionPaymentsTable';
import { SubscriptionStateBadge } from '../components/SubscriptionStateBadge';

const PAGE_SIZE = 10;

export function SubscriptionPage() {
	const t = useAppT('subscription');
	const tc = useT('common');

	const [renewOpen, setRenewOpen] = useState(false);
	const [pendingResult, setPendingResult] = useState<RenewSubscriptionResult | null>(
		null,
	);
	// A just-started renewal hasn't restored access yet. Cleared by
	// `onAccessRestored` below — never optimistically (§5) — once a fresh read
	// confirms it, which is also what stops the poll.
	const isPending = pendingResult != null;

	const {
		data: subscription,
		isLoading,
		isError,
		refetch,
	} = useSubscription({
		poll: isPending,
		onAccessRestored: () => {
			setPendingResult(null);
			toast.success(t('renew.accessRestored'));
		},
	});

	const [invoicePage, setInvoicePage] = useState(1);
	const [paymentPage, setPaymentPage] = useState(1);
	const invoicesQuery = useSubscriptionInvoices({
		page: invoicePage,
		limit: PAGE_SIZE,
	});
	const paymentsQuery = useSubscriptionPayments({
		page: paymentPage,
		limit: PAGE_SIZE,
	});

	function handleRenewed(result: RenewSubscriptionResult) {
		setPendingResult(result);
	}

	async function copyIdempotencyKey(key: string) {
		try {
			await navigator.clipboard.writeText(key);
			toast.success(t('renew.copied'));
		} catch {
			/* clipboard permission denied — nothing actionable to recover with */
		}
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
					{pendingResult && (
						<PendingPaymentCard
							result={pendingResult}
							polling={isPending}
							onCheckStatus={() => void refetch()}
							onCopyKey={() =>
								void copyIdempotencyKey(pendingResult.idempotencyKey)
							}
						/>
					)}

					{subscription.hasAccess ? (
						<ActiveSubscriptionCard
							subscription={subscription}
							onRenew={() => setRenewOpen(true)}
						/>
					) : (
						<BlockedSubscriptionCard
							subscription={subscription}
							onRenew={() => setRenewOpen(true)}
						/>
					)}

					<Card className="gap-0 overflow-hidden py-0">
						<Tabs defaultValue="invoices" className="gap-0">
							<div className="border-b border-border p-4">
								<TabsList>
									<TabsTrigger value="invoices">
										{t('history.invoicesTab')}
									</TabsTrigger>
									<TabsTrigger value="payments">
										{t('history.paymentsTab')}
									</TabsTrigger>
								</TabsList>
							</div>
							<TabsContent value="invoices" className="mt-0">
								<SubscriptionInvoicesTable
									invoices={invoicesQuery.data?.rows ?? []}
									isLoading={invoicesQuery.isLoading}
								/>
								<div className="border-t border-border px-4 py-3">
									<Pagination
										page={invoicePage}
										pageSize={PAGE_SIZE}
										total={invoicesQuery.data?.total ?? 0}
										onPageChange={setInvoicePage}
									/>
								</div>
							</TabsContent>
							<TabsContent value="payments" className="mt-0">
								<SubscriptionPaymentsTable
									payments={paymentsQuery.data?.rows ?? []}
									isLoading={paymentsQuery.isLoading}
								/>
								<div className="border-t border-border px-4 py-3">
									<Pagination
										page={paymentPage}
										pageSize={PAGE_SIZE}
										total={paymentsQuery.data?.total ?? 0}
										onPageChange={setPaymentPage}
									/>
								</div>
							</TabsContent>
						</Tabs>
					</Card>

					<RenewSubscriptionDialog
						open={renewOpen}
						onOpenChange={setRenewOpen}
						subscription={subscription}
						onRenewed={handleRenewed}
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

function PendingPaymentCard({
	result,
	polling,
	onCheckStatus,
	onCopyKey,
}: {
	result: RenewSubscriptionResult;
	polling: boolean;
	onCheckStatus: () => void;
	onCopyKey: () => void;
}) {
	const t = useAppT('subscription');

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{t('renew.successTitle')}</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-3 text-sm">
				<p className="text-muted-foreground">{t('renew.successDescription')}</p>

				<div className="grid grid-cols-1 gap-3 rounded-lg border border-border p-3.5 sm:grid-cols-2">
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">
							{t('renew.invoiceCode')}
						</span>
						<span className="font-mono font-semibold">
							{result.invoice.code}
						</span>
					</div>
					<div className="flex flex-col gap-0.5">
						<span className="text-xs text-muted-foreground">
							{t('history.column.amount')}
						</span>
						<span className="font-semibold tabular-nums">
							{formatPrice(result.payment.amount)} {result.payment.currency}
						</span>
					</div>
					<div className="col-span-1 flex flex-col gap-0.5 sm:col-span-2">
						<span className="text-xs text-muted-foreground">
							{t('renew.idempotencyKey')}
						</span>
						<div className="flex items-center gap-2">
							<span className="truncate font-mono text-xs">
								{result.idempotencyKey}
							</span>
							<Button
								type="button"
								size="icon"
								variant="ghost"
								className="size-6 shrink-0"
								aria-label={t('renew.copyKey')}
								onClick={onCopyKey}
							>
								<Copy className="size-3.5" />
							</Button>
						</div>
					</div>
				</div>

				<div className="flex items-center justify-between gap-3">
					<span className="flex items-center gap-2 text-muted-foreground">
						{polling && <Spinner className="size-3.5" />}
						{t('renew.waitingForPayment')}
					</span>
					<Button
						type="button"
						size="sm"
						variant="outline"
						onClick={onCheckStatus}
					>
						{t('renew.checkStatus')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
