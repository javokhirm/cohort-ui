import type { PlatformLeadListFilters } from './types';

export const platformLeadsKeys = {
	all: ['platformLeads'] as const,
	list: (filters?: PlatformLeadListFilters) =>
		[...platformLeadsKeys.all, 'list', filters ?? {}] as const,
	detail: (id: number) => [...platformLeadsKeys.all, 'detail', id] as const,
};
