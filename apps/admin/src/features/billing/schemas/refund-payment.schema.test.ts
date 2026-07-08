import { describe, expect, it } from 'vitest';

import { refundPaymentSchema } from './refund-payment.schema';

describe('refundPaymentSchema', () => {
	it('accepts a positive amount with a valid destination', () => {
		expect(
			refundPaymentSchema.safeParse({ amount: 100_000, destination: 'WALLET' })
				.success,
		).toBe(true);
		expect(
			refundPaymentSchema.safeParse({ amount: 100_000, destination: 'CASH_OUT' })
				.success,
		).toBe(true);
	});

	it('rejects a zero or negative amount', () => {
		const schema = refundPaymentSchema;
		expect(schema.safeParse({ amount: 0, destination: 'CASH_OUT' }).success).toBe(
			false,
		);
		expect(schema.safeParse({ amount: -500, destination: 'CASH_OUT' }).success).toBe(
			false,
		);
	});

	it('rejects a destination outside WALLET/CASH_OUT', () => {
		const result = refundPaymentSchema.safeParse({
			amount: 100_000,
			destination: 'BANK',
		});
		expect(result.success).toBe(false);
	});

	it('allows notes to be omitted or empty', () => {
		expect(
			refundPaymentSchema.safeParse({ amount: 100_000, destination: 'CASH_OUT' })
				.success,
		).toBe(true);
		expect(
			refundPaymentSchema.safeParse({
				amount: 100_000,
				destination: 'CASH_OUT',
				notes: '',
			}).success,
		).toBe(true);
	});
});
