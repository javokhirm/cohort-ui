import {
	CreditCard,
	Database,
	HardDrive,
	Mail,
	MessageSquare,
	Server,
} from 'lucide-react';

import type { StatusTone } from '@repo/ui';
import type { AtRiskReason, SubscriptionStatus } from '@/api/dashboard/types';
import type { useAppT } from '@/locales';

export const TOOLTIP_STYLE: React.CSSProperties = {
	backgroundColor: 'var(--popover)',
	border: '1px solid var(--border)',
	borderRadius: 'var(--radius-md)',
	color: 'var(--popover-foreground)',
	fontSize: 12,
};

export const CHART = {
	grid: 'var(--border)',
	revenue: 'var(--chart-1)',
	signups: 'var(--chart-3)',
} as const;

export const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 11 } as const;

export const TENANT_STATUS_COLORS: Record<string, string> = {
	ACTIVE: 'var(--tone-green-fg)',
	PENDING: 'var(--tone-blue-fg)',
	SUSPENDED: 'var(--tone-orange-fg)',
	CANCELLED: 'var(--tone-slate-fg)',
};

/** Fallback slice colour for a status the map doesn't know. */
export const TENANT_STATUS_FALLBACK = 'var(--tone-slate-fg)';

/**
 * The fixed set of subscription states rendered as counters, in lifecycle
 * order. Rendered in full and zero-filled — a counter is never hidden because
 * its count is 0, since "0" and "no data" must not look the same.
 */
export const SUBSCRIPTION_STATUS_ORDER: SubscriptionStatus[] = [
	'TRIALING',
	'ACTIVE',
	'PAST_DUE',
	'EXPIRED',
	'CANCELLED',
];

/** Tone per subscription state — drives the counter accent + label colour. */
export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, StatusTone> = {
	TRIALING: 'blue',
	ACTIVE: 'green',
	PAST_DUE: 'amber',
	EXPIRED: 'orange',
	CANCELLED: 'slate',
};

/**
 * Badge tone per at-risk reason, matching the backend severity order
 * `SUSPENDED > EXPIRED > PAST_DUE > TRIAL_ENDING`. `EXPIRED` reads as the
 * harsher orange since access is already lost; `PAST_DUE` is the softer amber.
 */
export const AT_RISK_REASON_TONE: Record<AtRiskReason, StatusTone> = {
	SUSPENDED: 'red',
	EXPIRED: 'orange',
	PAST_DUE: 'amber',
	TRIAL_ENDING: 'blue',
};

/** Foreground text class per tone, for counter values / inline figures. */
export const TONE_TEXT_CLASS: Record<StatusTone, string> = {
	green: 'text-tone-green-fg',
	red: 'text-tone-red-fg',
	amber: 'text-tone-amber-fg',
	blue: 'text-tone-blue-fg',
	violet: 'text-tone-violet-fg',
	slate: 'text-tone-slate-fg',
	indigo: 'text-tone-indigo-fg',
	cyan: 'text-tone-cyan-fg',
	pink: 'text-tone-pink-fg',
	orange: 'text-tone-orange-fg',
	yellow: 'text-tone-yellow-fg',
};

/** Localized subscription-state label — keeps the enum→key mapping type-safe. */
export function subscriptionStatusLabel(
	t: ReturnType<typeof useAppT<'dashboard'>>,
	status: SubscriptionStatus,
): string {
	switch (status) {
		case 'TRIALING':
			return t('subStatus.trialing');
		case 'ACTIVE':
			return t('subStatus.active');
		case 'PAST_DUE':
			return t('subStatus.pastDue');
		case 'EXPIRED':
			return t('subStatus.expired');
		case 'CANCELLED':
			return t('subStatus.cancelled');
	}
}

/** Localized at-risk reason label. */
export function atRiskReasonLabel(
	t: ReturnType<typeof useAppT<'dashboard'>>,
	reason: AtRiskReason,
): string {
	switch (reason) {
		case 'SUSPENDED':
			return t('atRiskReason.suspended');
		case 'EXPIRED':
			return t('atRiskReason.expired');
		case 'PAST_DUE':
			return t('atRiskReason.pastDue');
		case 'TRIAL_ENDING':
			return t('atRiskReason.trialEnding');
	}
}

/** System-service rows — names resolve from the translator at render. */
export function buildServices(t: ReturnType<typeof useAppT<'dashboard'>>) {
	return [
		{ name: t('service.api'), icon: Server },
		{ name: t('service.database'), icon: Database },
		{ name: t('service.storage'), icon: HardDrive },
		{ name: t('service.email'), icon: Mail },
		{ name: t('service.sms'), icon: MessageSquare },
		{ name: t('service.payments'), icon: CreditCard },
	];
}
