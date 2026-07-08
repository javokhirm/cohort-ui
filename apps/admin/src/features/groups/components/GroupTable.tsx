import { useNavigate } from '@tanstack/react-router';
import { CalendarDays, MapPin, User } from 'lucide-react';

import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';

import type { GroupListItem } from '../api/groups.queries';
import { formatScheduleRule, GROUP_STATUS_META } from '../lib/group-options';

interface GroupTableProps {
	groups: GroupListItem[];
	isLoading?: boolean;
}

export function GroupTable({ groups, isLoading }: GroupTableProps) {
	const navigate = useNavigate();

	const columns: ColumnDef<GroupListItem>[] = [
		{
			id: 'name',
			header: 'Group',
			cell: ({ row }) => {
				const schedule = formatScheduleRule(row.original.scheduleRule);
				return (
					<div className="flex gap-2.5">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<CalendarDays className="size-4" />
						</span>
						<div className="flex w-44 flex-col">
							<span className="truncate font-medium">
								{row.original.name}
							</span>
							<span className="truncate text-xs text-muted-foreground">
								{schedule ?? 'No schedule set'}
							</span>
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: 'courseName',
			header: 'Course',
			cell: ({ getValue }) => (
				<span className="text-sm text-muted-foreground">
					{getValue<string>()}
				</span>
			),
			size: 160,
		},
		{
			id: 'teacher',
			header: 'Teacher',
			cell: ({ row }) => (
				<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<User className="size-3.5" />
					{row.original.defaultTeacherName ?? 'Unassigned'}
				</span>
			),
			size: 170,
		},
		{
			id: 'room',
			header: 'Room',
			cell: ({ row }) => (
				<span className="flex items-center gap-1.5 text-sm text-muted-foreground">
					<MapPin className="size-3.5" />
					{row.original.roomName ?? '—'}
				</span>
			),
			size: 140,
		},
		{
			accessorKey: 'capacity',
			header: 'Capacity',
			cell: ({ getValue }) => {
				const cap = getValue<number | null>();
				return (
					<span className="text-sm tabular-nums text-muted-foreground">
						{cap == null ? '—' : `${cap} seats`}
					</span>
				);
			},
			size: 110,
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: ({ getValue }) => {
				const meta = GROUP_STATUS_META[getValue<GroupListItem['status']>()];
				return <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>;
			},
			size: 110,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={groups}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={(row) =>
				void navigate({
					to: '/groups/$groupId',
					params: { groupId: String(row.id) },
				})
			}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No groups match these filters.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
