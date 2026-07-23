import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Button, PageHeader, Skeleton } from '@repo/ui';

import { downloadImportErrors } from '@/api/student-imports/student-imports.mutations';
import type { ImportRowOutcome } from '@/api/student-imports/types';
import { CommitImportDialog } from '@/features/student-imports/components/CommitImportDialog';
import { ImportRowsTable } from '@/features/student-imports/components/ImportRowsTable';
import { ImportSummary } from '@/features/student-imports/components/ImportSummary';
import { useStudentImport } from '@/features/student-imports/hooks';
import { useAppT } from '@/locales';

type RowFilter = 'ALL' | 'INVALID' | ImportRowOutcome;

/** Row filter chips — labels resolve from the translator at render. */
function buildFilters(
	t: ReturnType<typeof useAppT<'imports'>>,
): { value: RowFilter; label: string }[] {
	return [
		{ value: 'ALL', label: t('allRows') },
		{ value: 'INVALID', label: t('stat.blocked') },
		{ value: 'CREATED', label: t('stat.imported') },
		{ value: 'SKIPPED_EXISTING', label: t('stat.alreadyEnrolled') },
		{ value: 'FAILED', label: t('stat.failed') },
	];
}

/**
 * One import session, from review to result.
 *
 * `VALIDATED` — the operator reviews the report and commits (or fixes the file
 * and uploads a new one). `QUEUED`/`APPLYING` — a progress bar, polled.
 * `COMPLETED`/`FAILED` — what actually happened, and the rejected rows to
 * download.
 */
export function ImportSessionPage() {
	const t = useAppT('imports');
	const tt = useAppT('tenants');
	const { tenantId, sessionId } = useParams({ strict: false }) as {
		tenantId?: string;
		sessionId?: string;
	};
	const numericTenantId = tenantId ? parseInt(tenantId, 10) : NaN;
	const isValid = !isNaN(numericTenantId) && Boolean(sessionId);

	const [filter, setFilter] = useState<RowFilter>('ALL');
	const [page, setPage] = useState(1);
	const [commitOpen, setCommitOpen] = useState(false);

	const {
		data: session,
		isLoading,
		isError,
	} = useStudentImport(numericTenantId, sessionId ?? '', isValid);

	if (!isValid || isError) {
		return (
			<div className="flex flex-col items-center gap-4 py-24 text-center">
				<div className="flex flex-col gap-1">
					<p className="text-sm font-medium">{t('notFoundTitle')}</p>
					<p className="text-sm text-muted-foreground">{t('notFoundHint')}</p>
				</div>
				<Link to="/tenants">
					<Button variant="outline">← {tt('backToList')}</Button>
				</Link>
			</div>
		);
	}

	if (isLoading || !session) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	const isReview = session.status === 'VALIDATED';
	const isFinished = session.status === 'COMPLETED' || session.status === 'FAILED';
	const hasRejects =
		session.counters.invalidRows > 0 || session.counters.failedCount > 0;

	const rowFilters =
		filter === 'ALL'
			? {}
			: filter === 'INVALID'
				? { validationStatus: 'INVALID' as const }
				: { outcome: filter };

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={t('title')}
				description={t('centerRef', { id: numericTenantId })}
				actions={
					<div className="flex gap-2">
						{hasRejects && (
							<Button
								variant="outline"
								onClick={() =>
									void downloadImportErrors(
										numericTenantId,
										session.sessionId,
									)
								}
							>
								{t('downloadRejected')}
							</Button>
						)}
						{isReview && session.counters.validRows > 0 && (
							<Button onClick={() => setCommitOpen(true)}>
								{t('importStudents')}
							</Button>
						)}
					</div>
				}
			/>

			<ImportSummary session={session} />

			<div className="flex flex-col gap-3">
				<div className="flex flex-wrap gap-2">
					{buildFilters(t)
						.filter(
							// Outcome filters mean nothing until the import has actually run.
							(option) =>
								option.value === 'ALL' ||
								option.value === 'INVALID' ||
								isFinished,
						)
						.map((option) => (
							<Button
								key={option.value}
								size="sm"
								variant={filter === option.value ? 'default' : 'outline'}
								onClick={() => {
									setFilter(option.value);
									setPage(1);
								}}
							>
								{option.label}
							</Button>
						))}
				</div>

				<ImportRowsTable
					tenantId={numericTenantId}
					sessionId={session.sessionId}
					filters={rowFilters}
					page={page}
					onPageChange={setPage}
				/>
			</div>

			<CommitImportDialog
				tenantId={numericTenantId}
				session={session}
				open={commitOpen}
				onOpenChange={setCommitOpen}
			/>
		</div>
	);
}
