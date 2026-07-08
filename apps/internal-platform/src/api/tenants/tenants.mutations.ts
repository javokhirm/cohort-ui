import { superAdminApi } from '@/api/apiClient';
import type {
	AddMemberInput,
	ChangeMemberRoleInput,
	ChangePlanInput,
	OnboardTenantInput,
	TenantActionInput,
	TenantDetailView,
	TenantSummaryView,
	UpdateTenantInput,
} from './types';
import type { SubscriptionView } from '../subscriptions/types';

export function onboardTenant(input: OnboardTenantInput): Promise<TenantDetailView> {
	return superAdminApi.post<TenantDetailView>('/tenants', input);
}

export function updateTenant(
	id: number,
	input: UpdateTenantInput,
): Promise<TenantSummaryView> {
	return superAdminApi.patch<TenantSummaryView>(`/tenants/${id}`, input);
}

export function suspendTenant(
	id: number,
	input: TenantActionInput,
): Promise<TenantSummaryView> {
	return superAdminApi.post<TenantSummaryView>(`/tenants/${id}/suspend`, input);
}

export function unsuspendTenant(
	id: number,
	input: TenantActionInput,
): Promise<TenantSummaryView> {
	return superAdminApi.post<TenantSummaryView>(`/tenants/${id}/unsuspend`, input);
}

export function cancelTenant(
	id: number,
	input: TenantActionInput,
): Promise<TenantSummaryView> {
	return superAdminApi.post<TenantSummaryView>(`/tenants/${id}/cancel`, input);
}

export function changeTenantPlan(
	id: number,
	input: ChangePlanInput,
): Promise<SubscriptionView> {
	return superAdminApi.post<SubscriptionView>(`/tenants/${id}/change-plan`, input);
}

export function addTenantMember(tenantId: number, input: AddMemberInput): Promise<null> {
	return superAdminApi.post<null>(`/tenants/${tenantId}/members`, input);
}

export function changeTenantMemberRole(
	tenantId: number,
	userId: number,
	input: ChangeMemberRoleInput,
): Promise<null> {
	return superAdminApi.patch<null>(`/tenants/${tenantId}/members/${userId}`, input);
}
