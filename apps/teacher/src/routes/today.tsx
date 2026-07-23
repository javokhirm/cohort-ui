import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import {
	addDays,
	currentHour,
	endOfWeek,
	formatFullDate,
	formatShortDate,
	formatWeekRange,
	startOfWeek,
	todayIsoDate,
	weekDates,
} from '@repo/utils';

import { useSessions } from '@/features/schedule/api/sessions.queries';
import { TodayGreeting } from '@/features/schedule/components/TodayGreeting';
import { TodaySessions } from '@/features/schedule/components/TodaySessions';
import { WeekNav } from '@/features/schedule/components/WeekNav';
import { WeekStrip } from '@/features/schedule/components/WeekStrip';
import { useBranchFilter } from '@/store/branchStore';
import { useSessionStore } from '@/store/sessionStore';
import { useAppT } from '@/locales';

/** Catalog key for the time-of-day greeting at the center's current hour. */
function greetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
	const hour = currentHour();
	if (hour < 12) return 'greetingMorning';
	if (hour < 18) return 'greetingAfternoon';
	return 'greetingEvening';
}

/**
 * The teacher's home / Today screen (api-reference §4.1).
 *
 * A week browser over `GET /teach/sessions`: one range query per visible week
 * (Mon–Sun), a day picker that selects within the loaded week without
 * refetching, and the selected day's sessions as cards. The active branch is a
 * client-side view filter (see `useBranchFilter`) — `/teach/*` takes no branch
 * param, so switching branch must never refetch, and the query key stays
 * branch-free. When the filter hides sessions the empty state says so: a teacher
 * seeing "No classes" while they are in fact teaching across town is the one
 * failure this screen must not have.
 */
export function TodayRoute() {
	const t = useAppT('schedule');
	const user = useSessionStore((s) => s.user);
	const filterByBranch = useBranchFilter();
	const navigate = useNavigate();

	const today = todayIsoDate();
	const [selectedDate, setSelectedDate] = useState(today);

	const weekFrom = startOfWeek(selectedDate);
	const weekTo = endOfWeek(selectedDate);
	const dates = weekDates(selectedDate);

	const { data, isPending, isError } = useSessions({ from: weekFrom, to: weekTo });

	// Branch-filtered rows for the whole week (drives the strip dots) and for the
	// selected day (drives the list), plus how many the branch filter hides today.
	const weekSessions = useMemo(
		() => (data ? filterByBranch(data) : []),
		[data, filterByBranch],
	);
	const datesWithSessions = useMemo(
		() => new Set(weekSessions.map((s) => s.sessionDate)),
		[weekSessions],
	);
	const daySessions = weekSessions.filter((s) => s.sessionDate === selectedDate);
	const daySessionsAllBranches = (data ?? []).filter(
		(s) => s.sessionDate === selectedDate,
	);
	const hiddenByBranch = daySessionsAllBranches.length - daySessions.length;

	const isToday = selectedDate === today;

	return (
		<div className="mx-auto w-full max-w-3xl">
			<TodayGreeting
				greeting={t(greetingKey())}
				firstName={user?.firstName}
				longDate={formatFullDate(today)}
			/>

			<WeekNav
				rangeLabel={formatWeekRange(selectedDate)}
				onPrevWeek={() => setSelectedDate(addDays(selectedDate, -7))}
				onNextWeek={() => setSelectedDate(addDays(selectedDate, 7))}
				showJumpToday={!isToday}
				onJumpToday={() => setSelectedDate(today)}
			/>

			<WeekStrip
				dates={dates}
				selectedDate={selectedDate}
				today={today}
				datesWithSessions={datesWithSessions}
				onSelect={setSelectedDate}
			/>

			<TodaySessions
				isPending={isPending}
				isError={isError}
				sessions={daySessions}
				hiddenByBranch={hiddenByBranch}
				emptyWhen={
					isToday
						? t('emptyWhenToday')
						: t('emptyWhenOnDate', { date: formatShortDate(selectedDate) })
				}
				onTakeAttendance={(sessionId) =>
					void navigate({
						to: '/sessions/$sessionId/attendance',
						params: { sessionId: String(sessionId) },
					})
				}
				onEnterMarks={(sessionId) =>
					void navigate({
						to: '/sessions/$sessionId/marks',
						params: { sessionId: String(sessionId) },
					})
				}
			/>
		</div>
	);
}
