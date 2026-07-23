import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import {
	Checkbox,
	DataTable,
	StatusBadge,
	type ColumnDef,
	type RowSelectionState,
} from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';
import { useBranches } from '@/api/branches';
import type { Student, StudentUser } from '../api/students.queries';

function StudentAvatar({ user }: { user: StudentUser }) {
	const initials =
		`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
			{initials}
		</div>
	);
}

interface StudentTableProps {
	students: Student[];
	isLoading?: boolean;
}

export function StudentTable({ students, isLoading }: StudentTableProps) {
	const t = useAppT('people');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate();
	const { data: branches = [] } = useBranches();
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

	const columns: ColumnDef<Student>[] = [
		{
			id: 'select',
			header: ({ table }) => (
				<Checkbox
					checked={
						table.getIsAllPageRowsSelected()
							? true
							: table.getIsSomePageRowsSelected()
								? 'indeterminate'
								: false
					}
					onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
					aria-label={t('column.selectAll')}
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(v) => row.toggleSelected(!!v)}
					aria-label={t('column.selectRow', {
						name: `${row.original.user.firstName} ${row.original.user.lastName}`,
					})}
					onClick={(e) => e.stopPropagation()}
				/>
			),
			enableSorting: false,
			size: 40,
		},
		{
			accessorKey: 'studentCode',
			header: t('column.code'),
			cell: ({ getValue }) => (
				<span className="font-mono text-xs text-muted-foreground">
					{getValue<string>()}
				</span>
			),
			size: 144,
		},
		{
			id: 'student',
			header: t('column.student'),
			cell: ({ row }) => (
				<div className="flex items-center gap-2.5">
					<StudentAvatar user={row.original.user} />
					<span className="font-medium">
						{row.original.user.firstName} {row.original.user.lastName}
					</span>
				</div>
			),
		},
		{
			id: 'branch',
			header: t('column.branch'),
			cell: ({ row }) => {
				const branchName =
					branches.find((b) => b.id === row.original.branchId)?.name ?? '—';
				return (
					<span className="text-sm text-muted-foreground">{branchName}</span>
				);
			},
		},
		{
			id: 'dateOfBirth',
			header: t('column.dateOfBirth'),
			cell: ({ row }) => {
				const { dateOfBirth } = row.original;
				return (
					<span className="text-sm text-muted-foreground">
						{dateOfBirth ? formatDate(dateOfBirth) : '—'}
					</span>
				);
			},
			size: 144,
		},
		{
			accessorKey: 'status',
			header: t('column.status'),
			cell: ({ getValue }) => (
				<StatusBadge kind="student" status={getValue<string>()}>
					{statusLabel('student', getValue<string>())}
				</StatusBadge>
			),
			size: 102,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={students}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			rowSelection={rowSelection}
			onRowSelectionChange={setRowSelection}
			onRowClick={(row) => void navigate({ to: `/students/${row.id}` as any })}
			className="rounded-none border-0"
		/>
	);
}
