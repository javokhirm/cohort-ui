import { adminApi } from '@/api/apiClient';
import type { ResetPasswordInput } from './types';

export function deactivateUser(id: number): Promise<void> {
	return adminApi.post<void>(`/users/${id}/deactivate`);
}

export function resetUserPassword(id: number, input: ResetPasswordInput): Promise<void> {
	return adminApi.post<void>(`/users/${id}/reset-password`, input);
}
