import { isApiError } from '@repo/api-client';

/**
 * Backend error code raised when creating/regenerating a group would double-book
 * a room or teacher for one or more of its scheduled sessions
 * (`GroupService` → `ConflictDetectorService`). The 409 body carries
 * `details.conflicts[]`, each describing the colliding occupied slot.
 */
const SCHEDULE_CONFLICT_CODE = 'GROUP_SCHEDULE_CONFLICT';

/** One occupied slot from the 409 `details.conflicts` payload (fields optional — trust nothing). */
interface ScheduleConflictDetail {
	type?: 'ROOM' | 'TEACHER';
	sessionDate?: string;
	startTime?: string;
	endTime?: string;
}

/** Drop seconds from an `HH:mm[:ss]` time so toasts read `09:00`, not `09:00:00`. */
function toHhmm(time: string | undefined): string {
	return (time ?? '').slice(0, 5);
}

function firstConflict(
	details: Record<string, unknown> | undefined,
): ScheduleConflictDetail | null {
	const conflicts = details?.conflicts;
	if (!Array.isArray(conflicts) || conflicts.length === 0) return null;
	return conflicts[0] as ScheduleConflictDetail;
}

/**
 * If `err` is a group schedule-conflict 409, return a human-readable explanation
 * naming the occupied resource, date and time; otherwise return `null` so the
 * caller can fall back to generic error handling. Pure — safe to unit-test.
 */
export function describeScheduleConflict(err: unknown): string | null {
	if (!isApiError(err) || err.code !== SCHEDULE_CONFLICT_CODE) return null;

	const conflict = firstConflict(err.details);
	if (!conflict?.sessionDate) return err.message;

	const resource = conflict.type === 'TEACHER' ? 'teacher' : 'room';
	const window = `${toHhmm(conflict.startTime)}–${toHhmm(conflict.endTime)}`;
	return `The ${resource} is already booked on ${conflict.sessionDate} (${window}). Pick another ${resource}, time, or date range.`;
}
