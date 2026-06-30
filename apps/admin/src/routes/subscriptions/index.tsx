import { useNavigate, useSearch } from '@tanstack/react-router';
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

import { formatPrice, formatPriceCompact } from '@/lib/formatters/currency';
import { formatDate } from '@/lib/formatters/date';
import {
	useSubscriptionAnalytics,
	useSubscriptionList,
} from '@/features/subscriptions/hooks';
import { PAGE_SIZE, STATUS_TABS } from '@/features/subscriptions/constants';
import { avatarClass, getInitials } from '@/features/subscriptions/utils';
import { BillingDateCell } from '@/features/subscriptions/components/BillingDateCell';
import { TableSkeleton } from '@/features/subscriptions/components/TableSkeleton';
import type { SubscriptionStatus } from '@/api/subscriptions/types';

export function SubscriptionsPage() {
	const navigate = useNavigate();
	const { page = 1, status } = useSearch({ from: '/_authed/subscriptions' });

	const analyticsQuery = useSubscriptionAnalytics();
	const listQuery = useSubscriptionList({ page, status });

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

									<TableCell className="text-sm text-muted-foreground">
										{sub.tierName ??
											`Tier #${sub.subscriptionTierId}`}
									</TableCell>

									<TableCell>
										<StatusBadge kind="tenant" status={sub.status} />
									</TableCell>

									<TableCell className="text-right tabular-nums text-sm font-medium">
										{formatPrice(sub.monthlyValue)}
									</TableCell>

									<TableCell className="text-right text-sm text-muted-foreground">
										{formatDate(sub.currentPeriodStart)}
									</TableCell>

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
