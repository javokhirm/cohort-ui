import { type ReactNode, useEffect } from 'react';
import { CalendarX, CheckCheck, LayoutGrid, List, Users } from 'lucide-react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

import {
	Button,
	EmptyState,
	PageHeader,
	resolveStatus,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
	toast,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@repo/ui';
import { todayIsoDate } from '@repo/utils';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { type LegendItem, ToneLegend } from '@/components/ToneLegend';
import { useAttendanceGrid } from '@/features/attendance/api/attendance-grid.queries';
import {
	useMarkAllPresent,
	useUpsertAttendanceCell,
} from '@/features/attendance/api/attendance-grid.mutations';
import { ATTENDANCE_STATUSES } from '@/features/attendance/api/attendance.queries';
import { AttendanceGrid } from '@/features/attendance/components/AttendanceGrid';
import { MonthNav } from '@/features/attendance/components/MonthNav';
import {
	addMonths,
	currentMonth,
	formatMonthLabel,
	isTodayIso,
} from '@/features/attendance/lib/month';
import { useSessions } from '@/features/schedule/api/sessions.queries';
import { useAppT } from '@/locales';

/**
 * A group's monthly attendance table (`GET /teach/groups/:id/attendance`,
 * api-reference §4.3): rows are the roster, columns are the month's sessions, and
 * only today's column is editable — each cell saves instantly (optimistic). The
 * month is URL-driven (`?month=YYYY-MM`); the view toggle jumps to today's
 * session for the current-day list.
 *
 * The page is a bounded flex column so the grid owns its own scroll: that is
 * what keeps the date header and the student column pinned while a teacher
 * scans a 30-student, 20-session month. It runs full-width, unlike the
 * single-session list, so a wide month gets the room it needs before the sheet
 * itself has to scroll horizontally.
 *
 * On a phone the grid is hard to work with, so a fresh visit (no `?view=table`)
 * auto-redirects to today's session list — the same page the "List" toggle
 * jumps to. `?view=table` marks an explicit manual pick, so the toggle can
 * still open the table on mobile without immediately bouncing back.
 */
export function GroupAttendanceRoute() {
	const t = useAppT('attendance');
	const tShell = useAppT('shell');
	const tGroups = useAppT('groups');
	const tSchedule = useAppT('schedule');
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
	const markAllPresent = useMarkAllPresent(groupId, month);

	// The grid's colour key, read off the shared attendance status map. Built at
	// render (not module scope) so the labels re-resolve when the locale changes.
	const legend: LegendItem[] = ATTENDANCE_STATUSES.map((status) => {
		const { tone, label } = resolveStatus('attendance', status);
		return { tone, label };
	});

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
	const rows = grid?.rows ?? [];
	const columns = grid?.columns ?? [];

	// Today's column is the grid's only editable one — "mark all present" only
	// makes sense while it's visible (the currently viewed month) and open.
	const todayColumn = columns.find((col) => isTodayIso(col.date));
	const canMarkAllPresent =
		!!todayColumn && todayColumn.status !== 'CANCELLED' && rows.length > 0;

	// Why the button is off (or what it will do) — better than a caption that
	// says the same thing whether or not it can be pressed.
	let markAllHint: string;
	if (!todayColumn) markAllHint = t('markAllHintNoSession');
	else if (todayColumn.status === 'CANCELLED') markAllHint = t('markAllHintCancelled');
	else if (rows.length === 0) markAllHint = t('markAllHintNoStudents');
	else markAllHint = t('markAllHintReady');

	const onMarkAllPresent = () => {
		if (!grid || !todayColumn) return;
		const sessionId = todayColumn.sessionId;
		const studentIds = grid.rows.map((row) => row.studentId);
		const alreadyMarkedIds = grid.rows
			.filter((row) => row.cells[sessionId] !== undefined)
			.map((row) => row.studentId);
		markAllPresent.mutate(
			{ sessionId, studentIds, alreadyMarkedIds },
			{ onSuccess: () => toast.success(t('markedAllPresent')) },
		);
	};

	const stateCard = (node: ReactNode) => (
		<div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-border bg-card">
			{node}
		</div>
	);

	let body: ReactNode;
	if (gridQuery.isError) {
		body = stateCard(
			<EmptyState
				icon={<CalendarX />}
				title={t('errorTitle')}
				description={tShell('genericErrorDescription')}
				action={
					<Button variant="outline" onClick={() => void gridQuery.refetch()}>
						{tShell('tryAgain')}
					</Button>
				}
			/>,
		);
	} else if (gridQuery.isPending || !grid) {
		body = <Skeleton className="min-h-0 w-full flex-1 rounded-2xl" />;
	} else if (columns.length === 0) {
		body = stateCard(
			<EmptyState
				icon={<CalendarX />}
				title={tSchedule('noSessionsThisMonth')}
				description={tSchedule('noSessionsThisMonthDescription')}
				action={
					month !== currentMonth() && (
						<Button
							variant="outline"
							onClick={() => goToMonth(currentMonth())}
						>
							{tShell('goToThisMonth')}
						</Button>
					)
				}
			/>,
		);
	} else if (rows.length === 0) {
		body = stateCard(
			<EmptyState
				icon={<Users />}
				title={tGroups('rosterEmptyTitle')}
				description={t('noStudentsDescription')}
			/>,
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
		<div className="flex h-full w-full flex-col pb-3">
			<PageHeader
				className="shrink-0"
				title={grid?.group.courseName ?? t('title')}
				description={grid?.group.name ?? tGroups('groupNumber', { id: groupId })}
				actions={
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
							<TabsTrigger value="table" aria-label={tShell('tableView')}>
								<LayoutGrid />
							</TabsTrigger>
							<TabsTrigger
								value="list"
								disabled={!todaySession}
								aria-label={tShell('listView')}
							>
								<List />
							</TabsTrigger>
						</TabsList>
					</Tabs>
				}
			/>

			<div className="mt-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
				<MonthNav
					label={formatMonthLabel(month)}
					onPrev={() => goToMonth(addMonths(month, -1))}
					onNext={() => goToMonth(addMonths(month, 1))}
					showToday={month !== currentMonth()}
					onToday={() => goToMonth(currentMonth())}
				/>
				<Tooltip>
					<TooltipTrigger asChild>
						{/* Wrapper: a disabled button fires no pointer events, so it
						    could never surface the reason it is disabled. */}
						<span className="inline-flex">
							<Button
								size="sm"
								disabled={!canMarkAllPresent || markAllPresent.isPending}
								onClick={onMarkAllPresent}
							>
								<CheckCheck className="size-4" />
								{t('markAllPresent')}
							</Button>
						</span>
					</TooltipTrigger>
					<TooltipContent>{markAllHint}</TooltipContent>
				</Tooltip>
			</div>

			<div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
				<ToneLegend items={legend} />
				<p className="text-[11px] text-muted-foreground">
					{t('onlyTodayEditable')}
				</p>
			</div>

			<div className="mt-2 flex min-h-0 flex-1 flex-col">{body}</div>
		</div>
	);
}
