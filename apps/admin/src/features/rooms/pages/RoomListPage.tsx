import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { DoorOpen, Plus } from 'lucide-react';

import { Button, EmptyState, PageHeader, SearchFilterBar, Spinner } from '@repo/ui';

import { Can } from '@/components/Can';
import { useBranches } from '@/api/branches';
import { usePermissions } from '@/features/auth/hooks';
import { useInfiniteScrollSentinel } from '@/hooks/useInfiniteScrollSentinel';
import { useInfiniteRoomList } from '../api/rooms.queries';
import type { RoomResponse } from '../api/rooms.queries';
import type { RoomListFilters } from '../api/keys';
import { ROOM_STATUS_FILTERS } from '../lib/room-type';
import { RoomCard } from '../components/RoomCard';
import { RoomForm } from '../components/RoomForm';

const PAGE_SIZE = 20;

export function RoomListPage() {
	const navigate = useNavigate({ from: '/rooms' });
	const { can } = usePermissions();
	const { status } = useSearch({ from: '/_authed/rooms' });

	const [addOpen, setAddOpen] = useState(false);
	const [editRoom, setEditRoom] = useState<RoomResponse | null>(null);
	const canEdit = can('room.update');

	const filters: Omit<RoomListFilters, 'page'> = {
		limit: PAGE_SIZE,
		isActive: status === undefined ? undefined : status === 'active',
	};

	const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useInfiniteRoomList(filters);
	const rooms = data?.pages.flatMap((p) => p.rows) ?? [];

	const { data: branches = [] } = useBranches();
	const branchName = (id: number) => branches.find((b) => b.id === id)?.name ?? '—';

	const sentinelRef = useInfiniteScrollSentinel({
		hasNextPage,
		isFetchingNextPage,
		fetchNextPage,
	});

	function handleStatusChange(value: (typeof ROOM_STATUS_FILTERS)[number]['value']) {
		void navigate({
			search: (prev) => ({ ...prev, status: value }),
		});
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title="Rooms"
				description="Physical and online rooms by branch"
				actions={
					<Can permission="room.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							New room
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={ROOM_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load rooms. Please refresh.
					</div>
				)}

				{isLoading ? (
					<div className="flex items-center justify-center py-16 text-muted-foreground">
						<Spinner className="size-5" />
					</div>
				) : rooms.length > 0 ? (
					<>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{rooms.map((room) => (
								<RoomCard
									key={room.id}
									room={room}
									branchName={branchName(room.branchId)}
									onEdit={canEdit ? setEditRoom : undefined}
								/>
							))}
						</div>
						{hasNextPage && (
							<div ref={sentinelRef} className="flex justify-center py-4">
								{isFetchingNextPage && <Spinner className="size-5" />}
							</div>
						)}
					</>
				) : (
					!isError && (
						<EmptyState
							icon={<DoorOpen />}
							title="No rooms match this filter"
							description="Try adjusting the status filter, or add a new room."
						/>
					)
				)}
			</div>

			<RoomForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
			{editRoom && (
				<RoomForm
					mode="edit"
					room={editRoom}
					open={editRoom !== null}
					onOpenChange={(open) => {
						if (!open) setEditRoom(null);
					}}
				/>
			)}
		</div>
	);
}
