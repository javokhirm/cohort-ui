import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';

import { LEAD_LOGGABLE_ACTIVITY_TYPES, LEAD_SOURCES } from '../api/leads.queries';

export const createLeadSchema = z.object({
	firstName: z.string().min(1, 'First name is required'),
	lastName: z.string().optional().or(z.literal('')),
	phoneNumber: z.string().regex(UZ_PHONE_REGEX, 'Enter a valid phone number'),
	email: z.union([z.literal(''), z.email('Enter a valid email')]).optional(),
	source: z.enum(LEAD_SOURCES),
	branchId: z.number({ error: 'Branch is required' }).int().positive().optional(),
	courseInterestId: z.number().int().positive().optional(),
	assignedToStaffId: z.number().int().positive().optional(),
	notes: z.string().optional().or(z.literal('')),
});

export type CreateLeadFormValues = z.infer<typeof createLeadSchema>;

export const logActivitySchema = z.object({
	type: z.enum(LEAD_LOGGABLE_ACTIVITY_TYPES),
	notes: z.string().optional().or(z.literal('')),
});

export type LogActivityFormValues = z.infer<typeof logActivitySchema>;

/** Blank string in an optional text field → `undefined` (omit from the payload). */
export function blankToUndefined(value: string | undefined): string | undefined {
	return value === '' ? undefined : value;
}
