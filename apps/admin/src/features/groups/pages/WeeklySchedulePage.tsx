import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import {
	PageHeader,
	SearchFilterBar,
	Skeleton,
	WeekCalendarGrid,
	type WeekCalendarDay,
} from '@repo/ui';
import { formatDate, todayIsoDate } from '@repo/utils';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { useSessionCalendar } from '../api/sessions.queries';
import type { SessionCalendarFilters } from '../api/keys';
import type { SessionStatus } from '../api/groups.queries';
import { hhmm, SESSION_STATUS_FILTERS, toYmd } from '../lib/group-options';
import { addDays, DOW_KEYS, parseDate, startOfWeek } from '../lib/schedule-dates';
import { ScheduleToolbar } from '../components/ScheduleToolbar';
import { SessionDetailSheet } from '../components/SessionDetailSheet';

/**
 * One week of classes across every group, as a Mon–Sun grid — the schedule
 * screen an admin lives in day to day.
 *
 * Its own route (`/schedule/week`) rather than a view toggle: the month grid
 * answers a different question at a different zoom, and room availability a
 * different question entirely, so each is a destination the sidebar can name.
 */
export function WeeklySchedulePage() {
	const t = useAppT('groups');
	const tc = useT('common');
	const navigate = useNavigate({ from: '/schedule/week' });
	const { date, status } = useSearch({ from: '/_authed/schedule/week' });

	const selectedDate = parseDate(date);
	const weekStart = startOfWeek(selectedDate);
	const weekEnd = addDays(weekStart, 6);
	const fromYmd = toYmd(weekStart);
	const toYmdStr = toYmd(weekEnd);
	const isToday = fromYmd === toYmd(startOfWeek(new Date()));

	const [openSessionId, setOpenSessionId] = useState<number | null>(null);

	const filters: SessionCalendarFilters = { from: fromYmd, to: toYmdStr, status };
	const { data: sessions = [], isLoading, isError } = useSessionCalendar(filters);

	function setSearch(patch: Partial<{ date: string; status?: SessionStatus }>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	// Derived directly from `sessions` — the React Compiler memoizes these.
	const weekDays: WeekCalendarDay[] = Array.from({ length: 7 }, (_, i) => {
		const d = addDays(weekStart, i);
		const ymd = toYmd(d);
		return {
			date: d,
			sessions: sessions
				.filter((s) => s.sessionDate === ymd)
				.sort((a, b) => a.startTime.localeCompare(b.startTime))
				.map((s) => ({
					id: s.id,
					startTime: hhmm(s.startTime),
					groupName: s.groupName,
					teacherName: s.teacherName,
					roomName: s.roomName,
					status: s.status,
				})),
		};
	});

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6">
			<PageHeader
				title={t('schedule.week.title')}
				description={t('schedule.week.description')}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={SESSION_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.value ? t(`sessionStatus.${f.value}`) : tc('state.all'),
						active: status === f.value,
						onClick: () => setSearch({ status: f.value }),
					}))}
				/>

				<ScheduleToolbar
					onStep={(delta) =>
						setSearch({ date: toYmd(addDays(selectedDate, delta * 7)) })
					}
					onToday={() => setSearch({ date: todayIsoDate() })}
					isToday={isToday}
				>
					<span className="min-w-52 text-center text-sm font-semibold">
						{`${formatDate(fromYmd)} – ${formatDate(toYmdStr)}`}
					</span>
				</ScheduleToolbar>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('schedule.loadError')}
					</div>
				)}

				{isLoading ? (
					<div className="grid grid-cols-7 gap-1.5">
						{Array.from({ length: 7 }, (_, i) => (
							<Skeleton key={i} className="h-96 rounded-2xl" />
						))}
					</div>
				) : (
					<WeekCalendarGrid
						days={weekDays}
						formatWeekday={(d) => t(`day.${DOW_KEYS[d.getDay()]!}`)}
						onSessionClick={(s) => setOpenSessionId(s.id)}
					/>
				)}
			</div>

			<SessionDetailSheet
				sessionId={openSessionId}
				open={openSessionId != null}
				onOpenChange={(o) => !o && setOpenSessionId(null)}
			/>
		</div>
	);
}
