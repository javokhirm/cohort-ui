import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { auditKeys } from '@/api/audit/keys';
import { getAuditLog, listAuditLogs } from '@/api/audit/auditLog.queries';
import type { AuditLogFilters } from '@/api/audit/types';

export function useAuditLogs(filters: AuditLogFilters) {
	return useQuery({
		queryKey: auditKeys.list(filters),
		queryFn: () => listAuditLogs(filters),
		placeholderData: keepPreviousData,
	});
}

export function useAuditLogEntry(id: number, enabled: boolean) {
	return useQuery({
		queryKey: auditKeys.detail(id),
		queryFn: () => getAuditLog(id),
		enabled,
	});
}
