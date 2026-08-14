import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { Card, DataTable, Pagination, type ColumnDef } from '@repo/ui';

import { formatDate, formatPrice } from '@repo/utils';
import { useSubscriptionPayments } from '@/features/subscription-payments/hooks';
import {
	PAGE_SIZE,
	paymentMethodLabel,
} from '@/features/subscription-payments/constants';
import { PaymentFilters } from '@/features/subscription-payments/components/PaymentFilters';
import { PaymentDetailSheet } from '@/features/subscription-payments/components/PaymentDetailSheet';
import { PaymentStatusBadge } from '@/features/subscription-payments/components/PaymentStatusBadge';
import type { SubscriptionPaymentView } from '@/api/subscription-payments/types';
import { useAppT } from '@/locales';

function buildColumns(
	t: ReturnType<typeof useAppT<'payments'>>,
): ColumnDef<SubscriptionPaymentView>[] {
	return [
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
			id: 'invoiceCode',
			header: t('column.invoice'),
			cell: ({ row }) => (
				<span className="font-mono text-xs text-muted-foreground">
					{row.original.invoiceCode ?? '—'}
				</span>
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
			accessorKey: 'method',
			header: t('column.method'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{paymentMethodLabel(t, row.original.method)}
				</span>
			),
		},
		{
			accessorKey: 'status',
			header: t('column.status'),
			cell: ({ row }) => <PaymentStatusBadge status={row.original.status} />,
		},
		{
			id: 'providerTxnId',
			header: t('column.txn'),
			cell: ({ row }) => (
				<span className="block max-w-40 truncate font-mono text-xs text-muted-foreground">
					{row.original.providerTxnId ?? '—'}
				</span>
			),
		},
		{
			accessorKey: 'createdAt',
			header: t('column.date'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDate(row.original.createdAt)}
				</span>
			),
		},
	];
}

export function SubscriptionPaymentsPage() {
	const t = useAppT('payments');
	const navigate = useNavigate({ from: '/subscription-payments' });
	const search = useSearch({ from: '/_authed/subscription-payments' });
	const { page = 1, tenantId, status, method, search: q, from, to } = search;

	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const listQuery = useSubscriptionPayments({
		page,
		limit: PAGE_SIZE,
		tenantId,
		status,
		method,
		search: q,
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

	function openDetail(row: SubscriptionPaymentView) {
		setSelectedId(row.id);
		setSheetOpen(true);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
				<p className="text-sm text-muted-foreground">{t('subtitle')}</p>
			</div>

			<PaymentFilters
				values={{ search: q, status, method, from, to }}
				onChange={patchFilters}
			/>

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

			<PaymentDetailSheet
				paymentId={selectedId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}
