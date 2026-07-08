import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

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
