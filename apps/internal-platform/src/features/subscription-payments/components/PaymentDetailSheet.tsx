import { useState } from 'react';
import { Link } from '@tanstack/react-router';

import {
	Button,
	DetailRows,
	Separator,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Skeleton,
	type DetailRow,
} from '@repo/ui';

import { formatDateTime, formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';

import { paymentMethodLabel } from '../constants';
import { useSubscriptionPayment } from '../hooks';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { RefundDialog } from './RefundDialog';

/**
 * A single payment's detail. Leads with `providerTxnId` and `invoiceCode` — the
 * two identifiers a support ticket starts from — then the money/timeline rows.
 * Refund is offered only for a SUCCEEDED payment.
 */
export function PaymentDetailSheet({
	paymentId,
	open,
	onOpenChange,
}: {
	paymentId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useAppT('payments');
	const [refundOpen, setRefundOpen] = useState(false);
	const { data: payment, isLoading, isError } = useSubscriptionPayment(paymentId);

	const rows: DetailRow[] = payment
		? [
				{
					label: t('detail.amount'),
					value: `${formatPrice(payment.amount)} ${payment.currency}`,
				},
				{
					label: t('detail.method'),
					value: paymentMethodLabel(t, payment.method),
				},
				{ label: t('detail.provider'), value: payment.provider ?? '—' },
				{
					label: t('detail.tenant'),
					value: (
						<Link
							to="/tenants/$tenantId"
							params={{ tenantId: String(payment.tenantId) }}
							className="text-primary underline-offset-4 hover:underline"
						>
							{t('tenantRef', { id: payment.tenantId })}
						</Link>
					),
				},
				{
					label: t('detail.createdAt'),
					value: formatDateTime(payment.createdAt),
				},
				{
					label: t('detail.paidAt'),
					value: payment.paidAt ? formatDateTime(payment.paidAt) : '—',
				},
				...(payment.failureReason
					? [{ label: t('detail.failureReason'), value: payment.failureReason }]
					: []),
				...(payment.refundedAt
					? [
							{
								label: t('detail.refundedAt'),
								value: formatDateTime(payment.refundedAt),
							},
							{
								label: t('detail.refundedAmount'),
								value:
									payment.refundedAmount != null
										? `${formatPrice(payment.refundedAmount)} ${payment.currency}`
										: '—',
							},
						]
					: []),
			]
		: [];

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-md">
				<SheetHeader>
					<SheetTitle>{t('detail.title')}</SheetTitle>
					<SheetDescription>{t('detail.subtitle')}</SheetDescription>
				</SheetHeader>

				<div className="flex flex-1 flex-col gap-5 px-4 pb-4">
					{isLoading ? (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-64 w-full" />
						</div>
					) : isError || !payment ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							{t('detail.loadError')}
						</p>
					) : (
						<>
							<div className="flex items-center justify-between">
								<PaymentStatusBadge status={payment.status} />
							</div>

							{/* Support anchors — the identifiers a ticket is filed against. */}
							<div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
								<div className="flex flex-col gap-0.5">
									<span className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
										{t('detail.invoiceCode')}
									</span>
									<span className="font-mono text-sm font-semibold">
										{payment.invoiceCode ?? '—'}
									</span>
								</div>
								<Separator />
								<div className="flex flex-col gap-0.5">
									<span className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
										{t('detail.providerTxnId')}
									</span>
									<span className="break-all font-mono text-sm font-semibold">
										{payment.providerTxnId ?? '—'}
									</span>
								</div>
							</div>

							<DetailRows rows={rows} />

							{payment.status === 'SUCCEEDED' && (
								<Button
									variant="destructive"
									className="w-full"
									onClick={() => setRefundOpen(true)}
								>
									{t('refund.submit')}
								</Button>
							)}

							<RefundDialog
								key={refundOpen ? 'open' : 'closed'}
								payment={payment}
								open={refundOpen}
								onOpenChange={setRefundOpen}
							/>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
