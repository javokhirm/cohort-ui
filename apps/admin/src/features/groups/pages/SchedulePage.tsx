import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { CalendarX2, ChevronLeft, ChevronRight, DoorOpen } from 'lucide-react';

import {
	Button,
	cn,
	DatePicker,
	EmptyState,
	MonthCalendarGrid,
	PageHeader,
	resolveStatus,
	SearchFilterBar,
	Skeleton,
	TONE_ACCENT_CLASSES,
	WeekCalendarGrid,
	type MonthCalendarDay,
	type WeekCalendarDay,
} from '@repo/ui';
import { formatDate, formatFullDate, formatMonthShort, todayIsoDate } from '@repo/utils';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { useSessionCalendar } from '../api/sessions.queries';
import { useRoomSchedule } from '../api/room-schedule.queries';
import type { SessionCalendarFilters } from '../api/keys';
import type { SessionStatus } from '../api/groups.queries';
import { hhmm, SESSION_STATUS_FILTERS, toYmd } from '../lib/group-options';
import {
	allocationWindow,
	buildAllocationRows,
	centerNowMinutes,
	filterAllocationRows,
	nowMarkerPercent,
	type RoomViewFilter,
} from '../lib/room-allocation';
import { RoomAllocationGrid } from '../components/RoomAllocationGrid';
import { RoomScheduleList } from '../components/RoomScheduleList';
import { RoomScheduleSummaryBar } from '../components/RoomScheduleSummaryBar';
import { SessionDetailSheet } from '../components/SessionDetailSheet';

type CalendarView = 'week' | 'month' | 'rooms';

const SESSION_STATUS_LEGEND: SessionStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
const VIEWS = ['week', 'month', 'rooms'] as const;
const ROOM_FILTERS = ['all', 'booked', 'conflicts'] as const;
/** How often the "now" line catches up with the clock. */
const NOW_TICK_MS = 60_000;

/** `Date.getDay()` (0 = Sun) → the `groups` catalog `day.*` key. */
const DOW_KEYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
/** Month-grid headers, Monday-first, as `groups` catalog `day.*` keys. */
const MONTH_HEADER_KEYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const;

/** Monday 00:00 of the week containing `d`. */
function startOfWeek(d: Date): Date {
	const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
	const day = date.getDay(); // 0=Sun … 6=Sat
	const diff = day === 0 ? -6 : 1 - day;
	date.setDate(date.getDate() + diff);
	return date;
}

function addDays(d: Date, n: number): Date {
	const date = new Date(d);
	date.setDate(date.getDate() + n);
	return date;
}

function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** Full Mon–Sun weeks spanning the month containing `monthAnchor`. */
function monthGridRange(monthAnchor: Date): { start: Date; end: Date } {
	const start = startOfWeek(startOfMonth(monthAnchor));
	const end = addDays(startOfWeek(endOfMonth(monthAnchor)), 6);
	return { start, end };
}

function parseDate(value: string | undefined): Date {
	if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [y, m, day] = value.split('-').map(Number);
		return new Date(y!, m! - 1, day!);
	}
	return new Date();
}

export function SchedulePage() {
	const t = useAppT('groups');
	const tc = useT('common');
	const navigate = useNavigate({ from: '/schedule' });
	const {
		date,
		status,
		view = 'week',
		roomFilter = 'all',
	} = useSearch({ from: '/_authed/schedule' });

	const isRoomView = view === 'rooms';

	const selectedDate = parseDate(date);
	const weekStart = startOfWeek(selectedDate);
	const weekEnd = addDays(weekStart, 6);
	const { start: monthGridStart, end: monthGridEnd } = monthGridRange(selectedDate);

	const rangeStart = isRoomView
		? selectedDate
		: view === 'week'
			? weekStart
			: monthGridStart;
	const rangeEnd = isRoomView ? selectedDate : view === 'week' ? weekEnd : monthGridEnd;
	const fromYmd = toYmd(rangeStart);
	const toYmdStr = toYmd(rangeEnd);
	const isToday = fromYmd === todayIsoDate();

	const [openSessionId, setOpenSessionId] = useState<number | null>(null);

	const filters: SessionCalendarFilters = {
		from: fromYmd,
		to: toYmdStr,
		status,
	};
	// The two views read different endpoints; only one is ever in flight.
	const {
		data: sessions = [],
		isLoading,
		isError,
	} = useSessionCalendar(filters, !isRoomView);

	const {
		data: roomSchedule,
		isLoading: roomsLoading,
		isError: roomsError,
	} = useRoomSchedule({ date: fromYmd }, isRoomView);

	// The clock is an external system: subscribe to it, and *derive* whether the
	// "now" line is relevant — it only means anything on today's room view.
	const [clockMinutes, setClockMinutes] = useState(centerNowMinutes);
	useEffect(() => {
		const id = setInterval(() => setClockMinutes(centerNowMinutes()), NOW_TICK_MS);
		return () => clearInterval(id);
	}, []);
	const nowMinutes = isRoomView && isToday ? clockMinutes : null;

	function setSearch(
		patch: Partial<{
			date: string;
			status?: SessionStatus;
			view: CalendarView;
			roomFilter: RoomViewFilter;
		}>,
	) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	function shiftDays(delta: number) {
		setSearch({ date: toYmd(addDays(selectedDate, delta)) });
	}

	function shiftMonth(delta: number) {
		const d = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth() + delta,
			1,
		);
		setSearch({ date: toYmd(d) });
	}

	/** Prev/next steps by whatever the current view shows: a day, a week, a month. */
	function shiftRange(delta: number) {
		if (view === 'month') shiftMonth(delta);
		else shiftDays(view === 'week' ? delta * 7 : delta);
	}

	// Derived directly from `sessions` — the React Compiler memoizes these.
	const weekDays: WeekCalendarDay[] = Array.from({ length: 7 }, (_, i) => {
		const d = addDays(weekStart, i);
		const ymd = toYmd(d);
		return {
			date: d,
			sessions: [...sessions]
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

	const monthWeeks: MonthCalendarDay[][] = [];
	for (
		let cursor = monthGridStart;
		cursor <= monthGridEnd;
		cursor = addDays(cursor, 7)
	) {
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

	// Rooms down the side, the day's classes laid out across the hours. The
	// layout maths is skipped entirely on the other two views.
	const allRoomRows = isRoomView ? buildAllocationRows(roomSchedule) : [];
	const roomRows = filterAllocationRows(allRoomRows, roomFilter);
	const roomWindow = allocationWindow(roomSchedule);
	const nowPercent = nowMarkerPercent(nowMinutes, roomWindow);
	// A branch name per room only earns its place when the selection spans more
	// than one branch.
	const showBranch = new Set(roomSchedule?.rooms.map((r) => r.branchId) ?? []).size > 1;

	const rangeLabel = isRoomView
		? formatFullDate(fromYmd)
		: view === 'week'
			? `${formatDate(fromYmd)} – ${formatDate(toYmdStr)}`
			: t('schedule.monthYear', {
					month: formatMonthShort(toYmd(selectedDate).slice(0, 7)),
					year: selectedDate.getFullYear(),
				});

	const showError = isRoomView ? roomsError : isError;
	const showLoading = isRoomView ? roomsLoading : isLoading;

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6">
			<PageHeader
				title={t('schedule.title')}
				description={
					isRoomView
						? t('schedule.rooms.description')
						: t('schedule.description')
				}
			/>

			<div className="flex flex-col gap-4">
				{/* The status filter narrows the calendar; it is deliberately absent
				    from the room view, where hiding a booking would make "free" a lie. */}
				{!isRoomView && (
					<SearchFilterBar
						filters={SESSION_STATUS_FILTERS.map((f) => ({
							id: f.value ?? 'ALL',
							label: f.value
								? t(`sessionStatus.${f.value}`)
								: tc('state.all'),
							active: status === f.value,
							onClick: () => setSearch({ status: f.value }),
						}))}
					/>
				)}

				{/* Calendar nav / legend / view toggle */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() => shiftRange(-1)}
							aria-label={tc('action.previous')}
						>
							<ChevronLeft className="size-4" />
						</Button>
						{isRoomView ? (
							// The room view answers "what is booked on this date",
							// so the date itself is the control — not just a label.
							<DatePicker
								value={fromYmd}
								onChange={(value) => value && setSearch({ date: value })}
								className="w-48"
							/>
						) : (
							<span className="min-w-52 text-center text-sm font-semibold">
								{rangeLabel}
							</span>
						)}
						<Button
							variant="outline"
							size="icon"
							onClick={() => shiftRange(1)}
							aria-label={tc('action.next')}
						>
							<ChevronRight className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							disabled={isToday}
							onClick={() => setSearch({ date: todayIsoDate() })}
						>
							{t('schedule.today')}
						</Button>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							{SESSION_STATUS_LEGEND.map((s) => {
								const { tone } = resolveStatus('session', s);
								return (
									<span key={s} className="flex items-center gap-1.5">
										<span
											className={cn(
												'size-2 rounded-full',
												TONE_ACCENT_CLASSES[tone].dot,
											)}
										/>
										{t(`sessionStatus.${s}`)}
									</span>
								);
							})}
						</div>

						<div className="flex gap-0.5 rounded-lg bg-muted p-1">
							{VIEWS.map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setSearch({ view: v })}
									className={cn(
										'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
										view === v
											? 'bg-background text-foreground shadow-sm'
											: 'text-muted-foreground',
									)}
								>
									{t(`schedule.view.${v}`)}
								</button>
							))}
						</div>
					</div>
				</div>

				{showError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{isRoomView
							? t('schedule.rooms.loadError')
							: t('schedule.loadError')}
					</div>
				)}

				{showLoading ? (
					isRoomView ? (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-24 rounded-2xl" />
							<Skeleton className="h-80 rounded-2xl" />
						</div>
					) : (
						<div className="grid grid-cols-7 gap-1.5">
							{Array.from({ length: 7 }, (_, i) => (
								<Skeleton key={i} className="h-96 rounded-2xl" />
							))}
						</div>
					)
				) : isRoomView ? (
					roomSchedule && allRoomRows.length > 0 ? (
						<>
							<RoomScheduleSummaryBar summary={roomSchedule.summary} />

							<SearchFilterBar
								filters={ROOM_FILTERS.map((f) => ({
									id: f,
									label: t(`schedule.rooms.filter.${f}`),
									active: roomFilter === f,
									onClick: () => setSearch({ roomFilter: f }),
								}))}
							/>

							{roomRows.length === 0 ? (
								<EmptyState
									icon={<CalendarX2 />}
									title={t('schedule.rooms.noMatchTitle')}
									description={t('schedule.rooms.noMatchDescription')}
								/>
							) : (
								<>
									<div className="hidden md:block">
										<RoomAllocationGrid
											rows={roomRows}
											window={roomWindow}
											nowPercent={nowPercent}
											showBranch={showBranch}
											onSessionClick={setOpenSessionId}
										/>
									</div>
									<div className="md:hidden">
										<RoomScheduleList
											rows={roomRows}
											showBranch={showBranch}
											onSessionClick={setOpenSessionId}
										/>
									</div>
								</>
							)}
						</>
					) : (
						!roomsError && (
							<EmptyState
								icon={<DoorOpen />}
								title={t('schedule.rooms.emptyTitle')}
								description={t('schedule.rooms.emptyDescription')}
							/>
						)
					)
				) : view === 'week' ? (
					<WeekCalendarGrid
						days={weekDays}
						formatWeekday={(d) => t(`day.${DOW_KEYS[d.getDay()]!}`)}
						onSessionClick={(s) => setOpenSessionId(s.id)}
					/>
				) : (
					<MonthCalendarGrid
						weeks={monthWeeks}
						weekdayHeaders={MONTH_HEADER_KEYS.map((k) => t(`day.${k}`))}
						formatSessionCount={(count) =>
							t('schedule.sessionCount', { count })
						}
						onDayClick={(d) => setSearch({ view: 'week', date: toYmd(d) })}
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
