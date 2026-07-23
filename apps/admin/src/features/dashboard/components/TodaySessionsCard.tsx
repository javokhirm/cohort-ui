import { Link } from '@tanstack/react-router';
import { CalendarDays } from 'lucide-react';

import { EmptyState, Separator, StatusBadge } from '@repo/ui';
import { toIsoDate } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useSessionCalendar } from '@/features/groups/api/sessions.queries';

import { PanelSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';
import { useAppT } from '@/locales';

/**
 * Today's sessions — reuses the existing session-calendar endpoint with a
 * single-day window. Ordered by the backend (start time within the day).
 */
export function TodaySessionsCard() {
	const t = useAppT('dashboard');
	const statusLabel = useStatusLabel();
	const today = toIsoDate(new Date());
	const { data, isLoading, isError, refetch } = useSessionCalendar({
		from: today,
		to: today,
	});

	if (isLoading) return <PanelSkeleton />;
	if (isError || !data)
		return <PanelError title={t('card.todaySessions')} onRetry={refetch} />;

	return (
		<PanelCard
			title={t('card.todaySessions')}
			flush
			headerRight={
				<Link
					to="/schedule"
					className="text-sm font-medium text-primary hover:underline"
				>
					{t('viewCalendar')}
				</Link>
			}
		>
			{data.length === 0 ? (
				<EmptyState
					icon={<CalendarDays />}
					title={t('card.noSessionsTitle')}
					description={t('card.noSessionsDescription')}
				/>
			) : (
				<ul>
					{data.map((session, i) => (
						<li key={session.id}>
							{i > 0 && <Separator />}
							<div className="flex items-center gap-4 px-5 py-3">
								<span className="w-12 shrink-0 text-sm font-semibold tabular-nums">
									{session.startTime.slice(0, 5)}
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{session.courseName} · {session.groupName}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{[session.teacherName, session.roomName]
											.filter(Boolean)
											.join(' · ') || '—'}
									</p>
								</div>
								<StatusBadge kind="session" status={session.status}>
									{statusLabel('session', session.status)}
								</StatusBadge>
							</div>
						</li>
					))}
				</ul>
			)}
		</PanelCard>
	);
}
