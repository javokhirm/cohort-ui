import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { CalendarX2, DoorOpen } from 'lucide-react';

import { DatePicker, EmptyState, PageHeader, SearchFilterBar, Skeleton } from '@repo/ui';
import { todayIsoDate } from '@repo/utils';
import { useAppT } from '@/locales';

import { useRoomSchedule } from '../api/room-schedule.queries';
import { toYmd } from '../lib/group-options';
import { addDays, parseDate } from '../lib/schedule-dates';
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
import { ScheduleToolbar } from '../components/ScheduleToolbar';
import { SessionDetailSheet } from '../components/SessionDetailSheet';

const ROOM_FILTERS = ['all', 'booked', 'conflicts'] as const;
/** How often the "now" line catches up with the clock. */
const NOW_TICK_MS = 60_000;

/**
 * One day's classes laid out by room — which rooms are free, which are
 * double-booked, and which classes have nowhere to sit.
 *
 * Deliberately a screen of its own rather than a third tab on the calendar:
 * it answers a question about *rooms*, not about a group's week, and it is the
 * one schedule view with no status filter — hiding a booking here would make
 * "free" a lie.
 */
export function RoomAvailabilityPage() {
	const t = useAppT('groups');
	const navigate = useNavigate({ from: '/schedule/rooms' });
	const { date, roomFilter = 'all' } = useSearch({ from: '/_authed/schedule/rooms' });

	const selectedDate = parseDate(date);
	const ymd = toYmd(selectedDate);
	const isToday = ymd === todayIsoDate();

	const [openSessionId, setOpenSessionId] = useState<number | null>(null);

	const { data: roomSchedule, isLoading, isError } = useRoomSchedule({ date: ymd });

	// The clock is an external system: subscribe to it, and *derive* whether the
	// "now" line is relevant — it only means anything on today.
	const [clockMinutes, setClockMinutes] = useState(centerNowMinutes);
	useEffect(() => {
		const id = setInterval(() => setClockMinutes(centerNowMinutes()), NOW_TICK_MS);
		return () => clearInterval(id);
	}, []);
	const nowMinutes = isToday ? clockMinutes : null;

	function setSearch(patch: Partial<{ date: string; roomFilter: RoomViewFilter }>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	// Rooms down the side, the day's classes laid out across the hours.
	const allRoomRows = buildAllocationRows(roomSchedule);
	const roomRows = filterAllocationRows(allRoomRows, roomFilter);
	const roomWindow = allocationWindow(roomSchedule);
	const nowPercent = nowMarkerPercent(nowMinutes, roomWindow);
	// A branch name per room only earns its place when the selection spans more
	// than one branch.
	const showBranch = new Set(roomSchedule?.rooms.map((r) => r.branchId) ?? []).size > 1;

	return (
		<div className="mx-auto flex max-w-6xl flex-col gap-6">
			<PageHeader
				title={t('schedule.rooms.title')}
				description={t('schedule.rooms.description')}
			/>

			<div className="flex flex-col gap-4">
				<ScheduleToolbar
					onStep={(delta) =>
						setSearch({ date: toYmd(addDays(selectedDate, delta)) })
					}
					onToday={() => setSearch({ date: todayIsoDate() })}
					isToday={isToday}
				>
					{/* This screen answers "what is booked on this date", so the date
					    itself is the control — not just a label. */}
					<DatePicker
						value={ymd}
						onChange={(value) => value && setSearch({ date: value })}
						className="w-48"
					/>
				</ScheduleToolbar>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('schedule.rooms.loadError')}
					</div>
				)}

				{isLoading ? (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-24 rounded-2xl" />
						<Skeleton className="h-80 rounded-2xl" />
					</div>
				) : roomSchedule && allRoomRows.length > 0 ? (
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
					!isError && (
						<EmptyState
							icon={<DoorOpen />}
							title={t('schedule.rooms.emptyTitle')}
							description={t('schedule.rooms.emptyDescription')}
						/>
					)
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
