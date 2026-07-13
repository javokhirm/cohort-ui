import { z } from 'zod';

import { UZ_PHONE_REGEX } from '@repo/utils';

export const loginSchema = z.object({
	phone: z.string().regex(UZ_PHONE_REGEX, 'Enter a valid phone number.'),
	password: z.string().min(1, 'Password is required.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
