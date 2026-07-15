/**
 * Static mock data for the Platform Dashboard.
 * Replace each section with a real TanStack Query hook once the backend
 * endpoint for that domain is wired up (see TODOs in dashboard.tsx).
 */

export type TenantStatus = 'active' | 'trialing' | 'past_due' | 'suspended' | 'cancelled';
export type PlanId = 'starter' | 'growth' | 'enterprise';

export type MockTenant = {
	id: string;
	name: string;
	initials: string;
	plan: PlanId;
	status: TenantStatus;
	students: number;
	joinedAt: string; // ISO date string
};

export type MonthRevenue = { month: string; revenue: number };
export type MonthSignups = { month: string; signups: number };
export type PlanSlice = { name: string; count: number; color: string };

export type MockDashboard = {
	kpi: {
		totalTenants: number;
		activeTenants: number;
		mrr: number; // UZS
		totalStudents: number;
		storageTb: number;
		churnRate: number; // percentage
		trends: {
			totalTenants: number; // % vs last month, positive = grew
			activeTenants: number;
			mrr: number;
			totalStudents: number;
			storageTb: number;
			churnRate: number; // negative = churn fell (good)
		};
	};
	revenueByMonth: MonthRevenue[];
	signupsByMonth: MonthSignups[];
	planDistribution: PlanSlice[];
	tenants: MockTenant[];
};

/** Chart colours as design-system tokens, so they follow light and dark. */
export const CHART_COLORS = {
	indigo: 'var(--chart-1)',
	green: 'var(--chart-2)',
	blue: 'var(--chart-3)',
	amber: 'var(--chart-4)',
	violet: 'var(--chart-5)',
} as const;

export const MOCK_DASHBOARD: MockDashboard = {
	kpi: {
		totalTenants: 47,
		activeTenants: 39,
		mrr: 184_500_000,
		totalStudents: 12_847,
		storageTb: 1.2,
		churnRate: 2.1,
		trends: {
			totalTenants: 6.8,
			activeTenants: 5.4,
			mrr: 12.3,
			totalStudents: 8.1,
			storageTb: 4.5,
			churnRate: -0.3,
		},
	},

	revenueByMonth: [
		{ month: 'Jan', revenue: 98_000_000 },
		{ month: 'Feb', revenue: 112_500_000 },
		{ month: 'Mar', revenue: 127_000_000 },
		{ month: 'Apr', revenue: 141_000_000 },
		{ month: 'May', revenue: 163_500_000 },
		{ month: 'Jun', revenue: 184_500_000 },
	],

	signupsByMonth: [
		{ month: 'Jan', signups: 4 },
		{ month: 'Feb', signups: 6 },
		{ month: 'Mar', signups: 5 },
		{ month: 'Apr', signups: 9 },
		{ month: 'May', signups: 11 },
		{ month: 'Jun', signups: 12 },
	],

	planDistribution: [
		{ name: 'Starter', count: 21, color: CHART_COLORS.indigo },
		{ name: 'Growth', count: 19, color: CHART_COLORS.blue },
		{ name: 'Enterprise', count: 7, color: CHART_COLORS.amber },
	],

	tenants: [
		{
			id: 't1',
			name: 'Anvar Academy',
			initials: 'AA',
			plan: 'growth',
			status: 'active',
			students: 640,
			joinedAt: '2025-01-14T08:00:00Z',
		},
		{
			id: 't2',
			name: 'Brilliance School',
			initials: 'BS',
			plan: 'starter',
			status: 'past_due',
			students: 180,
			joinedAt: '2025-02-03T09:30:00Z',
		},
		{
			id: 't3',
			name: 'Elite Learning Hub',
			initials: 'EL',
			plan: 'enterprise',
			status: 'active',
			students: 1_240,
			joinedAt: '2025-02-28T11:00:00Z',
		},
		{
			id: 't4',
			name: 'Future Stars',
			initials: 'FS',
			plan: 'starter',
			status: 'suspended',
			students: 95,
			joinedAt: '2025-03-10T14:20:00Z',
		},
		{
			id: 't5',
			name: 'Global Minds',
			initials: 'GM',
			plan: 'growth',
			status: 'active',
			students: 420,
			joinedAt: '2025-04-01T07:45:00Z',
		},
		{
			id: 't6',
			name: 'Horizon Institute',
			initials: 'HI',
			plan: 'growth',
			status: 'active',
			students: 310,
			joinedAt: '2025-04-22T10:00:00Z',
		},
		{
			id: 't7',
			name: 'Intellect Center',
			initials: 'IC',
			plan: 'starter',
			status: 'past_due',
			students: 73,
			joinedAt: '2025-05-05T13:00:00Z',
		},
		{
			id: 't8',
			name: 'Kelajak School',
			initials: 'KS',
			plan: 'enterprise',
			status: 'active',
			students: 890,
			joinedAt: '2025-05-19T09:00:00Z',
		},
		{
			id: 't9',
			name: 'Luminary Academy',
			initials: 'LA',
			plan: 'starter',
			status: 'trialing',
			students: 22,
			joinedAt: '2025-06-10T08:30:00Z',
		},
		{
			id: 't10',
			name: 'Mentor Pro',
			initials: 'MP',
			plan: 'growth',
			status: 'active',
			students: 510,
			joinedAt: '2025-06-25T11:15:00Z',
		},
	],
};
