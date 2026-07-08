import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';

import type { InvoiceResponse } from '../api/invoices.queries';

interface InvoiceTableProps {
	invoices: InvoiceResponse[];
	isLoading?: boolean;
	onRowClick?: (invoice: InvoiceResponse) => void;
}

export function InvoiceTable({ invoices, isLoading, onRowClick }: InvoiceTableProps) {
	const columns: ColumnDef<InvoiceResponse>[] = [
		{
			accessorKey: 'invoiceNumber',
			header: 'Invoice #',
			cell: ({ getValue }) => (
				<span className="font-mono text-xs font-semibold">
					{getValue<string>()}
				</span>
			),
			size: 140,
		},
		{
			id: 'student',
			header: 'Student',
			cell: ({ row }) => (
				<span className="font-medium">{row.original.studentName}</span>
			),
		},
		{
			id: 'total',
			header: () => <div className="text-right">Total</div>,
			cell: ({ row }) => (
				<div className="text-right tabular-nums">
					{formatPrice(row.original.total)} UZS
				</div>
			),
			size: 150,
		},
		{
			id: 'paid',
			header: () => <div className="text-right">Paid</div>,
			cell: ({ row }) => (
				<div className="text-right tabular-nums text-tone-green-fg">
					{formatPrice(row.original.amountPaid)} UZS
				</div>
			),
			size: 150,
		},
		{
			id: 'balance',
			header: () => <div className="text-right">Balance</div>,
			cell: ({ row }) => (
				<div
					className={
						row.original.amountDue > 0
							? 'text-right tabular-nums text-tone-red-fg'
							: 'text-right tabular-nums text-muted-foreground'
					}
				>
					{formatPrice(row.original.amountDue)} UZS
				</div>
			),
			size: 150,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ getValue }) => (
				<StatusBadge kind="invoice" status={getValue<string>()} />
			),
			size: 110,
		},
		{
			accessorKey: 'dueDate',
			header: 'Due',
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
			onRowClick={onRowClick}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No invoices match this filter.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
