import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import { roomsKeys, type RoomListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `RoomResponseDto` for the `/manage/rooms` surface
// (api-reference.md §3.6). The generated `@repo/api-client` OpenAPI types
// expose the request DTOs but not response bodies, so the shape is declared
// here; reconcile if the spec starts emitting response schemas.

export const ROOM_TYPES = ['classroom', 'lab', 'online'] as const;
export type RoomType = (typeof ROOM_TYPES)[number];

export interface RoomResponse {
	id: number;
	branchId: number;
	name: string;
	capacity: number;
	type: RoomType | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useRoomList(filters: RoomListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// (e.g. the group form's room picker scoped to the form's branch) wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: RoomListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: roomsKeys.roomList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<RoomResponse>('/rooms', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<RoomResponse>>,
		placeholderData: keepPreviousData,
	});
}
