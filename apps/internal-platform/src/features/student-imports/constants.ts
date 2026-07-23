import type { StatusTone } from '@repo/ui';

import type { ImportRowOutcome, StudentImportStatus } from '@/api/student-imports/types';
import type { useAppT } from '@/locales';

type ImportsT = ReturnType<typeof useAppT<'imports'>>;

/** Status tones for an import session. */
export const IMPORT_STATUS_TONE: Record<StudentImportStatus, StatusTone> = {
	VALIDATED: 'blue',
	QUEUED: 'amber',
	APPLYING: 'amber',
	COMPLETED: 'green',
	FAILED: 'red',
};

/** Localized import-session status label — keeps the key mapping type-safe. */
export function importStatusLabel(t: ImportsT, status: StudentImportStatus): string {
	switch (status) {
		case 'VALIDATED':
			return t('statusLabel.validated');
		case 'QUEUED':
			return t('statusLabel.queued');
		case 'APPLYING':
			return t('statusLabel.applying');
		case 'COMPLETED':
			return t('statusLabel.completed');
		case 'FAILED':
			return t('statusLabel.failed');
	}
}

/** Tones for a row's outcome. A skip is not a failure — it is a no-op. */
export const ROW_OUTCOME_TONE: Record<ImportRowOutcome, StatusTone> = {
	CREATED: 'green',
	SKIPPED_EXISTING: 'slate',
	FAILED: 'red',
};

/** Localized row-outcome label. */
export function rowOutcomeLabel(t: ImportsT, outcome: ImportRowOutcome): string {
	switch (outcome) {
		case 'CREATED':
			return t('stat.imported');
		case 'SKIPPED_EXISTING':
			return t('stat.alreadyEnrolled');
		case 'FAILED':
			return t('stat.failed');
	}
}
