import { DoorOpen } from 'lucide-react';

import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';

import { useBranches } from '@/api/branches';

import type { RoomResponse } from '../api/rooms.queries';

interface RoomTableProps {
	rooms: RoomResponse[];
	isLoading?: boolean;
	onEdit: (room: RoomResponse) => void;
}

export function RoomTable({ rooms, isLoading, onEdit }: RoomTableProps) {
	const { data: branches = [] } = useBranches();
	const branchName = (id: number) => branches.find((b) => b.id === id)?.name ?? '—';

	const columns: ColumnDef<RoomResponse>[] = [
		{
			id: 'name',
			header: 'Room',
			cell: ({ row }) => (
				<div className="flex items-center gap-2.5">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<DoorOpen className="size-4" />
					</span>
					<span className="font-medium">{row.original.name}</span>
				</div>
			),
		},
		{
			id: 'branch',
			header: 'Branch',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{branchName(row.original.branchId)}
				</span>
			),
			size: 160,
		},
		{
			accessorKey: 'capacity',
			header: 'Capacity',
			cell: ({ getValue }) => (
				<span className="text-sm tabular-nums text-muted-foreground">
					{getValue<number>()}
				</span>
			),
			size: 120,
		},
		{
			accessorKey: 'type',
			header: 'Type',
			cell: ({ getValue }) => {
				const type = getValue<RoomResponse['type']>();
				if (!type) return <span className="text-muted-foreground">—</span>;
				return <StatusBadge kind="room" status={type} />;
			},
			size: 120,
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			cell: ({ getValue }) =>
				getValue<boolean>() ? (
					<StatusBadge tone="green">Active</StatusBadge>
				) : (
					<StatusBadge tone="slate">Inactive</StatusBadge>
				),
			size: 100,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={rooms}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={(row) => onEdit(row)}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No rooms match this filter.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
