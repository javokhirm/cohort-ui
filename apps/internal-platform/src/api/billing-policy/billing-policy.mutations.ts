import { superAdminApi } from '@/api/apiClient';

import type { TenantBillingPolicy, UpdateTenantBillingPolicyInput } from './types';

/**
 * Merge-upsert a tenant's billing policy. Only the fields sent are changed, and
 * the server re-validates its cross-field rules against the MERGED result — so a
 * partial body can still be rejected (422) because of a value already stored.
 *
 * Returns the tenant's new effective policy. The change is recorded in the
 * platform audit trail with a before/after diff.
 */
export function updateTenantBillingPolicy(
	tenantId: number,
	input: UpdateTenantBillingPolicyInput,
): Promise<TenantBillingPolicy> {
	return superAdminApi.put<TenantBillingPolicy>(
		`/tenants/${tenantId}/billing-policy`,
		input,
	);
}
