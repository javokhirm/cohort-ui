import { useNavigate, useSearch } from '@tanstack/react-router';
import { AlertTriangle, ChevronRight, ReceiptText, Wallet } from 'lucide-react';

import {
	Button,
	Card,
	EmptyState,
	Skeleton,
	StatusBadge,
	Tabs,
	TabsList,
	TabsTrigger,
} from '@repo/ui';
import { formatDate, formatMoney } from '@repo/utils';

import {
	useBillingSummary,
	useInvoices,
	usePayments,
	useWallet,
} from '@/features/billing/api/billing.queries';
import type { StudentBillingSummary } from '@/features/billing/api/billing.queries';
import { InvoiceCard } from '@/features/billing/components/InvoiceCard';
import { PaymentList } from '@/features/billing/components/PaymentList';
import { WalletTransactionList } from '@/features/billing/components/WalletTransactionList';
import { useAppT } from '@/locales';

export type BillingView = 'invoices' | 'wallet' | 'payments';

/** The Outstanding header card per the design: label + status pill, amount, sub line. */
function OutstandingCard({ summary }: { summary: StudentBillingSummary }) {
	const t = useAppT('billing');
	const owes = summary.outstanding > 0;

	return (
		<Card className="gap-0 py-0">
			<div className="p-4">
				<div className="flex items-center justify-between gap-2">
					<span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
						{t('outstanding')}
					</span>
					{summary.overdueCount > 0 ? (
						<StatusBadge tone="red">
							{t('overdueCount', { count: summary.overdueCount })}
						</StatusBadge>
					) : owes ? (
						<StatusBadge tone="amber">
							{t('openCount', { count: summary.openInvoiceCount })}
						</StatusBadge>
					) : (
						<StatusBadge tone="green">{t('allPaid')}</StatusBadge>
					)}
				</div>
				<p className="mt-2.5 text-[26px] font-extrabold tabular-nums tracking-tight text-foreground">
					{formatMoney(summary.outstanding, summary.currency)}
				</p>
				<p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
					{owes && summary.oldestDueDate
						? t('outstandingSub', {
								count: summary.openInvoiceCount,
								date: formatDate(summary.oldestDueDate),
							})
						: t('nothingToPay')}
				</p>
			</div>
		</Card>
	);
}

/**
 * The student's Billing screen (api-reference §5.8–5.9): the outstanding summary and
 * wallet row over three switchable views — invoices, wallet ledger, payment history.
 * The active view lives in the `?view=` search param. Read-only: paying happens at the
 * center (see the invoice detail's "How to pay" sheet), never in-app.
 */
export function BillingRoute() {
	const t = useAppT('billing');
	const navigate = useNavigate();
	const { view = 'invoices' } = useSearch({ from: '/_authed/billing' });

	const summary = useBillingSummary();
	const invoices = useInvoices(view === 'invoices');
	const wallet = useWallet(view === 'wallet');
	const payments = usePayments(view === 'payments');

	const setView = (next: BillingView) =>
		void navigate({ to: '/billing', search: { view: next }, replace: true });

	if (summary.isPending) {
		return (
			<div className="mx-auto flex w-full max-w-205 flex-col gap-2.5 pb-8">
				<Skeleton className="h-32 w-full rounded-xl" />
				<Skeleton className="h-13 w-full rounded-[13px]" />
				<Skeleton className="mt-3 h-40 w-full rounded-[15px]" />
			</div>
		);
	}

	if (summary.isError || !summary.data) {
		return (
			<div className="mx-auto w-full max-w-205 rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<AlertTriangle />}
					title={t('errorTitle')}
					description={t('errorDescription')}
					action={
						<Button variant="outline" onClick={() => void summary.refetch()}>
							{t('retry')}
						</Button>
					}
				/>
			</div>
		);
	}

	const invoiceRows = invoices.data?.pages.flatMap((p) => p.rows) ?? [];
	const paymentRows = payments.data?.pages.flatMap((p) => p.rows) ?? [];

	return (
		<div className="mx-auto w-full max-w-205 pb-8">
			<OutstandingCard summary={summary.data} />

			<button
				type="button"
				onClick={() => setView('wallet')}
				className="mt-2.5 flex w-full cursor-pointer items-center gap-2.5 rounded-[13px] border border-border bg-card px-3 py-2.5 shadow-sm transition-colors hover:border-primary"
			>
				<span className="flex size-7.5 shrink-0 items-center justify-center rounded-[9px] bg-tone-indigo-bg text-tone-indigo-fg">
					<Wallet className="size-3.5" />
				</span>
				<span className="flex-1 text-left text-[12.5px] font-semibold text-muted-foreground">
					{t('walletBalance')}
				</span>
				<span className="text-sm font-bold tabular-nums text-foreground">
					{formatMoney(summary.data.walletBalance, summary.data.currency)}
				</span>
				<ChevronRight className="size-4 text-muted-foreground" />
			</button>

			<Tabs
				value={view}
				onValueChange={(value) => setView(value as BillingView)}
				className="my-3.5"
			>
				<TabsList>
					<TabsTrigger value="invoices" className="px-4">
						{t('invoicesTab')}
					</TabsTrigger>
					<TabsTrigger value="wallet" className="px-4">
						{t('walletTab')}
					</TabsTrigger>
					<TabsTrigger value="payments" className="px-4">
						{t('paymentsTab')}
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{view === 'invoices' &&
				(invoices.isPending ? (
					<div className="flex flex-col gap-2.5">
						<Skeleton className="h-32 w-full rounded-[15px]" />
						<Skeleton className="h-32 w-full rounded-[15px]" />
					</div>
				) : invoices.isError ? (
					<div className="rounded-2xl border border-border bg-card">
						<EmptyState
							icon={<AlertTriangle />}
							title={t('errorTitle')}
							description={t('errorDescription')}
						/>
					</div>
				) : invoiceRows.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-border bg-card">
						<EmptyState
							icon={<ReceiptText />}
							title={t('noInvoicesTitle')}
							description={t('noInvoicesDescription')}
						/>
					</div>
				) : (
					<>
						<div className="flex flex-col gap-2.5">
							{invoiceRows.map((invoice) => (
								<InvoiceCard
									key={invoice.id}
									invoice={invoice}
									onOpen={() =>
										void navigate({
											to: '/billing/$invoiceId',
											params: { invoiceId: String(invoice.id) },
										})
									}
								/>
							))}
						</div>
						{invoices.hasNextPage && (
							<Button
								variant="outline"
								className="mt-3 w-full text-primary"
								disabled={invoices.isFetchingNextPage}
								onClick={() => void invoices.fetchNextPage()}
							>
								{t('loadMoreInvoices')}
							</Button>
						)}
					</>
				))}

			{view === 'wallet' &&
				(wallet.isPending ? (
					<Skeleton className="h-48 w-full rounded-2xl" />
				) : wallet.isError || !wallet.data ? (
					<div className="rounded-2xl border border-border bg-card">
						<EmptyState
							icon={<AlertTriangle />}
							title={t('errorTitle')}
							description={t('errorDescription')}
						/>
					</div>
				) : (
					<WalletTransactionList wallet={wallet.data} />
				))}

			{view === 'payments' &&
				(payments.isPending ? (
					<Skeleton className="h-48 w-full rounded-2xl" />
				) : payments.isError ? (
					<div className="rounded-2xl border border-border bg-card">
						<EmptyState
							icon={<AlertTriangle />}
							title={t('errorTitle')}
							description={t('errorDescription')}
						/>
					</div>
				) : (
					<>
						<PaymentList payments={paymentRows} />
						{payments.hasNextPage && (
							<Button
								variant="outline"
								className="mt-3 w-full text-primary"
								disabled={payments.isFetchingNextPage}
								onClick={() => void payments.fetchNextPage()}
							>
								{t('loadMorePayments')}
							</Button>
						)}
					</>
				))}
		</div>
	);
}
