import { superAdminApi } from '@/api/apiClient';

import type { TenantBillingPolicy } from './types';

/**
 * A tenant's effective billing policy — its stored row, or the platform defaults
 * when it has never been configured. 404s for an unknown tenant.
 */
export function getTenantBillingPolicy(tenantId: number): Promise<TenantBillingPolicy> {
	return superAdminApi.get<TenantBillingPolicy>(`/tenants/${tenantId}/billing-policy`);
}
