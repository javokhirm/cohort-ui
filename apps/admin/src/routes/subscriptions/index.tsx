// TODO: replace mock data + local state with useQuery(subscriptionsQuery()) once
//       GET /admin/subscriptions is ready.

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	cn,
} from '@repo/ui';
import { MOCK_SUBSCRIPTIONS } from './_mock';
import type { SubscriptionStatus } from './_mock';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL = MOCK_SUBSCRIPTIONS;
const PAGE_SIZE = 6;

const STATUS_TABS: { value: SubscriptionStatus | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'trialing', label: 'Trialing' },
	{ value: 'past_due', label: 'Past due' },
	{ value: 'suspended', label: 'Suspended' },
	{ value: 'cancelled', label: 'Cancelled' },
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

const AVATAR_INDEX = new Map(ALL.map((s, i) => [s.id, i]));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarClass(id: string) {
	return AVATAR_PALETTE[(AVATAR_INDEX.get(id) ?? 0) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

function formatMrr(uzs: number): string {
	if (uzs === 0) return '—';
	return new Intl.NumberFormat('ru-RU').format(uzs);
}

function formatMrrKpi(uzs: number): string {
	if (uzs >= 1_000_000_000) return `${(uzs / 1_000_000_000).toFixed(1)}B`;
	if (uzs >= 1_000_000) return `${(uzs / 1_000_000).toFixed(1)}M`;
	return `${(uzs / 1_000).toFixed(0)}K`;
}

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(iso));
}

function daysDiff(isoA: string, isoB: string): number {
	return Math.round((new Date(isoA).getTime() - new Date(isoB).getTime()) / 86_400_000);
}

// ─── NextBillCell ─────────────────────────────────────────────────────────────

function NextBillCell({
	status,
	nextBillAt,
	trialEndsAt,
	today,
}: {
	status: SubscriptionStatus;
	nextBillAt: string;
	trialEndsAt?: string;
	today: string;
}) {
	if (status === 'trialing' && trialEndsAt) {
		const daysLeft = daysDiff(trialEndsAt, today);
		return (
			<span className="text-sm font-medium text-tone-blue-fg">
				Trial · {daysLeft}d left
			</span>
		);
	}

	if (status === 'past_due') {
		const daysOver = daysDiff(today, nextBillAt);
		return (
			<span className="text-sm font-medium text-tone-red-fg">
				{daysOver}d overdue
			</span>
		);
	}

	if (status === 'cancelled') {
		return <span className="text-sm text-muted-foreground">—</span>;
	}

	return <span className="text-sm">{formatDate(nextBillAt)}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SubscriptionsPage() {
	const [statusTab, setStatusTab] = useState<SubscriptionStatus | 'all'>('all');
	const [page, setPage] = useState(0);

	// Fixed reference date (matches mock data); replace with new Date().toISOString().slice(0, 10) once live.
	const today = '2026-06-29';

	// Global KPI stats — not affected by filters
	const kpi = useMemo(() => {
		let active = 0,
			trialing = 0,
			past_due = 0,
			mrr = 0;
		for (const s of ALL) {
			if (s.status === 'active') active++;
			else if (s.status === 'trialing') trialing++;
			else if (s.status === 'past_due') past_due++;
			mrr += s.mrr;
		}
		return { active, trialing, past_due, mrr };
	}, []);

	// Per-status counts for tab badges
	const tabCounts = useMemo(() => {
		const c: Partial<Record<SubscriptionStatus | 'all', number>> = {
			all: ALL.length,
		};
		for (const s of ALL) {
			c[s.status] = (c[s.status] ?? 0) + 1;
		}
		return c;
	}, []);

	const filtered = useMemo(
		() => (statusTab === 'all' ? ALL : ALL.filter((s) => s.status === statusTab)),
		[statusTab],
	);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, pageCount - 1);
	const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
	const rangeStart = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
	const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

	function handleTab(value: SubscriptionStatus | 'all') {
		setStatusTab(value);
		setPage(0);
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
						<p className="mt-1 text-3xl font-bold text-tone-green-fg">
							{kpi.active}
						</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Trialing</p>
						<p className="mt-1 text-3xl font-bold text-tone-blue-fg">
							{kpi.trialing}
						</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Past due</p>
						<p className="mt-1 text-3xl font-bold text-tone-amber-fg">
							{kpi.past_due}
						</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Total MRR</p>
						<p className="mt-1 text-2xl font-bold">
							{formatMrrKpi(kpi.mrr)} UZS
						</p>
					</CardContent>
				</Card>
			</div>

			{/* ── Status filter tabs ───────────────────────────────────────── */}
			<div className="flex items-center gap-0.5 overflow-x-auto">
				{STATUS_TABS.map((tab) => {
					const active = statusTab === tab.value;
					const count = tabCounts[tab.value] ?? 0;
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
						</button>
					);
				})}
			</div>

			{/* ── Table ────────────────────────────────────────────────────── */}
			<Card className="gap-0 overflow-hidden py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-72">Tenant</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">MRR</TableHead>
							<TableHead className="text-right">Started</TableHead>
							<TableHead className="text-right">Next bill</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-16 text-center text-sm text-muted-foreground"
								>
									No subscriptions match your filters.
								</TableCell>
							</TableRow>
						) : (
							rows.map((sub) => (
								<TableRow key={sub.id}>
									{/* Tenant */}
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="size-8 shrink-0">
												<AvatarFallback
													className={cn(
														'text-xs font-bold',
														avatarClass(sub.id),
													)}
												>
													{getInitials(sub.tenantName)}
												</AvatarFallback>
											</Avatar>
											<span className="truncate text-sm font-medium">
												{sub.tenantName}
											</span>
										</div>
									</TableCell>

									{/* Plan */}
									<TableCell className="text-sm text-muted-foreground">
										{sub.plan}
									</TableCell>

									{/* Status */}
									<TableCell>
										<StatusBadge kind="tenant" status={sub.status} />
									</TableCell>

									{/* MRR */}
									<TableCell className="text-right tabular-nums text-sm font-medium">
										{formatMrr(sub.mrr)}
									</TableCell>

									{/* Started */}
									<TableCell className="text-right text-sm text-muted-foreground">
										{formatDate(sub.startedAt)}
									</TableCell>

									{/* Next bill */}
									<TableCell className="text-right">
										<NextBillCell
											status={sub.status}
											nextBillAt={sub.nextBillAt}
											trialEndsAt={sub.trialEndsAt}
											today={today}
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
						{filtered.length === 0
							? 'No results'
							: `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} subscriptions`}
					</p>

					{pageCount > 1 && (
						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={safePage === 0}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							{Array.from({ length: pageCount }, (_, i) => (
								<Button
									key={i}
									variant={i === safePage ? 'default' : 'ghost'}
									size="icon"
									className="size-8 text-xs"
									onClick={() => setPage(i)}
								>
									{i + 1}
								</Button>
							))}
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={safePage >= pageCount - 1}
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
