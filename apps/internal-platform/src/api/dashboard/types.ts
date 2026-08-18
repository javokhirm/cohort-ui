import type { MrrTrendPoint } from '../subscriptions/types';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';

/** Subscription lifecycle states — `EXPIRED` is the lapsed-period state. */
export type SubscriptionStatus =
	'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED';

/**
 * Why a tenant is flagged, most-severe first:
 * `SUSPENDED` > `EXPIRED` > `PAST_DUE` > `TRIAL_ENDING`. `EXPIRED` outranks
 * `PAST_DUE` because an expired center has already lost access, whereas a
 * past-due one is still working.
 */
export type AtRiskReason = 'SUSPENDED' | 'EXPIRED' | 'PAST_DUE' | 'TRIAL_ENDING';
export type MrrTrendPeriod = '6m' | '12m' | '24m';

export interface TenantStatusBreakdown {
	ACTIVE: number;
	SUSPENDED: number;
	PENDING: number;
	CANCELLED: number;
}

/** Subscription count per state; every state is always present and zero-filled. */
export interface SubscriptionStatusCounts {
	TRIALING: number;
	ACTIVE: number;
	PAST_DUE: number;
	EXPIRED: number;
	CANCELLED: number;
}

/**
 * The platform's OWN collections this month — distinct from `revenue`, which is
 * the GMV processed on centers' behalf. Do not conflate the two.
 */
export interface DashboardSubscriptionBilling {
	revenueThisMonth: number;
	paymentsThisMonth: number;
	failedPaymentsThisMonth: number;
	currency: string;
}

/** A center whose subscription lapses within the next 30 days (soonest first). */
export interface UpcomingExpiration {
	tenantId: number;
	tenantName: string;
	subscriptionId: number;
	planName: string | null;
	currentPeriodEnd: string;
	/** Whole days until the period ends (>= 0 within the window). */
	daysRemaining: number;
	renewalPrice: number;
	currency: string;
}

export interface AtRiskTenant {
	tenantId: number;
	name: string;
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
	/** Subscription counts across every state, including EXPIRED. */
	subscriptions: SubscriptionStatusCounts;
	/** The platform's own subscription collections this month. */
	subscriptionBilling: DashboardSubscriptionBilling;
	/** Centers lapsing within 30 days, soonest first — the outreach list. */
	upcomingExpirations: UpcomingExpiration[];
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
