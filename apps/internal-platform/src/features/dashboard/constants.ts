import {
	CreditCard,
	Database,
	HardDrive,
	Mail,
	MessageSquare,
	Server,
} from 'lucide-react';

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
