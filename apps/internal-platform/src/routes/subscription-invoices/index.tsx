import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { Card, DataTable, Pagination, type ColumnDef } from '@repo/ui';

import { formatDate, formatPrice } from '@repo/utils';
import { useSubscriptionInvoices } from '@/features/subscription-invoices/hooks';
import {
	PAGE_SIZE,
	billingIntervalLabel,
} from '@/features/subscription-invoices/constants';
import { InvoiceFilters } from '@/features/subscription-invoices/components/InvoiceFilters';
import { InvoiceDetailSheet } from '@/features/subscription-invoices/components/InvoiceDetailSheet';
import { InvoiceStatusBadge } from '@/features/subscription-invoices/components/InvoiceStatusBadge';
import type { SubscriptionInvoiceView } from '@/api/subscription-invoices/types';
import { useAppT } from '@/locales';

function buildColumns(
	t: ReturnType<typeof useAppT<'invoices'>>,
): ColumnDef<SubscriptionInvoiceView>[] {
	return [
		{
			accessorKey: 'code',
			header: t('column.code'),
			cell: ({ row }) => (
				<span className="font-mono text-xs font-medium">{row.original.code}</span>
			),
		},
		{
			id: 'tenant',
			header: t('column.tenant'),
			cell: ({ row }) => (
				<span className="text-sm font-medium">
					{t('tenantRef', { id: row.original.tenantId })}
				</span>
			),
		},
		{
			id: 'plan',
			header: t('column.plan'),
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="text-sm">{row.original.tierName}</span>
					<span className="text-xs text-muted-foreground">
						{billingIntervalLabel(t, row.original.billingInterval)}
					</span>
				</div>
			),
		},
		{
			accessorKey: 'amount',
			header: () => <div className="text-right">{t('column.amount')}</div>,
			cell: ({ row }) => (
				<div className="text-right text-sm font-medium tabular-nums">
					{formatPrice(row.original.amount)} {row.original.currency}
				</div>
			),
		},
		{
			accessorKey: 'status',
			header: t('column.status'),
			cell: ({ row }) => <InvoiceStatusBadge status={row.original.status} />,
		},
		{
			accessorKey: 'issueDate',
			header: t('column.issued'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(row.original.issueDate)}
				</span>
			),
		},
		{
			id: 'period',
			header: t('column.period'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(row.original.periodStart)} –{' '}
					{formatDate(row.original.periodEnd)}
				</span>
			),
		},
	];
}

export function SubscriptionInvoicesPage() {
	const t = useAppT('invoices');
	const navigate = useNavigate({ from: '/subscription-invoices' });
	const search = useSearch({ from: '/_authed/subscription-invoices' });
	const { page = 1, tenantId, status, from, to } = search;

	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const listQuery = useSubscriptionInvoices({
		page,
		limit: PAGE_SIZE,
		tenantId,
		status,
		from,
		to,
	});
	const list = listQuery.data;
	const total = list?.total ?? 0;

	function patchFilters(patch: Record<string, unknown>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	function openDetail(row: SubscriptionInvoiceView) {
		setSelectedId(row.id);
		setSheetOpen(true);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
				<p className="text-sm text-muted-foreground">{t('subtitle')}</p>
			</div>

			<InvoiceFilters values={{ status, from, to }} onChange={patchFilters} />

			{listQuery.isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{t('loadError')}
				</div>
			)}

			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={buildColumns(t)}
					data={list?.rows ?? []}
					isLoading={listQuery.isLoading}
					getRowId={(row) => String(row.id)}
					onRowClick={openDetail}
					emptyState={
						<div className="py-16 text-center text-sm text-muted-foreground">
							{t('empty')}
						</div>
					}
					className="rounded-none border-0"
				/>
				<div className="border-t border-border px-4 py-3">
					<Pagination
						page={page}
						pageSize={PAGE_SIZE}
						total={total}
						onPageChange={handlePage}
					/>
				</div>
			</Card>

			<InvoiceDetailSheet
				invoiceId={selectedId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}
