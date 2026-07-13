import { superAdminApi } from '@/api/apiClient';
import { downloadFile, saveTextFile } from '@/lib/download';

import { IMPORT_COLUMNS } from './types';
import type { CommitStudentImportInput, StudentImportSessionView } from './types';

/**
 * Upload a CSV: the backend parses it, validates every row against the center's
 * live state, and returns the report. **Nothing is written to the tenant** —
 * that only happens on commit.
 *
 * `FormData` passes straight through the api-client (axios sets the multipart
 * boundary), and the response is still the standard JSON envelope, so this needs
 * no special client handling.
 */
export function uploadStudentImport(
	tenantId: number,
	file: File,
): Promise<StudentImportSessionView> {
	const form = new FormData();
	form.append('file', file);
	return superAdminApi.post<StudentImportSessionView>(
		`/tenants/${tenantId}/student-imports`,
		form,
	);
}

/** Approve the session: queue the background job that applies the rows. */
export function commitStudentImport(
	tenantId: number,
	sessionId: string,
	input: CommitStudentImportInput,
): Promise<StudentImportSessionView> {
	return superAdminApi.post<StudentImportSessionView>(
		`/tenants/${tenantId}/student-imports/${sessionId}/commit`,
		input,
	);
}

/** Download the rejected rows as a CSV to fix and re-upload. */
export function downloadImportErrors(tenantId: number, sessionId: string): Promise<void> {
	return downloadFile(
		`/tenants/${tenantId}/student-imports/${sessionId}/errors.csv`,
		`student-import-errors-${sessionId.slice(0, 8)}.csv`,
	);
}

/** The empty CSV template — a constant, so it is generated here rather than fetched. */
export function downloadImportTemplate(): void {
	saveTextFile(`${IMPORT_COLUMNS.join(',')}\n`, 'student-import-template.csv');
}
