import { Activity, ArrowUpRight, Building2, Users, Wallet } from 'lucide-react';
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

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Separator,
	StatCard,
	StatusBadge,
} from '@repo/ui';
import {
	formatNumber,
	formatPercent,
	formatPriceAxis,
	formatPriceCompact,
} from '@repo/utils';
import type { DashboardKpis } from '@/api/dashboard/types';

import {
	AXIS_TICK,
	CHART,
	SERVICES,
	TENANT_STATUS_COLORS,
	TENANT_STATUS_FALLBACK,
	TOOLTIP_STYLE,
} from '../constants';
import { getInitials } from '../utils';
import { TrendChip } from './TrendChip';

export function DashboardContent({ data }: { data: DashboardKpis }) {
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
			fill: TENANT_STATUS_COLORS[status] ?? TENANT_STATUS_FALLBACK,
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
					value={formatPriceCompact(data.mrr.current)}
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
					value={formatNumber(data.students.active)}
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
					value={formatPercent(data.mrr.churnRate)}
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
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={CHART.grid}
								/>
								<XAxis
									dataKey="month"
									tick={AXIS_TICK}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={AXIS_TICK}
									axisLine={false}
									tickLine={false}
									tickFormatter={(v: number) => formatPriceAxis(v)}
									width={36}
								/>
								<Tooltip contentStyle={TOOLTIP_STYLE} />
								<Line
									type="monotone"
									dataKey="revenue"
									stroke={CHART.revenue}
									strokeWidth={2}
									dot={false}
									activeDot={{ r: 4, fill: CHART.revenue }}
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
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={CHART.grid}
								/>
								<XAxis
									dataKey="month"
									tick={AXIS_TICK}
									axisLine={false}
									tickLine={false}
								/>
								<YAxis
									tick={AXIS_TICK}
									axisLine={false}
									tickLine={false}
									width={24}
									allowDecimals={false}
								/>
								<Tooltip contentStyle={TOOLTIP_STYLE} />
								<Bar
									dataKey="signups"
									fill={CHART.signups}
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
									wrapperStyle={{
										color: 'var(--muted-foreground)',
										fontSize: 12,
									}}
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
										? `${data.mrr.growth > 0 ? '+' : ''}${formatPercent(data.mrr.growth)}`
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
										? formatPriceCompact(
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
