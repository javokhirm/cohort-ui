import type { PaginatedResult } from '@repo/api-client';

import { superAdminApi } from '@/api/apiClient';

import type {
	StudentImportRowFilters,
	StudentImportRowView,
	StudentImportSessionView,
} from './types';

/** A tenant's recent import sessions, newest first. */
export function listStudentImports(
	tenantId: number,
): Promise<StudentImportSessionView[]> {
	return superAdminApi.get<StudentImportSessionView[]>(
		`/tenants/${tenantId}/student-imports`,
	);
}

/** One session: status + counters. This is what the progress view polls. */
export function getStudentImport(
	tenantId: number,
	sessionId: string,
): Promise<StudentImportSessionView> {
	return superAdminApi.get<StudentImportSessionView>(
		`/tenants/${tenantId}/student-imports/${sessionId}`,
	);
}

/** The paginated row report: each row, its errors/warnings, and its outcome. */
export function listStudentImportRows(
	tenantId: number,
	sessionId: string,
	filters?: StudentImportRowFilters,
): Promise<PaginatedResult<StudentImportRowView>> {
	const params: Record<string, string> = {};
	if (filters?.validationStatus) params['validationStatus'] = filters.validationStatus;
	if (filters?.outcome) params['outcome'] = filters.outcome;
	if (filters?.page != null) params['page'] = String(filters.page);
	if (filters?.limit != null) params['limit'] = String(filters.limit);

	return superAdminApi.getPaginated<StudentImportRowView>(
		`/tenants/${tenantId}/student-imports/${sessionId}/rows`,
		{ params },
	);
}
