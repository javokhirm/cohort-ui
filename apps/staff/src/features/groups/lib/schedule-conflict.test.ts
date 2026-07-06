import { describe, expect, it } from 'vitest';

import { ApiError } from '@repo/api-client';

import { describeScheduleConflict } from './schedule-conflict';

const conflictError = (details?: Record<string, unknown>) =>
	new ApiError(
		'GROUP_SCHEDULE_CONFLICT',
		'The room or teacher is already booked for one or more of the scheduled sessions.',
		409,
		details,
	);

describe('describeScheduleConflict', () => {
	it('names the occupied room, date and time window', () => {
		const msg = describeScheduleConflict(
			conflictError({
				conflicts: [
					{
						type: 'ROOM',
						sessionDate: '2025-03-03',
						startTime: '09:00:00',
						endTime: '10:30:00',
					},
				],
			}),
		);

		expect(msg).toBe(
			'The room is already booked on 2025-03-03 (09:00–10:30). Pick another room, time, or date range.',
		);
	});

	it('names the teacher when the collision is a teacher double-booking', () => {
		const msg = describeScheduleConflict(
			conflictError({
				conflicts: [
					{
						type: 'TEACHER',
						sessionDate: '2025-03-05',
						startTime: '14:00',
						endTime: '15:00',
					},
				],
			}),
		);

		expect(msg).toContain(
			'The teacher is already booked on 2025-03-05 (14:00–15:00)',
		);
	});

	it('falls back to the server message when no conflict detail is present', () => {
		const err = conflictError();
		expect(describeScheduleConflict(err)).toBe(err.message);
	});

	it('returns null for a non-conflict ApiError', () => {
		expect(
			describeScheduleConflict(
				new ApiError('ROOM_NOT_FOUND', 'Room not found.', 404),
			),
		).toBeNull();
	});

	it('returns null for a non-ApiError value', () => {
		expect(describeScheduleConflict(new Error('boom'))).toBeNull();
		expect(describeScheduleConflict(null)).toBeNull();
	});
});
