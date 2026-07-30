import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

import { Button, Card, cn, EmptyState, Separator, Skeleton, StatusBadge } from '@repo/ui';
import { formatDate, formatMoney } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useInvoiceDetail } from '@/features/billing/api/billing.queries';
import { HowToPaySheet } from '@/features/billing/components/HowToPaySheet';
import { useSessionStore } from '@/store/sessionStore';
import { useAppT } from '@/locales';

/**
 * Invoice detail (`GET /student/invoices/:id`), per the design: header with number,
 * status and issue/due dates, the line items with discounts in green, the totals block,
 * payments recorded against this invoice, and — while a balance remains — a sticky
 * "How to pay" bar opening the instructions sheet. Read-only; money renders through
 * `formatMoney` only.
 */
export function InvoiceDetailRoute() {
	const t = useAppT('billing');
	const statusLabel = useStatusLabel();
	const user = useSessionStore((s) => s.user);
	const { invoiceId } = useParams({ from: '/_authed/billing/$invoiceId' });
	const { data, isPending, isError } = useInvoiceDetail(Number(invoiceId));
	const [payOpen, setPayOpen] = useState(false);

	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

	return (
		<div className="mx-auto w-full max-w-170 pb-8">
			<Link
				to="/billing"
				className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				{t('backToBilling')}
			</Link>

			{isPending ? (
				<Skeleton className="h-96 w-full rounded-2xl" />
			) : isError || !data ? (
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<AlertTriangle />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
			) : (
				<>
					<Card className="gap-0 overflow-hidden py-0">
						<div className="border-b border-border p-4.5">
							<div className="flex items-start justify-between gap-2.5">
								<div className="min-w-0">
									<p className="font-mono text-xs text-muted-foreground">
										{data.invoiceNumber}
									</p>
									<h1 className="mt-0.5 text-[17px] font-bold text-foreground">
										{t('invoiceTitle')}
									</h1>
								</div>
								<StatusBadge
									kind="invoice"
									status={data.status}
									className="shrink-0"
								>
									{statusLabel('invoice', data.status)}
								</StatusBadge>
							</div>
							<div className="mt-3.5 flex gap-4.5">
								{fullName && (
									<div>
										<p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
											{t('studentLabel')}
										</p>
										<p className="mt-0.5 text-[13px] font-semibold text-foreground">
											{fullName}
										</p>
									</div>
								)}
								<div>
									<p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
										{t('issuedLabel')}
									</p>
									<p className="mt-0.5 text-[13px] font-semibold text-foreground">
										{formatDate(data.issueDate)}
									</p>
								</div>
								<div>
									<p className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground">
										{t('dueLabel')}
									</p>
									<p
										className={cn(
											'mt-0.5 text-[13px] font-semibold',
											data.status === 'OVERDUE'
												? 'text-tone-red-fg'
												: 'text-foreground',
										)}
									>
										{formatDate(data.dueDate)}
									</p>
								</div>
							</div>
						</div>

						<div className="px-4.5 py-3.5">
							<p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
								{t('lineItems')}
							</p>
							{data.lineItems.map((item, i) => (
								<div
									key={i}
									className="flex items-center justify-between gap-2.5 py-2"
								>
									<span className="text-[13px] text-foreground">
										{item.description}
									</span>
									<span className="text-[13.5px] font-semibold tabular-nums text-foreground">
										{formatMoney(item.amount, data.currency)}
									</span>
								</div>
							))}
							{data.discounts.map((discount, i) => (
								<div
									key={`d-${i}`}
									className="flex items-center justify-between gap-2.5 py-2"
								>
									<span className="text-[13px] text-tone-green-fg">
										{discount.name}
									</span>
									<span className="text-[13.5px] font-semibold tabular-nums text-tone-green-fg">
										−{formatMoney(discount.appliedAmount, data.currency)}
									</span>
								</div>
							))}
						</div>

						<div className="border-t border-border bg-muted px-4.5 py-3.5">
							<div className="flex justify-between py-1 text-[12.5px] text-muted-foreground">
								<span>{t('totalLabel')}</span>
								<span className="tabular-nums">
									{formatMoney(data.total, data.currency)}
								</span>
							</div>
							<div className="flex justify-between py-1 text-[12.5px] text-muted-foreground">
								<span>{t('paidLabel')}</span>
								<span className="tabular-nums">
									−{formatMoney(data.amountPaid, data.currency)}
								</span>
							</div>
							<Separator className="my-1.5" />
							<div className="flex items-center justify-between pt-1">
								<span className="text-[13.5px] font-bold text-foreground">
									{t('balanceLabel')}
								</span>
								<span
									className={cn(
										'text-lg font-extrabold tabular-nums',
										data.balance === 0
											? 'text-tone-green-fg'
											: data.status === 'OVERDUE'
												? 'text-tone-red-fg'
												: 'text-foreground',
									)}
								>
									{formatMoney(data.balance, data.currency)}
								</span>
							</div>
						</div>
					</Card>

					{data.payments.length > 0 && (
						<>
							<h2 className="mb-2 mt-5 px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
								{t('paymentsOnInvoice')}
							</h2>
							<Card className="gap-0 overflow-hidden py-0">
								{data.payments.map((payment, i) => (
									<div key={payment.id}>
										{i > 0 && <Separator />}
										<div className="flex items-center justify-between gap-2.5 px-3.5 py-3">
											<div>
												<p className="text-[13.5px] font-semibold tabular-nums text-foreground">
													{formatMoney(
														payment.amount,
														data.currency,
													)}
												</p>
												<p className="mt-px text-[11px] text-muted-foreground">
													{t(`method.${payment.method}`)}
													{payment.paidAt
														? ` · ${formatDate(payment.paidAt)}`
														: ''}
												</p>
											</div>
										</div>
									</div>
								))}
							</Card>
						</>
					)}

					{data.balance > 0 && (
						<div className="sticky bottom-0 -mx-4 mt-5 flex items-center gap-3 border-t border-border bg-card px-4 py-3 md:mx-0 md:rounded-2xl md:border">
							<div className="min-w-0 flex-1">
								<p className="text-[11px] text-muted-foreground">
									{t('balanceDueLabel')}
								</p>
								<p className="text-base font-extrabold tabular-nums text-foreground">
									{formatMoney(data.balance, data.currency)}
								</p>
							</div>
							<Button
								variant="ghost"
								className="shrink-0 font-semibold text-primary underline underline-offset-3"
								onClick={() => setPayOpen(true)}
							>
								{t('howToPay')}
							</Button>
						</div>
					)}

					<HowToPaySheet
						invoice={data}
						open={payOpen}
						onOpenChange={setPayOpen}
					/>
				</>
			)}
		</div>
	);
}
