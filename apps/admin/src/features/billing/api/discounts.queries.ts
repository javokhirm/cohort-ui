import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import type { PaginatedResult } from '@repo/api-client';

import { discountsKeys, type DiscountListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `DiscountResponseDto` for the `/manage/discounts` surface
// (api-reference.md §3.15). The generated `@repo/api-client` OpenAPI types
// expose the request DTOs but not response bodies, so the shape is declared
// here; reconcile if the spec starts emitting response schemas.

export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export interface DiscountResponse {
	id: number;
	name: string;
	type: DiscountType;
	/** Percentage (0–100) or fixed amount in currency. */
	value: number;
	applicableTo: string;
	code: string | null;
	maxUses: number | null;
	currentUses: number;
	validFrom: string | null;
	validUntil: string | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useDiscountList(filters: DiscountListFilters) {
	return useQuery({
		queryKey: discountsKeys.discountList(filters),
		queryFn: () =>
			manageApi.getPaginated<DiscountResponse>('/discounts', {
				params: filters,
			}) as Promise<PaginatedResult<DiscountResponse>>,
		placeholderData: keepPreviousData,
	});
}

/** Card-grid variant of {@link useDiscountList}: accumulates pages for infinite scroll. */
export function useInfiniteDiscountList(filters: Omit<DiscountListFilters, 'page'>) {
	return useInfiniteQuery({
		queryKey: discountsKeys.discountInfiniteList(filters),
		queryFn: ({ pageParam }) =>
			manageApi.getPaginated<DiscountResponse>('/discounts', {
				params: { ...filters, page: pageParam },
			}) as Promise<PaginatedResult<DiscountResponse>>,
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.page < last.totalPages ? last.page + 1 : undefined,
		placeholderData: keepPreviousData,
	});
}
