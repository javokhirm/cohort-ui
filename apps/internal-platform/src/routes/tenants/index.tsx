import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	DataTable,
	Pagination,
	Skeleton,
	StatusBadge,
	cn,
	type ColumnDef,
} from '@repo/ui';

import { formatNumber, formatPrice, formatPriceAxis } from '@repo/utils';
import { avatarClass, getInitials } from '@/features/tenants/utils';
import {
	PAGE_SIZE,
	STATUS_TABS,
	SUB_STATUS_LABEL,
	SUB_STATUS_TONE,
	TENANT_STATUS_LABEL,
	TENANT_STATUS_TONE,
	type StatusTab,
} from '@/features/tenants/constants';
import { useTenantsPage, useTenantSummary } from '@/features/tenants/hooks';

type TenantRow = NonNullable<ReturnType<typeof useTenantsPage>['data']>['rows'][number];

const columns: ColumnDef<TenantRow>[] = [
	{
		id: 'center',
		header: 'Center',
		cell: ({ row }) => {
			const tenant = row.original;
			return (
				<div className="flex items-center gap-3">
					<Avatar className="size-8 shrink-0">
						<AvatarFallback
							className={cn('text-xs font-bold', avatarClass(tenant.id))}
						>
							{getInitials(tenant.name)}
						</AvatarFallback>
					</Avatar>
					<div className="min-w-0">
						<p className="truncate text-sm font-medium leading-tight">
							{tenant.name}
						</p>
					</div>
				</div>
			);
		},
	},
	{
		id: 'plan',
		header: 'Plan',
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{row.original.plan?.name ?? '—'}
			</span>
		),
	},
	{
		id: 'status',
		header: 'Status',
		cell: ({ row }) => {
			const tenant = row.original;
			return (
				<div className="flex flex-col gap-1">
					<StatusBadge tone={TENANT_STATUS_TONE[tenant.status]}>
						{TENANT_STATUS_LABEL[tenant.status]}
					</StatusBadge>
					{tenant.subscriptionStatus && (
						<StatusBadge tone={SUB_STATUS_TONE[tenant.subscriptionStatus]}>
							{SUB_STATUS_LABEL[tenant.subscriptionStatus]}
						</StatusBadge>
					)}
				</div>
			);
		},
	},
	{
		id: 'branches',
		header: () => <div className="text-right">Branches</div>,
		cell: ({ row }) => (
			<div className="text-right tabular-nums">{row.original.branches}</div>
		),
	},
	{
		id: 'students',
		header: () => <div className="text-right">Students</div>,
		cell: ({ row }) => (
			<div className="text-right tabular-nums">
				{formatNumber(row.original.students)}
			</div>
		),
	},
	{
		id: 'mrr',
		header: () => <div className="text-right">MRR</div>,
		cell: ({ row }) => (
			<div className="text-right tabular-nums text-sm">
				{row.original.mrr === 0 ? '—' : formatPrice(row.original.mrr)}
			</div>
		),
	},
];

export function TenantsPage() {
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [statusTab, setStatusTab] = useState<StatusTab>('all');
	const [page, setPage] = useState(1);

	const {
		data: tenantsPage,
		isLoading,
		isError,
	} = useTenantsPage({
		statusTab,
		search: debouncedSearch,
		page,
	});

	const { data: summary } = useTenantSummary();

	function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
		const val = e.target.value;
		setSearch(val);
		setPage(1);
		const timer = setTimeout(() => setDebouncedSearch(val), 300);
		return () => clearTimeout(timer);
	}

	function handleTab(value: StatusTab) {
		setStatusTab(value);
		setPage(1);
	}

	const total = tenantsPage?.total ?? 0;

	function tabCount(tab: StatusTab): number {
		if (!summary) return 0;
		if (tab === 'all') return summary.total;
		return summary.byStatus[tab] ?? 0;
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">Tenants</h1>
					<p className="text-sm text-muted-foreground">
						Every education center on the Cohort platform
						{summary ? ` · ${summary.total} total` : ''}
					</p>
				</div>
				<Button
					onClick={() => void navigate({ to: '/tenants/onboard' as never })}
				>
					+ Onboard center
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Active</p>
						{summary ? (
							<p className="mt-1 text-3xl font-bold text-tone-green-fg">
								{summary.bySubscription.ACTIVE}
							</p>
						) : (
							<Skeleton className="mt-2 h-8 w-16" />
						)}
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Trialing</p>
						{summary ? (
							<p className="mt-1 text-3xl font-bold text-tone-blue-fg">
								{summary.bySubscription.TRIALING}
							</p>
						) : (
							<Skeleton className="mt-2 h-8 w-16" />
						)}
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Past due</p>
						{summary ? (
							<p className="mt-1 text-3xl font-bold text-tone-amber-fg">
								{summary.bySubscription.PAST_DUE}
							</p>
						) : (
							<Skeleton className="mt-2 h-8 w-16" />
						)}
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Suspended</p>
						{summary ? (
							<p className="mt-1 text-3xl font-bold text-tone-red-fg">
								{summary.byStatus.SUSPENDED}
							</p>
						) : (
							<Skeleton className="mt-2 h-8 w-16" />
						)}
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Total MRR</p>
						{summary ? (
							<p className="mt-1 text-2xl font-bold">
								{formatPriceAxis(summary.totalMrr)}
							</p>
						) : (
							<Skeleton className="mt-2 h-7 w-20" />
						)}
					</CardContent>
				</Card>
			</div>

			<div className="flex flex-wrap items-center gap-3">
				<div className="relative">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="search"
						value={search}
						onChange={handleSearch}
						placeholder="Search centers..."
						className="h-9 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>

				<div className="flex items-center gap-0.5 overflow-x-auto">
					{STATUS_TABS.map((tab) => {
						const active = statusTab === tab.value;
						const count = tabCount(tab.value);
						return (
							<button
								key={tab.value}
								type="button"
								onClick={() => handleTab(tab.value)}
								className={cn(
									'cursor-pointer inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
									active
										? 'bg-primary text-primary-foreground'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground',
								)}
							>
								{tab.label}
								{summary && (
									<span
										className={cn(
											'min-w-5 rounded px-1 text-center text-xs font-semibold tabular-nums',
											active
												? 'bg-white/20 text-primary-foreground'
												: 'bg-muted text-muted-foreground',
										)}
									>
										{count}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load tenants. Please refresh.
				</div>
			)}

			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={columns}
					data={tenantsPage?.rows ?? []}
					isLoading={isLoading}
					getRowId={(row) => String(row.id)}
					onRowClick={(row) =>
						void navigate({
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							to: `/tenants/${row.id}` as any,
						})
					}
					emptyState={
						<div className="py-16 text-center text-sm text-muted-foreground">
							No tenants match your filters.
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
