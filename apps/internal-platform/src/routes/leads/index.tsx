import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { Card, DataTable, StatusBadge, Pagination, type ColumnDef } from '@repo/ui';

import { formatDateTime } from '@repo/utils';
import type { PlatformLead } from '@/api/platformLeads/types';
import { LeadDetailSheet } from '@/features/platform-leads/components/LeadDetailSheet';
import { LeadFilters } from '@/features/platform-leads/components/LeadFilters';
import {
	PLATFORM_LEAD_SOURCE_TONE,
	platformLeadSourceLabel,
	PAGE_SIZE,
} from '@/features/platform-leads/constants';
import { usePlatformLeadList } from '@/features/platform-leads/hooks';
import { useAppT } from '@/locales';

function buildColumns(t: ReturnType<typeof useAppT<'leads'>>): ColumnDef<PlatformLead>[] {
	return [
		{
			id: 'name',
			header: t('column.name'),
			cell: ({ row }) => (
				<div className="flex flex-col">
					<span className="text-sm font-medium">{row.original.name}</span>
					<span className="text-xs text-muted-foreground">
						{row.original.email}
					</span>
				</div>
			),
		},
		{
			accessorKey: 'phone',
			header: t('column.phone'),
			cell: ({ row }) => (
				<span className="text-sm tabular-nums text-muted-foreground">
					{row.original.phone ?? '—'}
				</span>
			),
		},
		{
			accessorKey: 'centerName',
			header: t('column.center'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.centerName ?? '—'}
				</span>
			),
		},
		{
			accessorKey: 'source',
			header: t('column.source'),
			cell: ({ row }) => (
				<StatusBadge
					tone={PLATFORM_LEAD_SOURCE_TONE[row.original.source] ?? 'slate'}
				>
					{platformLeadSourceLabel(t, row.original.source)}
				</StatusBadge>
			),
		},
		{
			accessorKey: 'createdAt',
			header: t('column.createdAt'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDateTime(row.original.createdAt)}
				</span>
			),
		},
	];
}

export function LeadsPage() {
	const t = useAppT('leads');
	const navigate = useNavigate({ from: '/leads' });
	const { page = 1, search: q, source } = useSearch({ from: '/_authed/leads' });

	const [selected, setSelected] = useState<PlatformLead | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const listQuery = usePlatformLeadList({ page, limit: PAGE_SIZE, search: q, source });
	const list = listQuery.data;
	const total = list?.total ?? 0;

	function patchFilters(patch: Record<string, unknown>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch, page: undefined }) });
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	function openDetail(row: PlatformLead) {
		setSelected(row);
		setSheetOpen(true);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
				<p className="text-sm text-muted-foreground">{t('subtitle')}</p>
			</div>

			<LeadFilters values={{ search: q, source }} onChange={patchFilters} />

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

			<LeadDetailSheet
				lead={selected}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</div>
	);
}
