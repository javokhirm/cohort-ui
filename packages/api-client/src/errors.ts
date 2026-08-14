import type { SubscriptionAccessState } from './subscription';

export class ApiError extends Error {
	readonly name = 'ApiError';

	constructor(
		readonly code: string,
		message: string,
		readonly status: number,
		readonly details?: Record<string, unknown>,
	) {
		super(message);
	}
}

export function isApiError(err: unknown): err is ApiError {
	return err instanceof ApiError;
}

/** `error.code` values the backend returns on a 402 subscription block. */
export const SUBSCRIPTION_ERROR_CODES = [
	'SUBSCRIPTION_EXPIRED',
	'SUBSCRIPTION_CANCELLED',
	'SUBSCRIPTION_SUSPENDED',
	'SUBSCRIPTION_MISSING',
] as const;
export type SubscriptionErrorCode = (typeof SUBSCRIPTION_ERROR_CODES)[number];

/**
 * `error.details` on a 402 subscription-block response — the renewal essentials,
 * so the client can render its blocking screen without a follow-up call.
 */
export interface SubscriptionBlockDetails {
	state: SubscriptionAccessState;
	planName: string | null;
	/** ISO 8601 with timezone, or `null`. Display only. */
	currentPeriodEnd: string | null;
	/** UZS number, up to 2 decimals, or `null`. */
	renewalPrice: number | null;
	currency: string;
}

export interface SubscriptionApiError extends Omit<ApiError, 'details'> {
	readonly code: SubscriptionErrorCode;
	readonly status: 402;
	readonly details: SubscriptionBlockDetails;
}

/**
 * Narrows a caught error to a 402 subscription block — the tenant's session is
 * valid, only the plan has lapsed. Callers must not treat this like a 401: don't
 * clear tokens or redirect to `/login`, route to the renewal screen instead.
 */
export function isSubscriptionError(err: unknown): err is SubscriptionApiError {
	return isApiError(err) && err.status === 402;
}
