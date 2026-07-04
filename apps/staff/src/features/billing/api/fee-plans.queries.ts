import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import { feePlansKeys, type FeePlanListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `FeePlanResponseDto` for the `/manage/fee-plans` surface
// (api-reference.md §3.12). The generated `@repo/api-client` OpenAPI types
// expose the request DTOs but not response bodies, so the shape is declared
// here; reconcile if the spec starts emitting response schemas.

export const FEE_PLAN_BILLING_CYCLES = [
	'MONTHLY',
	'QUARTERLY',
	'ONE_TIME',
	'PER_SESSION',
] as const;
export type FeePlanBillingCycle = (typeof FEE_PLAN_BILLING_CYCLES)[number];

/**
 * How a student's **first, partial** invoice is prorated when they enroll
 * mid-cycle (api-reference.md §3.12). `SESSION` charges for the classes
 * remaining from the join date (falling back to `DAILY` when the group has no
 * schedule), `DAILY` uses calendar days, `NONE` always charges in full.
 */
export const FEE_PLAN_PRORATION_METHODS = ['SESSION', 'DAILY', 'NONE'] as const;
export type FeePlanProrationMethod = (typeof FEE_PLAN_PRORATION_METHODS)[number];

export interface FeePlanResponse {
	id: number;
	/** Null = applies across all branches. */
	branchId: number | null;
	/** Null = applies to any course. */
	courseId: number | null;
	name: string;
	amount: number;
	currency: string;
	billingCycle: FeePlanBillingCycle;
	prorationMethod: FeePlanProrationMethod;
	dueDay: number;
	lateFeeAmount: number;
	gracePeriodDays: number;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useFeePlanList(filters: FeePlanListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins. Shared plans (branchId null) are always included server-side
	// alongside whatever branch-filtered rows match (api-reference.md §1).
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: FeePlanListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: feePlansKeys.feePlanList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<FeePlanResponse>('/fee-plans', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<FeePlanResponse>>,
		placeholderData: keepPreviousData,
	});
}
