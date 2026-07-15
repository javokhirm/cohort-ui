import { type ReactNode, useEffect } from 'react';
import { CalendarX, LayoutGrid, List } from 'lucide-react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

import { EmptyState, PageHeader, Skeleton, Tabs, TabsList, TabsTrigger } from '@repo/ui';
import { todayIsoDate } from '@repo/utils';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { useAttendanceGrid } from '@/features/attendance/api/attendance-grid.queries';
import { useUpsertAttendanceCell } from '@/features/attendance/api/attendance-grid.mutations';
import { AttendanceGrid } from '@/features/attendance/components/AttendanceGrid';
import { MonthNav } from '@/features/attendance/components/MonthNav';
import {
	addMonths,
	currentMonth,
	formatMonthLabel,
} from '@/features/attendance/lib/month';
import { useSessions } from '@/features/schedule/api/sessions.queries';

/**
 * A group's monthly attendance table (`GET /teach/groups/:id/attendance`,
 * api-reference §4.3): rows are the roster, columns are the month's sessions, and
 * only today's column is editable — each cell saves instantly (optimistic). The
 * month is URL-driven (`?month=YYYY-MM`); the view toggle jumps to today's
 * session for the current-day list.
 *
 * On a phone the grid is hard to work with, so a fresh visit (no `?view=table`)
 * auto-redirects to today's session list — the same page the "List" toggle
 * jumps to. `?view=table` marks an explicit manual pick, so the toggle can
 * still open the table on mobile without immediately bouncing back.
 */
export function GroupAttendanceRoute() {
	const navigate = useNavigate();
	const { groupId: groupIdParam } = useParams({
		from: '/_authed/groups/$groupId/attendance',
	});
	const { month: monthParam, view } = useSearch({
		from: '/_authed/groups/$groupId/attendance',
	});
	const groupId = Number(groupIdParam);
	const month = monthParam ?? currentMonth();
	const isMobile = useIsMobile();

	const gridQuery = useAttendanceGrid(groupId, month);
	const upsertCell = useUpsertAttendanceCell(groupId, month);

	// Resolve today's session for this group to enable the "List" toggle.
	const today = todayIsoDate();
	const todaySessions = useSessions({ from: today, to: today });
	const todaySession = (todaySessions.data ?? []).find(
		(s) => s.groupId === groupId && s.status !== 'CANCELLED',
	);
	const todaySessionId = todaySession?.id;

	useEffect(() => {
		if (view === 'table' || !isMobile || !todaySessionId) return;
		void navigate({
			to: '/sessions/$sessionId/attendance',
			params: { sessionId: String(todaySessionId) },
			replace: true,
		});
	}, [view, isMobile, todaySessionId, navigate]);

	const goToMonth = (next: string) =>
		void navigate({
			to: '/groups/$groupId/attendance',
			params: { groupId: groupIdParam },
			search: { month: next, view },
		});

	const grid = gridQuery.data;

	let body: ReactNode;
	if (gridQuery.isError) {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarX />}
					title="Couldn't load attendance"
					description="Something went wrong. Try again in a moment."
				/>
			</div>
		);
	} else if (gridQuery.isPending || !grid) {
		body = <Skeleton className="h-72 w-full rounded-2xl" />;
	} else if (grid.columns.length === 0) {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<CalendarX />}
					title="No sessions this month"
					description="This group has no scheduled sessions in the selected month."
				/>
			</div>
		);
	} else {
		body = (
			<AttendanceGrid
				grid={grid}
				onEditCell={(sessionId, studentId, status) =>
					upsertCell.mutate({ sessionId, studentId, status })
				}
			/>
		);
	}

	return (
		<div className="mx-auto w-full max-w-5xl">
			<div className="flex justify-between items-center">
				<PageHeader
					title={grid?.group.courseName ?? 'Attendance'}
					description={grid?.group.name ?? `Group #${groupId}`}
				/>
				<Tabs
					value="table"
					onValueChange={(v) => {
						if (v === 'list' && todaySession) {
							void navigate({
								to: '/sessions/$sessionId/attendance',
								params: { sessionId: String(todaySession.id) },
								search: { view: 'list' },
							});
						}
					}}
				>
					<TabsList>
						<TabsTrigger value="table" aria-label="Table view">
							<LayoutGrid />
						</TabsTrigger>
						<TabsTrigger
							value="list"
							disabled={!todaySession}
							aria-label="List view"
						>
							<List />
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
				<MonthNav
					label={formatMonthLabel(month)}
					onPrev={() => goToMonth(addMonths(month, -1))}
					onNext={() => goToMonth(addMonths(month, 1))}
					showToday={month !== currentMonth()}
					onToday={() => goToMonth(currentMonth())}
				/>
			</div>

			<div className="mt-3">{body}</div>
		</div>
	);
}
