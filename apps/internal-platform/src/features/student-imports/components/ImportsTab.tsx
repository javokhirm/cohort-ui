import { useNavigate } from '@tanstack/react-router';
import { Card, DataTable, Skeleton, StatusBadge, type ColumnDef } from '@repo/ui';
import { formatDateTime } from '@repo/utils';

import type { StudentImportSessionView } from '@/api/student-imports/types';

import { IMPORT_STATUS_LABEL, IMPORT_STATUS_TONE } from '../constants';
import { useStudentImports } from '../hooks';
import { UploadImportCard } from './UploadImportCard';

const columns: ColumnDef<StudentImportSessionView>[] = [
	{
		id: 'file',
		header: 'File',
		cell: ({ row }) => (
			<span className="font-mono text-sm">{row.original.fileName}</span>
		),
	},
	{
		id: 'status',
		header: 'Status',
		cell: ({ row }) => (
			<StatusBadge tone={IMPORT_STATUS_TONE[row.original.status]}>
				{IMPORT_STATUS_LABEL[row.original.status]}
			</StatusBadge>
		),
	},
	{
		id: 'result',
		header: 'Result',
		cell: ({ row }) => {
			const { status, counters } = row.original;
			if (status === 'COMPLETED') {
				return (
					<span className="text-sm text-muted-foreground">
						{counters.createdCount} imported
						{counters.skippedCount > 0 &&
							`, ${counters.skippedCount} already enrolled`}
						{counters.failedCount > 0 && `, ${counters.failedCount} failed`}
					</span>
				);
			}
			return (
				<span className="text-sm text-muted-foreground">
					{counters.validRows} of {counters.totalRows} rows valid
				</span>
			);
		},
	},
	{
		id: 'createdAt',
		header: 'Uploaded',
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{formatDateTime(row.original.createdAt)}
			</span>
		),
	},
];

/**
 * The center's import history, plus the upload that starts a new one.
 *
 * Sessions expire from Redis after a week, so this list is a working view, not an
 * archive — the permanent record of what was imported lives in the audit log.
 */
export function ImportsTab({ tenantId }: { tenantId: number }) {
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
				<h3 className="text-sm font-semibold">Recent imports</h3>

				{isError ? (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load this center&apos;s imports. Please refresh.
					</div>
				) : isLoading ? (
					<Skeleton className="h-40 w-full" />
				) : (
					<Card className="gap-0 overflow-hidden py-0">
						<DataTable
							columns={columns}
							data={sessions ?? []}
							getRowId={(row) => row.sessionId}
							onRowClick={(row) => openSession(row.sessionId)}
							emptyState={
								<div className="py-16 text-center text-sm text-muted-foreground">
									No imports yet. Upload a CSV to migrate this
									center&apos;s students.
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
