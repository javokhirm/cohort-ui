import { isApiError } from '@repo/api-client';
import { formatDate } from '@repo/utils';

import type { GroupsT } from './group-options';

/**
 * Backend error code raised when an enrollment's `enrolledAt` falls outside the
 * tenant's current billing period (`EnrollmentStartWindowService`). The 422 body
 * carries `details.earliest` / `details.latest` — the window the date must land
 * in — plus the tenant's `billingCycleAnchor`.
 *
 * It matters because `enrolledAt` is the **billing anniversary anchor**: invoice
 * generation only ever issues the period containing today, so an anchor in an
 * earlier period would leave the periods in between unissued by any job and the
 * student would never be billed for them.
 */
const ENROLLMENT_DATE_CODE = 'ENROLLMENT_DATE_OUT_OF_RANGE';

/** The 422 `details` payload (fields optional — trust nothing). */
interface EnrollmentDateDetail {
	earliest?: string;
	latest?: string;
}

/** `formatDate` throws nothing but yields "Invalid DateTime" on junk — guard it. */
function pretty(iso: string | undefined): string | null {
	if (!iso) return null;
	const formatted = formatDate(iso);
	return formatted.startsWith('Invalid') ? null : formatted;
}

/**
 * If `err` is an out-of-range enrollment-date 422, return a human-readable
 * explanation naming the window the date must fall in; otherwise return `null`
 * so the caller can fall back to generic error handling. Pure — safe to unit-test.
 */
export function describeEnrollmentDateError(t: GroupsT, err: unknown): string | null {
	if (!isApiError(err) || err.code !== ENROLLMENT_DATE_CODE) return null;

	const { earliest, latest } = (err.details ?? {}) as EnrollmentDateDetail;
	const from = pretty(earliest);
	const to = pretty(latest);
	// The server message is already localized (uz/ru/en), so it beats a generic
	// fallback when the details are missing or malformed.
	if (!from || !to) return err.message;

	return t('enrollmentDateError', { from, to });
}
