import { describe, expect, it } from 'vitest';

import { creditNoteSchema } from './credit-note.schema';

describe('creditNoteSchema', () => {
	it('accepts an amount within the creditable cap', () => {
		const result = creditNoteSchema(500_000).safeParse({
			amount: 500_000,
			reason: 'Student withdrew from a session',
		});
		expect(result.success).toBe(true);
	});

	it('rejects a zero or negative amount', () => {
		const schema = creditNoteSchema(500_000);
		expect(schema.safeParse({ amount: 0, reason: 'x' }).success).toBe(false);
		expect(schema.safeParse({ amount: -1, reason: 'x' }).success).toBe(false);
	});

	it('rejects an amount exceeding the creditable cap', () => {
		const result = creditNoteSchema(500_000).safeParse({
			amount: 500_001,
			reason: 'Too much',
		});
		expect(result.success).toBe(false);
	});

	it('requires a reason', () => {
		const result = creditNoteSchema(500_000).safeParse({
			amount: 100_000,
			reason: '',
		});
		expect(result.success).toBe(false);
	});
});
