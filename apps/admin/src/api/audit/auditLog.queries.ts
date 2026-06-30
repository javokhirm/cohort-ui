import type { PaginatedResult } from '@repo/api-client';

import { adminApi } from '@/api/apiClient';
import type { AuditLogFilters, AuditLogView } from '@/api/audit/types';

export function listAuditLogs(
	filters?: AuditLogFilters,
): Promise<PaginatedResult<AuditLogView>> {
	const params: Record<string, string> = {};
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);
	if (filters?.search) params['search'] = filters.search;
	if (filters?.action) params['action'] = filters.action;
	if (filters?.tenantId != null) params['tenantId'] = String(filters.tenantId);
	if (filters?.actorUserId != null) params['actorUserId'] = String(filters.actorUserId);
	if (filters?.from) params['from'] = filters.from;
	if (filters?.to) params['to'] = filters.to;
	return adminApi.getPaginated<AuditLogView>('/audit-logs', { params });
}

export function getAuditLog(id: number): Promise<AuditLogView> {
	return adminApi.get<AuditLogView>(`/audit-logs/${id}`);
}
