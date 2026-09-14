import { MoreHorizontal, Trash2 } from 'lucide-react';

import {
	Badge,
	Button,
	DataTable,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	type ColumnDef,
} from '@repo/ui';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';
import type { GuardianCandidate } from '../api/guardians.queries';

/** Guardians have no login of their own, so this mirrors `StudentAvatar`'s initials look. */
function GuardianAvatar({ firstName, lastName }: { firstName: string; lastName: string }) {
	const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
			{initials}
		</div>
	);
}

/** Up to two linked-student names as chips, with a "+N more" overflow badge. */
function LinkedStudentsCell({ students }: { students: GuardianCandidate['students'] }) {
	const t = useAppT('people');
	if (students.length === 0) {
		return (
			<span className="text-sm text-muted-foreground">
				{t('guardiansPage.noStudents')}
			</span>
		);
	}

	const visible = students.slice(0, 2);
	const overflow = students.length - visible.length;

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{visible.map((s) => (
				<Badge key={s.studentId} variant="secondary" className="font-normal">
					{s.firstName} {s.lastName}
				</Badge>
			))}
			{overflow > 0 && (
				<Badge variant="outline" className="font-normal text-muted-foreground">
					{t('guardiansPage.moreStudents', { count: overflow })}
				</Badge>
			)}
		</div>
	);
}

/** Row-level "..." menu, matching the roster's `EnrollmentRow` pattern. */
function RowActions({
	guardian,
	onEdit,
	onDelete,
}: {
	guardian: GuardianCandidate;
	onEdit?: (guardian: GuardianCandidate) => void;
	onDelete?: (guardian: GuardianCandidate) => void;
}) {
	const t = useAppT('people');

	return (
		<Can permission="student.guardian.manage">
			<div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="sm"
							className="size-8 p-0"
							aria-label={t('guardiansPage.detail.actionsLabel')}
						>
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={() => onEdit?.(guardian)}>
							{t('guardiansPage.detail.edit')}
						</DropdownMenuItem>
						<DropdownMenuItem variant="destructive" onClick={() => onDelete?.(guardian)}>
							<Trash2 />
							{t('guardiansPage.detail.delete')}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</Can>
	);
}

interface GuardianTableProps {
	guardians: GuardianCandidate[];
	isLoading?: boolean;
	onRowClick?: (guardian: GuardianCandidate) => void;
	onEdit?: (guardian: GuardianCandidate) => void;
	onDelete?: (guardian: GuardianCandidate) => void;
}

export function GuardianTable({
	guardians,
	isLoading,
	onRowClick,
	onEdit,
	onDelete,
}: GuardianTableProps) {
	const t = useAppT('people');

	const columns: ColumnDef<GuardianCandidate>[] = [
		{
			id: 'guardian',
			header: t('guardiansPage.column.guardian'),
			cell: ({ row }) => (
				<div className="flex items-center gap-2.5">
					<GuardianAvatar
						firstName={row.original.user.firstName}
						lastName={row.original.user.lastName}
					/>
					<span className="font-medium">
						{row.original.user.firstName} {row.original.user.lastName}
					</span>
				</div>
			),
		},
		{
			id: 'phone',
			header: t('guardiansPage.column.phone'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.user.phone ?? '—'}
				</span>
			),
			size: 160,
		},
		{
			id: 'students',
			header: t('guardiansPage.column.students'),
			cell: ({ row }) => <LinkedStudentsCell students={row.original.students} />,
		},
	];

	if (onEdit || onDelete) {
		columns.push({
			id: 'actions',
			header: () => <span className="sr-only">{t('guardiansPage.column.actions')}</span>,
			cell: ({ row }) => (
				<RowActions guardian={row.original} onEdit={onEdit} onDelete={onDelete} />
			),
			size: 56,
		});
	}

	return (
		<DataTable
			columns={columns}
			data={guardians}
			isLoading={isLoading}
			getRowId={(row) => String(row.user.id)}
			onRowClick={onRowClick}
			className="rounded-none border-0"
		/>
	);
}
