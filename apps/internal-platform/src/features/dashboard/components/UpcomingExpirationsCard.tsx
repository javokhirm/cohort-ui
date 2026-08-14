import { Link } from '@tanstack/react-router';
import { CalendarClock } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Separator,
	StatusBadge,
	type StatusTone,
} from '@repo/ui';

import { formatDate, formatPrice } from '@repo/utils';
import type { UpcomingExpiration } from '@/api/dashboard/types';
import { useAppT } from '@/locales';

import { getInitials } from '../utils';

/** Colour the day-count by urgency; the closer the lapse, the harsher the tone. */
function daysTone(days: number): StatusTone {
	if (days <= 3) return 'red';
	if (days <= 7) return 'orange';
	if (days <= 14) return 'amber';
	return 'slate';
}

/**
 * The proactive outreach list: centers lapsing within 30 days, soonest first
 * (the backend already orders them). Each row is actionable — it links straight
 * to the tenant so an operator can renew or record an offline payment.
 */
export function UpcomingExpirationsCard({
	expirations,
}: {
	expirations: UpcomingExpiration[];
}) {
	const t = useAppT('dashboard');

	return (
		<Card className="gap-0 py-0">
			<CardHeader className="border-b border-border px-5 py-4">
				<CardTitle className="flex items-center gap-2 text-sm font-semibold">
					<CalendarClock className="size-4 text-muted-foreground" />
					{t('card.upcomingExpirations')}
				</CardTitle>
				<p className="text-xs text-muted-foreground">
					{t('card.upcomingExpirationsHint')}
				</p>
			</CardHeader>
			<CardContent className="px-0 py-0">
				{expirations.length === 0 ? (
					<p className="px-5 py-6 text-sm text-muted-foreground">
						{t('noUpcomingExpirations')}
					</p>
				) : (
					<ul>
						{expirations.map((item, i) => (
							<li key={item.subscriptionId}>
								{i > 0 && <Separator />}
								<div className="flex flex-wrap items-center gap-3 px-5 py-3">
									<Avatar className="size-8 shrink-0">
										<AvatarFallback className="bg-tone-indigo-bg text-xs font-semibold text-tone-indigo-fg">
											{getInitials(item.tenantName)}
										</AvatarFallback>
									</Avatar>
									<div className="flex min-w-40 flex-1 flex-col">
										<span className="truncate text-sm font-medium">
											{item.tenantName}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{item.planName ?? t('noPlanShort')} ·{' '}
											{formatDate(item.currentPeriodEnd)}
										</span>
									</div>
									<StatusBadge tone={daysTone(item.daysRemaining)}>
										{t('daysRemaining', {
											count: item.daysRemaining,
										})}
									</StatusBadge>
									<span className="hidden text-sm font-medium tabular-nums sm:inline">
										{formatPrice(item.renewalPrice)} {item.currency}
									</span>
									<Button
										asChild
										variant="outline"
										size="sm"
										className="shrink-0 text-xs"
									>
										<Link
											to="/tenants/$tenantId"
											params={{ tenantId: String(item.tenantId) }}
										>
											{t('view')}
										</Link>
									</Button>
								</div>
							</li>
						))}
					</ul>
				)}
			</CardContent>
		</Card>
	);
}
