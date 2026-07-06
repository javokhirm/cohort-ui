import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { feePlansKeys } from './keys';
import type {
	FeePlanBillingCycle,
	FeePlanProrationMethod,
	FeePlanResponse,
} from './fee-plans.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend `CreateFeePlanDto` / `UpdateFeePlanDto` (api-reference.md §3.12).

export interface CreateFeePlanInput {
	branchId?: number | null;
	courseId?: number | null;
	name: string;
	amount: number;
	currency?: string;
	billingCycle: FeePlanBillingCycle;
	/** `null` inherits the tenant billing-policy default (§billing policy). */
	prorationMethod?: FeePlanProrationMethod | null;
	/** `null` inherits the tenant billing-policy due-day. */
	dueDay?: number | null;
}

export interface UpdateFeePlanInput {
	id: number;
	branchId?: number | null;
	courseId?: number | null;
	name?: string;
	amount?: number;
	currency?: string;
	billingCycle?: FeePlanBillingCycle;
	/** `null` inherits the tenant billing-policy default (§billing policy). */
	prorationMethod?: FeePlanProrationMethod | null;
	/** `null` inherits the tenant billing-policy due-day. */
	dueDay?: number | null;
	isActive?: boolean;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateFeePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateFeePlanInput) =>
			manageApi.post<FeePlanResponse>('/fee-plans', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: feePlansKeys.feePlans() });
		},
	});
}

export function useUpdateFeePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateFeePlanInput) =>
			manageApi.patch<FeePlanResponse>(`/fee-plans/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: feePlansKeys.feePlans() });
		},
	});
}
