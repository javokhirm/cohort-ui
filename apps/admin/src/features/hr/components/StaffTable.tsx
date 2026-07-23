import { useNavigate } from '@tanstack/react-router';

import { Badge, DataTable, StatusBadge, type ColumnDef } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';

import type { StaffResponse, StaffUser } from '../api/staff.queries';

function StaffAvatar({ user }: { user: StaffUser }) {
	const initials =
		`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
			{initials}
		</div>
	);
}

interface StaffTableProps {
	staff: StaffResponse[];
	isLoading?: boolean;
}

export function StaffTable({ staff, isLoading }: StaffTableProps) {
	const t = useAppT('hr');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate();

	const columns: ColumnDef<StaffResponse>[] = [
		{
			accessorKey: 'staffCode',
			header: t('column.employee'),
			cell: ({ getValue }) => (
				<span className="font-mono text-xs text-muted-foreground">
					{getValue<string>()}
				</span>
			),
			size: 144,
		},
		{
			id: 'name',
			header: t('column.name'),
			cell: ({ row }) => {
				const { user, position, department } = row.original;
				const subtitle = position ?? department;
				return (
					<div className="flex items-center gap-2.5">
						<StaffAvatar user={user} />
						<div className="flex flex-col">
							<span className="font-medium">
								{user.firstName} {user.lastName}
							</span>
							{subtitle && (
								<span className="text-xs text-muted-foreground">
									{subtitle}
								</span>
							)}
						</div>
					</div>
				);
			},
		},
		{
			id: 'role',
			header: t('column.role'),
			cell: ({ row }) => {
				const roles = row.original.roles;
				if (roles.length === 0)
					return <span className="text-muted-foreground">—</span>;
				return (
					<div className="flex flex-wrap gap-1">
						{roles.map((role) => (
							<Badge key={role} variant="secondary" className="text-xs">
								{statusLabel('role', role)}
							</Badge>
						))}
					</div>
				);
			},
			size: 160,
		},
		{
			id: 'branch',
			header: t('column.branch'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.branch?.name ?? '—'}
				</span>
			),
		},
		{
			accessorKey: 'status',
			header: t('column.status'),
			cell: ({ getValue }) => (
				<StatusBadge kind="staff" status={getValue<string>()}>
					{statusLabel('staff', getValue<string>())}
				</StatusBadge>
			),
			size: 112,
		},
		{
			id: 'load',
			header: t('column.load'),
			cell: ({ row }) => {
				const { groupsCount, weeklyHours } = row.original;
				if (groupsCount === 0) {
					return <span className="text-sm text-muted-foreground">—</span>;
				}
				return (
					<span className="text-sm text-muted-foreground">
						{t('loadValue', { count: groupsCount, hours: weeklyHours })}
					</span>
				);
			},
		},
	];

	return (
		<DataTable
			columns={columns}
			data={staff}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={(row) =>
				void navigate({
					to: '/staff/$staffId',
					params: { staffId: String(row.id) },
				})
			}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					{t('emptyFiltered')}
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
