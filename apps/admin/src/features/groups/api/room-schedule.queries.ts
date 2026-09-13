import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';

import { groupsKeys, type RoomScheduleFilters } from './keys';
import type { SessionStatus } from './groups.queries';
import type { RoomType } from '@/features/rooms/api/rooms.queries';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirror the backend `RoomScheduleDto` for `GET /manage/schedule/rooms`
// (api-reference.md §3.7). The generated `@repo/api-client` OpenAPI types expose
// request DTOs but not response bodies, so the shapes are declared here;
// reconcile when the spec starts emitting response schemas.

/** One class occupying a room (or held without one) on the requested day. */
export interface RoomScheduleBooking {
	sessionId: number;
	branchId: number;
	groupId: number;
	groupName: string;
	courseName: string;
	teacherId: number | null;
	teacherName: string | null;
	/** `HH:mm`, 24-hour. */
	startTime: string;
	/** `HH:mm`, 24-hour. */
	endTime: string;
	durationMinutes: number;
	topic: string | null;
	status: SessionStatus;
	studentCount: number;
	/** Overlaps another live class in the same room — the room is double-booked. */
	conflict: boolean;
	/** The group's roster outgrows the room's seats. */
	overCapacity: boolean;
}

/** One room's day. A room with nothing booked still gets a row. */
export interface RoomScheduleRoom {
	roomId: number;
	name: string;
	branchId: number;
	branchName: string;
	capacity: number;
	type: RoomType | null;
	/** False for a retired room that still holds classes on this date. */
	isActive: boolean;
	bookings: RoomScheduleBooking[];
	conflictCount: number;
}

export interface RoomScheduleSummary {
	roomCount: number;
	occupiedRoomCount: number;
	sessionCount: number;
	cancelledCount: number;
	conflictCount: number;
	unassignedCount: number;
}

/** `GET /manage/schedule/rooms` (`RoomScheduleDto`). */
export interface RoomSchedule {
	date: string;
	/** The day's outer bounds; `null` when nothing at all is scheduled. */
	window: { startTime: string; endTime: string } | null;
	rooms: RoomScheduleRoom[];
	/** Classes held with no room assigned — they occupy nothing and never conflict. */
	unassigned: RoomScheduleBooking[];
	summary: RoomScheduleSummary;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * One day's classes laid out by room (`GET /manage/schedule/rooms`). Purpose-built
 * for the schedule's room view: free rooms, booked minutes and double-bookings
 * all arrive resolved, so the browser never has to re-derive what "free" means
 * or page through the room list to find out.
 */
export function useRoomSchedule(filters: RoomScheduleFilters, enabled = true) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: RoomScheduleFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: groupsKeys.roomSchedule(effectiveFilters),
		queryFn: () =>
			manageApi.get<RoomSchedule>('/schedule/rooms', { params: effectiveFilters }),
		placeholderData: keepPreviousData,
		enabled,
	});
}
