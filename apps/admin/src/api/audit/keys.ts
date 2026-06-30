import type { AuditLogFilters } from './types';

export const auditKeys = {
	all: ['audit'] as const,
	list: (filters?: AuditLogFilters) =>
		[...auditKeys.all, 'list', filters ?? {}] as const,
	detail: (id: number) => [...auditKeys.all, 'detail', id] as const,
};
