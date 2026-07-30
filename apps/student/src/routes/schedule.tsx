import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { CalendarDays, ChevronRight } from 'lucide-react';

import { Button, EmptyState, Skeleton } from '@repo/ui';
import {
	addDays,
	endOfWeek,
	formatShortDate,
	formatWeekRange,
	startOfWeek,
	todayIsoDate,
	weekDates,
} from '@repo/utils';

import { useSessions } from '@/features/schedule/api/sessions.queries';
import type { StudentSession } from '@/features/schedule/api/sessions.queries';
import { DaySessionCard } from '@/features/schedule/components/DaySessionCard';
import { WeekNav } from '@/features/schedule/components/WeekNav';
import { WeekStrip } from '@/features/schedule/components/WeekStrip';
import { useAppT } from '@/locales';

/** Whole hours + minutes taught in the loaded week, e.g. `{ hours: 9, minutes: 30 }`. */
function weekMinutes(sessions: StudentSession[]): number {
	return sessions.reduce((acc, s) => {
		const [sh = 0, sm = 0] = s.startTime.split(':').map(Number);
		const [eh = 0, em = 0] = s.endTime.split(':').map(Number);
		return acc + Math.max(0, eh * 60 + em - (sh * 60 + sm));
	}, 0);
}

/** Whether `session` is running right now (only meaningful on today's date). */
function isLiveNow(session: StudentSession, now: Date): boolean {
	const start = new Date(`${session.sessionDate}T${session.startTime}`);
	const end = new Date(`${session.sessionDate}T${session.endTime}`);
	return now >= start && now < end;
}

/**
 * The student's Schedule (api-reference §5.3): a week browser over
 * `GET /student/sessions` — one range query per visible Mon–Sun week, a day strip that
 * selects within the loaded week without refetching, and the selected day's sessions.
 * Read-only; tapping a session opens its detail.
 */
export function ScheduleRoute() {
	const t = useAppT('schedule');
	const navigate = useNavigate();

	const today = todayIsoDate();
	const [selectedDate, setSelectedDate] = useState(today);

	const weekFrom = startOfWeek(selectedDate);
	const weekTo = endOfWeek(selectedDate);
	const dates = weekDates(selectedDate);

	const { data, isPending, isError } = useSessions({ from: weekFrom, to: weekTo });

	const weekSessions = useMemo(() => data ?? [], [data]);
	const daySessions = weekSessions.filter((s) => s.sessionDate === selectedDate);
	const now = new Date();

	const minutes = weekMinutes(weekSessions);
	const summary =
		weekSessions.length === 0
			? t('weekEmpty')
			: t('weekSummary', {
					count: weekSessions.length,
					hours: Math.floor(minutes / 60),
				});

	// The design's empty-day CTA jumps to the next day with classes; the honest version
	// only knows about the loaded week, so the button appears when that week has one.
	const nextClassDate = weekSessions
		.map((s) => s.sessionDate)
		.filter((d) => d > selectedDate)
		.sort()[0];

	const isToday = selectedDate === today;

	return (
		<div className="mx-auto w-full max-w-210 pb-8">
			<WeekNav
				rangeLabel={
					isToday ? `${t('thisWeek')} · ${formatWeekRange(selectedDate)}` : formatWeekRange(selectedDate)
				}
				summary={summary}
				onPrevWeek={() => setSelectedDate(addDays(startOfWeek(selectedDate), -7))}
				onNextWeek={() => setSelectedDate(addDays(startOfWeek(selectedDate), 7))}
			/>

			<WeekStrip
				dates={dates}
				selectedDate={selectedDate}
				today={today}
				weekSessions={weekSessions}
				onSelect={setSelectedDate}
			/>

			<div className="mb-2.5 mt-4 flex items-center justify-between gap-2 px-0.5">
				<span className="text-[13.5px] font-bold text-foreground">
					{isToday
						? `${t('todayLabel')} · ${formatShortDate(selectedDate)}`
						: formatShortDate(selectedDate)}
				</span>
				{!isToday && (
					<Button
						variant="ghost"
						size="sm"
						className="h-7 gap-1 px-2 text-xs font-semibold text-primary"
						onClick={() => setSelectedDate(today)}
					>
						<CalendarDays className="size-3.5" />
						{t('jumpToday')}
					</Button>
				)}
			</div>

			{isPending ? (
				<div className="flex flex-col gap-2.5">
					<Skeleton className="h-26 w-full rounded-[13px]" />
					<Skeleton className="h-26 w-full rounded-[13px]" />
				</div>
			) : isError ? (
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<CalendarDays />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
			) : daySessions.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border bg-card">
					<EmptyState
						icon={<CalendarDays />}
						title={t('emptyDayTitle')}
						description={
							nextClassDate
								? t('emptyDayNext', { date: formatShortDate(nextClassDate) })
								: t('emptyDayDescription')
						}
						action={
							nextClassDate ? (
								<Button
									variant="outline"
									size="sm"
									className="gap-1 text-primary"
									onClick={() => setSelectedDate(nextClassDate)}
								>
									{t('goToNextClassDay')}
									<ChevronRight className="size-4" />
								</Button>
							) : undefined
						}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-2.5">
					{daySessions.map((session) => (
						<DaySessionCard
							key={session.id}
							session={session}
							isLive={isToday && isLiveNow(session, now)}
							isPast={
								session.status === 'COMPLETED' ||
								(isToday &&
									now >=
										new Date(
											`${session.sessionDate}T${session.endTime}`,
										)) ||
								selectedDate < today
							}
							onOpen={() =>
								void navigate({
									to: '/schedule/$sessionId',
									params: { sessionId: String(session.id) },
								})
							}
						/>
					))}
				</div>
			)}
		</div>
	);
}
