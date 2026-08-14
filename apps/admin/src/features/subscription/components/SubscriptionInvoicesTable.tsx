import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';

import { useAppT } from '@/locales';

import type { SubscriptionInvoice } from '../api/subscription.queries';
import { SUBSCRIPTION_INVOICE_STATUS_TONE } from '../lib/status-tone';

interface SubscriptionInvoicesTableProps {
	invoices: SubscriptionInvoice[];
	isLoading?: boolean;
}

export function SubscriptionInvoicesTable({
	invoices,
	isLoading,
}: SubscriptionInvoicesTableProps) {
	const t = useAppT('subscription');

	const columns: ColumnDef<SubscriptionInvoice>[] = [
		{
			id: 'code',
			header: t('history.column.code'),
			cell: ({ row }) => (
				<span className="font-mono text-xs font-semibold">
					{row.original.code}
				</span>
			),
		},
		{
			id: 'plan',
			header: t('history.column.plan'),
			cell: ({ row }) => (
				<span className="font-medium">
					{row.original.tierName} ·{' '}
					{t(`interval.${row.original.billingInterval}`)}
				</span>
			),
		},
		{
			id: 'period',
			header: t('history.column.period'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(row.original.periodStart)} –{' '}
					{formatDate(row.original.periodEnd)}
				</span>
			),
		},
		{
			id: 'amount',
			header: () => <div className="text-right">{t('history.column.amount')}</div>,
			cell: ({ row }) => (
				<div className="text-right tabular-nums">
					{formatPrice(row.original.amount)} {row.original.currency}
				</div>
			),
			size: 150,
		},
		{
			accessorKey: 'status',
			header: t('history.column.status'),
			cell: ({ getValue }) => {
				const status = getValue<SubscriptionInvoice['status']>();
				return (
					<StatusBadge tone={SUBSCRIPTION_INVOICE_STATUS_TONE[status]}>
						{t(`invoiceStatus.${status}`)}
					</StatusBadge>
				);
			},
			size: 120,
		},
		{
			id: 'issueDate',
			header: t('history.column.issued'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(row.original.issueDate)}
				</span>
			),
			size: 120,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={invoices}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					{t('history.invoiceEmpty')}
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
