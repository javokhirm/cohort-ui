import { Tag } from 'lucide-react';

import { Badge, DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';

import type { DiscountResponse } from '../api/discounts.queries';
import { DISCOUNT_TYPE_OPTIONS } from '../lib/discount-options';

interface DiscountTableProps {
	discounts: DiscountResponse[];
	isLoading?: boolean;
	/** Row-click opens the edit form. Omit to disable editing (no `discount.manage`). */
	onEdit?: (discount: DiscountResponse) => void;
}

function typeLabel(type: DiscountResponse['type']): string {
	return DISCOUNT_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatValue(discount: DiscountResponse): string {
	return discount.type === 'PERCENTAGE'
		? `${discount.value}%`
		: `${formatPrice(discount.value)} UZS`;
}

function formatValidity(discount: DiscountResponse): string {
	const { validFrom, validUntil } = discount;
	if (validFrom && validUntil) {
		return `${formatDate(validFrom)} – ${formatDate(validUntil)}`;
	}
	if (validFrom) return `From ${formatDate(validFrom)}`;
	if (validUntil) return `Until ${formatDate(validUntil)}`;
	return '—';
}

export function DiscountTable({ discounts, isLoading, onEdit }: DiscountTableProps) {
	const columns: ColumnDef<DiscountResponse>[] = [
		{
			id: 'name',
			header: 'Name',
			cell: ({ row }) => (
				<div className="flex items-center gap-2.5">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Tag className="size-4" />
					</span>
					<span className="font-medium">{row.original.name}</span>
				</div>
			),
		},
		{
			accessorKey: 'type',
			header: 'Type',
			cell: ({ getValue }) => (
				<Badge variant="outline">
					{typeLabel(getValue<DiscountResponse['type']>())}
				</Badge>
			),
			size: 130,
		},
		{
			id: 'value',
			header: () => <div className="text-right">Value</div>,
			cell: ({ row }) => (
				<div className="text-right text-sm font-semibold tabular-nums">
					{formatValue(row.original)}
				</div>
			),
			size: 140,
		},
		{
			id: 'code',
			header: 'Promo code',
			cell: ({ row }) =>
				row.original.code ? (
					<span className="font-mono text-xs text-primary">
						{row.original.code}
					</span>
				) : (
					<span className="text-sm text-muted-foreground">—</span>
				),
			size: 140,
		},
		{
			id: 'validity',
			header: 'Validity',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatValidity(row.original)}
				</span>
			),
			size: 220,
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
			data={discounts}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={onEdit ? (row) => onEdit(row) : undefined}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No discounts match this filter.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
