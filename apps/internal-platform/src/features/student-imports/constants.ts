import type { StatusTone } from '@repo/ui';

import type { ImportRowOutcome, StudentImportStatus } from '@/api/student-imports/types';

/** Status tones for an import session. */
export const IMPORT_STATUS_TONE: Record<StudentImportStatus, StatusTone> = {
	VALIDATED: 'blue',
	QUEUED: 'amber',
	APPLYING: 'amber',
	COMPLETED: 'green',
	FAILED: 'red',
};

export const IMPORT_STATUS_LABEL: Record<StudentImportStatus, string> = {
	VALIDATED: 'Ready to review',
	QUEUED: 'Queued',
	APPLYING: 'Importing…',
	COMPLETED: 'Completed',
	FAILED: 'Failed',
};

/** Tones for a row's outcome. A skip is not a failure — it is a no-op. */
export const ROW_OUTCOME_TONE: Record<ImportRowOutcome, StatusTone> = {
	CREATED: 'green',
	SKIPPED_EXISTING: 'slate',
	FAILED: 'red',
};

export const ROW_OUTCOME_LABEL: Record<ImportRowOutcome, string> = {
	CREATED: 'Imported',
	SKIPPED_EXISTING: 'Already enrolled',
	FAILED: 'Failed',
};
