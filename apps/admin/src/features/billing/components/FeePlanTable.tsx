import { Layers } from 'lucide-react';

import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatPrice } from '@repo/utils';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import type { FeePlanResponse } from '../api/fee-plans.queries';

interface FeePlanTableProps {
	feePlans: FeePlanResponse[];
	isLoading?: boolean;
	/** Row-click opens the edit form. Omit to disable editing (no `fee-plan.manage`). */
	onEdit?: (feePlan: FeePlanResponse) => void;
}

export function FeePlanTable({ feePlans, isLoading, onEdit }: FeePlanTableProps) {
	const t = useAppT('billing');
	const tc = useT('common');
	const columns: ColumnDef<FeePlanResponse>[] = [
		{
			id: 'name',
			header: t('feePlans.column.name'),
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
			id: 'groups',
			header: t('feePlans.column.status'),
			// Groups reach a plan through their course; open a plan to see which.
			cell: ({ row }) => {
				const count = row.original.groupCount;
				return (
					<span className="text-sm text-muted-foreground">
						{count === 0
							? 'Not in use'
							: `${count} group${count === 1 ? '' : 's'}`}
					</span>
				);
			},
			size: 130,
		},
		{
			id: 'amount',
			header: () => <div className="text-right">{t('invoices.detail.amount')}</div>,
			cell: ({ row }) => (
				<div className="text-right text-sm font-semibold tabular-nums">
					{formatPrice(row.original.amount)} {row.original.currency}
				</div>
			),
			size: 160,
		},
		{
			accessorKey: 'billingCycle',
			header: t('feePlans.column.cycle'),
			cell: ({ getValue }) => (
				<StatusBadge
					kind="fee_cycle"
					status={getValue<FeePlanResponse['billingCycle']>()}
				/>
			),
			size: 120,
		},
		{
			accessorKey: 'isActive',
			header: t('feePlans.column.status'),
			cell: ({ getValue }) =>
				getValue<boolean>() ? (
					<StatusBadge tone="green">{tc('state.active')}</StatusBadge>
				) : (
					<StatusBadge tone="slate">{tc('state.inactive')}</StatusBadge>
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
