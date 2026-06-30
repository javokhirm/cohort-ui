import type { PlanListFilters } from './types';

export const plansKeys = {
	all: ['plans'] as const,
	list: (filters?: PlanListFilters) =>
		[...plansKeys.all, 'list', filters ?? {}] as const,
	detail: (id: number) => [...plansKeys.all, 'detail', id] as const,
};
