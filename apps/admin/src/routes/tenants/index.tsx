import { useMemo, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';

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
import { MOCK_TENANTS } from './_mock';
import type { PlanId, TenantStatus } from './_mock';

// TODO: replace with useQuery(tenantsQuery()) once GET /admin/tenants is ready.
const ALL = MOCK_TENANTS;
const PAGE_SIZE = 20;

const PLAN_LABELS: Record<PlanId, string> = {
	starter: 'Starter',
	growth: 'Growth',
	enterprise: 'Enterprise',
};

const STATUS_TABS: { value: TenantStatus | 'all'; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'active', label: 'Active' },
	{ value: 'trialing', label: 'Trialing' },
	{ value: 'past_due', label: 'Past due' },
	{ value: 'suspended', label: 'Suspended' },
	{ value: 'cancelled', label: 'Cancelled' },
];

/** Deterministic avatar colour per tenant, cycles through tone palette. */
const AVATAR_PALETTE = [
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

const AVATAR_INDEX = new Map(ALL.map((t, i) => [t.id, i]));

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

/** Compact MRR for KPI strip (e.g. "48.6M"). */
function formatMrrKpi(uzs: number): string {
	if (uzs >= 1_000_000_000) return `${(uzs / 1_000_000_000).toFixed(1)}B`;
	if (uzs >= 1_000_000) return `${(uzs / 1_000_000).toFixed(1)}M`;
	return `${(uzs / 1_000).toFixed(0)}K`;
}

/** Full UZS amount in Uzbek/Russian number format (space-separated thousands). */
function formatMrrRow(uzs: number): string {
	if (uzs === 0) return '—';
	return new Intl.NumberFormat('ru-RU').format(uzs);
}

function timeAgo(iso: string): string {
	const diff = Date.now() - new Date(iso).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 60) return `${mins}m ago`;
	const hrs = Math.floor(mins / 60);
	if (hrs < 24) return `${hrs}h ago`;
	const days = Math.floor(hrs / 24);
	if (days < 30) return `${days}d ago`;
	return `${Math.floor(days / 30)}mo ago`;
}

export function TenantsPage() {
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [statusTab, setStatusTab] = useState<TenantStatus | 'all'>('all');
	const [page, setPage] = useState(0);

	// Global KPI stats from all tenants (not affected by filters)
	const kpi = useMemo(() => {
		let active = 0,
			trialing = 0,
			past_due = 0,
			suspended = 0,
			mrr = 0;
		for (const t of ALL) {
			if (t.status === 'active') active++;
			else if (t.status === 'trialing') trialing++;
			else if (t.status === 'past_due') past_due++;
			else if (t.status === 'suspended') suspended++;
			mrr += t.mrr;
		}
		return { active, trialing, past_due, suspended, mrr };
	}, []);

	// Filter by search query; drives both tab counts and the table
	const searchFiltered = useMemo(() => {
		const q = search.toLowerCase().trim();
		if (!q) return ALL;
		return ALL.filter(
			(t) =>
				t.name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q),
		);
	}, [search]);

	// Per-status counts within current search results (shown in tabs)
	const tabCounts = useMemo(() => {
		const c: Partial<Record<TenantStatus | 'all', number>> = {
			all: searchFiltered.length,
		};
		for (const t of searchFiltered) {
			c[t.status] = (c[t.status] ?? 0) + 1;
		}
		return c;
	}, [searchFiltered]);

	const filtered = useMemo(
		() =>
			statusTab === 'all'
				? searchFiltered
				: searchFiltered.filter((t) => t.status === statusTab),
		[searchFiltered, statusTab],
	);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, pageCount - 1);
	const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
	const rangeStart = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
	const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

	function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
		setSearch(e.target.value);
		setPage(0);
	}

	function handleTab(value: TenantStatus | 'all') {
		setStatusTab(value);
		setPage(0);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* ── Page header ──────────────────────────────────────────────── */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">Tenants</h1>
					<p className="text-sm text-muted-foreground">
						Every education center on the EduCore platform · {ALL.length}{' '}
						total
					</p>
				</div>
				<Button disabled>+ Onboard center</Button>
			</div>

			{/* ── KPI strip ────────────────────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
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
						<p className="text-xs text-muted-foreground">Suspended</p>
						<p className="mt-1 text-3xl font-bold text-tone-red-fg">
							{kpi.suspended}
						</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<p className="text-xs text-muted-foreground">Total MRR</p>
						<p className="mt-1 text-2xl font-bold">{formatMrrKpi(kpi.mrr)}</p>
					</CardContent>
				</Card>
			</div>

			{/* ── Filter bar ───────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-3">
				{/* Search */}
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

				{/* Status tabs */}
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

				{/* Export */}
				<Button variant="outline" size="sm" className="ml-auto gap-1.5">
					<Download className="size-3.5" />
					Export
				</Button>
			</div>

			{/* ── Table ────────────────────────────────────────────────────── */}
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
							<TableHead className="text-right">Last active</TableHead>
							<TableHead className="w-10" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={8}
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
									{/* Center */}
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

									{/* Plan — plain text, no badge */}
									<TableCell className="text-sm text-muted-foreground">
										{PLAN_LABELS[tenant.plan]}
									</TableCell>

									{/* Status */}
									<TableCell>
										<StatusBadge
											kind="tenant"
											status={tenant.status}
										/>
									</TableCell>

									{/* Branches */}
									<TableCell className="text-right tabular-nums">
										{tenant.branches}
									</TableCell>

									{/* Students */}
									<TableCell className="text-right tabular-nums">
										{tenant.students.toLocaleString('ru-RU')}
									</TableCell>

									{/* MRR */}
									<TableCell className="text-right tabular-nums text-sm">
										{formatMrrRow(tenant.mrr)}
									</TableCell>

									{/* Last active */}
									<TableCell className="text-right text-sm text-muted-foreground">
										{timeAgo(tenant.lastActiveAt)}
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
							: `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} tenants`}
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
