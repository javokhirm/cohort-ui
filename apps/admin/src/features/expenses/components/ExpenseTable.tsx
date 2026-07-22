import { MoreHorizontal } from 'lucide-react';

import {
	Badge,
	Button,
	DataTable,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	StatusBadge,
	type ColumnDef,
} from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';

import { useBranches } from '@/api/branches';

import type { ExpenseResponse } from '../api/expenses.queries';

interface ExpenseTableProps {
	expenses: ExpenseResponse[];
	isLoading?: boolean;
	/** Row-click opens the edit form. Omit to disable editing (no `expense.update`). */
	onEdit?: (expense: ExpenseResponse) => void;
	/** Omit to hide the delete action (no `expense.delete`). */
	onDelete?: (expense: ExpenseResponse) => void;
}

/**
 * True only for rows a source flow owns (payroll mark-paid / advances). Uses a
 * loose null check on purpose: an absent `sourceType` must read as "manual", so
 * a field missing from the response can never lock the whole table.
 */
function isSourceOwned(expense: ExpenseResponse): boolean {
	return expense.sourceType != null;
}

/** "description — vendor" when both are set, otherwise whichever one is present. */
function vendorDescriptionLabel(expense: ExpenseResponse): string {
	if (expense.vendor && expense.description) {
		return `${expense.description} — ${expense.vendor}`;
	}
	return expense.vendor ?? expense.description ?? '—';
}

function RowActions({
	expense,
	onDelete,
}: {
	expense: ExpenseResponse;
	onDelete: (expense: ExpenseResponse) => void;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="size-8 p-0"
					onClick={(e) => e.stopPropagation()}
					aria-label="Expense actions"
				>
					<MoreHorizontal className="size-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
				<DropdownMenuItem variant="destructive" onClick={() => onDelete(expense)}>
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export function ExpenseTable({
	expenses,
	isLoading,
	onEdit,
	onDelete,
}: ExpenseTableProps) {
	const { data: branches = [] } = useBranches();
	const branchName = (id: number) => branches.find((b) => b.id === id)?.name ?? '—';

	const columns: ColumnDef<ExpenseResponse>[] = [
		{
			accessorKey: 'expenseDate',
			header: 'Date',
			cell: ({ getValue }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(getValue<string>())}
				</span>
			),
			size: 120,
		},
		{
			accessorKey: 'category',
			header: 'Category',
			cell: ({ getValue }) => (
				<StatusBadge kind="expense" status={getValue<string>()} />
			),
			size: 120,
		},
		{
			id: 'vendor',
			header: 'Vendor / Description',
			cell: ({ row }) => (
				<span className="flex items-center gap-2 text-sm font-medium">
					{vendorDescriptionLabel(row.original)}
					{isSourceOwned(row.original) && (
						<Badge variant="secondary" className="text-xs">
							Payroll
						</Badge>
					)}
				</span>
			),
		},
		{
			accessorKey: 'amount',
			header: () => <div className="text-right">Amount</div>,
			cell: ({ row }) => (
				<div className="text-right text-sm font-semibold tabular-nums">
					{formatPrice(row.original.amount)} {row.original.currency}
				</div>
			),
			size: 160,
		},
		{
			id: 'branch',
			header: 'Branch',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{branchName(row.original.branchId)}
				</span>
			),
			size: 140,
		},
	];

	if (onDelete) {
		columns.push({
			id: 'actions',
			header: () => <span className="sr-only">Actions</span>,
			// Auto rows (payroll-sourced) are managed from payroll — no actions.
			cell: ({ row }) =>
				isSourceOwned(row.original) ? (
					<span className="text-muted-foreground">—</span>
				) : (
					<RowActions expense={row.original} onDelete={onDelete} />
				),
			size: 56,
		});
	}

	return (
		<DataTable
			columns={columns}
			data={expenses}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={
				onEdit
					? (row) => {
							// Payroll-sourced rows are read-only here.
							if (!isSourceOwned(row)) onEdit(row);
						}
					: undefined
			}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No expenses match this filter.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
