import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import {
	Checkbox,
	DataTable,
	StatusBadge,
	type ColumnDef,
	type RowSelectionState,
} from '@repo/ui';
import { formatPrice } from '@repo/utils';

import type { Student, StudentUser } from '../api/students.queries';
import { useBranches } from '../api/students.queries';

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
					aria-label="Select all"
				/>
			),
			cell: ({ row }) => (
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(v) => row.toggleSelected(!!v)}
					aria-label={`Select ${row.original.user.firstName} ${row.original.user.lastName}`}
					onClick={(e) => e.stopPropagation()}
				/>
			),
			enableSorting: false,
			size: 40,
		},
		{
			accessorKey: 'studentCode',
			header: 'Code',
			cell: ({ getValue }) => (
				<span className="font-mono text-xs text-muted-foreground">
					{getValue<string>()}
				</span>
			),
			size: 144,
		},
		{
			id: 'student',
			header: 'Student',
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
			header: 'Branch',
			cell: ({ row }) => {
				const branchName =
					branches.find((b) => b.id === row.original.branchId)?.name ?? '—';
				return (
					<span className="text-sm text-muted-foreground">{branchName}</span>
				);
			},
		},
		{
			id: 'groups',
			header: 'Group(s)',
			cell: ({ row }) => {
				const groupsText = row.original.groups?.map((g) => g.code).join(', ');
				return (
					<span
						className="max-w-40 truncate text-sm text-muted-foreground"
						title={groupsText}
					>
						{groupsText ?? '—'}
					</span>
				);
			},
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ getValue }) => (
				<StatusBadge kind="student" status={getValue<string>()} />
			),
			size: 112,
		},
		{
			id: 'guardian',
			header: 'Guardian',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.primaryGuardian?.name ?? '—'}
				</span>
			),
		},
		{
			id: 'balance',
			header: () => <div className="text-right">Balance</div>,
			cell: ({ row }) => {
				const { balance } = row.original;
				return (
					<div className="text-right text-sm tabular-nums">
						{balance !== undefined ? (
							<span
								className={
									balance > 0
										? 'font-medium text-destructive'
										: 'text-muted-foreground'
								}
							>
								{formatPrice(balance)}
							</span>
						) : (
							<span className="text-muted-foreground">—</span>
						)}
					</div>
				);
			},
			size: 144,
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onRowClick={(row) => void navigate({ to: `/students/${row.id}` as any })}
			className="rounded-none border-0"
		/>
	);
}
