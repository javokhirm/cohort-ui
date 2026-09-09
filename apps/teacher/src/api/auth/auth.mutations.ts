import { publicApi } from '@/api/apiClient';
import { ClientApp, type AuthResult } from '@/lib/auth/types';

export interface LoginInput {
	phone: string;
	password: string;
}

export function login(input: LoginInput): Promise<AuthResult> {
	return publicApi.post<AuthResult>('/auth/login', input, {
		headers: {
			'x-client-app': ClientApp.TEACHER,
		},
	});
}
