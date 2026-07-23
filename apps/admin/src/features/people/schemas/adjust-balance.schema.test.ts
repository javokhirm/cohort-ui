import { describe, expect, it } from 'vitest';

import type { Translator } from '@repo/i18n';

import type { useAppT } from '@/locales';
import { adjustBalanceSchema } from './adjust-balance.schema';

/**
 * These tests exercise the *rules*, not the copy, so the schema factories get a
 * stub translator that echoes its key. Message wording is covered by the
 * catalogs' own type-checking (a missing key fails `check-types`).
 */
const t = ((key: string) => key) as unknown as Translator<'validation'>;

const tp = ((key: string) => key) as unknown as ReturnType<typeof useAppT<'people'>>;

describe('adjustBalanceSchema', () => {
	it('accepts a positive amount regardless of current balance', () => {
		const result = adjustBalanceSchema(0, t, tp).safeParse({
			amount: 50_000,
			reason: 'Goodwill credit',
		});
		expect(result.success).toBe(true);
	});

	it('accepts a negative amount that leaves the balance at exactly zero', () => {
		const result = adjustBalanceSchema(100_000, t, tp).safeParse({
			amount: -100_000,
			reason: 'Correcting a duplicate deposit',
		});
		expect(result.success).toBe(true);
	});

	it('rejects a negative amount that would drive the balance below zero', () => {
		const result = adjustBalanceSchema(100_000, t, tp).safeParse({
			amount: -100_001,
			reason: 'Too much',
		});
		expect(result.success).toBe(false);
	});

	it('rejects a zero amount', () => {
		const result = adjustBalanceSchema(100_000, t, tp).safeParse({
			amount: 0,
			reason: 'No-op',
		});
		expect(result.success).toBe(false);
	});

	it('requires a reason', () => {
		const result = adjustBalanceSchema(100_000, t, tp).safeParse({
			amount: 10_000,
			reason: '',
		});
		expect(result.success).toBe(false);
	});
});
