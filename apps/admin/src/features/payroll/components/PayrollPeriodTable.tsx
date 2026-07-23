import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatMoney } from '@repo/utils';

import type { PayrollPeriodRow } from '../api/payroll.queries';
import { LiveBadge } from './LiveBadge';
import { RateTypeBadge } from './RateTypeBadge';
import { useAppT } from '@/locales';

interface PayrollPeriodTableProps {
	rows: PayrollPeriodRow[];
	isLoading?: boolean;
	onRowClick?: (row: PayrollPeriodRow) => void;
}

function teacherInitials(name: string): string {
	const [first, last] = name.split(' ');
	return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}

/** The month's per-teacher rows — click through to the per-student breakdown. */
export function PayrollPeriodTable({
	rows,
	isLoading,
	onRowClick,
}: PayrollPeriodTableProps) {
	const t = useAppT('payroll');
	const columns: ColumnDef<PayrollPeriodRow>[] = [
		{
			id: 'teacher',
			header: t('column.staff'),
			cell: ({ row }) => {
				const { staffName, staffCode, position } = row.original;
				return (
					<div className="flex items-center gap-2.5">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
							{teacherInitials(staffName)}
						</span>
						<div className="min-w-0">
							<div className="truncate text-sm font-semibold">
								{staffName}
							</div>
							<div className="truncate text-xs text-muted-foreground">
								{[staffCode, position].filter(Boolean).join(' · ')}
							</div>
						</div>
					</div>
				);
			},
		},
		{
			id: 'type',
			header: t('column.type'),
			cell: ({ row }) => (
				<RateTypeBadge
					rateType={row.original.rateType}
					percent={row.original.percent}
				/>
			),
			size: 100,
		},
		{
			accessorKey: 'sessionsTaught',
			header: () => <div className="text-right">Sessions</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums text-muted-foreground">
					{getValue<number>()}
				</div>
			),
			size: 88,
		},
		{
			accessorKey: 'studentsCount',
			header: () => <div className="text-right">Students</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums text-muted-foreground">
					{getValue<number>()}
				</div>
			),
			size: 88,
		},
		{
			accessorKey: 'grossAmount',
			header: () => <div className="text-right">Computed</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums">
					{formatMoney(getValue<number>())}
				</div>
			),
			size: 144,
		},
		{
			accessorKey: 'advancesTotal',
			header: () => <div className="text-right">Advances</div>,
			cell: ({ getValue }) => {
				const advances = getValue<number>();
				return (
					<div
						className={
							advances > 0
								? 'text-right text-sm tabular-nums text-tone-red-fg'
								: 'text-right text-sm tabular-nums text-muted-foreground'
						}
					>
						{advances > 0 ? `−${formatMoney(advances)}` : formatMoney(0)}
					</div>
				);
			},
			size: 132,
		},
		{
			accessorKey: 'netAmount',
			header: () => <div className="text-right">Net payable</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm font-bold tabular-nums">
					{formatMoney(getValue<number>())}
				</div>
			),
			size: 144,
		},
		{
			accessorKey: 'status',
			header: () => <div className="text-right">Status</div>,
			cell: ({ row }) => (
				<div className="flex justify-end">
					{row.original.status === 'LIVE' ? (
						<LiveBadge />
					) : (
						<StatusBadge kind="payroll" status={row.original.status} />
					)}
				</div>
			),
			size: 104,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={rows}
			isLoading={isLoading}
			getRowId={(row) => String(row.staffId)}
			onRowClick={onRowClick}
			emptyState={
				<div className="py-16 text-center">
					<p className="text-sm font-semibold">No teachers match this filter</p>
					<p className="mt-1 text-sm text-muted-foreground">
						No completed sessions or active payroll config in this window.
					</p>
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
