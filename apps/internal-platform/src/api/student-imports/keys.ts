import type { StudentImportRowFilters } from './types';

/** Query keys for student imports. Every key is scoped by tenant. */
export const studentImportsKeys = {
	all: ['student-imports'] as const,
	list: (tenantId: number) => [...studentImportsKeys.all, 'list', tenantId] as const,
	detail: (tenantId: number, sessionId: string) =>
		[...studentImportsKeys.all, 'detail', tenantId, sessionId] as const,
	rows: (tenantId: number, sessionId: string, filters?: StudentImportRowFilters) =>
		[...studentImportsKeys.all, 'rows', tenantId, sessionId, filters ?? {}] as const,
};
