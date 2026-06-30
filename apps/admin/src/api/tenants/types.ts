export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'CANCELLED';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED';
export type BillingInterval = 'MONTHLY' | 'ANNUAL';
export type TenantMemberStatus = 'ACTIVE' | 'INACTIVE' | 'INVITED';

export interface TenantSummaryView {
	id: number;
	name: string;
	subdomain: string;
	status: TenantStatus;
	city: string | null;
	phone: string | null;
	timezone: string;
	locale: string;
	defaultCurrency: string;
	brandColor: string | null;
	subscriptionTierId: number | null;
}

export interface TenantSubscriptionInvoiceView {
	id: number;
	code: string;
	issueDate: string;
	amount: number;
	status: string;
	currency: string;
}

export interface TenantSubscriptionView {
	id: number;
	status: SubscriptionStatus;
	tierId: number;
	tierName: string;
	unitPrice: number;
	billingInterval: BillingInterval;
	mrr: number;
	currency: string;
	currentPeriodStart: string;
	currentPeriodEnd: string;
	recentInvoices: TenantSubscriptionInvoiceView[];
}

export interface TenantOverviewStats {
	branches: number;
	activeStudents: number;
	activeStaff: number;
	monthlyRevenue: number;
	outstandingBalance: number;
	lastLoginAt: string | null;
	currency: string;
}

export interface TenantMemberRoleView {
	id: number;
	name: string;
	branchId: number | null;
}

export interface TenantMemberView {
	tenantId: number;
	userId: number;
	status: TenantMemberStatus;
	joinedAt: string | null;
	user: {
		id: number;
		phone: string;
		email: string | null;
		firstName: string;
		lastName: string;
		lastLoginAt: string | null;
	};
	roles: TenantMemberRoleView[];
}

export interface TenantLifecycleView {
	signedUpAt: string;
	trialStartedAt: string | null;
	convertedToPaidAt: string | null;
	activeAndBillingAt: string | null;
}

export interface TenantBranchView {
	id: number;
	name: string;
	code: string;
	isMain: boolean;
	isActive: boolean;
	address: string | null;
	phone: string | null;
	email: string | null;
	timezone: string | null;
	students: number;
	staff: number;
}

/** Full tenant detail returned by GET /admin/tenants/:id — covers all page tabs. */
export interface TenantDetailView extends TenantSummaryView {
	createdAt: string;
	subscription: TenantSubscriptionView | null;
	stats: TenantOverviewStats;
	branches: TenantBranchView[];
	members: TenantMemberView[];
	lifecycle: TenantLifecycleView;
}

export interface TenantActionInput {
	reason?: string;
}

export interface UpdateTenantInput {
	timezone?: string;
	locale?: string;
	currency?: string;
	brandColor?: string | null;
	phone?: string | null;
	city?: string | null;
}

export interface ChangePlanInput {
	subscriptionTierId: number;
	billingInterval?: BillingInterval;
}

export interface TenantListRow {
	id: number;
	name: string;
	subdomain: string;
	status: TenantStatus;
	plan: { id: number; name: string } | null;
	subscriptionStatus: SubscriptionStatus | null;
	branches: number;
	students: number;
	mrr: number;
	currency: string;
}

export interface TenantListFilters {
	status?: TenantStatus;
	search?: string;
	page?: number;
	limit?: number;
}

export interface TenantDirectorySummary {
	currency: string;
	total: number;
	byStatus: { ACTIVE: number; SUSPENDED: number; PENDING: number; CANCELLED: number };
	bySubscription: {
		TRIALING: number;
		ACTIVE: number;
		PAST_DUE: number;
		CANCELLED: number;
	};
	totalMrr: number;
}

export interface AddMemberInput {
	userId: number;
	roleId: number;
	branchId?: number | null;
}

export interface ChangeMemberRoleInput {
	roleId: number;
	branchId?: number | null;
}

export interface OnboardTenantInput {
	name: string;
	subdomain: string;
	city?: string;
	phone?: string;
	timezone?: string;
	locale?: string;
	currency?: string;
	subscriptionTierId: number;
	mainBranch: {
		name: string;
		code: string;
		address?: string;
		phone?: string;
		email?: string;
		timezone?: string;
	};
	ownerUser: {
		phone: string;
		email?: string;
		firstName: string;
		lastName: string;
		password: string;
	};
}
