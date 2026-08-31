import { CalendarDays } from 'lucide-react';

import { Card, EmptyState } from '@repo/ui';

import type { StudentSession } from '../api/home.queries';
import { TodaySessionRow } from './TodaySessionRow';
import { useAppT } from '@/locales';

interface TodaySessionListProps {
	sessions: StudentSession[];
	/** The class the hero is about — highlighted on the rail. `null` once the day is over. */
	nowSessionId: number | null;
	/** Opens a session's detail screen. */
	onOpenSession: (sessionId: number) => void;
}

/**
 * Today's sessions as a vertical timeline — one panel, one thread, a stop per
 * class. A flat separated list would read as a table of rows; the thread gives
 * the day a shape a student can see themselves moving along.
 *
 * Loading and error for the whole Home screen are handled one level up by
 * `routes/home.tsx`, and a day with no classes at all never reaches here (the
 * route shows `RestDayCard` instead) — the empty state below is the guard for a
 * caller that hands over an empty list anyway, not a state Home renders today.
 * Read-only: no attendance or marking actions, those belong to the teacher
 * console.
 */
export function TodaySessionList({
	sessions,
	nowSessionId,
	onOpenSession,
}: TodaySessionListProps) {
	const t = useAppT('home');

	if (sessions.length === 0) {
		return (
			<Card className="gap-0 py-0">
				<EmptyState
					icon={<CalendarDays />}
					title={t('todayEmptyTitle')}
					description={t('todayEmptyDescription')}
				/>
			</Card>
		);
	}

	return (
		<Card className="gap-0 overflow-hidden py-1.5">
			{sessions.map((session, i) => (
				<TodaySessionRow
					key={session.id}
					session={session}
					hasBefore={i > 0}
					hasAfter={i < sessions.length - 1}
					isNow={session.id === nowSessionId}
					onOpen={() => onOpenSession(session.id)}
				/>
			))}
		</Card>
	);
}
