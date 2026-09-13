import { TASHKENT_TZ } from '@repo/utils';

import type {
	RoomSchedule,
	RoomScheduleBooking,
	RoomScheduleRoom,
} from '../api/room-schedule.queries';
import type { RoomType } from '@/features/rooms/api/rooms.queries';
import { timeToMinutes } from './group-options';

/**
 * Layout maths for the schedule's **room view** — turning one day of
 * `GET /manage/schedule/rooms` into a room × time-of-day timeline.
 *
 * Everything the *domain* decides now arrives from the backend already resolved:
 * which rooms to show, how long each is occupied, which classes are
 * double-booked, which outgrow their room. What is left here is presentation —
 * where a block sits on screen, how deep a row stacks, which hours the axis
 * spans — so the two never drift apart.
 */

const MINUTES_PER_DAY = 24 * 60;
/** Fallback window when the day holds no classes at all. */
const DEFAULT_WINDOW_START = 8 * 60;
const DEFAULT_WINDOW_END = 20 * 60;
/** Keeps a single early class from rendering as a one-hour-wide axis. */
const MIN_WINDOW_MINUTES = 6 * 60;
/** A block never collapses to nothing, even on same/backwards end times. */
const MIN_BLOCK_MINUTES = 15;

/** One class placed on the timeline. */
export interface AllocationBlock {
	booking: RoomScheduleBooking;
	/** Minutes since midnight; `endMin` is always > `startMin`. */
	startMin: number;
	endMin: number;
	/** Stacking row within the room — above 0 only where classes overlap. */
	lane: number;
}

/** One row of the grid: a room, or the catch-all for unplaced classes. */
export interface AllocationRow {
	/** Stable React key. */
	key: string;
	/** `null` on the catch-all row for classes held without a room. */
	roomId: number | null;
	/** Empty on the catch-all row — the view supplies a localized label. */
	name: string;
	branchName: string | null;
	capacity: number | null;
	type: RoomType | null;
	isActive: boolean;
	blocks: AllocationBlock[];
	/** How many lanes deep the row stacks — 1 unless something overlaps. */
	laneCount: number;
	conflictCount: number;
}

/**
 * Place a room's classes on lanes, first-fit by start time, so overlapping
 * classes stack instead of covering each other. Cancelled classes take a lane
 * too — they are drawn, just greyed.
 */
function layoutBlocks(bookings: RoomScheduleBooking[]): {
	blocks: AllocationBlock[];
	laneCount: number;
} {
	const laneEnds: number[] = [];
	const blocks = bookings.map((booking) => {
		const startMin = Math.min(
			Math.max(timeToMinutes(booking.startTime), 0),
			MINUTES_PER_DAY,
		);
		const endMin = Math.min(
			MINUTES_PER_DAY,
			Math.max(timeToMinutes(booking.endTime), startMin + MIN_BLOCK_MINUTES),
		);

		let lane = laneEnds.findIndex((end) => end <= startMin);
		if (lane === -1) lane = laneEnds.length;
		laneEnds[lane] = endMin;

		return { booking, startMin, endMin, lane };
	});

	return { blocks, laneCount: Math.max(1, laneEnds.length) };
}

function toRow(room: RoomScheduleRoom): AllocationRow {
	return {
		key: `room-${room.roomId}`,
		roomId: room.roomId,
		name: room.name,
		branchName: room.branchName || null,
		capacity: room.capacity,
		type: room.type,
		isActive: room.isActive,
		conflictCount: room.conflictCount,
		...layoutBlocks(room.bookings),
	};
}

/**
 * The grid's rows, in reading order: the rooms as the backend ordered them
 * (branch, then name), then the unplaced classes last — they are the work an
 * admin still has to do, so they belong at the bottom, not hidden.
 */
export function buildAllocationRows(schedule: RoomSchedule | undefined): AllocationRow[] {
	if (!schedule) return [];

	const rows = schedule.rooms.map(toRow);
	if (schedule.unassigned.length > 0) {
		rows.push({
			key: 'unassigned',
			roomId: null,
			name: '',
			branchName: null,
			capacity: null,
			type: null,
			isActive: true,
			conflictCount: 0,
			...layoutBlocks(schedule.unassigned),
		});
	}
	return rows;
}

/** Which rooms the view is showing. */
export type RoomViewFilter = 'all' | 'booked' | 'conflicts';

/** Narrow the rows to the filter. The unplaced-classes row always survives. */
export function filterAllocationRows(
	rows: AllocationRow[],
	filter: RoomViewFilter,
): AllocationRow[] {
	if (filter === 'all') return rows;
	return rows.filter(
		(row) =>
			row.roomId === null ||
			(filter === 'conflicts' ? row.conflictCount > 0 : row.blocks.length > 0),
	);
}

export interface AllocationWindow {
	/** Whole-hour bounds of the visible axis, in minutes since midnight. */
	startMin: number;
	endMin: number;
	/** The hour marks the axis is divided into, e.g. `[8, 9, … 19]`. */
	hours: number[];
}

/**
 * The whole-hour axis that covers the day's classes. The backend reports the
 * day's true bounds; this rounds them out to whole hours and guarantees a
 * readable minimum span, so one 09:00–10:00 class does not produce a
 * single-column grid.
 */
export function allocationWindow(schedule: RoomSchedule | undefined): AllocationWindow {
	let startMin = DEFAULT_WINDOW_START;
	let endMin = DEFAULT_WINDOW_END;

	if (schedule?.window) {
		startMin = Math.floor(timeToMinutes(schedule.window.startTime) / 60) * 60;
		endMin = Math.ceil(timeToMinutes(schedule.window.endTime) / 60) * 60;
		if (endMin - startMin < MIN_WINDOW_MINUTES) {
			endMin = Math.min(MINUTES_PER_DAY, startMin + MIN_WINDOW_MINUTES);
			startMin = Math.max(0, endMin - MIN_WINDOW_MINUTES);
		}
	}

	const hours = Array.from(
		{ length: (endMin - startMin) / 60 },
		(_, i) => startMin / 60 + i,
	);
	return { startMin, endMin, hours };
}

/** How far into the visible window a minute sits, as a percentage. */
function offsetPercent(minute: number, window: AllocationWindow): number {
	const span = window.endMin - window.startMin;
	return span > 0 ? ((minute - window.startMin) / span) * 100 : 0;
}

/** A block's left offset and width as percentages of the visible window. */
export function blockGeometry(
	block: AllocationBlock,
	window: AllocationWindow,
): { left: string; width: string } {
	const start = Math.max(block.startMin, window.startMin);
	const end = Math.min(block.endMin, window.endMin);
	const left = offsetPercent(start, window);
	return {
		left: `${left}%`,
		width: `${Math.max(offsetPercent(end, window) - left, 0)}%`,
	};
}

/** "08:00" for an hour mark on the axis. */
export function hourLabel(hour: number): string {
	return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * Minutes since midnight **on the center's clock**, not the viewer's laptop —
 * a manager travelling abroad must still see the "now" line where their center
 * actually is.
 *
 * Local because `@repo/utils` exposes the current *hour* but not the minute; if
 * a second screen ever needs this, promote it to the date helpers there.
 */
export function centerNowMinutes(): number {
	const [h = '0', m = '0'] = new Intl.DateTimeFormat('en-GB', {
		timeZone: TASHKENT_TZ,
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
	})
		.format(new Date())
		.split(':');
	return Number(h) * 60 + Number(m);
}

/**
 * Where to draw the "now" line, as a percentage across the window — or `null`
 * when the current time falls outside the hours on show (which includes every
 * day that is not today).
 */
export function nowMarkerPercent(
	nowMinutes: number | null,
	window: AllocationWindow,
): number | null {
	if (nowMinutes === null) return null;
	if (nowMinutes < window.startMin || nowMinutes > window.endMin) return null;
	return offsetPercent(nowMinutes, window);
}
