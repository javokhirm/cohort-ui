import { type ReactNode, useEffect, useState } from 'react';
import { LayoutGrid, List, SlidersHorizontal, Star } from 'lucide-react';
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
import { useMarksGrid } from '@/features/marks/api/marks-grid.queries';
import { useUpsertMarkCell } from '@/features/marks/api/marks-grid.mutations';
import { MarksGrid } from '@/features/marks/components/MarksGrid';
import { MonthNav } from '@/features/marks/components/MonthNav';
import { GradingScaleSheet } from '@/features/marks/components/GradingScaleSheet';
import {
	addMonths,
	currentMonth,
	formatMonthLabel,
	isTodayIso,
} from '@/features/marks/lib/month';

/**
 * A group's monthly marks table (`GET /teach/groups/:id/marks`, §1.1): rows are
 * the roster, columns are the month's sessions, and only today's column is
 * editable — each cell saves instantly (optimistic). Per-student AVG% and RANK
 * are frozen on the right. The month is URL-driven (`?month=YYYY-MM`); the view
 * toggle jumps to today's session for the current-day list. On a phone the grid
 * is hard to work with, so a fresh visit auto-redirects to today's session list.
 */
export function GroupMarksRoute() {
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
	const [scaleOpen, setScaleOpen] = useState(false);

	const grid = gridQuery.data;
	// Today's session comes from the grid itself — no cross-feature session fetch.
	const todaySession = grid?.columns.find(
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

	let body: ReactNode;
	if (gridQuery.isError) {
		body = (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<Star />}
					title="Couldn't load marks"
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
					icon={<Star />}
					title="No sessions this month"
					description="This group has no scheduled sessions in the selected month."
				/>
			</div>
		);
	} else {
		body = (
			<MarksGrid
				grid={grid}
				onEditCell={(sessionId, studentId, value) =>
					upsertCell.mutate({ sessionId, studentId, ...value })
				}
			/>
		);
	}

	return (
		<div className="mx-auto w-full max-w-5xl">
			<div className="flex items-center justify-between">
				<PageHeader
					title={grid?.group.courseName ?? 'Marks'}
					description={grid?.group.name ?? `Group #${groupId}`}
				/>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setScaleOpen(true)}
					>
						<SlidersHorizontal className="size-4" />
						Grading scale
					</Button>
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
							<TabsTrigger value="table" aria-label="Table view">
								<LayoutGrid />
							</TabsTrigger>
							<TabsTrigger
								value="list"
								disabled={!todaySessionId}
								aria-label="List view"
							>
								<List />
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
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

			<GradingScaleSheet
				groupId={groupId}
				open={scaleOpen}
				onOpenChange={setScaleOpen}
			/>
		</div>
	);
}
