import { useNavigate, useSearch } from '@tanstack/react-router';

import {
	Avatar,
	AvatarFallback,
	Card,
	CardContent,
	DataTable,
	Pagination,
	Skeleton,
	StatusBadge,
	cn,
	type ColumnDef,
} from '@repo/ui';

import { formatDate, formatPrice, formatPriceCompact } from '@repo/utils';
import {
	useSubscriptionAnalytics,
	useSubscriptionList,
} from '@/features/subscriptions/hooks';
import { PAGE_SIZE, STATUS_TABS } from '@/features/subscriptions/constants';
import { avatarClass, getInitials } from '@/features/subscriptions/utils';
import { BillingDateCell } from '@/features/subscriptions/components/BillingDateCell';
import type { SubscriptionStatus } from '@/api/subscriptions/types';

type SubscriptionRow = NonNullable<
	ReturnType<typeof useSubscriptionList>['data']
>['rows'][number];

const columns: ColumnDef<SubscriptionRow>[] = [
	{
		id: 'tenant',
		header: 'Tenant',
		cell: ({ row }) => {
			const sub = row.original;
			return (
				<div className="flex items-center gap-3">
					<Avatar className="size-8 shrink-0">
						<AvatarFallback
							className={cn('text-xs font-bold', avatarClass(sub.tenantId))}
						>
							{getInitials(sub.tenantName ?? '?')}
						</AvatarFallback>
					</Avatar>
					<span className="truncate text-sm font-medium">
						{sub.tenantName ?? `Tenant #${sub.tenantId}`}
					</span>
				</div>
			);
		},
	},
	{
		id: 'plan',
		header: 'Plan',
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{row.original.tierName ?? `Tier #${row.original.subscriptionTierId}`}
			</span>
		),
	},
	{
		accessorKey: 'status',
		header: 'Status',
		cell: ({ row }) => <StatusBadge kind="tenant" status={row.original.status} />,
	},
	{
		accessorKey: 'monthlyValue',
		header: () => 'MRR',
		cell: ({ getValue }) => (
			<div className="tabular-nums text-sm font-medium">
				{formatPrice(getValue<number>())}
			</div>
		),
	},
	{
		accessorKey: 'currentPeriodStart',
		header: () => 'Period start',
		cell: ({ getValue }) => (
			<div className="text-sm text-muted-foreground">
				{formatDate(getValue<string>())}
			</div>
		),
	},
	{
		id: 'nextBill',
		header: () => 'Next bill',
		cell: ({ row }) => (
			<BillingDateCell
				status={row.original.status}
				currentPeriodEnd={row.original.currentPeriodEnd}
				cancelledAt={row.original.cancelledAt}
			/>
		),
	},
];

export function SubscriptionsPage() {
	const navigate = useNavigate();
	const { page = 1, status } = useSearch({ from: '/_authed/subscriptions' });

	const analyticsQuery = useSubscriptionAnalytics();
	const listQuery = useSubscriptionList({ page, status });

	const analytics = analyticsQuery.data;
	const list = listQuery.data;
	const total = list?.total ?? 0;

	function handleTab(value: SubscriptionStatus | 'all') {
		void navigate({
			search: () => ({
				status: value === 'all' ? undefined : value,
				page: undefined,
			}),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	const tabCounts: Partial<Record<SubscriptionStatus | 'all', number>> = {};
	if (analytics) {
		tabCounts['ACTIVE'] = analytics.current.activeCount;
		tabCounts['TRIALING'] = analytics.current.trialingCount;
		tabCounts['PAST_DUE'] = analytics.current.pastDueCount;
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">Subscriptions</h1>
				<p className="text-sm text-muted-foreground">
					Per-tenant billing lifecycle across the platform.
				</p>
			</div>

			{/* ── KPI strip ────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Active</p>
						{analyticsQuery.isLoading ? (
							<Skeleton className="mt-1 h-8 w-12" />
						) : (
							<p className="mt-1 text-3xl font-bold text-tone-green-fg">
								{analytics?.current.activeCount ?? '—'}
							</p>
						)}
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Trialing</p>
						{analyticsQuery.isLoading ? (
							<Skeleton className="mt-1 h-8 w-12" />
						) : (
							<p className="mt-1 text-3xl font-bold text-tone-blue-fg">
								{analytics?.current.trialingCount ?? '—'}
							</p>
						)}
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Past due</p>
						{analyticsQuery.isLoading ? (
							<Skeleton className="mt-1 h-8 w-12" />
						) : (
							<p className="mt-1 text-3xl font-bold text-tone-amber-fg">
								{analytics?.current.pastDueCount ?? '—'}
							</p>
						)}
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Total MRR</p>
						{analyticsQuery.isLoading ? (
							<Skeleton className="mt-1 h-7 w-24" />
						) : (
							<p className="mt-1 text-2xl font-bold">
								{analytics
									? formatPriceCompact(analytics.current.mrr)
									: '—'}
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* ── Status filter tabs ───────────────────────────────────────── */}
			<div className="flex items-center gap-0.5 overflow-x-auto">
				{STATUS_TABS.map((tab) => {
					const isActive = (status ?? 'all') === tab.value;
					const count = tabCounts[tab.value];
					return (
						<button
							key={tab.value}
							type="button"
							onClick={() => handleTab(tab.value)}
							className={cn(
								'cursor-pointer inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors',
								isActive
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-muted hover:text-foreground',
							)}
						>
							{tab.label}
							{count != null && (
								<span
									className={cn(
										'min-w-5 rounded px-1 text-center text-xs font-semibold tabular-nums',
										isActive
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

			{listQuery.isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load subscriptions. Please refresh.
				</div>
			)}

			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={columns}
					data={list?.rows ?? []}
					isLoading={listQuery.isLoading}
					getRowId={(row) => String(row.id)}
					emptyState={
						<div className="py-16 text-center text-sm text-muted-foreground">
							No subscriptions match your filters.
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
		</div>
	);
}
