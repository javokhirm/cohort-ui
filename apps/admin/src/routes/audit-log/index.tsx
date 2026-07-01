import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import {
	Card,
	DataTable,
	Pagination,
	type ColumnDef,
} from '@repo/ui';

import { formatDateTime as formatTimestamp } from '@/lib/formatters/date';
import { useAuditLogs } from '@/features/audit-log/hooks';
import { PAGE_SIZE } from '@/features/audit-log/constants';

type AuditLogRow = NonNullable<ReturnType<typeof useAuditLogs>['data']>['rows'][number];

const columns: ColumnDef<AuditLogRow>[] = [
	{
		accessorKey: 'timestamp',
		header: 'Timestamp',
		cell: ({ getValue }) => (
			<span className="text-xs text-muted-foreground tabular-nums">
				{formatTimestamp(getValue<string>())}
			</span>
		),
	},
	{
		id: 'actor',
		header: 'Actor',
		cell: ({ row }) => (
			<div className="text-sm">
				<div className="font-medium">{row.original.actor.name ?? '—'}</div>
				{row.original.actor.role && (
					<div className="text-xs text-muted-foreground">
						{row.original.actor.role}
					</div>
				)}
			</div>
		),
	},
	{
		id: 'tenant',
		header: 'Tenant',
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{row.original.tenant ? (
					row.original.tenant.name
				) : (
					<span className="italic">Platform</span>
				)}
			</span>
		),
	},
	{
		accessorKey: 'action',
		header: 'Action',
		cell: ({ getValue }) => (
			<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
				{getValue<string>()}
			</code>
		),
	},
	{
		id: 'entity',
		header: 'Entity',
		cell: ({ row }) => (
			<span className="text-xs text-muted-foreground">
				{row.original.entityType
					? `${row.original.entityType}${row.original.entityId != null ? ` #${row.original.entityId}` : ''}`
					: '—'}
			</span>
		),
	},
	{
		accessorKey: 'ipAddress',
		header: 'IP Address',
		cell: ({ getValue }) => (
			<span className="text-xs text-muted-foreground tabular-nums">
				{getValue<string | null>() ?? '—'}
			</span>
		),
	},
];

export function AuditLogPage() {
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);

	const filters = {
		search: debouncedSearch || undefined,
		page,
		limit: PAGE_SIZE,
	};

	const { data, isLoading, isError } = useAuditLogs(filters);

	function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
		const val = e.target.value;
		setSearch(val);
		setPage(1);
		const timer = setTimeout(() => setDebouncedSearch(val), 300);
		return () => clearTimeout(timer);
	}

	const total = data?.total ?? 0;

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">Audit Log</h1>
				<p className="text-sm text-muted-foreground">
					Platform-wide action trail — newest first
					{total > 0 ? ` · ${total} entries` : ''}
				</p>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="relative">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="search"
						value={search}
						onChange={handleSearch}
						placeholder="Search action, actor, tenant…"
						className="h-9 w-72 rounded-md border border-input bg-background pl-8 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
			</div>

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load audit logs. Please refresh.
				</div>
			)}

			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={columns}
					data={data?.rows ?? []}
					isLoading={isLoading}
					getRowId={(row) => String(row.id)}
					onRowClick={(row) =>
						void navigate({
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							to: `/audit-log/${row.id}` as any,
						})
					}
					emptyState={
						<div className="py-16 text-center text-sm text-muted-foreground">
							No audit log entries match your filters.
						</div>
					}
					className="rounded-none border-0"
				/>
				<div className="border-t border-border px-4 py-3">
					<Pagination
						page={page}
						pageSize={PAGE_SIZE}
						total={total}
						onPageChange={setPage}
					/>
				</div>
			</Card>
		</div>
	);
}
