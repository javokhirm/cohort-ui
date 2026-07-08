import { describe, expect, it } from 'vitest';

import type { EnrollmentStatus } from '../api/groups.queries';
import { canTransitionEnrollment, ENROLLMENT_TRANSITIONS } from './group-options';

describe('canTransitionEnrollment', () => {
	it('allows ACTIVE to move to any non-terminal or terminal status', () => {
		expect(canTransitionEnrollment('ACTIVE', 'SUSPENDED')).toBe(true);
		expect(canTransitionEnrollment('ACTIVE', 'DROPPED')).toBe(true);
		expect(canTransitionEnrollment('ACTIVE', 'COMPLETED')).toBe(true);
		expect(canTransitionEnrollment('ACTIVE', 'TRANSFERRED')).toBe(true);
	});

	it('only allows SUSPENDED to reactivate or drop', () => {
		expect(canTransitionEnrollment('SUSPENDED', 'ACTIVE')).toBe(true);
		expect(canTransitionEnrollment('SUSPENDED', 'DROPPED')).toBe(true);
		expect(canTransitionEnrollment('SUSPENDED', 'COMPLETED')).toBe(false);
		expect(canTransitionEnrollment('SUSPENDED', 'TRANSFERRED')).toBe(false);
	});

	it('treats DROPPED / COMPLETED / TRANSFERRED as terminal', () => {
		const terminal: EnrollmentStatus[] = ['DROPPED', 'COMPLETED', 'TRANSFERRED'];
		for (const from of terminal) {
			expect(ENROLLMENT_TRANSITIONS[from]).toEqual([]);
		}
	});
});
