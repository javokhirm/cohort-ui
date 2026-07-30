import { publicApi } from '@/api/apiClient';
import type { AuthResult } from '@/lib/auth/types';

export interface LoginInput {
	studentCode: string;
	password: string;
}

/** Single-step login — student code + password → JWT pair + user summary. */
export function login(input: LoginInput): Promise<AuthResult> {
	return publicApi.post<AuthResult>('/auth/student/login', input);
}
