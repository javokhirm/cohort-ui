import { useState } from 'react';
import { Receipt } from 'lucide-react';

import {
	DataTable,
	EmptyState,
	Pagination,
	Skeleton,
	StatusBadge,
	type ColumnDef,
} from '@repo/ui';
import { formatDate, formatMoney } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';
import {
	STUDENT_TAB_PAGE_SIZE,
	useStudentInvoices,
	type Invoice,
} from '../api/students.queries';

type PeopleT = ReturnType<typeof useAppT<'people'>>;

/**
 * Column table is built per render rather than held at module scope: the headers
 * are user-facing, so they must re-resolve when the language changes.
 */
const buildInvoiceColumns = (
	t: PeopleT,
	statusLabel: ReturnType<typeof useStatusLabel>,
): ColumnDef<Invoice>[] => [
	{
		accessorKey: 'invoiceNumber',
		header: t('detail.billing.column.invoice'),
		cell: ({ getValue }) => (
			<span className="font-mono text-xs">{getValue<string>()}</span>
		),
	},
	{
		accessorKey: 'issueDate',
		header: t('detail.billing.column.date'),
		cell: ({ getValue }) => (
			<span className="text-muted-foreground">
				{formatDate(getValue<string>())}
			</span>
		),
	},
	{
		accessorKey: 'total',
		header: () => (
			<div className="text-right">{t('detail.billing.column.total')}</div>
		),
		cell: ({ row }) => (
			<div className="text-right font-medium tabular-nums">
				{formatMoney(row.original.total, row.original.currency)}
			</div>
		),
	},
	{
		accessorKey: 'status',
		header: t('detail.billing.column.status'),
		cell: ({ getValue }) => (
			<StatusBadge kind="invoice" status={getValue<string>()}>
				{statusLabel('invoice', getValue<string>())}
			</StatusBadge>
		),
	},
];

interface BillingTabProps {
	studentId: number;
}

/**
 * Student detail → Billing: this student's invoices, newest first. Read-only —
 * every write (record payment, apply discount, void) lives on the invoice
 * itself, so nothing here can change an amount by accident.
 */
export function BillingTab({ studentId }: BillingTabProps) {
	const t = useAppT('people');
	const statusLabel = useStatusLabel();
	const [page, setPage] = useState(1);
	const { data, isLoading } = useStudentInvoices(studentId, page);

	const invoices = data?.rows ?? [];
	const total = data?.total ?? 0;

	if (isLoading && !data) {
		return <Skeleton className="h-32 rounded-xl" />;
	}

	return (
		<div className="flex flex-col gap-3">
			<DataTable
				columns={buildInvoiceColumns(t, statusLabel)}
				data={invoices}
				getRowId={(row) => String(row.id)}
				emptyState={
					<EmptyState
						icon={<Receipt />}
						title={t('detail.billing.emptyTitle')}
						description={t('detail.billing.emptyDescription')}
					/>
				}
			/>

			{total > STUDENT_TAB_PAGE_SIZE && (
				<Pagination
					page={page}
					pageSize={STUDENT_TAB_PAGE_SIZE}
					total={total}
					onPageChange={setPage}
				/>
			)}
		</div>
	);
}
