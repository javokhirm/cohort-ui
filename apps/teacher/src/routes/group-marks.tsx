import { type ReactNode, useEffect } from 'react';
import { LayoutGrid, List, Star, Users } from 'lucide-react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';

import {
	Button,
	EmptyState,
	PageHeader,
	Skeleton,
	Tabs,
	TabsList,
	TabsTrigger,
} from '@repo/ui';

import { useIsMobile } from '@/hooks/use-is-mobile';
import { type LegendItem, ToneLegend } from '@/components/ToneLegend';
import { useMarksGrid } from '@/features/marks/api/marks-grid.queries';
import {
	useClearMarkCell,
	useUpsertMarkCell,
} from '@/features/marks/api/marks-grid.mutations';
import { MarksGrid } from '@/features/marks/components/MarksGrid';
import { MonthNav } from '@/features/marks/components/MonthNav';
import {
	addMonths,
	currentMonth,
	formatMonthLabel,
	isTodayIso,
} from '@/features/marks/lib/month';
import { WEAK_SCORE_PCT } from '@/features/marks/lib/scale';
import { useAppT } from '@/locales';

/**
 * A group's monthly marks table (`GET /teach/groups/:id/marks`, §1.1): rows are
 * the roster, columns are the month's sessions, and any past-or-today column
 * is editable (today's is tinted, but that's a visual cue only) — each cell
 * saves instantly (optimistic). Per-student AVG% and RANK
 * are frozen on the right. The month is URL-driven (`?month=YYYY-MM`); the view
 * toggle jumps to today's session for the current-day list. On a phone the grid
 * is hard to work with, so a fresh visit auto-redirects to today's session list.
 *
 * The page is a bounded flex column so the grid owns its own scroll and keeps
 * its header and student column pinned, and runs full-width so a wide month
 * gets the room it needs before the sheet itself has to scroll horizontally.
 * The active grading scale is stated in the toolbar and links to the group's
 * Grading tab — without it a bare "8" in a cell doesn't say whether it's out of
 * 10 or out of 100.
 */
export function GroupMarksRoute() {
	const t = useAppT('marks');
	const tShell = useAppT('shell');
	const tGroups = useAppT('groups');
	const tAttendance = useAppT('attendance');
	const tSchedule = useAppT('schedule');
	const navigate = useNavigate();
	const { groupId: groupIdParam } = useParams({
		from: '/_authed/groups/$groupId/marks',
	});
	const { month: monthParam, view } = useSearch({
		from: '/_authed/groups/$groupId/marks',
	});
	const groupId = Number(groupIdParam);
	const month = monthParam ?? currentMonth();
	const isMobile = useIsMobile();

	const gridQuery = useMarksGrid(groupId, month);
	const upsertCell = useUpsertMarkCell(groupId, month);
	const clearCell = useClearMarkCell(groupId, month);

	// The grid's colour key. The tone→band mapping mirrors `scoreTone`; labels are
	// built at render so they re-resolve when the locale changes.
	const scoreBands: LegendItem[] = [
		{ tone: 'green', label: t('topBand') },
		{ tone: 'amber', label: t('midBand', { low: WEAK_SCORE_PCT }) },
		{ tone: 'red', label: t('lowBand', { low: WEAK_SCORE_PCT }) },
	];

	const grid = gridQuery.data;
	const rows = grid?.rows ?? [];
	const columns = grid?.columns ?? [];

	// Today's session comes from the grid itself — no cross-feature session fetch.
	const todaySession = columns.find(
		(c) => isTodayIso(c.date) && c.status !== 'CANCELLED',
	);
	const todaySessionId = todaySession?.sessionId;

	useEffect(() => {
		if (view === 'table' || !isMobile || !todaySessionId) return;
		void navigate({
			to: '/sessions/$sessionId/marks',
			params: { sessionId: String(todaySessionId) },
			search: { view: 'list' },
			replace: true,
		});
	}, [view, isMobile, todaySessionId, navigate]);

	const goToMonth = (next: string) =>
		void navigate({
			to: '/groups/$groupId/marks',
			params: { groupId: groupIdParam },
			search: { month: next, view },
		});

	const stateCard = (node: ReactNode) => (
		<div className="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-border bg-card">
			{node}
		</div>
	);

	let body: ReactNode;
	if (gridQuery.isError) {
		body = stateCard(
			<EmptyState
				icon={<Star />}
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
				icon={<Star />}
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
				description={tAttendance('noStudentsDescription')}
			/>,
		);
	} else {
		body = (
			<MarksGrid
				grid={grid}
				onEditCell={(sessionId, studentId, value) =>
					upsertCell.mutate({ sessionId, studentId, ...value })
				}
				onClearCell={(sessionId, studentId) =>
					clearCell.mutate({ sessionId, studentId })
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
							if (v === 'list' && todaySessionId) {
								void navigate({
									to: '/sessions/$sessionId/marks',
									params: { sessionId: String(todaySessionId) },
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
								disabled={!todaySessionId}
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
			</div>

			<div className="mt-2 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
				<ToneLegend items={scoreBands} />
				<p className="text-[11px] text-muted-foreground">
					{tAttendance('pastAndTodayEditable')}
				</p>
			</div>

			<div className="mt-2 flex min-h-0 flex-1 flex-col">{body}</div>
		</div>
	);
}
