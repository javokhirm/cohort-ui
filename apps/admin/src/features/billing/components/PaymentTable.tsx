import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

import {
	Button,
	DataTable,
	StatusBadge,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	type ColumnDef,
} from '@repo/ui';
import { formatDateTime, formatPrice } from '@repo/utils';

import type { PaymentResponse } from '../api/invoices.queries';
import { paymentMethodLabel } from '../lib/payment-options';
import { RefundPaymentDialog, type RefundablePayment } from './RefundPaymentDialog';

function isRefundable(payment: PaymentResponse): boolean {
	return payment.status === 'SUCCEEDED' && payment.method !== 'CREDIT';
}

function RowActions({
	payment,
	onRefundClick,
}: {
	payment: PaymentResponse;
	onRefundClick: (payment: PaymentResponse) => void;
}) {
	if (!isRefundable(payment)) {
		return <span className="text-muted-foreground">—</span>;
	}

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="size-8 p-0"
					aria-label="Refund payment"
					onClick={(e) => {
						e.stopPropagation();
						onRefundClick(payment);
					}}
				>
					<RotateCcw className="size-4" />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Refund</TooltipContent>
		</Tooltip>
	);
}

interface PaymentTableProps {
	payments: PaymentResponse[];
	isLoading?: boolean;
	/** Whether the caller may refund payments (`payment.refund`). */
	canRefund?: boolean;
	onRowClick?: (payment: PaymentResponse) => void;
}

export function PaymentTable({
	payments,
	isLoading,
	canRefund,
	onRowClick,
}: PaymentTableProps) {
	const [refundTarget, setRefundTarget] = useState<RefundablePayment | null>(null);

	const columns: ColumnDef<PaymentResponse>[] = [
		{
			id: 'transaction',
			header: 'Transaction',
			cell: ({ row }) => (
				<span className="font-mono text-xs font-semibold">
					#{row.original.id}
				</span>
			),
			size: 100,
		},
		{
			id: 'student',
			header: 'Student',
			cell: ({ row }) => (
				<span className="font-medium">{row.original.studentName}</span>
			),
		},
		{
			id: 'amount',
			header: () => <div className="text-right">Amount</div>,
			cell: ({ row }) => (
				<div className="text-right tabular-nums">
					{formatPrice(row.original.amount)} {row.original.currency}
				</div>
			),
			size: 150,
		},
		{
			id: 'method',
			header: 'Method',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{paymentMethodLabel(row.original.method)}
				</span>
			),
			size: 130,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ getValue }) => (
				<StatusBadge kind="payment" status={getValue<string>()} />
			),
			size: 110,
		},
		{
			id: 'paidAt',
			header: 'Date',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.paidAt ? formatDateTime(row.original.paidAt) : '—'}
				</span>
			),
			size: 160,
		},
	];

	if (canRefund) {
		columns.push({
			id: 'actions',
			header: () => <span className="sr-only">Actions</span>,
			cell: ({ row }) => (
				<RowActions payment={row.original} onRefundClick={setRefundTarget} />
			),
			size: 56,
		});
	}

	return (
		<>
			<DataTable
				columns={columns}
				data={payments}
				isLoading={isLoading}
				getRowId={(row) => String(row.id)}
				onRowClick={onRowClick}
				emptyState={
					<div className="py-16 text-center text-sm text-muted-foreground">
						No payments match this filter.
					</div>
				}
				className="rounded-none border-0"
			/>
			<RefundPaymentDialog
				payment={refundTarget}
				open={refundTarget != null}
				onOpenChange={(open) => {
					if (!open) setRefundTarget(null);
				}}
			/>
		</>
	);
}
