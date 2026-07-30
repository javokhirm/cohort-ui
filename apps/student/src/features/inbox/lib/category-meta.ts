import { AlertTriangle, CalendarDays, Info, Star, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StatusTone } from '@repo/ui';

import type { NotificationCategory } from '../api/notifications.queries';

/** Icon + tone per inbox category — the design's `notif` badge table. */
export const CATEGORY_META: Record<
	NotificationCategory,
	{ tone: StatusTone; Icon: LucideIcon }
> = {
	payment: { tone: 'amber', Icon: Wallet },
	grade: { tone: 'green', Icon: Star },
	schedule: { tone: 'blue', Icon: CalendarDays },
	absence: { tone: 'red', Icon: AlertTriangle },
	notice: { tone: 'indigo', Icon: Info },
};

/** Tailwind class pair for a category's tinted icon box. */
export const CATEGORY_TINT_CLASS: Record<NotificationCategory, string> = {
	payment: 'bg-tone-amber-bg text-tone-amber-fg',
	grade: 'bg-tone-green-bg text-tone-green-fg',
	schedule: 'bg-tone-blue-bg text-tone-blue-fg',
	absence: 'bg-tone-red-bg text-tone-red-fg',
	notice: 'bg-tone-indigo-bg text-tone-indigo-fg',
};
