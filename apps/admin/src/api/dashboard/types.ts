import type { MrrTrendPoint } from '../subscriptions/types';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';
export type AtRiskReason = 'SUSPENDED' | 'PAST_DUE' | 'TRIAL_ENDING';
export type MrrTrendPeriod = '6m' | '12m' | '24m';

export interface TenantStatusBreakdown {
	ACTIVE: number;
	SUSPENDED: number;
	PENDING: number;
	CANCELLED: number;
}

export interface AtRiskTenant {
	tenantId: number;
	name: string;
	subdomain: string;
	status: TenantStatus;
	reason: AtRiskReason;
	reasons: AtRiskReason[];
	trialEndsAt: string | null;
	daysUntilTrialEnd: number | null;
}

export interface DashboardKpis {
	currency: string;
	generatedAt: string;
	tenants: {
		total: number;
		active: number;
		byStatus: TenantStatusBreakdown;
		newThisMonth: number;
	};
	students: { active: number };
	branches: { active: number };
	mrr: {
		current: number;
		arr: number;
		growth: number | null;
		signups: number;
		churned: number;
		churnRate: number;
		trend: MrrTrendPoint[];
	};
	revenue: {
		processedTotal: number;
		processedThisMonth: number;
		currency: string;
	};
	atRisk: {
		count: number;
		tenants: AtRiskTenant[];
	};
}

export interface MrrTrendResponse {
	period: MrrTrendPeriod;
	currency: string;
	points: MrrTrendPoint[];
}
