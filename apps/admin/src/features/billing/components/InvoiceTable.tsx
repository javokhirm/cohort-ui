import { cn, DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';
import { useAppT } from '@/locales';

import type { InvoiceResponse } from '../api/invoices.queries';

interface InvoiceTableProps {
	invoices: InvoiceResponse[];
	isLoading?: boolean;
	onRowClick?: (invoice: InvoiceResponse) => void;
}

function isVoid(invoice: InvoiceResponse) {
	return invoice.status === 'VOID';
}

export function InvoiceTable({ invoices, isLoading, onRowClick }: InvoiceTableProps) {
	const statusLabel = useStatusLabel();
	const t = useAppT('billing');
	const columns: ColumnDef<InvoiceResponse>[] = [
		{
			accessorKey: 'invoiceNumber',
			header: t('invoices.column.invoice'),
			cell: ({ row, getValue }) => (
				<span
					className={cn(
						'font-mono text-xs font-semibold',
						isVoid(row.original) && 'text-muted-foreground line-through',
					)}
				>
					{getValue<string>()}
				</span>
			),
			size: 140,
		},
		{
			id: 'student',
			header: t('invoices.column.student'),
			cell: ({ row }) => (
				<span
					className={cn(
						'font-medium',
						isVoid(row.original) && 'text-muted-foreground',
					)}
				>
					{row.original.studentName}
				</span>
			),
		},
		{
			id: 'total',
			header: () => <div className="text-right">{t('invoices.detail.total')}</div>,
			cell: ({ row }) => (
				<div
					className={cn(
						'text-right tabular-nums',
						isVoid(row.original) && 'text-muted-foreground line-through',
					)}
				>
					{formatPrice(row.original.total)} UZS
				</div>
			),
			size: 150,
		},
		{
			id: 'paid',
			header: () => <div className="text-right">{t('invoices.detail.paid')}</div>,
			cell: ({ row }) => (
				<div
					className={cn(
						'text-right tabular-nums',
						isVoid(row.original)
							? 'text-muted-foreground'
							: 'text-tone-green-fg',
					)}
				>
					{formatPrice(row.original.amountPaid)} UZS
				</div>
			),
			size: 150,
		},
		{
			id: 'balance',
			header: () => (
				<div className="text-right">{t('invoices.detail.balance')}</div>
			),
			cell: ({ row }) => (
				<div
					className={cn(
						'text-right tabular-nums',
						isVoid(row.original)
							? 'text-muted-foreground'
							: row.original.amountDue > 0
								? 'text-tone-red-fg'
								: 'text-muted-foreground',
					)}
				>
					{formatPrice(row.original.amountDue)} UZS
				</div>
			),
			size: 150,
		},
		{
			accessorKey: 'status',
			header: t('invoices.column.status'),
			cell: ({ getValue }) => (
				<StatusBadge kind="invoice" status={getValue<string>()}>
					{statusLabel('invoice', getValue<string>())}
				</StatusBadge>
			),
			size: 110,
		},
		{
			accessorKey: 'dueDate',
			header: t('invoices.column.due'),
			cell: ({ getValue }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(getValue<string>())}
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
			getRowClassName={(row) => (isVoid(row) ? 'opacity-60' : undefined)}
			onRowClick={onRowClick}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					{t('invoices.emptyFiltered')}
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
