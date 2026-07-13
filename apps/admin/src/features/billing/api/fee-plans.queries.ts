import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { GroupListItem } from '@/features/groups/api/groups.queries';
import type { PaginatedResult } from '@repo/api-client';

import { feePlansKeys, type FeePlanListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `FeePlanResponseDto` for the `/manage/fee-plans` surface
// (api-reference.md §3.12). The generated `@repo/api-client` OpenAPI types
// expose the request DTOs but not response bodies, so the shape is declared
// here; reconcile if the spec starts emitting response schemas.

/**
 * Both cycles are auto-billed: each maps to exactly one generation leg, so a
 * plan attached to a course always bills. Not to be confused with the billing
 * policy's `lateFeeRecurrence`, which has its own unrelated `ONE_TIME` value.
 */
export const FEE_PLAN_BILLING_CYCLES = ['MONTHLY', 'PER_SESSION'] as const;
export type FeePlanBillingCycle = (typeof FEE_PLAN_BILLING_CYCLES)[number];

/**
 * A fee plan says only **what** to charge. When and how it bills — due day,
 * proration, late fees, grace days — comes from the tenant billing policy
 * (api-reference.md §3.12a) and a plan cannot override any of it.
 */
export interface FeePlanResponse {
	id: number;
	/** Null = applies across all branches. */
	branchId: number | null;
	/**
	 * Live groups billing on this plan, reached through their course. Computed
	 * by the list endpoint only; `0` on create/update responses.
	 */
	groupCount: number;
	name: string;
	amount: number;
	currency: string;
	billingCycle: FeePlanBillingCycle;
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

/**
 * The groups billing on a plan, reached through their course
 * (`group.courseId → courses.feePlanId`). Read-only: groups are never assigned
 * to a plan from the plans page — a course carries the plan.
 *
 * Its own `fee-plan.manage` sub-resource rather than `GET /groups?feePlanId=`,
 * so a plans-page user need not also hold `group.read`.
 */
export function useFeePlanGroups(feePlanId: number, enabled = true) {
	return useQuery({
		queryKey: feePlansKeys.feePlanGroups(feePlanId),
		queryFn: () =>
			manageApi.getPaginated<GroupListItem>(`/fee-plans/${feePlanId}/groups`, {
				params: { limit: 100 },
			}) as Promise<PaginatedResult<GroupListItem>>,
		enabled,
	});
}
