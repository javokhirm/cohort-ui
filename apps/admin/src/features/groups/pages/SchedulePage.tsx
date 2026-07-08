import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import {
	Button,
	cn,
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
import { formatDate } from '@repo/utils';

import { useSessionCalendar } from '../api/sessions.queries';
import type { SessionCalendarFilters } from '../api/keys';
import type { SessionStatus } from '../api/groups.queries';
import { hhmm, SESSION_STATUS_FILTERS, toYmd } from '../lib/group-options';
import { SessionDetailSheet } from '../components/SessionDetailSheet';

type CalendarView = 'week' | 'month';
const SESSION_STATUS_LEGEND: SessionStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

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
	const navigate = useNavigate();
	const { date, status, view = 'week' } = useSearch({ from: '/_authed/schedule' });

	const selectedDate = parseDate(date);
	const weekStart = startOfWeek(selectedDate);
	const weekEnd = addDays(weekStart, 6);
	const { start: monthGridStart, end: monthGridEnd } = monthGridRange(selectedDate);

	const rangeStart = view === 'week' ? weekStart : monthGridStart;
	const rangeEnd = view === 'week' ? weekEnd : monthGridEnd;
	const fromYmd = toYmd(rangeStart);
	const toYmdStr = toYmd(rangeEnd);

	const [openSessionId, setOpenSessionId] = useState<number | null>(null);

	const filters: SessionCalendarFilters = {
		from: fromYmd,
		to: toYmdStr,
		status,
	};
	const { data: sessions = [], isLoading, isError } = useSessionCalendar(filters);

	function setSearch(
		patch: Partial<{
			date: string;
			status?: SessionStatus;
			view: CalendarView;
		}>,
	) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	function shiftWeek(delta: number) {
		setSearch({ date: toYmd(addDays(selectedDate, delta * 7)) });
	}

	function shiftMonth(delta: number) {
		const d = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth() + delta,
			1,
		);
		setSearch({ date: toYmd(d) });
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

	const rangeLabel =
		view === 'week'
			? `${formatDate(fromYmd)} – ${formatDate(toYmdStr)}`
			: selectedDate.toLocaleDateString('en-US', {
					month: 'long',
					year: 'numeric',
				});

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6">
			<PageHeader
				title="Schedule"
				description="Session calendar across all groups"
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={SESSION_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => setSearch({ status: f.value }),
					}))}
				/>

				{/* Calendar nav / legend / view toggle */}
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								view === 'week' ? shiftWeek(-1) : shiftMonth(-1)
							}
						>
							<ChevronLeft className="size-4" />
						</Button>
						<span className="w-52 text-center text-sm font-semibold">
							{rangeLabel}
						</span>
						<Button
							variant="outline"
							size="icon"
							onClick={() =>
								view === 'week' ? shiftWeek(1) : shiftMonth(1)
							}
						>
							<ChevronRight className="size-4" />
						</Button>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-3 text-xs text-muted-foreground">
							{SESSION_STATUS_LEGEND.map((s) => {
								const { label, tone } = resolveStatus('session', s);
								return (
									<span key={s} className="flex items-center gap-1.5">
										<span
											className={cn(
												'size-2 rounded-full',
												TONE_ACCENT_CLASSES[tone].dot,
											)}
										/>
										{label}
									</span>
								);
							})}
						</div>

						<div className="flex gap-0.5 rounded-lg bg-muted p-1">
							{(['week', 'month'] as const).map((v) => (
								<button
									key={v}
									type="button"
									onClick={() => setSearch({ view: v })}
									className={cn(
										'rounded-md px-3 py-1 text-xs font-semibold capitalize transition-colors',
										view === v
											? 'bg-background text-foreground shadow-sm'
											: 'text-muted-foreground',
									)}
								>
									{v}
								</button>
							))}
						</div>
					</div>
				</div>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load the schedule. Please refresh.
					</div>
				)}

				{isLoading ? (
					<div className="grid grid-cols-7 gap-1.5">
						{Array.from({ length: 7 }, (_, i) => (
							<Skeleton key={i} className="h-96 rounded-2xl" />
						))}
					</div>
				) : view === 'week' ? (
					<WeekCalendarGrid
						days={weekDays}
						onSessionClick={(s) => setOpenSessionId(s.id)}
					/>
				) : (
					<MonthCalendarGrid
						weeks={monthWeeks}
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
