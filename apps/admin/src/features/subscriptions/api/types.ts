export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
export type BillingInterval = 'MONTHLY' | 'ANNUAL';

export interface SubscriptionView {
	id: number;
	tenantId: number;
	tenantName: string | null;
	tenantSubdomain: string | null;
	subscriptionTierId: number;
	tierName: string | null;
	status: SubscriptionStatus;
	billingInterval: BillingInterval;
	unitPrice: number;
	monthlyValue: number;
	currency: string;
	currentPeriodStart: string;
	currentPeriodEnd: string;
	cancelledAt: string | null;
}

export interface SubscriptionListFilters {
	status?: SubscriptionStatus;
	tierId?: number;
	page?: number;
	limit?: number;
}

export interface MrrTrendPoint {
	periodMonth: string;
	currency: string;
	mrr: number;
	arr: number;
	activeCount: number;
	pastDueCount: number;
	trialingCount: number;
	signups: number;
	churned: number;
}

export interface SubscriptionAnalyticsView {
	currency: string;
	current: {
		mrr: number;
		arr: number;
		activeCount: number;
		pastDueCount: number;
		trialingCount: number;
		signups: number;
		churned: number;
		churnRate: number;
	};
	trend: MrrTrendPoint[];
	reconciliation: { collectedThisMonth: number; note: string };
}
