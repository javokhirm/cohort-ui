import { CalendarDays } from 'lucide-react';

import { EmptyState, SessionCard } from '@repo/ui';
import { formatTime } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { StudentSession } from '../api/home.queries';
import { useAppT } from '@/locales';

interface TodaySessionListProps {
	sessions: StudentSession[];
}

/**
 * Today's sessions. Loading/error for the whole Home screen (this list included) is
 * handled one level up by `routes/home.tsx`, since every section here comes from the same
 * `GET /student/home` call — this component only needs its own empty state.
 * Read-only view: no attendance/marks actions, those belong to the teacher console.
 */
export function TodaySessionList({ sessions }: TodaySessionListProps) {
	const t = useAppT('home');
	const statusLabel = useStatusLabel();

	if (sessions.length === 0) {
		return (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarDays />}
					title={t('todayEmptyTitle')}
					description={t('todayEmptyDescription')}
				/>
			</div>
		);
	}

	return (
		<div className="grid gap-3 sm:grid-cols-2">
			{sessions.map((session) => (
				<SessionCard
					key={session.id}
					startTime={formatTime(session.startTime)}
					endTime={formatTime(session.endTime)}
					groupName={session.groupName}
					courseName={session.courseName}
					room={session.roomName ?? undefined}
					topic={session.topic ?? undefined}
					status={session.status}
					statusLabel={statusLabel('session', session.status)}
					className={session.status === 'CANCELLED' ? 'opacity-60' : undefined}
				/>
			))}
		</div>
	);
}
