import {
	Activity,
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
import type { StatusTone } from '@repo/ui';
import { MOCK_DASHBOARD } from './_mock';
import type { PlanId } from './_mock';

// TODO: replace with useDashboardStats() TanStack Query hook once GET /admin/stats is live
const data = MOCK_DASHBOARD;

// Dark-mode recharts tooltip style (mirrors --card / --border tokens in dark mode)
const TOOLTIP_STYLE: React.CSSProperties = {
	backgroundColor: '#131c30',
	border: '1px solid #1e293b',
	borderRadius: '0.5rem',
	color: '#f1f5f9',
	fontSize: 12,
};

const PLAN_LABELS: Record<PlanId, string> = {
	starter: 'Starter',
	growth: 'Growth',
	enterprise: 'Enterprise',
};

const PLAN_TONES: Record<PlanId, StatusTone> = {
	starter: 'slate',
	growth: 'blue',
	enterprise: 'violet',
};

const SERVICES = [
	{ name: 'API', icon: Server },
	{ name: 'Database', icon: Database },
	{ name: 'Storage', icon: HardDrive },
	{ name: 'Email', icon: Mail },
	{ name: 'SMS', icon: MessageSquare },
	{ name: 'Payments', icon: CreditCard },
];

/** TODO: use shared i18n money formatter once @repo/i18n ships */
function formatMrr(uzs: number): string {
	if (uzs >= 1_000_000) return `${(uzs / 1_000_000).toFixed(1)}M UZS`;
	return `${(uzs / 1_000).toFixed(0)}K UZS`;
}

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(iso));
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

export function DashboardPage() {
	const kpi = data.kpi;

	const attentionTenants = data.tenants.filter(
		(t) => t.status === 'past_due' || t.status === 'suspended',
	);

	const recentSignups = [...data.tenants]
		.sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime())
		.slice(0, 5);

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			{/* Page header */}
			<div>
				<h1 className="text-xl font-semibold">Dashboard</h1>
				<p className="text-sm text-muted-foreground">
					Platform overview and health
				</p>
			</div>

			{/* ── Section A: KPI strip ─────────────────────────────────── */}
			<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
				<StatCard
					label="Total Tenants"
					value={kpi.totalTenants}
					icon={<Building2 />}
					delta={{
						value: <TrendChip value={kpi.trends.totalTenants} />,
					}}
					hint="vs last month"
				/>
				<StatCard
					label="Active Tenants"
					value={kpi.activeTenants}
					icon={<Building2 />}
					delta={{
						value: <TrendChip value={kpi.trends.activeTenants} />,
					}}
					hint="vs last month"
				/>
				<StatCard
					label="MRR"
					value={formatMrr(kpi.mrr)}
					icon={<Wallet />}
					delta={{
						value: <TrendChip value={kpi.trends.mrr} />,
					}}
					hint="vs last month"
				/>
				<StatCard
					label="Total Students"
					value={kpi.totalStudents.toLocaleString()}
					icon={<Users />}
					delta={{
						value: <TrendChip value={kpi.trends.totalStudents} />,
					}}
					hint="vs last month"
				/>
				<StatCard
					label="Storage Used"
					value={`${kpi.storageTb} TB`}
					icon={<HardDrive />}
					delta={{
						value: (
							<TrendChip value={kpi.trends.storageTb} upIsGood={false} />
						),
					}}
					hint="vs last month"
				/>
				<StatCard
					label="Churn Rate"
					value={`${kpi.churnRate}%`}
					icon={<Activity />}
					delta={{
						value: (
							<TrendChip value={kpi.trends.churnRate} upIsGood={false} />
						),
					}}
					hint="vs last month"
				/>
			</div>

			{/* ── Section B: Charts ─────────────────────────────────────── */}
			{/* TODO: replace mock arrays with useRevenueChart() / useSignupChart() / usePlanDist() */}
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
							<LineChart
								data={data.revenueByMonth}
								margin={{ left: 0, right: 8 }}
							>
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
									tickFormatter={(v: number) =>
										`${(v / 1_000_000).toFixed(0)}M`
									}
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
							<BarChart
								data={data.signupsByMonth}
								margin={{ left: 0, right: 8 }}
							>
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

				{/* Plan distribution */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Plan Distribution
						</CardTitle>
						<p className="text-xs text-muted-foreground">Active tenant mix</p>
					</CardHeader>
					<CardContent className="flex items-center justify-center px-2 py-4">
						<ResponsiveContainer width="100%" height={180}>
							<PieChart>
								<Pie
									data={data.planDistribution.map((s) => ({
										...s,
										fill: s.color,
									}))}
									dataKey="count"
									nameKey="name"
									cx="50%"
									cy="45%"
									innerRadius={48}
									outerRadius={72}
									paddingAngle={2}
									stroke="transparent"
								/>
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

			{/* ── Section C: Attention + Recent Signups ─────────────────── */}
			{/* TODO: replace with useTenants({ status: ['past_due','suspended'] }) and useRecentTenants() */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
				{/* Needs Attention */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Needs Attention
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							Past due or suspended tenants
						</p>
					</CardHeader>
					<CardContent className="px-0 py-0">
						{attentionTenants.length === 0 ? (
							<p className="px-5 py-6 text-sm text-tone-green-fg">
								All tenants healthy ✓
							</p>
						) : (
							<ul>
								{attentionTenants.map((tenant, i) => (
									<li key={tenant.id}>
										{i > 0 && <Separator />}
										<div className="flex items-center gap-3 px-5 py-3">
											<Avatar className="size-8">
												<AvatarFallback className="bg-tone-indigo-bg text-xs font-semibold text-tone-indigo-fg">
													{tenant.initials}
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
												{/* TODO: link to /tenants/:id */}
												View
											</Button>
										</div>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>

				{/* Recent Signups */}
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Recent Signups
						</CardTitle>
						<p className="text-xs text-muted-foreground">
							Last 5 onboarded tenants
						</p>
					</CardHeader>
					<CardContent className="px-0 py-0">
						<ul>
							{recentSignups.map((tenant, i) => (
								<li key={tenant.id}>
									{i > 0 && <Separator />}
									<div className="flex items-center gap-3 px-5 py-3">
										<span className="flex-1 truncate text-sm font-medium">
											{tenant.name}
										</span>
										<StatusBadge tone={PLAN_TONES[tenant.plan]}>
											{PLAN_LABELS[tenant.plan]}
										</StatusBadge>
										<span className="shrink-0 text-xs text-muted-foreground">
											{formatDate(tenant.joinedAt)}
										</span>
									</div>
								</li>
							))}
						</ul>
						<Separator />
						<div className="px-5 py-3">
							<Button
								variant="ghost"
								size="sm"
								className="text-xs text-muted-foreground"
							>
								{/* TODO: link to /tenants once route exists */}
								View all →
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* ── Section D: System Services ────────────────────────────── */}
			{/* TODO: replace hard-coded "Operational" with useSystemHealth() once GET /admin/health is live */}
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
		</div>
	);
}
