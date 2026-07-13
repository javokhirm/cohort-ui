import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { billingPolicyKeys } from '@/api/billing-policy/keys';
import { updateTenantBillingPolicy } from '@/api/billing-policy/billing-policy.mutations';
import { getTenantBillingPolicy } from '@/api/billing-policy/billing-policy.queries';
import type { UpdateTenantBillingPolicyInput } from '@/api/billing-policy/types';
import { tenantsKeys } from '@/api/tenants/keys';
import {
	cancelTenant,
	suspendTenant,
	unsuspendTenant,
	updateTenant,
} from '@/api/tenants/tenants.mutations';
import { getTenant, getTenantSummary, listTenants } from '@/api/tenants/tenants.queries';
import type { UpdateTenantInput } from '@/api/tenants/types';

import type { StatusTab } from './constants';
import { PAGE_SIZE } from './constants';

// ─── List hooks ───────────────────────────────────────────────────────────────

export function useTenantsPage({
	statusTab,
	search,
	page,
}: {
	statusTab: StatusTab;
	search: string;
	page: number;
}) {
	const filters = {
		status: statusTab === 'all' ? undefined : statusTab,
		search: search || undefined,
		page,
		limit: PAGE_SIZE,
	};
	return useQuery({
		queryKey: tenantsKeys.list(filters),
		queryFn: () => listTenants(filters),
		placeholderData: keepPreviousData,
	});
}

export function useTenantSummary() {
	return useQuery({
		queryKey: tenantsKeys.summary(),
		queryFn: getTenantSummary,
	});
}

// ─── Detail hooks ─────────────────────────────────────────────────────────────

export function useTenant(id: number, enabled: boolean) {
	return useQuery({
		queryKey: tenantsKeys.detail(id),
		queryFn: () => getTenant(id),
		enabled,
	});
}

export function useSuspendTenant(id: number, options?: { onSuccess?: () => void }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (reason?: string) => suspendTenant(id, { reason }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tenantsKeys.detail(id) });
			options?.onSuccess?.();
		},
	});
}

export function useUnsuspendTenant(id: number, options?: { onSuccess?: () => void }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (reason?: string) => unsuspendTenant(id, { reason }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tenantsKeys.detail(id) });
			options?.onSuccess?.();
		},
	});
}

export function useCancelTenant(id: number, options?: { onSuccess?: () => void }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (reason?: string) => cancelTenant(id, { reason }),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tenantsKeys.detail(id) });
			options?.onSuccess?.();
		},
	});
}

export function useUpdateTenant(id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateTenantInput) => updateTenant(id, data),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: tenantsKeys.detail(id) });
		},
	});
}

// ─── Billing policy ───────────────────────────────────────────────────────────

/**
 * A tenant's effective billing policy. The platform console is the only place
 * this can be changed; tenant staff can read it but not write it.
 */
export function useTenantBillingPolicy(id: number, enabled: boolean) {
	return useQuery({
		queryKey: billingPolicyKeys.detail(id),
		queryFn: () => getTenantBillingPolicy(id),
		enabled,
	});
}

export function useUpdateTenantBillingPolicy(id: number) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (data: UpdateTenantBillingPolicyInput) =>
			updateTenantBillingPolicy(id, data),
		// Seed the cache from the server's response rather than the submitted form
		// values: this is a merge-upsert, so what comes back is the tenant's new
		// EFFECTIVE policy — never assume the write landed as sent.
		onSuccess: (policy) => {
			queryClient.setQueryData(billingPolicyKeys.detail(id), policy);
		},
	});
}
