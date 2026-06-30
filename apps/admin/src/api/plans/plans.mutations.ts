import { adminApi } from '@/api/apiClient';
import type { CreatePlanInput, PlanView, UpdatePlanInput } from './types';

export function createPlan(input: CreatePlanInput): Promise<PlanView> {
	return adminApi.post<PlanView>('/plans', input);
}

export function updatePlan(id: number, input: UpdatePlanInput): Promise<PlanView> {
	return adminApi.patch<PlanView>(`/plans/${id}`, input);
}
