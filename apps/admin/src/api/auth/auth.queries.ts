import { adminApi } from '@/api/apiClient';
import type { OperatorProfile } from '@/lib/auth/types';

/** The authenticated operator's profile — used to bootstrap/confirm the console. */
export function getOperator(): Promise<OperatorProfile> {
	return adminApi.get<OperatorProfile>('/me');
}
