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
	buildStatusTabs,
	tenantSubStatusLabel,
	SUB_STATUS_TONE,
	tenantStatusLabel,
	TENANT_STATUS_TONE,
	type StatusTab,
} from '@/features/tenants/constants';
import { useTenantsPage, useTenantSummary } from '@/features/tenants/hooks';
import { useAppT } from '@/locales';

type TenantRow = NonNullable<ReturnType<typeof useTenantsPage>['data']>['rows'][number];

/**
 * Built per render rather than held at module scope: the headers are
 * user-facing, so they must re-resolve when the language changes.
 */
function buildColumns(t: ReturnType<typeof useAppT<'tenants'>>): ColumnDef<TenantRow>[] {
	return [
		{
			id: 'center',
			header: t('column.center'),
			cell: ({ row }) => {
				const tenant = row.original;
				return (
					<div className="flex items-center gap-3">
						<Avatar className="size-8 shrink-0">
							<AvatarFallback
								className={cn(
									'text-xs font-bold',
									avatarClass(tenant.id),
								)}
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
			header: t('column.plan'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.plan?.name ?? '—'}
				</span>
			),
		},
		{
			id: 'status',
			header: t('column.status'),
			cell: ({ row }) => {
				const tenant = row.original;
				return (
					<div className="flex flex-col gap-1">
						<StatusBadge tone={TENANT_STATUS_TONE[tenant.status]}>
							{tenantStatusLabel(t, tenant.status)}
						</StatusBadge>
						{tenant.subscriptionStatus && (
							<StatusBadge
								tone={SUB_STATUS_TONE[tenant.subscriptionStatus]}
							>
								{tenantSubStatusLabel(t, tenant.subscriptionStatus)}
							</StatusBadge>
						)}
					</div>
				);
			},
		},
		{
			id: 'branches',
			header: () => <div className="text-right">{t('column.branches')}</div>,
			cell: ({ row }) => (
				<div className="text-right tabular-nums">{row.original.branches}</div>
			),
		},
		{
			id: 'students',
			header: () => <div className="text-right">{t('column.students')}</div>,
			cell: ({ row }) => (
				<div className="text-right tabular-nums">
					{formatNumber(row.original.students)}
				</div>
			),
		},
		{
			id: 'mrr',
			header: () => <div className="text-right">{t('column.mrr')}</div>,
			cell: ({ row }) => (
				<div className="text-right tabular-nums text-sm">
					{row.original.mrr === 0 ? '—' : formatPrice(row.original.mrr)}
				</div>
			),
		},
	];
}

export function TenantsPage() {
	const t = useAppT('tenants');
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
					<h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
					<p className="text-sm text-muted-foreground">
						{t('description')}
						{summary ? ` · ${t('totalCount', { count: summary.total })}` : ''}
					</p>
				</div>
				<Button
					onClick={() => void navigate({ to: '/tenants/onboard' as never })}
				>
					+ {t('onboard')}
				</Button>
			</div>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">
							{t('subStatusLabel.active')}
						</p>
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
						<p className="text-xs text-muted-foreground">
							{t('subStatusLabel.trialing')}
						</p>
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
						<p className="text-xs text-muted-foreground">
							{t('subStatusLabel.pastDue')}
						</p>
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
						<p className="text-xs text-muted-foreground">
							{t('statusLabel.suspended')}
						</p>
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
						<p className="text-xs text-muted-foreground">{t('totalMrr')}</p>
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
						placeholder={t('searchPlaceholder')}
						className="h-9 w-64 rounded-md border border-input bg-background pl-8 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>

				<div className="flex items-center gap-0.5 overflow-x-auto">
					{buildStatusTabs(t).map((tab) => {
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
												? 'bg-primary-foreground/20 text-primary-foreground'
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
					{t('loadError')}
				</div>
			)}

			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={buildColumns(t)}
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
						onPageChange={setPage}
					/>
				</div>
			</Card>
		</div>
	);
}
