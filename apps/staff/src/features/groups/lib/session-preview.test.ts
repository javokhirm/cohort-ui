import { describe, expect, it } from 'vitest';

import { generateSessionDates } from './session-preview';

describe('generateSessionDates', () => {
	it('enumerates matching weekdays across the range, inclusive of both ends', () => {
		// 2025-03-03 is a Monday.
		const dates = generateSessionDates(
			['MON', 'WED', 'FRI'],
			'2025-03-03',
			'2025-03-14',
		);
		expect(dates).toEqual([
			'2025-03-03',
			'2025-03-05',
			'2025-03-07',
			'2025-03-10',
			'2025-03-12',
			'2025-03-14',
		]);
	});

	it('returns an empty list when no days are selected', () => {
		expect(generateSessionDates([], '2025-03-03', '2025-03-14')).toEqual([]);
	});

	it('returns an empty list when the date range is missing', () => {
		expect(generateSessionDates(['MON'], undefined, '2025-03-14')).toEqual([]);
		expect(generateSessionDates(['MON'], '2025-03-03', undefined)).toEqual([]);
		expect(generateSessionDates(['MON'], '2025-03-03', '')).toEqual([]);
	});

	it('returns an empty list when the end date is before the start date', () => {
		expect(generateSessionDates(['MON'], '2025-03-14', '2025-03-03')).toEqual([]);
	});

	it('includes a single-day range when it matches', () => {
		expect(generateSessionDates(['MON'], '2025-03-03', '2025-03-03')).toEqual([
			'2025-03-03',
		]);
	});
});
