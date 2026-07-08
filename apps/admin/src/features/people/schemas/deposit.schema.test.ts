import { describe, expect, it } from 'vitest';

import { depositSchema } from './deposit.schema';

describe('depositSchema', () => {
	it('accepts a positive amount with a valid method', () => {
		const result = depositSchema.safeParse({
			amount: 100_000,
			method: 'CASH',
			notes: '',
		});
		expect(result.success).toBe(true);
	});

	it('rejects a zero or negative amount', () => {
		expect(depositSchema.safeParse({ amount: 0, method: 'CASH' }).success).toBe(
			false,
		);
		expect(depositSchema.safeParse({ amount: -1000, method: 'CASH' }).success).toBe(
			false,
		);
	});

	it('rejects a method outside CASH/CARD/BANK_TRANSFER', () => {
		const result = depositSchema.safeParse({
			amount: 100_000,
			method: 'CLICK',
		});
		expect(result.success).toBe(false);
	});

	it('allows notes to be omitted or empty', () => {
		expect(depositSchema.safeParse({ amount: 50_000, method: 'CARD' }).success).toBe(
			true,
		);
		expect(
			depositSchema.safeParse({ amount: 50_000, method: 'CARD', notes: '' })
				.success,
		).toBe(true);
	});
});
