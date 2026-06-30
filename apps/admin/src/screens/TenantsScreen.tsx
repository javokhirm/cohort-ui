import { useState } from 'react';

import { Link, useNavigate } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	Skeleton,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	cn,
} from '@repo/ui';
import type { StatusTone } from '@repo/ui';

import { tenantsKeys } from '@/api/tenants/keys';
import { listTenants, getTenantSummary } from '@/api/tenants/tenants.queries';
import type { SubscriptionStatus, TenantStatus } from '@/api/tenants/types';
import { avatarClass, getInitials } from '@/features/tenants/utils';

// ─── Status maps ──────────────────────────────────────────────────────────────

const TENANT_STATUS_TONE: Record<TenantStatus, StatusTone> = {
	ACTIVE: 'green',
	PENDING: 'blue',
	SUSPENDED: 'red',
	CANCELLED: 'slate',
};

const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
	ACTIVE: 'Active',
	PENDING: 'Pending',
	SUSPENDED: 'Suspended',
	CANCELLED: 'Cancelled',
};

const SUB_STATUS_TONE: Record<SubscriptionStatus, StatusTone> = {
	TRIALING: 'blue',
	ACTIVE: 'green',
	PAST_DUE: 'amber',
	CANCELLED: 'slate',
};

const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
	TRIALING: 'Trialing',
	ACTIVE: 'Active',
	PAST_DUE: 'Past due',
	CANCELLED: 'Cancelled',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

type StatusTab = TenantStatus | 'all';

const STATUS_TABS: { value: StatusTab; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'SUSPENDED', label: 'Suspended' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMrrKpi(uzs: number): string {
	if (uzs >= 1_000_000_000) return `${(uzs / 1_000_000_000).toFixed(1)}B`;
	if (uzs >= 1_000_000) return `${(uzs / 1_000_000).toFixed(1)}M`;
	return `${(uzs / 1_000).toFixed(0)}K`;
}

function formatMrrRow(uzs: number): string {
	if (uzs === 0) return '—';
	return new Intl.NumberFormat('ru-RU').format(uzs);
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function TenantsScreen() {
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [statusTab, setStatusTab] = useState<StatusTab>('all');
	const [page, setPage] = useState(1);

	const filters = {
		status: statusTab === 'all' ? undefined : statusTab,
		search: debouncedSearch || undefined,
		page,
		limit: PAGE_SIZE,
	};

	const {
		data: tenantsPage,
		isLoading,
		isError,
	} = useQuery({
		queryKey: tenantsKeys.list(filters),
		queryFn: () => listTenants(filters),
		placeholderData: keepPreviousData,
	});

	const { data: summary } = useQuery({
		queryKey: tenantsKeys.summary(),
		queryFn: getTenantSummary,
	});

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

	const rows = tenantsPage?.rows ?? [];
	const totalPages = tenantsPage?.totalPages ?? 1;
	const total = tenantsPage?.total ?? 0;
	const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const rangeEnd = Math.min(page * PAGE_SIZE, total);

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
						Every education center on the EduCore platform
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
								{formatMrrKpi(summary.totalMrr)}
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
						placeholder="Search center or subdomain..."
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
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-72">Center</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Branches</TableHead>
							<TableHead className="text-right">Students</TableHead>
							<TableHead className="text-right">MRR</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 6 }, (_, i) => (
								<TableRow key={i}>
									<TableCell>
										<div className="flex items-center gap-3">
											<Skeleton className="size-8 rounded-full" />
											<div className="flex flex-col gap-1">
												<Skeleton className="h-4 w-36" />
												<Skeleton className="h-3 w-24" />
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Skeleton className="h-4 w-16" />
									</TableCell>
									<TableCell>
										<Skeleton className="h-5 w-20 rounded-full" />
									</TableCell>
									<TableCell className="text-right">
										<Skeleton className="ml-auto h-4 w-6" />
									</TableCell>
									<TableCell className="text-right">
										<Skeleton className="ml-auto h-4 w-12" />
									</TableCell>
									<TableCell className="text-right">
										<Skeleton className="ml-auto h-4 w-20" />
									</TableCell>
								</TableRow>
							))
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-16 text-center text-sm text-muted-foreground"
								>
									No tenants match your filters.
								</TableCell>
							</TableRow>
						) : (
							rows.map((tenant) => (
								<TableRow
									key={tenant.id}
									className="cursor-pointer"
									onClick={() =>
										void navigate({
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											to: `/tenants/${tenant.id}` as any,
										})
									}
								>
									<TableCell>
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
												<Link
													// eslint-disable-next-line @typescript-eslint/no-explicit-any
													to={`/tenants/${tenant.id}` as any}
													className="truncate text-sm font-medium leading-tight hover:underline"
												>
													{tenant.name}
												</Link>
												<p className="truncate text-xs text-muted-foreground">
													{tenant.subdomain}.educore.uz
												</p>
											</div>
										</div>
									</TableCell>

									<TableCell className="text-sm text-muted-foreground">
										{tenant.plan?.name ?? '—'}
									</TableCell>

									<TableCell>
										<div className="flex flex-col gap-1">
											<StatusBadge
												tone={TENANT_STATUS_TONE[tenant.status]}
											>
												{TENANT_STATUS_LABEL[tenant.status]}
											</StatusBadge>
											{tenant.subscriptionStatus && (
												<StatusBadge
													tone={
														SUB_STATUS_TONE[
															tenant.subscriptionStatus
														]
													}
												>
													{
														SUB_STATUS_LABEL[
															tenant.subscriptionStatus
														]
													}
												</StatusBadge>
											)}
										</div>
									</TableCell>

									<TableCell className="text-right tabular-nums">
										{tenant.branches}
									</TableCell>

									<TableCell className="text-right tabular-nums">
										{tenant.students.toLocaleString('ru-RU')}
									</TableCell>

									<TableCell className="text-right tabular-nums text-sm">
										{formatMrrRow(tenant.mrr)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				<div className="flex items-center justify-between border-t border-border px-4 py-3">
					<p className="text-xs text-muted-foreground">
						{total === 0
							? 'No results'
							: `Showing ${rangeStart}–${rangeEnd} of ${total} tenants`}
					</p>

					{totalPages > 1 && (
						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
								const p = i + 1;
								return (
									<Button
										key={p}
										variant={p === page ? 'default' : 'ghost'}
										size="icon"
										className="size-8 text-xs"
										onClick={() => setPage(p)}
									>
										{p}
									</Button>
								);
							})}
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page >= totalPages}
								onClick={() => setPage((p) => p + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
