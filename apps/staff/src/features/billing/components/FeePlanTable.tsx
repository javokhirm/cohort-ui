import { Layers } from 'lucide-react';

import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatPrice } from '@repo/utils';

import { useCourseList } from '@/features/courses/api/courses.queries';

import type { FeePlanResponse } from '../api/fee-plans.queries';

interface FeePlanTableProps {
	feePlans: FeePlanResponse[];
	isLoading?: boolean;
	/** Row-click opens the edit form. Omit to disable editing (no `fee-plan.manage`). */
	onEdit?: (feePlan: FeePlanResponse) => void;
}

export function FeePlanTable({ feePlans, isLoading, onEdit }: FeePlanTableProps) {
	const { data: courseData } = useCourseList({ limit: 100 });
	const courses = courseData?.rows ?? [];
	const courseName = (id: number | null) => {
		if (id == null) return 'Any';
		return courses.find((c) => c.id === id)?.name ?? '—';
	};

	const columns: ColumnDef<FeePlanResponse>[] = [
		{
			id: 'name',
			header: 'Plan',
			cell: ({ row }) => (
				<div className="flex items-center gap-2.5">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Layers className="size-4" />
					</span>
					<span className="font-medium">{row.original.name}</span>
				</div>
			),
		},
		{
			id: 'course',
			header: 'Course',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{courseName(row.original.courseId)}
				</span>
			),
		},
		{
			id: 'amount',
			header: () => <div className="text-right">Amount</div>,
			cell: ({ row }) => (
				<div className="text-right text-sm font-semibold tabular-nums">
					{formatPrice(row.original.amount)} {row.original.currency}
				</div>
			),
			size: 160,
		},
		{
			accessorKey: 'billingCycle',
			header: 'Cycle',
			cell: ({ getValue }) => (
				<StatusBadge
					kind="fee_cycle"
					status={getValue<FeePlanResponse['billingCycle']>()}
				/>
			),
			size: 120,
		},
		{
			id: 'due',
			header: 'Due',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					Day {row.original.dueDay}
				</span>
			),
			size: 90,
		},
		{
			id: 'lateFee',
			header: () => <div className="text-right">Late fee</div>,
			cell: ({ row }) =>
				row.original.lateFeeAmount > 0 ? (
					<div className="text-right text-sm tabular-nums text-muted-foreground">
						{formatPrice(row.original.lateFeeAmount)} {row.original.currency}
					</div>
				) : (
					<div className="text-right text-sm text-muted-foreground">—</div>
				),
			size: 140,
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			cell: ({ getValue }) =>
				getValue<boolean>() ? (
					<StatusBadge tone="green">Active</StatusBadge>
				) : (
					<StatusBadge tone="slate">Inactive</StatusBadge>
				),
			size: 100,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={feePlans}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={onEdit ? (row) => onEdit(row) : undefined}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No fee plans match this filter.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
