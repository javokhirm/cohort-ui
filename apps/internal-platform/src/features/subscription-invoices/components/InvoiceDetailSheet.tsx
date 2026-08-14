import { Link } from '@tanstack/react-router';

import {
	DetailRows,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Skeleton,
	type DetailRow,
} from '@repo/ui';

import { formatDate, formatDateTime, formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';

import { billingIntervalLabel } from '../constants';
import { useSubscriptionInvoice } from '../hooks';
import { InvoiceStatusBadge } from './InvoiceStatusBadge';

/**
 * A single subscription invoice. `tierName`/`unitPrice` are the snapshot taken
 * at purchase time — the panel labels them as such, since they intentionally
 * differ from the live plan catalogue after a re-price and must not be
 * "corrected" against it.
 */
export function InvoiceDetailSheet({
	invoiceId,
	open,
	onOpenChange,
}: {
	invoiceId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useAppT('invoices');
	const { data: invoice, isLoading, isError } = useSubscriptionInvoice(invoiceId);

	const rows: DetailRow[] = invoice
		? [
				{
					label: t('detail.tenant'),
					value: (
						<Link
							to="/tenants/$tenantId"
							params={{ tenantId: String(invoice.tenantId) }}
							className="text-primary underline-offset-4 hover:underline"
						>
							{t('tenantRef', { id: invoice.tenantId })}
						</Link>
					),
				},
				{ label: t('detail.plan'), value: invoice.tierName },
				{
					label: t('detail.interval'),
					value: billingIntervalLabel(t, invoice.billingInterval),
				},
				{
					label: t('detail.unitPrice'),
					value: `${formatPrice(invoice.unitPrice)} ${invoice.currency}`,
				},
				{
					label: t('detail.amount'),
					value: `${formatPrice(invoice.amount)} ${invoice.currency}`,
				},
				{ label: t('detail.issueDate'), value: formatDate(invoice.issueDate) },
				{
					label: t('detail.period'),
					value: `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`,
				},
				{
					label: t('detail.paidAt'),
					value: invoice.paidAt ? formatDateTime(invoice.paidAt) : '—',
				},
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
							<Skeleton className="h-16 w-full" />
							<Skeleton className="h-64 w-full" />
						</div>
					) : isError || !invoice ? (
						<p className="py-10 text-center text-sm text-muted-foreground">
							{t('detail.loadError')}
						</p>
					) : (
						<>
							<div className="flex items-center justify-between gap-3">
								<span className="font-mono text-sm font-semibold">
									{invoice.code}
								</span>
								<InvoiceStatusBadge status={invoice.status} />
							</div>

							<DetailRows rows={rows} />

							<p className="text-xs text-muted-foreground">
								{t('detail.snapshotNote')}
							</p>
						</>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
}
