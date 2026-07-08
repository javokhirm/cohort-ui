import { cn } from '@repo/ui';
import type { StatusTone } from '@repo/ui';

import type { SubscriptionStatus, TenantStatus } from '@/api/tenants/types';

// ─── List page ────────────────────────────────────────────────────────────────

export const PAGE_SIZE = 20;

export type StatusTab = TenantStatus | 'all';

export const STATUS_TABS: { value: StatusTab; label: string }[] = [
	{ value: 'all', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'PENDING', label: 'Pending' },
	{ value: 'SUSPENDED', label: 'Suspended' },
	{ value: 'CANCELLED', label: 'Cancelled' },
];

export const TENANT_STATUS_TONE: Record<TenantStatus, StatusTone> = {
	ACTIVE: 'green',
	PENDING: 'blue',
	SUSPENDED: 'red',
	CANCELLED: 'slate',
};

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
	ACTIVE: 'Active',
	PENDING: 'Pending',
	SUSPENDED: 'Suspended',
	CANCELLED: 'Cancelled',
};

export const SUB_STATUS_TONE: Record<SubscriptionStatus, StatusTone> = {
	TRIALING: 'blue',
	ACTIVE: 'green',
	PAST_DUE: 'amber',
	CANCELLED: 'slate',
};

export const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
	TRIALING: 'Trialing',
	ACTIVE: 'Active',
	PAST_DUE: 'Past due',
	CANCELLED: 'Cancelled',
};

// ─── Detail page ──────────────────────────────────────────────────────────────

export const TAB_TRIGGER_CLASS = cn(
	'cursor-pointer -mb-px rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2',
	'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
	'data-[state=active]:border-b-primary data-[state=active]:bg-transparent',
	'data-[state=active]:text-primary data-[state=active]:shadow-none',
);
