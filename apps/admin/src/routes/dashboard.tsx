import {
	Activity,
	ArrowUpRight,
	Building2,
	CreditCard,
	Database,
	HardDrive,
	Mail,
	MessageSquare,
	Server,
	TrendingDown,
	TrendingUp,
	Users,
	Wallet,
} from 'lucide-react';
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Separator,
	Skeleton,
	StatCard,
	StatusBadge,
} from '@repo/ui';

import { dashboardKeys } from '@/features/dashboard/api/keys';
import { getDashboard } from '@/features/dashboard/api/dashboard.queries';
import type { DashboardKpis } from '@/features/dashboard/api/types';
import { formatUzsCompact, formatUzsAxis } from '@/lib/formatters/currency';

// ─── Constants ────────────────────────────────────────────────────────────────

const TOOLTIP_STYLE: React.CSSProperties = {
	backgroundColor: '#131c30',
	border: '1px solid #1e293b',
	borderRadius: '0.5rem',
	color: '#f1f5f9',
	fontSize: 12,
};

const TENANT_STATUS_COLORS: Record<string, string> = {
	ACTIVE: '#22c55e',
	PENDING: '#60a5fa',
	SUSPENDED: '#f97316',
	CANCELLED: '#94a3b8',
};

const SERVICES = [
	{ name: 'API', icon: Server },
	{ name: 'Database', icon: Database },
	{ name: 'Storage', icon: HardDrive },
	{ name: 'Email', icon: Mail },
	{ name: 'SMS', icon: MessageSquare },
	{ name: 'Payments', icon: CreditCard },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

function TrendChip({ value, upIsGood = true }: { value: number; upIsGood?: boolean }) {
	const isUp = value >= 0;
	const isGood = upIsGood ? isUp : !isUp;
	const Icon = isUp ? TrendingUp : TrendingDown;
	const abs = Math.abs(value).toFixed(1);
	return (
		<span
			className={`inline-flex items-center gap-1 text-xs font-semibold tabular-nums ${
				isGood ? 'text-tone-green-fg' : 'text-tone-red-fg'
			}`}
		>
			<Icon className="size-3" />
			{abs}%
		</span>
	);
}

// ─── Skeleton states ──────────────────────────────────────────────────────────

function KpiSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
			{Array.from({ length: 6 }, (_, i) => (
				<Card key={i} className="py-0">
					<CardContent className="px-5 py-4">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="mt-2 h-8 w-16" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function ChartSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			{Array.from({ length: 3 }, (_, i) => (
				<Card key={i} className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<Skeleton className="h-4 w-28" />
					</CardHeader>
					<CardContent className="flex items-center justify-center px-2 py-4">
						<Skeleton className="h-45 w-full" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}

// ─── Dashboard content ────────────────────────────────────────────────────────

function DashboardContent({ data }: { data: DashboardKpis }) {
	const trendData = data.mrr.trend.slice(-6).map((p) => ({
		month: p.periodMonth.slice(5),
		revenue: p.mrr,
		signups: p.signups,
	}));

	const tenantStatusData = (Object.entries(data.tenants.byStatus) as [string, number][])
		.filter(([, count]) => count > 0)
		.map(([status, count]) => ({
			name: status.charAt(0) + status.slice(1).toLowerCase(),
			count,
			fill: TENANT_STATUS_COLORS[status] ?? '#94a3b8',
		}));

	return (
		<>
			{/* ── Section A: KPI strip ─────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
				<StatCard
					label="Total Tenants"
					value={data.tenants.total}
					icon={<Building2 />}
					delta={{ value: `+${data.tenants.newThisMonth} this month` }}
					hint="all time"
				/>
				<StatCard
					label="Active Tenants"
					value={data.tenants.active}
					icon={<Building2 />}
					hint={`of ${data.tenants.total} total`}
				/>
				<StatCard
					label="MRR"
					value={formatUzsCompact(data.mrr.current)}
					icon={<Wallet />}
					delta={{
						value:
							data.mrr.growth != null ? (
								<TrendChip value={data.mrr.growth} />
							) : undefined,
					}}
					hint="vs last month"
				/>
				<StatCard
					label="Total Students"
					value={data.students.active.toLocaleString()}
					icon={<Users />}
				/>
				<StatCard
					label="New This Month"
					value={data.tenants.newThisMonth}
					icon={<ArrowUpRight />}
					hint="tenant sign-ups"
				/>
				<StatCard
					label="Churn Rate"
					value={`${data.mrr.churnRate.toFixed(1)}%`}
					icon={<Activity />}
					delta={{
						value: <TrendChip value={data.mrr.churnRate} upIsGood={false} />,
					}}
					hint="this period"
				/>
			</div>

			{/* ── Section B: Charts ─────────────────────────────────────── */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{/* Revenue trend */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Revenue Trend
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							Last 6 months (UZS)
						</p>
					</CardHeader>
					<CardContent className="px-2 py-4">
						<ResponsiveContainer width="100%" height={180}>
							<LineChart data={trendData} margin={{ left: 0, right: 8 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
								<XAxis
									dataKey="month"
									tick={{ fill: '#64748b', fontSize: 11 }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fill: '#64748b', fontSize: 11 }}
									axisLine={false}
									tickLine={false}
									tickFormatter={(v: number) => formatUzsAxis(v)}
									width={36}
								/>
								<Tooltip contentStyle={TOOLTIP_STYLE} />
								<Line
									type="monotone"
									dataKey="revenue"
									stroke="#818cf8"
									strokeWidth={2}
									dot={false}
									activeDot={{ r: 4, fill: '#818cf8' }}
								/>
							</LineChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* New signups */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							New Signups
						</CardTitle>
						<p className="text-xs text-muted-foreground">Tenants per month</p>
					</CardHeader>
					<CardContent className="px-2 py-4">
						<ResponsiveContainer width="100%" height={180}>
							<BarChart data={trendData} margin={{ left: 0, right: 8 }}>
								<CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
								<XAxis
									dataKey="month"
									tick={{ fill: '#64748b', fontSize: 11 }}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={{ fill: '#64748b', fontSize: 11 }}
									axisLine={false}
									tickLine={false}
									width={24}
									allowDecimals={false}
								/>
								<Tooltip contentStyle={TOOLTIP_STYLE} />
								<Bar
									dataKey="signups"
									fill="#60a5fa"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>

				{/* Tenant status distribution */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Tenant Status
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							Lifecycle breakdown
						</p>
					</CardHeader>
					<CardContent className="flex items-center justify-center px-2 py-4">
						<ResponsiveContainer width="100%" height={180}>
							<PieChart>
								<Pie
									data={tenantStatusData}
									dataKey="count"
									nameKey="name"
									cx="50%"
									cy="45%"
									innerRadius={48}
									outerRadius={72}
									paddingAngle={2}
									stroke="transparent"
								>
									{tenantStatusData.map((entry) => (
										<Cell key={entry.name} fill={entry.fill} />
									))}
								</Pie>
								<Tooltip contentStyle={TOOLTIP_STYLE} />
								<Legend
									iconType="circle"
									iconSize={8}
									wrapperStyle={{ color: '#94a3b8', fontSize: 12 }}
								/>
							</PieChart>
						</ResponsiveContainer>
					</CardContent>
				</Card>
			</div>

			{/* ── Section C: Attention + Monthly Highlights ─────────────── */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Needs Attention */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Needs Attention
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							Suspended or at-risk tenants
						</p>
					</CardHeader>
					<CardContent className="px-0 py-0">
						{data.atRisk.tenants.length === 0 ? (
							<p className="px-5 py-6 text-sm text-tone-green-fg">
								All tenants healthy ✓
							</p>
						) : (
							<ul>
								{data.atRisk.tenants.map((tenant, i) => (
									<li key={tenant.tenantId}>
										{i > 0 && <Separator />}
										<div className="flex items-center gap-3 px-5 py-3">
											<Avatar className="size-8">
												<AvatarFallback className="bg-tone-indigo-bg text-xs font-semibold text-tone-indigo-fg">
													{getInitials(tenant.name)}
												</AvatarFallback>
											</Avatar>
											<span className="flex-1 truncate text-sm font-medium">
												{tenant.name}
											</span>
											<StatusBadge
												kind="tenant"
												status={tenant.status}
											/>
											<Button
												variant="outline"
												size="sm"
												className="shrink-0 text-xs"
											>
												View
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				{/* Monthly Highlights */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Monthly Highlights
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							Current period at a glance
						</p>
					</CardHeader>
					<CardContent className="px-0 py-0">
						{[
							{
								label: 'New tenants',
								value: `+${data.tenants.newThisMonth}`,
								tone: 'text-tone-green-fg',
							},
							{
								label: 'New subscriptions',
								value: `+${data.mrr.signups}`,
								tone: 'text-tone-blue-fg',
							},
							{
								label: 'Churned',
								value:
									data.mrr.churned > 0 ? `-${data.mrr.churned}` : '0',
								tone:
									data.mrr.churned > 0
										? 'text-tone-red-fg'
										: 'text-muted-foreground',
							},
							{
								label: 'MRR growth',
								value:
									data.mrr.growth != null
										? `${data.mrr.growth > 0 ? '+' : ''}${data.mrr.growth.toFixed(1)}%`
										: '—',
								tone:
									(data.mrr.growth ?? 0) >= 0
										? 'text-tone-green-fg'
										: 'text-tone-red-fg',
							},
							{
								label: 'Revenue collected',
								value:
									data.revenue.processedThisMonth > 0
										? formatUzsCompact(
												data.revenue.processedThisMonth,
											)
										: '—',
								tone: 'text-foreground',
							},
						].map((item, i, arr) => (
							<div key={item.label}>
								<div className="flex items-center justify-between px-5 py-3">
									<span className="text-sm text-muted-foreground">
										{item.label}
									</span>
									<span
										className={`text-sm font-semibold tabular-nums ${item.tone}`}
									>
										{item.value}
									</span>
								</div>
								{i < arr.length - 1 && <Separator />}
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			{/* ── Section D: System Services ────────────────────────────── */}
			<Card className="gap-0 py-0">
				<CardHeader className="border-b border-border px-5 py-4">
					<CardTitle className="text-sm font-semibold">
						System Services
					</CardTitle>
					<p className="text-xs text-muted-foreground">
						Live status — all times UTC+5
					</p>
				</CardHeader>
				<CardContent className="px-5 py-4">
					<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
						{SERVICES.map(({ name, icon: Icon }) => (
							<div
								key={name}
								className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3"
							>
								<div className="flex items-center gap-2.5">
									<Icon className="size-4 text-muted-foreground" />
									<span className="text-sm font-medium">{name}</span>
								</div>
								<StatusBadge tone="green">Operational</StatusBadge>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DashboardPage() {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: dashboardKeys.overview(),
		queryFn: getDashboard,
	});

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			{/* Page header */}
			<div>
				<h1 className="text-xl font-semibold">Dashboard</h1>
				<p className="text-sm text-muted-foreground">
					Platform overview and health
				</p>
			</div>

			{isLoading ? (
				<>
					<KpiSkeleton />
					<ChartSkeleton />
				</>
			) : isError ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load dashboard data
					{error instanceof Error ? `: ${error.message}` : '.'}
				</div>
			) : data ? (
				<DashboardContent data={data} />
			) : null}
		</div>
	);
}
