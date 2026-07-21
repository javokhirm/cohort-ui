import { describe, expect, it } from 'vitest';

import { PERMISSION_CODES, permitted } from './permissions';

describe('permission catalog', () => {
	it('has no duplicate codes', () => {
		expect(new Set(PERMISSION_CODES).size).toBe(PERMISSION_CODES.length);
	});

	it('includes representative codes from each surface', () => {
		for (const code of [
			'student.read',
			'payroll.finalize',
			'invoice.void',
			'branch.update',
			'dashboard.read',
		]) {
			expect(PERMISSION_CODES).toContain(code);
		}
	});
});

describe('permitted (any-of)', () => {
	const granted = ['student.read', 'course.read'];

	it('passes for a single held code', () => {
		expect(permitted(granted, 'student.read')).toBe(true);
	});

	it('fails for a single missing code', () => {
		expect(permitted(granted, 'student.create')).toBe(false);
	});

	it('passes a list when at least one code is held', () => {
		expect(permitted(granted, ['student.create', 'course.read'])).toBe(true);
	});

	it('fails a list when none are held', () => {
		expect(permitted(granted, ['student.create', 'invoice.void'])).toBe(false);
	});

	it('an empty requirement list never passes', () => {
		expect(permitted(granted, [])).toBe(false);
	});

	it('works with a Set of granted codes', () => {
		expect(permitted(new Set(granted), 'course.read')).toBe(true);
		expect(permitted(new Set(granted), 'course.create')).toBe(false);
	});
});
