import { useNavigate, useSearch } from '@tanstack/react-router';

import {
	MonthCalendarGrid,
	PageHeader,
	SearchFilterBar,
	Skeleton,
	type MonthCalendarDay,
} from '@repo/ui';
import { formatMonthShort, todayIsoDate } from '@repo/utils';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { useSessionCalendar } from '../api/sessions.queries';
import type { SessionCalendarFilters } from '../api/keys';
import type { SessionStatus } from '../api/groups.queries';
import { SESSION_STATUS_FILTERS, toYmd } from '../lib/group-options';
import {
	addDays,
	addMonths,
	MONTH_HEADER_KEYS,
	monthGridRange,
	parseDate,
} from '../lib/schedule-dates';
import { ScheduleToolbar } from '../components/ScheduleToolbar';

/**
 * A month at a glance — how busy each day is, not what is on it. Picking a day
 * hands off to the weekly grid, which is where a class can actually be read and
 * opened; this screen deliberately shows counts only.
 */
export function MonthlySchedulePage() {
	const t = useAppT('groups');
	const tc = useT('common');
	const navigate = useNavigate({ from: '/schedule/month' });
	const { date, status } = useSearch({ from: '/_authed/schedule/month' });

	const selectedDate = parseDate(date);
	const { start: gridStart, end: gridEnd } = monthGridRange(selectedDate);
	const fromYmd = toYmd(gridStart);
	const toYmdStr = toYmd(gridEnd);
	const today = new Date();
	const isToday =
		selectedDate.getFullYear() === today.getFullYear() &&
		selectedDate.getMonth() === today.getMonth();

	const filters: SessionCalendarFilters = { from: fromYmd, to: toYmdStr, status };
	const { data: sessions = [], isLoading, isError } = useSessionCalendar(filters);

	function setSearch(patch: Partial<{ date: string; status?: SessionStatus }>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	// Derived directly from `sessions` — the React Compiler memoizes this.
	const monthWeeks: MonthCalendarDay[][] = [];
	for (let cursor = gridStart; cursor <= gridEnd; cursor = addDays(cursor, 7)) {
		monthWeeks.push(
			Array.from({ length: 7 }, (_, i) => {
				const d = addDays(cursor, i);
				const ymd = toYmd(d);
				return {
					date: d,
					inCurrentMonth: d.getMonth() === selectedDate.getMonth(),
					sessionCount: sessions.filter((s) => s.sessionDate === ymd).length,
				};
			}),
		);
	}

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6">
			<PageHeader
				title={t('schedule.month.title')}
				description={t('schedule.month.description')}
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
						setSearch({ date: toYmd(addMonths(selectedDate, delta)) })
					}
					onToday={() => setSearch({ date: todayIsoDate() })}
					isToday={isToday}
				>
					<span className="min-w-52 text-center text-sm font-semibold">
						{t('schedule.monthYear', {
							month: formatMonthShort(toYmd(selectedDate).slice(0, 7)),
							year: selectedDate.getFullYear(),
						})}
					</span>
				</ScheduleToolbar>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('schedule.loadError')}
					</div>
				)}

				{isLoading ? (
					<Skeleton className="h-[34rem] rounded-2xl" />
				) : (
					<MonthCalendarGrid
						weeks={monthWeeks}
						weekdayHeaders={MONTH_HEADER_KEYS.map((k) => t(`day.${k}`))}
						formatSessionCount={(count) =>
							t('schedule.sessionCount', { count })
						}
						// The month grid answers "how busy"; reading the day itself is
						// the weekly grid's job, so a click hands off to it.
						onDayClick={(d) =>
							void navigate({
								to: '/schedule/week',
								search: { date: toYmd(d), status },
							})
						}
					/>
				)}
			</div>
		</div>
	);
}
