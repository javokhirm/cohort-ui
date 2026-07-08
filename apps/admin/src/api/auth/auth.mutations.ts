import { publicApi } from '@/api/apiClient';
import type { AuthResult } from '@/lib/auth/types';

export interface LoginInput {
	phone: string;
	password: string;
}

/** Single-step staff login — phone + password → JWT pair + user summary. */
export function login(input: LoginInput): Promise<AuthResult> {
	return publicApi.post<AuthResult>('/auth/login', input);
}
