import { useNavigate, useSearch } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

import { formatUzs, formatUzsCompact } from '@/lib/formatters/currency';
import { subscriptionsKeys } from '@/features/subscriptions/api/keys';
import {
	getSubscriptionAnalytics,
	listSubscriptions,
} from '@/features/subscriptions/api/subscriptions.queries';
import type { SubscriptionStatus } from '@/features/subscriptions/api/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

const STATUS_TABS: { value: SubscriptionStatus | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'TRIALING', label: 'Trialing' },
	{ value: 'PAST_DUE', label: 'Past due' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

const AVATAR_PALETTE = [
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarClass(id: number): string {
	return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(iso));
}

// ─── BillingDateCell ──────────────────────────────────────────────────────────

function BillingDateCell({
	status,
	currentPeriodEnd,
	cancelledAt,
}: {
	status: SubscriptionStatus;
	currentPeriodEnd: string;
	cancelledAt: string | null;
}) {
	if (status === 'TRIALING') {
		return <span className="text-sm font-medium text-tone-blue-fg">In trial</span>;
	}

	if (status === 'PAST_DUE') {
		return (
			<span className="text-sm font-medium text-tone-red-fg">
				Overdue · {formatDate(currentPeriodEnd)}
			</span>
		);
	}

	if (status === 'CANCELLED') {
		return (
			<span className="text-sm text-muted-foreground">
				{cancelledAt ? formatDate(cancelledAt) : '—'}
			</span>
		);
	}

	return <span className="text-sm">{formatDate(currentPeriodEnd)}</span>;
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton() {
	return (
		<>
			{Array.from({ length: PAGE_SIZE }, (_, i) => (
				<TableRow key={i}>
					<TableCell>
						<div className="flex items-center gap-3">
							<Skeleton className="size-8 rounded-full" />
							<Skeleton className="h-4 w-36" />
						</div>
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-20" />
					</TableCell>
					<TableCell>
						<Skeleton className="h-5 w-16" />
					</TableCell>
					<TableCell className="text-right">
						<Skeleton className="ml-auto h-4 w-20" />
					</TableCell>
					<TableCell className="text-right">
						<Skeleton className="ml-auto h-4 w-20" />
					</TableCell>
					<TableCell className="text-right">
						<Skeleton className="ml-auto h-4 w-24" />
					</TableCell>
				</TableRow>
			))}
		</>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SubscriptionsPage() {
	const navigate = useNavigate();
	const { page = 1, status } = useSearch({ from: '/_authed/subscriptions' });

	const analyticsQuery = useQuery({
		queryKey: subscriptionsKeys.analytics(),
		queryFn: getSubscriptionAnalytics,
	});

	const listQuery = useQuery({
		queryKey: subscriptionsKeys.list({ page, limit: PAGE_SIZE, status }),
		queryFn: () => listSubscriptions({ page, limit: PAGE_SIZE, status }),
	});

	const analytics = analyticsQuery.data;
	const list = listQuery.data;

	const totalPages = list ? Math.max(1, list.totalPages) : 1;
	const total = list?.total ?? 0;
	const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const rangeEnd = Math.min(page * PAGE_SIZE, total);

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
			{/* ── Page header ──────────────────────────────────────────────── */}
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
									? formatUzsCompact(analytics.current.mrr)
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

			{/* ── Error state ──────────────────────────────────────────────── */}
			{listQuery.isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load subscriptions. Please refresh.
				</div>
			)}

			{/* ── Table ────────────────────────────────────────────────────── */}
			<Card className="gap-0 overflow-hidden py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-72">Tenant</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">MRR</TableHead>
							<TableHead className="text-right">Period start</TableHead>
							<TableHead className="text-right">Next bill</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{listQuery.isLoading ? (
							<TableSkeleton />
						) : !list || list.rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-16 text-center text-sm text-muted-foreground"
								>
									No subscriptions match your filters.
								</TableCell>
							</TableRow>
						) : (
							list.rows.map((sub) => (
								<TableRow key={sub.id}>
									{/* Tenant */}
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="size-8 shrink-0">
												<AvatarFallback
													className={cn(
														'text-xs font-bold',
														avatarClass(sub.tenantId),
													)}
												>
													{getInitials(
														sub.tenantName ??
															sub.tenantSubdomain ??
															'?',
													)}
												</AvatarFallback>
											</Avatar>
											<span className="truncate text-sm font-medium">
												{sub.tenantName ??
													sub.tenantSubdomain ??
													`Tenant #${sub.tenantId}`}
											</span>
										</div>
									</TableCell>

									{/* Plan */}
									<TableCell className="text-sm text-muted-foreground">
										{sub.tierName ??
											`Tier #${sub.subscriptionTierId}`}
									</TableCell>

									{/* Status */}
									<TableCell>
										<StatusBadge kind="tenant" status={sub.status} />
									</TableCell>

									{/* MRR */}
									<TableCell className="text-right tabular-nums text-sm font-medium">
										{formatUzs(sub.monthlyValue)}
									</TableCell>

									{/* Period start */}
									<TableCell className="text-right text-sm text-muted-foreground">
										{formatDate(sub.currentPeriodStart)}
									</TableCell>

									{/* Next bill */}
									<TableCell className="text-right">
										<BillingDateCell
											status={sub.status}
											currentPeriodEnd={sub.currentPeriodEnd}
											cancelledAt={sub.cancelledAt}
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{/* ── Pagination footer ─────────────────────────────────────── */}
				<div className="flex items-center justify-between border-t border-border px-4 py-3">
					<p className="text-xs text-muted-foreground">
						{listQuery.isLoading
							? 'Loading…'
							: total === 0
								? 'No results'
								: `Showing ${rangeStart}–${rangeEnd} of ${total} subscriptions`}
					</p>

					{totalPages > 1 && (
						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page <= 1}
								onClick={() => handlePage(page - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							{Array.from({ length: totalPages }, (_, i) => (
								<Button
									key={i}
									variant={i + 1 === page ? 'default' : 'ghost'}
									size="icon"
									className="size-8 text-xs"
									onClick={() => handlePage(i + 1)}
								>
									{i + 1}
								</Button>
							))}
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page >= totalPages}
								onClick={() => handlePage(page + 1)}
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
