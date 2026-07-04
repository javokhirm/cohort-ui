import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { enrollmentDiscountsKeys } from './keys';
import type { DiscountType } from './discounts.queries';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `EnrollmentDiscountResponseDto` for the
// `/manage/enrollments/:enrollmentId/discounts` surface (api-reference.md §3.13a).
// The generated `@repo/api-client` OpenAPI types expose the request DTOs but not
// response bodies, so the shape is declared here; reconcile if the spec starts
// emitting response schemas.

export interface EnrollmentDiscountResponse {
	id: number;
	enrollmentId: number;
	discountId: number;
	discountName: string;
	discountType: DiscountType;
	/** Percentage (0–100) or fixed amount in currency, from the discount definition. */
	discountValue: number;
	/** `YYYY-MM-DD`; window start (inclusive). Null = no start bound. */
	validFrom: string | null;
	/** `YYYY-MM-DD`; "assigned till" date (inclusive). Null = no end bound. */
	validUntil: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * List the standing discount assignments for an enrollment. Requires
 * `enrollment.discount.manage`, so only call this behind that gate — the backend
 * returns 403 otherwise.
 */
export function useEnrollmentDiscounts(enrollmentId: number) {
	return useQuery({
		queryKey: enrollmentDiscountsKeys.forEnrollment(enrollmentId),
		queryFn: () =>
			manageApi.get<EnrollmentDiscountResponse[]>(
				`/enrollments/${enrollmentId}/discounts`,
			),
		enabled: enrollmentId > 0,
	});
}
