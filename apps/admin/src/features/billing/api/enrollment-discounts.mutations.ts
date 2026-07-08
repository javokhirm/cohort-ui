import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { enrollmentDiscountsKeys } from './keys';
import type { EnrollmentDiscountResponse } from './enrollment-discounts.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend `AssignEnrollmentDiscountDto` (api-reference.md §3.13a).

export interface AssignEnrollmentDiscountInput {
	enrollmentId: number;
	discountId: number;
	validFrom?: string | null;
	validUntil?: string | null;
}

export interface RevokeEnrollmentDiscountInput {
	enrollmentId: number;
	assignmentId: number;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Assign a standing discount to an enrollment. The monthly generator then
 * auto-applies it to each invoice within its valid-until window (§3.13a). A
 * duplicate assignment of the same discount is rejected server-side
 * (422 `ENROLLMENT_DISCOUNT_DUPLICATE`).
 */
export function useAssignEnrollmentDiscount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ enrollmentId, ...body }: AssignEnrollmentDiscountInput) =>
			manageApi.post<EnrollmentDiscountResponse>(
				`/enrollments/${enrollmentId}/discounts`,
				body,
			),
		onSuccess: (_data, { enrollmentId }) => {
			void qc.invalidateQueries({
				queryKey: enrollmentDiscountsKeys.forEnrollment(enrollmentId),
			});
		},
	});
}

/** Revoke (soft-delete) a standing discount assignment. */
export function useRevokeEnrollmentDiscount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ enrollmentId, assignmentId }: RevokeEnrollmentDiscountInput) =>
			manageApi.delete(`/enrollments/${enrollmentId}/discounts/${assignmentId}`),
		onSuccess: (_data, { enrollmentId }) => {
			void qc.invalidateQueries({
				queryKey: enrollmentDiscountsKeys.forEnrollment(enrollmentId),
			});
		},
	});
}
