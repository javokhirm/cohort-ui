import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
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
	return useQuery({
		queryKey: roomsKeys.roomList(filters),
		queryFn: () =>
			manageApi.getPaginated<RoomResponse>('/rooms', {
				params: filters,
			}) as Promise<PaginatedResult<RoomResponse>>,
		placeholderData: keepPreviousData,
	});
}
