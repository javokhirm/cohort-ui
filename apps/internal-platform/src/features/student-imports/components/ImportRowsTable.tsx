import { Card, DataTable, Pagination, StatusBadge, type ColumnDef } from '@repo/ui';

import type { StudentImportRowView } from '@/api/student-imports/types';

import { ROW_OUTCOME_LABEL, ROW_OUTCOME_TONE } from '../constants';
import { IMPORT_ROWS_PAGE_SIZE, useStudentImportRows } from '../hooks';
import type { StudentImportRowFilters } from '@/api/student-imports/types';
import { useAppT } from '@/locales';

/**
 * Built per render rather than held at module scope: the headers are
 * user-facing, so they must re-resolve when the language changes.
 */
function buildColumns(
	t: ReturnType<typeof useAppT<'imports'>>,
): ColumnDef<StudentImportRowView>[] {
	return [
		{
			id: 'row',
			header: t('column.row'),
			cell: ({ row }) => (
				<span className="font-mono text-xs text-muted-foreground">
					{row.original.rowNumber}
				</span>
			),
		},
		{
			id: 'student',
			header: t('column.student'),
			cell: ({ row }) => {
				const { raw } = row.original;
				const name = [raw.firstName, raw.lastName].filter(Boolean).join(' ');
				return (
					<div className="flex flex-col">
						<span className="text-sm font-medium">{name || '—'}</span>
						<span className="font-mono text-xs text-muted-foreground">
							{raw.phone}
						</span>
					</div>
				);
			},
		},
		{
			id: 'group',
			header: t('column.group'),
			cell: ({ row }) => (
				<span className="font-mono text-xs text-muted-foreground">
					{row.original.raw.groupId}
				</span>
			),
		},
		{
			id: 'nextBillingDate',
			header: t('column.nextBilling'),
			cell: ({ row }) => (
				<span className="text-sm">{row.original.raw.nextBillingDate || '—'}</span>
			),
		},
		{
			id: 'status',
			header: t('column.status'),
			cell: ({ row }) => {
				const { errors, outcome } = row.original;
				// Once applied, the outcome is the story. Before that, it is whether the
				// row would even be allowed through.
				if (outcome) {
					return (
						<StatusBadge tone={ROW_OUTCOME_TONE[outcome.outcome]}>
							{ROW_OUTCOME_LABEL[outcome.outcome]}
						</StatusBadge>
					);
				}
				return errors.length > 0 ? (
					<StatusBadge tone="red">Invalid</StatusBadge>
				) : (
					<StatusBadge tone="green">Valid</StatusBadge>
				);
			},
		},
		{
			id: 'issues',
			header: t('column.issues'),
			cell: ({ row }) => {
				const { errors, warnings, outcome } = row.original;
				const messages = [
					...errors.map((issue) => ({
						tone: 'error' as const,
						text: issue.message,
					})),
					...warnings.map((issue) => ({
						tone: 'warn' as const,
						text: issue.message,
					})),
				];
				if (outcome?.outcome === 'FAILED' && outcome.errorMessage) {
					messages.push({ tone: 'error', text: outcome.errorMessage });
				}

				if (messages.length === 0) {
					return <span className="text-sm text-muted-foreground">—</span>;
				}

				return (
					<ul className="flex max-w-lg flex-col gap-1">
						{messages.map((message, index) => (
							<li
								key={index}
								className={
									message.tone === 'error'
										? 'text-xs text-destructive'
										: 'text-xs text-muted-foreground'
								}
							>
								{message.text}
							</li>
						))}
					</ul>
				);
			},
		},
	];
}

interface ImportRowsTableProps {
	tenantId: number;
	sessionId: string;
	filters: Omit<StudentImportRowFilters, 'page' | 'limit'>;
	page: number;
	onPageChange: (page: number) => void;
}

/** The row report — what each line of the CSV is, and what became of it. */
export function ImportRowsTable({
	tenantId,
	sessionId,
	filters,
	page,
	onPageChange,
}: ImportRowsTableProps) {
	const t = useAppT('imports');
	const { data, isLoading } = useStudentImportRows(
		tenantId,
		sessionId,
		{ ...filters, page, limit: IMPORT_ROWS_PAGE_SIZE },
		true,
	);

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<DataTable
				columns={buildColumns(t)}
				data={data?.rows ?? []}
				isLoading={isLoading}
				getRowId={(row) => String(row.rowNumber)}
				emptyState={
					<div className="py-16 text-center text-sm text-muted-foreground">
						No rows match this filter.
					</div>
				}
				className="rounded-none border-0"
			/>
			<div className="border-t border-border px-4 py-3">
				<Pagination
					page={page}
					pageSize={IMPORT_ROWS_PAGE_SIZE}
					total={data?.total ?? 0}
					onPageChange={onPageChange}
				/>
			</div>
		</Card>
	);
}
