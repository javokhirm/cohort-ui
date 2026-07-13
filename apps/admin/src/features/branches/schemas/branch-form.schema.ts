import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';

/**
 * Branch form schemas. Mirrors the backend `CreateBranchDto` / `UpdateBranchDto`
 * (api-reference §3.1). Address and phone are optional on the backend but the
 * product design marks them required, so the FE validates them as required.
 * The backend doesn't constrain `phone`'s format, but it's entered via the
 * shared `PhoneInput`, so it's always a valid Uzbekistan number.
 * `code` is create-only (immutable on the backend, absent from `UpdateBranchDto`);
 * `isActive` is edit-only (branches are always created active).
 */

const name = z.string().trim().min(1, 'Branch name is required');
const address = z.string().trim().min(1, 'Address is required');
const phone = z.string().regex(UZ_PHONE_REGEX, 'Enter a valid phone number');
const timezone = z.string().trim().min(1, 'Timezone is required');

export const createBranchSchema = z.object({
	name,
	code: z
		.string()
		.trim()
		.min(1, 'Short code is required')
		.max(20, 'Short code is too long'),
	address,
	phone,
	timezone,
	isMain: z.boolean(),
});

export const editBranchSchema = z.object({
	name,
	address,
	phone,
	timezone,
	isMain: z.boolean(),
	isActive: z.boolean(),
});

export type CreateBranchFormValues = z.infer<typeof createBranchSchema>;
export type EditBranchFormValues = z.infer<typeof editBranchSchema>;
