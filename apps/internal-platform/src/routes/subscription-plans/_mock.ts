/**
 * Mock plan data for the Plans management page.
 * TODO: replace with useQuery(plansQuery()) once GET /super-admin/plans is ready.
 */

export type PlanFeature =
	| 'billing'
	| 'payroll'
	| 'assessments'
	| 'telegram_bot'
	| 'api_access';

export type MockPlan = {
	id: string;
	name: string;
	priceUzs: number;
	studentLimit: number | null; // null = unlimited
	branchLimit: number | null; // null = unlimited
	storageGb: number;
	features: PlanFeature[];
	isPopular: boolean;
	tenantCount: number;
	archived: boolean;
};

export const MOCK_PLANS: MockPlan[] = [
	{
		id: 'plan-starter',
		name: 'Starter',
		priceUzs: 900_000,
		studentLimit: 300,
		branchLimit: 1,
		storageGb: 5,
		features: ['billing'],
		isPopular: false,
		tenantCount: 12,
		archived: false,
	},
	{
		id: 'plan-growth',
		name: 'Growth',
		priceUzs: 2_400_000,
		studentLimit: 1_500,
		branchLimit: 5,
		storageGb: 25,
		features: ['billing', 'payroll', 'assessments', 'telegram_bot'],
		isPopular: true,
		tenantCount: 8,
		archived: false,
	},
	{
		id: 'plan-enterprise',
		name: 'Enterprise',
		priceUzs: 4_800_000,
		studentLimit: null,
		branchLimit: null,
		storageGb: 100,
		features: ['billing', 'payroll', 'assessments', 'telegram_bot', 'api_access'],
		isPopular: false,
		tenantCount: 5,
		archived: false,
	},
	{
		id: 'plan-custom',
		name: 'Custom',
		priceUzs: 0,
		studentLimit: null,
		branchLimit: null,
		storageGb: 500,
		features: ['billing', 'payroll', 'assessments', 'telegram_bot', 'api_access'],
		isPopular: false,
		tenantCount: 2,
		archived: false,
	},
];
