import { superAdminApi } from '@/api/apiClient';
import type { OperatorProfile } from '@/lib/auth/types';

/** The authenticated operator's profile — used to bootstrap/confirm the console. */
export function getOperator(): Promise<OperatorProfile> {
	return superAdminApi.get<OperatorProfile>('/me');
}
