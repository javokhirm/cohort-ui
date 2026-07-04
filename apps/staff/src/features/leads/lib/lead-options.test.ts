import { describe, expect, it } from 'vitest';

import { canMoveLead, windowToCreatedAfter } from './lead-options';

describe('canMoveLead', () => {
	it('permits moves among the open stages and to LOST', () => {
		expect(canMoveLead('NEW', 'CONTACTED')).toBe(true);
		expect(canMoveLead('TRIAL_BOOKED', 'NEW')).toBe(true);
		expect(canMoveLead('CONTACTED', 'LOST')).toBe(true);
	});

	it('blocks enrollment, terminal moves, and no-ops', () => {
		expect(canMoveLead('NEW', 'ENROLLED')).toBe(false);
		expect(canMoveLead('LOST', 'NEW')).toBe(false);
		expect(canMoveLead('ENROLLED', 'CONTACTED')).toBe(false);
		expect(canMoveLead('NEW', 'NEW')).toBe(false);
	});
});

describe('windowToCreatedAfter', () => {
	it('returns undefined without a window', () => {
		expect(windowToCreatedAfter(undefined)).toBeUndefined();
	});

	it('returns a past ISO cutoff for a window', () => {
		const cutoff = windowToCreatedAfter('7d');
		expect(cutoff).toBeTypeOf('string');
		expect(new Date(cutoff!).getTime()).toBeLessThan(Date.now());
	});
});
