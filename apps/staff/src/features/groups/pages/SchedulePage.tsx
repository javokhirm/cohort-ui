import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react';

import {
	Button,
	Card,
	PageHeader,
	SearchFilterBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SessionCard,
	Skeleton,
	WeekStrip,
	type WeekDay,
} from '@repo/ui';
import { formatDate } from '@repo/utils';

import { useBranches } from '@/features/people/api/students.queries';

import { useSessionCalendar } from '../api/sessions.queries';
import type { SessionCalendarFilters } from '../api/keys';
import type { SessionStatus } from '../api/groups.queries';
import { hhmm, SESSION_STATUS_FILTERS, toYmd } from '../lib/group-options';
import { SessionDetailSheet } from '../components/SessionDetailSheet';

const ALL = 'all';

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

function parseDate(value: string | undefined): Date {
	if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [y, m, day] = value.split('-').map(Number);
		return new Date(y!, m! - 1, day!);
	}
	return new Date();
}

export function SchedulePage() {
	const navigate = useNavigate();
	const { date, branchId, status } = useSearch({ from: '/_authed/schedule' });

	const selectedDate = parseDate(date);
	const weekStart = startOfWeek(selectedDate);
	const weekEnd = addDays(weekStart, 6);
	const fromYmd = toYmd(weekStart);
	const toYmdStr = toYmd(weekEnd);
	const selectedYmd = toYmd(selectedDate);

	const [openSessionId, setOpenSessionId] = useState<number | null>(null);

	const { data: branches = [] } = useBranches();

	const filters: SessionCalendarFilters = {
		from: fromYmd,
		to: toYmdStr,
		branchId,
		status,
	};
	const { data: sessions = [], isLoading, isError } = useSessionCalendar(filters);

	// Derived directly from `sessions` — the React Compiler memoizes these.
	const daysWithEvents = new Set(sessions.map((s) => s.sessionDate));
	const weekDays: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
		const d = addDays(weekStart, i);
		return { date: d, hasEvents: daysWithEvents.has(toYmd(d)) };
	});
	const daySessions = [...sessions]
		.filter((s) => s.sessionDate === selectedYmd)
		.sort((a, b) => a.startTime.localeCompare(b.startTime));

	function setSearch(patch: Partial<{ date: string; branchId?: number; status?: SessionStatus }>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	function shiftWeek(delta: number) {
		// Keep the selected weekday, move to the adjacent week.
		setSearch({ date: toYmd(addDays(selectedDate, delta * 7)) });
	}

	return (
		<div className="mx-auto flex max-w-5xl flex-col gap-6">
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
					actions={
						<Select
							value={branchId ? String(branchId) : ALL}
							onValueChange={(v) =>
								setSearch({ branchId: v === ALL ? undefined : Number(v) })
							}
						>
							<SelectTrigger className="h-9 w-40" size="sm">
								<SelectValue placeholder="All branches" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL}>All branches</SelectItem>
								{branches.map((b) => (
									<SelectItem key={b.id} value={String(b.id)}>
										{b.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					}
				/>

				{/* Week navigation */}
				<div className="flex items-center justify-between">
					<Button variant="outline" size="sm" onClick={() => shiftWeek(-1)}>
						<ChevronLeft className="size-4" />
						Prev
					</Button>
					<span className="text-sm font-semibold">
						{formatDate(fromYmd)} – {formatDate(toYmdStr)}
					</span>
					<Button variant="outline" size="sm" onClick={() => shiftWeek(1)}>
						Next
						<ChevronRight className="size-4" />
					</Button>
				</div>

				<WeekStrip
					days={weekDays}
					selectedDate={selectedDate}
					onSelect={(d) => setSearch({ date: toYmd(d) })}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load the schedule. Please refresh.
					</div>
				)}

				{/* Day agenda */}
				{isLoading ? (
					<div className="flex flex-col gap-3">
						{[1, 2, 3].map((i) => (
							<Skeleton key={i} className="h-24 w-full rounded-2xl" />
						))}
					</div>
				) : daySessions.length === 0 ? (
					<Card className="py-0">
						<div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
							<CalendarX2 className="size-8 text-muted-foreground" />
							<p className="text-sm font-medium">No sessions this day</p>
							<p className="text-sm text-muted-foreground">
								Pick another day or adjust the filters.
							</p>
						</div>
					</Card>
				) : (
					<div className="flex flex-col gap-3">
						{daySessions.map((s) => (
							<SessionCard
								key={s.id}
								startTime={hhmm(s.startTime)}
								endTime={hhmm(s.endTime)}
								groupName={s.groupName}
								courseName={s.courseName}
								room={s.roomName ?? undefined}
								status={s.status}
								topic={s.topic ?? undefined}
								onClick={() => setOpenSessionId(s.id)}
							/>
						))}
					</div>
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
