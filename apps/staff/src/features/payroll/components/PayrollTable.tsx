import { MoreHorizontal } from 'lucide-react';

import {
	Button,
	DataTable,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	Spinner,
	StatusBadge,
	toast,
	type ColumnDef,
} from '@repo/ui';
import { formatDate, formatMoney } from '@repo/utils';

import type { PayrollResponse } from '../api/payroll.queries';
import { useApprovePayroll, useMarkPayrollPaid } from '../api/payroll.mutations';

function StaffAvatar({ staff }: { staff: PayrollResponse['staff'] }) {
	const initials = staff
		? `${staff.firstName?.[0] ?? ''}${staff.lastName?.[0] ?? ''}`.toUpperCase()
		: '?';
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
			{initials}
		</div>
	);
}

function RowActions({
	payroll,
	canApprove,
	canPay,
}: {
	payroll: PayrollResponse;
	canApprove: boolean;
	canPay: boolean;
}) {
	const approve = useApprovePayroll();
	const markPaid = useMarkPayrollPaid();
	const isPending = approve.isPending || markPaid.isPending;

	// The only action for each status is permission-gated; if the caller can't
	// perform the one that applies, there's nothing to show.
	const actionable =
		(payroll.status === 'DRAFT' && canApprove) ||
		(payroll.status === 'APPROVED' && canPay);
	if (payroll.status === 'PAID' || !actionable) {
		return <span className="text-muted-foreground">—</span>;
	}

	function handleApprove() {
		approve.mutate(payroll.id, {
			onSuccess: () => toast.success('Payroll approved'),
		});
	}

	function handleMarkPaid() {
		markPaid.mutate(payroll.id, {
			onSuccess: () => toast.success('Payroll marked as paid'),
		});
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="size-8 p-0"
					disabled={isPending}
					onClick={(e) => e.stopPropagation()}
					aria-label="Payroll actions"
				>
					{isPending ? (
						<Spinner className="size-4" />
					) : (
						<MoreHorizontal className="size-4" />
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
				{payroll.status === 'DRAFT' && canApprove && (
					<DropdownMenuItem onClick={handleApprove}>Approve</DropdownMenuItem>
				)}
				{payroll.status === 'APPROVED' && canPay && (
					<DropdownMenuItem onClick={handleMarkPaid}>
						Mark paid
					</DropdownMenuItem>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

interface PayrollTableProps {
	payrolls: PayrollResponse[];
	isLoading?: boolean;
	/** Whether the caller may approve DRAFT payroll (`payroll.approve`). */
	canApprove: boolean;
	/** Whether the caller may mark APPROVED payroll paid (`payroll.pay`). */
	canPay: boolean;
	onRowClick?: (payroll: PayrollResponse) => void;
}

export function PayrollTable({
	payrolls,
	isLoading,
	canApprove,
	canPay,
	onRowClick,
}: PayrollTableProps) {
	const columns: ColumnDef<PayrollResponse>[] = [
		{
			id: 'staff',
			header: 'Staff',
			cell: ({ row }) => {
				const { staff } = row.original;
				return (
					<div className="flex items-center gap-2.5">
						<StaffAvatar staff={staff} />
						<span className="font-medium">
							{staff ? `${staff.firstName} ${staff.lastName}` : '—'}
						</span>
					</div>
				);
			},
		},
		{
			id: 'period',
			header: 'Period',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(row.original.periodStart)} –{' '}
					{formatDate(row.original.periodEnd)}
				</span>
			),
		},
		{
			accessorKey: 'grossAmount',
			header: () => <div className="text-right">Gross</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums">
					{formatMoney(getValue<number>())}
				</div>
			),
			size: 144,
		},
		{
			accessorKey: 'deductions',
			header: () => <div className="text-right">Deductions</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums text-destructive">
					{formatMoney(getValue<number>())}
				</div>
			),
			size: 144,
		},
		{
			accessorKey: 'netAmount',
			header: () => <div className="text-right">Net</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm font-bold tabular-nums">
					{formatMoney(getValue<number>())}
				</div>
			),
			size: 144,
		},
		{
			id: 'hours',
			header: () => <div className="text-right">Hrs</div>,
			cell: ({ row }) => (
				<div className="text-right text-sm tabular-nums text-muted-foreground">
					{row.original.breakdown?.hoursTaught ?? '—'}
				</div>
			),
			size: 72,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ getValue }) => (
				<StatusBadge kind="payroll" status={getValue<string>()} />
			),
			size: 112,
		},
	];

	if (canApprove || canPay) {
		columns.push({
			id: 'actions',
			header: () => <span className="sr-only">Actions</span>,
			cell: ({ row }) => (
				<RowActions
					payroll={row.original}
					canApprove={canApprove}
					canPay={canPay}
				/>
			),
			size: 56,
		});
	}

	return (
		<DataTable
			columns={columns}
			data={payrolls}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={onRowClick}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No payroll records for this filter.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
