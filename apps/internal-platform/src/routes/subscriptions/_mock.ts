/**
 * Mock subscription data for the Subscriptions page.
 * TODO: replace with useQuery(subscriptionsQuery()) once GET /super-admin/subscriptions is ready.
 */

export type SubscriptionStatus =
	'active' | 'trialing' | 'past_due' | 'suspended' | 'cancelled';

export type MockSubscription = {
	id: string;
	tenantName: string;
	plan: string;
	status: SubscriptionStatus;
	/** UZS / month. 0 for trialing (no billing yet). */
	mrr: number;
	/** ISO date: when the subscription started or trial began. */
	startedAt: string;
	/** ISO date: next scheduled billing date (may be in the past for past_due). */
	nextBillAt: string;
	/** ISO date: when the trial ends. Only set for trialing subscriptions. */
	trialEndsAt?: string;
};

export const MOCK_SUBSCRIPTIONS: MockSubscription[] = [
	// ── Page 1 ──────────────────────────────────────────────────────────────
	{
		id: 'sub-001',
		tenantName: 'Zabon Language Center',
		plan: 'Growth',
		status: 'active',
		mrr: 2_400_000,
		startedAt: '2024-03-12',
		nextBillAt: '2026-07-01',
	},
	{
		id: 'sub-002',
		tenantName: 'IELTS Master Academy',
		plan: 'Scale',
		status: 'active',
		mrr: 4_800_000,
		startedAt: '2023-11-02',
		nextBillAt: '2026-07-01',
	},
	{
		id: 'sub-003',
		tenantName: 'Bright Future School',
		plan: 'Growth',
		status: 'trialing',
		mrr: 0,
		startedAt: '2026-06-14',
		nextBillAt: '2026-07-08',
		trialEndsAt: '2026-07-08',
	},
	{
		id: 'sub-004',
		tenantName: 'Cambridge Tashkent',
		plan: 'Scale',
		status: 'past_due',
		mrr: 4_800_000,
		startedAt: '2024-01-20',
		nextBillAt: '2026-06-23',
	},
	{
		id: 'sub-005',
		tenantName: 'Eduon Academy',
		plan: 'Starter',
		status: 'active',
		mrr: 900_000,
		startedAt: '2025-09-08',
		nextBillAt: '2026-07-01',
	},
	{
		id: 'sub-006',
		tenantName: 'Lingua Pro Center',
		plan: 'Growth',
		status: 'suspended',
		mrr: 2_400_000,
		startedAt: '2024-07-19',
		nextBillAt: '2026-07-01',
	},
	// ── Page 2 ──────────────────────────────────────────────────────────────
	{
		id: 'sub-007',
		tenantName: 'Spark Academy',
		plan: 'Enterprise',
		status: 'active',
		mrr: 19_200_000,
		startedAt: '2023-05-10',
		nextBillAt: '2026-07-01',
	},
	{
		id: 'sub-008',
		tenantName: 'Prestige Language Center',
		plan: 'Growth',
		status: 'trialing',
		mrr: 0,
		startedAt: '2026-06-20',
		nextBillAt: '2026-07-04',
		trialEndsAt: '2026-07-04',
	},
	{
		id: 'sub-009',
		tenantName: 'Digital Skills Institute',
		plan: 'Scale',
		status: 'suspended',
		mrr: 14_100_000,
		startedAt: '2024-02-15',
		nextBillAt: '2026-07-01',
	},
];
