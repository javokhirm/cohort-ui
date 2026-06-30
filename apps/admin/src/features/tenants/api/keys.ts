import type { TenantListFilters } from './types';

export const tenantsKeys = {
	all: ['tenants'] as const,
	list: (filters?: TenantListFilters) =>
		[...tenantsKeys.all, 'list', filters ?? {}] as const,
	summary: () => [...tenantsKeys.all, 'summary'] as const,
	detail: (id: number) => [...tenantsKeys.all, 'detail', id] as const,
};
