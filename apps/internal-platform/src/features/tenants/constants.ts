import type { StatusTone } from '@repo/ui';

import type { SubscriptionStatus, TenantStatus } from '@/api/tenants/types';
import type { useAppT } from '@/locales';

type TenantsT = ReturnType<typeof useAppT<'tenants'>>;

// ─── List page ────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 20;

export type StatusTab = TenantStatus | 'all';

/** Status filter tabs — labels resolve from the translator at render. */
export function buildStatusTabs(t: TenantsT): { value: StatusTab; label: string }[] {
	return [
		{ value: 'all', label: t('filter.all') },
		{ value: 'ACTIVE', label: t('statusLabel.active') },
		{ value: 'PENDING', label: t('statusLabel.pending') },
		{ value: 'SUSPENDED', label: t('statusLabel.suspended') },
		{ value: 'CANCELLED', label: t('statusLabel.cancelled') },
	];
}

export const TENANT_STATUS_TONE: Record<TenantStatus, StatusTone> = {
	ACTIVE: 'green',
	PENDING: 'blue',
	SUSPENDED: 'red',
	CANCELLED: 'slate',
};

/** Localized tenant-status label — keeps the enum→key mapping type-safe. */
export function tenantStatusLabel(t: TenantsT, status: TenantStatus): string {
	switch (status) {
		case 'ACTIVE':
			return t('statusLabel.active');
		case 'PENDING':
			return t('statusLabel.pending');
		case 'SUSPENDED':
			return t('statusLabel.suspended');
		case 'CANCELLED':
			return t('statusLabel.cancelled');
		default:
			return status;
	}
}

export const SUB_STATUS_TONE: Record<SubscriptionStatus, StatusTone> = {
	TRIALING: 'blue',
	ACTIVE: 'green',
	PAST_DUE: 'amber',
	CANCELLED: 'slate',
};

/** Localized subscription-status label for the tenants list. */
export function tenantSubStatusLabel(t: TenantsT, status: SubscriptionStatus): string {
	switch (status) {
		case 'TRIALING':
			return t('subStatusLabel.trialing');
		case 'ACTIVE':
			return t('subStatusLabel.active');
		case 'PAST_DUE':
			return t('subStatusLabel.pastDue');
		case 'CANCELLED':
			return t('subStatusLabel.cancelled');
		default:
			return status;
	}
}
