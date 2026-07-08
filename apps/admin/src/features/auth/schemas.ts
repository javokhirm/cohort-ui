import { z } from 'zod';

export const loginSchema = z.object({
	phone: z.string().min(9, 'Enter your phone number.'),
	password: z.string().min(1, 'Password is required.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
