import { describe, expect, it } from 'vitest';

import type { Translator } from '@repo/i18n';

import { depositSchema } from './deposit.schema';

/**
 * These tests exercise the *rules*, not the copy, so the schema factories get a
 * stub translator that echoes its key. Message wording is covered by the
 * catalogs' own type-checking (a missing key fails `check-types`).
 */
const t = ((key: string) => key) as unknown as Translator<'validation'>;

describe('depositSchema', () => {
	it('accepts a positive amount with a valid method', () => {
		const result = depositSchema(t).safeParse({
			amount: 100_000,
			method: 'CASH',
			notes: '',
		});
		expect(result.success).toBe(true);
	});

	it('rejects a zero or negative amount', () => {
		expect(depositSchema(t).safeParse({ amount: 0, method: 'CASH' }).success).toBe(
			false,
		);
		expect(
			depositSchema(t).safeParse({ amount: -1000, method: 'CASH' }).success,
		).toBe(false);
	});

	it('rejects a method outside CASH/CARD/BANK_TRANSFER', () => {
		const result = depositSchema(t).safeParse({
			amount: 100_000,
			method: 'CLICK',
		});
		expect(result.success).toBe(false);
	});

	it('allows notes to be omitted or empty', () => {
		expect(
			depositSchema(t).safeParse({ amount: 50_000, method: 'CARD' }).success,
		).toBe(true);
		expect(
			depositSchema(t).safeParse({ amount: 50_000, method: 'CARD', notes: '' })
				.success,
		).toBe(true);
	});
});
