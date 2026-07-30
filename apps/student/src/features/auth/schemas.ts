import { z } from 'zod';

/** One letter + 7 digits, case-insensitive — matches the backend's student code shape. */
const STUDENT_CODE_REGEX = /^[A-Za-z]\d{7}$/;

export const loginSchema = z.object({
	studentCode: z.string().regex(STUDENT_CODE_REGEX, 'Enter a valid student code.'),
	password: z.string().min(1, 'Password is required.'),
});

export type LoginInput = z.infer<typeof loginSchema>;
