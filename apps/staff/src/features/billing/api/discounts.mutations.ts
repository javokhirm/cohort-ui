import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { discountsKeys } from './keys';
import type { DiscountResponse, DiscountType } from './discounts.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend `CreateDiscountDto` / `UpdateDiscountDto` (api-reference.md §3.15).

export interface CreateDiscountInput {
	name: string;
	type: DiscountType;
	value: number;
	code?: string | null;
	validFrom?: string | null;
	validUntil?: string | null;
}

export interface UpdateDiscountInput {
	id: number;
	name?: string;
	type?: DiscountType;
	value?: number;
	code?: string | null;
	validFrom?: string | null;
	validUntil?: string | null;
	isActive?: boolean;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateDiscount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateDiscountInput) =>
			manageApi.post<DiscountResponse>('/discounts', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: discountsKeys.discounts() });
		},
	});
}

export function useUpdateDiscount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateDiscountInput) =>
			manageApi.patch<DiscountResponse>(`/discounts/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: discountsKeys.discounts() });
		},
	});
}
