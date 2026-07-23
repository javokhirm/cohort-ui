import { useNavigate } from '@tanstack/react-router';
import { Card, DataTable, Skeleton, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatDateTime } from '@repo/utils';

import type { StudentImportSessionView } from '@/api/student-imports/types';

import { importStatusLabel, IMPORT_STATUS_TONE } from '../constants';
import { useStudentImports } from '../hooks';
import { UploadImportCard } from './UploadImportCard';
import { useAppT } from '@/locales';

/**
 * Built per render rather than held at module scope: the headers are
 * user-facing, so they must re-resolve when the language changes.
 */
function buildColumns(
	t: ReturnType<typeof useAppT<'imports'>>,
): ColumnDef<StudentImportSessionView>[] {
	return [
		{
			id: 'file',
			header: t('column.file'),
			cell: ({ row }) => (
				<span className="font-mono text-sm">{row.original.fileName}</span>
			),
		},
		{
			id: 'status',
			header: t('column.status'),
			cell: ({ row }) => (
				<StatusBadge tone={IMPORT_STATUS_TONE[row.original.status]}>
					{importStatusLabel(t, row.original.status)}
				</StatusBadge>
			),
		},
		{
			id: 'result',
			header: t('column.result'),
			cell: ({ row }) => {
				const { status, counters } = row.original;
				if (status === 'COMPLETED') {
					return (
						<span className="text-sm text-muted-foreground">
							{t('resultImported', { count: counters.createdCount })}
							{counters.skippedCount > 0 &&
								t('resultAlreadyEnrolledSuffix', {
									count: counters.skippedCount,
								})}
							{counters.failedCount > 0 &&
								t('resultFailedSuffix', {
									count: counters.failedCount,
								})}
						</span>
					);
				}
				return (
					<span className="text-sm text-muted-foreground">
						{t('resultValid', {
							valid: counters.validRows,
							total: counters.totalRows,
						})}
					</span>
				);
			},
		},
		{
			id: 'createdAt',
			header: t('column.uploaded'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{formatDateTime(row.original.createdAt)}
				</span>
			),
		},
	];
}

/**
 * The center's import history, plus the upload that starts a new one.
 *
 * Sessions expire from Redis after a week, so this list is a working view, not an
 * archive — the permanent record of what was imported lives in the audit log.
 */
export function ImportsTab({ tenantId }: { tenantId: number }) {
	const t = useAppT('imports');
	const navigate = useNavigate();
	const { data: sessions, isLoading, isError } = useStudentImports(tenantId, true);

	const openSession = (sessionId: string) =>
		// The router is code-based, so dynamic paths are not statically typed here
		// (the same idiom the audit-log list uses).
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		void navigate({ to: `/tenants/${tenantId}/imports/${sessionId}` as any });

	return (
		<div className="flex flex-col gap-6">
			<UploadImportCard
				tenantId={tenantId}
				onUploaded={(session) => openSession(session.sessionId)}
			/>

			<div className="flex flex-col gap-3">
				<h3 className="text-sm font-semibold">{t('recentImports')}</h3>

				{isError ? (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('importsLoadError')}
					</div>
				) : isLoading ? (
					<Skeleton className="h-40 w-full" />
				) : (
					<Card className="gap-0 overflow-hidden py-0">
						<DataTable
							columns={buildColumns(t)}
							data={sessions ?? []}
							getRowId={(row) => row.sessionId}
							onRowClick={(row) => openSession(row.sessionId)}
							emptyState={
								<div className="py-16 text-center text-sm text-muted-foreground">
									{t('importsEmpty')}
								</div>
							}
							className="rounded-none border-0"
						/>
					</Card>
				)}
			</div>
		</div>
	);
}
