/**
 * CSV student import (api-reference §2.9) — the migration path that onboards an
 * existing education center's students.
 *
 * Sessions live in Redis under a TTL on the backend, so `sessionId` is a UUID
 * string rather than a numeric id, and a session that has expired comes back as a
 * 404 (`IMPORT_SESSION_NOT_FOUND`) — the fix is always to upload the file again.
 */

/**
 * `VALIDATED` — parsed and checked; nothing written to the center yet.
 * `QUEUED`/`APPLYING` — committed and being applied by the background worker.
 * `COMPLETED` — finished (individual rows may still have failed).
 * `FAILED` — the run aborted; `errorMessage` says why.
 */
export type StudentImportStatus =
	'VALIDATED' | 'QUEUED' | 'APPLYING' | 'COMPLETED' | 'FAILED';

/** Statuses in which the worker is still running — the UI polls while in these. */
export const IN_FLIGHT_STATUSES: StudentImportStatus[] = ['QUEUED', 'APPLYING'];

/**
 * What the worker did with one row. `SKIPPED_EXISTING` = the student was already
 * enrolled in that group, so the row was a no-op.
 */
export type ImportRowOutcome = 'CREATED' | 'SKIPPED_EXISTING' | 'FAILED';

/** One validation error or warning against a cell (or the row as a whole). */
export interface ImportRowIssue {
	column: string | null;
	code: string;
	message: string;
}

export interface StudentImportCounters {
	totalRows: number;
	validRows: number;
	invalidRows: number;
	warningRows: number;
	processedRows: number;
	createdCount: number;
	createdStudentCount: number;
	skippedCount: number;
	failedCount: number;
}

export interface StudentImportSessionView {
	sessionId: string;
	tenantId: number;
	status: StudentImportStatus;
	fileName: string;
	counters: StudentImportCounters;
	createdByUserId: number | null;
	committedByUserId: number | null;
	createdAt: string;
	committedAt: string | null;
	startedAt: string | null;
	finishedAt: string | null;
	errorMessage: string | null;
}

export interface StudentImportRowOutcomeView {
	outcome: ImportRowOutcome;
	studentId: number | null;
	enrollmentId: number | null;
	studentCreated: boolean;
	errorCode: string | null;
	errorMessage: string | null;
}

export interface StudentImportRowView {
	rowNumber: number;
	/** The original cells, keyed by canonical column name. */
	raw: Record<string, string>;
	errors: ImportRowIssue[];
	warnings: ImportRowIssue[];
	/** `null` until the worker has applied this row. */
	outcome: StudentImportRowOutcomeView | null;
}

export interface StudentImportRowFilters {
	validationStatus?: 'VALID' | 'INVALID';
	outcome?: ImportRowOutcome;
	page?: number;
	limit?: number;
}

export interface CommitStudentImportInput {
	/**
	 * Apply the valid rows and leave the invalid ones behind. Without it, a
	 * session that still holds invalid rows is refused — dropping students has to
	 * be deliberate.
	 */
	skipInvalidRows?: boolean;
}

/**
 * The CSV header the operator downloads as a template. Kept in lockstep with the
 * backend's `IMPORT_COLUMNS`; the file is generated client-side rather than
 * fetched, since it is a constant.
 */
export const IMPORT_COLUMNS = [
	'phone',
	'firstName',
	'lastName',
	'email',
	'dateOfBirth',
	'gender',
	'address',
	'joinDate',
	'branchCode',
	'groupId',
	'nextBillingDate',
] as const;
