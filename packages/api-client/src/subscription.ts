/**
 * Mirrors cohort-be's `SubscriptionAccessView` contract (see
 * `~domain/identity/interfaces/subscription-access.interface.ts`). Hand-written,
 * not generated: the backend's Swagger spec for `/manage/subscription` and the
 * `/me` bootstrap routes carries no response schema, so `openapi-typescript`
 * emits `content?: never` for them. One shape everywhere — `GET /manage/subscription`,
 * the `/me` bootstrap profiles, the login/refresh payload, and the 402 block body.
 *
 * Never recompute expiry client-side: `state` and `hasAccess` are the server's
 * verdict, derived live against the clock on every request. `currentPeriodEnd`
 * is for display only.
 */
export const SUBSCRIPTION_ACCESS_STATES = [
	'TRIALING',
	'ACTIVE',
	'PAST_DUE',
	'EXPIRED',
	'CANCELLED',
	'SUSPENDED',
	'NONE',
] as const;
export type SubscriptionAccessState = (typeof SUBSCRIPTION_ACCESS_STATES)[number];

/** The raw persisted subscription status — `SUSPENDED`/`NONE` are `state`-only, folded in from tenant status / a missing row. */
export type SubscriptionStatus =
	'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED';

export type BillingInterval = 'MONTHLY' | 'ANNUAL';

/** The plan a subscription is on, as surfaced to tenant-facing clients. */
export interface SubscriptionPlanView {
	id: number;
	name: string;
	/** Capability matrix (`{ referral_program: true }`) driving feature gating. */
	features: Record<string, unknown>;
	/** `null` means unlimited. */
	maxStudents: number | null;
	/** `null` means unlimited. */
	maxBranches: number | null;
}

/** The tenant's subscription as every subscription-aware surface reports it. */
export interface SubscriptionAccessView {
	state: SubscriptionAccessState;
	/** Whether normal application access is granted right now — gate on this, not on `state`. */
	hasAccess: boolean;
	subscriptionId: number | null;
	status: SubscriptionStatus | null;
	plan: SubscriptionPlanView | null;
	billingInterval: BillingInterval | null;
	/** Price snapshotted on the subscription — what a renewal of the same plan costs. UZS number, up to 2 decimals. */
	renewalPrice: number | null;
	currency: string;
	/** ISO 8601 with timezone, or `null` with no subscription. */
	currentPeriodStart: string | null;
	/** ISO 8601 with timezone, or `null` with no subscription. Display only — never diff this against the client clock. */
	currentPeriodEnd: string | null;
	/** Whole days until `currentPeriodEnd`; negative once lapsed, `null` with no subscription. */
	daysRemaining: number | null;
	/** `true` while access still holds but the period ends within the server's configured warning window. */
	expiresSoon: boolean;
}
