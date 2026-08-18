import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatDateTime, formatPrice } from '@repo/utils';

import { useAppT } from '@/locales';

import type { SubscriptionPayment } from '../api/subscription.queries';
import { SUBSCRIPTION_PAYMENT_STATUS_TONE } from '../lib/status-tone';

interface SubscriptionPaymentsTableProps {
	payments: SubscriptionPayment[];
	isLoading?: boolean;
}

export function SubscriptionPaymentsTable({
	payments,
	isLoading,
}: SubscriptionPaymentsTableProps) {
	const t = useAppT('subscription');

	const columns: ColumnDef<SubscriptionPayment>[] = [
		{
			id: 'invoiceCode',
			header: t('history.column.code'),
			cell: ({ row }) => (
				<span className="font-mono text-xs font-semibold">
					{row.original.invoiceCode ?? '—'}
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
			id: 'method',
			header: t('history.column.method'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{t(`method.${row.original.method}`)}
				</span>
			),
			size: 140,
		},
		{
			accessorKey: 'status',
			header: t('history.column.status'),
			cell: ({ getValue }) => {
				const status = getValue<SubscriptionPayment['status']>();
				return (
					<StatusBadge tone={SUBSCRIPTION_PAYMENT_STATUS_TONE[status]}>
						{t(`paymentStatus.${status}`)}
					</StatusBadge>
				);
			},
			size: 120,
		},
		{
			id: 'paidAt',
			header: t('history.column.paidAt'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.paidAt ? formatDateTime(row.original.paidAt) : '—'}
				</span>
			),
			size: 170,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={payments}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					{t('history.paymentEmpty')}
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
