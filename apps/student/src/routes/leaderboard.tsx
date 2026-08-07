import { AlertTriangle, Trophy, Users } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { Button, EmptyState, Skeleton } from '@repo/ui';

import { useLeaderboard } from '@/features/leaderboard/api/leaderboard.queries';
import { BoardStatsStrip } from '@/features/leaderboard/components/BoardStatsStrip';
import { GroupSelectChips } from '@/features/leaderboard/components/GroupSelectChips';
import { LeaderboardPodium } from '@/features/leaderboard/components/LeaderboardPodium';
import { LeaderboardRow } from '@/features/leaderboard/components/LeaderboardRow';
import { MyRankCard } from '@/features/leaderboard/components/MyRankCard';
import { PeriodToggle } from '@/features/leaderboard/components/PeriodToggle';
import type { LeaderboardPeriod } from '@/features/leaderboard/lib/period';
import { useMyGroups } from '@/features/progress/api/groups.queries';
import { useAppT } from '@/locales';

/** Enrollments that get a board — matches the server's roster rule. */
const RANKABLE_ENROLLMENTS = new Set(['ACTIVE', 'COMPLETED']);

/**
 * The group leaderboard screen — reachable only from Home's card, deliberately
 * not a fifth bottom tab (`layouts/nav.ts`).
 *
 * Both selectors live in the URL, so the back button restores the group and the
 * window the student was looking at, and a link can point at a specific board.
 * The group defaults to the first rankable enrollment when the URL says nothing.
 */
export function LeaderboardRoute() {
	const t = useAppT('leaderboard');
	const navigate = useNavigate();
	const { groupId, period } = useSearch({ from: '/_authed/leaderboard' });

	const groups = useMyGroups();
	// Past enrollments still explain a student's marks, but they are not ranked
	// against classmates who are still attending — so they get no board either.
	const rankable = (groups.data ?? []).filter((g) =>
		RANKABLE_ENROLLMENTS.has(g.enrollmentStatus),
	);
	const activeGroupId =
		groupId !== undefined && rankable.some((g) => g.id === groupId)
			? groupId
			: rankable[0]?.id;

	const board = useLeaderboard(activeGroupId, period);

	const setSearch = (next: { groupId?: number; period?: LeaderboardPeriod }) =>
		void navigate({
			to: '/leaderboard',
			search: { groupId: activeGroupId, period, ...next },
			replace: true,
		});

	if (groups.isPending) {
		return (
			<div className="mx-auto flex w-full max-w-200 flex-col gap-4">
				<Skeleton className="h-9 w-full rounded-xl" />
				<Skeleton className="h-28 w-full rounded-xl" />
				<Skeleton className="h-24 w-full rounded-xl" />
			</div>
		);
	}

	if (groups.isError) {
		return <BoardError onRetry={() => void groups.refetch()} />;
	}

	if (rankable.length === 0) {
		return (
			<Shell>
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<Users />}
						title={t('noGroupsTitle')}
						description={t('noGroupsDescription')}
					/>
				</div>
			</Shell>
		);
	}

	return (
		<Shell>
			{/* Both selectors share one line once there is room for them to. */}
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<GroupSelectChips
					groups={rankable}
					selected={activeGroupId}
					onSelect={(id) => setSearch({ groupId: id })}
				/>
				<PeriodToggle
					value={period}
					onChange={(next) => setSearch({ period: next })}
				/>
			</div>

			{board.isPending ? (
				<>
					<div className="grid gap-3 md:grid-cols-2">
						<Skeleton className="h-52 w-full rounded-2xl" />
						<div className="flex flex-col gap-3">
							<Skeleton className="h-36 w-full rounded-2xl" />
							<Skeleton className="h-16 w-full rounded-2xl" />
						</div>
					</div>
					<Skeleton className="h-40 w-full rounded-xl" />
				</>
			) : board.isError || !board.data ? (
				<BoardError onRetry={() => void board.refetch()} />
			) : (
				<Board
					board={board.data}
					onShowAllTime={() => setSearch({ period: 'all' })}
				/>
			)}
		</Shell>
	);
}

/** The screen's column — one place owns the width and rhythm. */
function Shell({ children }: { children: React.ReactNode }) {
	return (
		<div className="mx-auto flex w-full max-w-200 flex-col gap-3 pb-8">
			{children}
		</div>
	);
}

function BoardError({ onRetry }: { onRetry: () => void }) {
	const t = useAppT('leaderboard');
	return (
		<div className="mx-auto w-full max-w-200 rounded-2xl border border-border bg-card">
			<EmptyState
				icon={<AlertTriangle />}
				title={t('errorTitle')}
				description={t('errorDescription')}
				action={
					<Button variant="outline" onClick={onRetry}>
						{t('retry')}
					</Button>
				}
			/>
		</div>
	);
}

/**
 * The board itself, once loaded. Three shapes, in the order the server's own
 * gates apply them: a cohort too small to rank at all, a window nobody has been
 * marked in yet, and the ranked board.
 *
 * On a phone it reads top to bottom — podium, my standing, the rest. From `md`
 * the podium and the standing sit side by side, because the podium is a squat
 * block that would otherwise leave half the row empty.
 */
function Board({
	board,
	onShowAllTime,
}: {
	board: NonNullable<ReturnType<typeof useLeaderboard>['data']>;
	onShowAllTime: () => void;
}) {
	const t = useAppT('leaderboard');

	if (board.cohortSize < 3) {
		return (
			<>
				<MyRankCard board={board} />
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<Users />}
						title={t('smallCohortTitle')}
						description={t('smallCohortDescription')}
					/>
				</div>
			</>
		);
	}

	if (board.rankedCount === 0) {
		return (
			<>
				<MyRankCard board={board} />
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<Trophy />}
						title={t('noMarksTitle')}
						description={t('noMarksDescription')}
						action={
							board.period === 'month' ? (
								<Button variant="outline" onClick={onShowAllTime}>
									{t('tryAllTime')}
								</Button>
							) : undefined
						}
					/>
				</div>
			</>
		);
	}

	const podium = board.rows.slice(0, 3);
	const rest = board.rows.slice(3);
	// `rows` is capped server-side, so a student outside it is pinned below
	// rather than dropped — this screen must always show them where they stand.
	const pinned = board.me.rank !== null && !board.rows.some((row) => row.isMe);

	return (
		<>
			<div className="grid gap-3 md:grid-cols-2 md:items-start">
				<LeaderboardPodium rows={podium} />
				<div className="flex flex-col gap-3">
					<MyRankCard board={board} />
					<BoardStatsStrip board={board} />
				</div>
			</div>

			{rest.length > 0 && (
				<section className="mt-1">
					<h2 className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
						{t('standingsTitle')}
					</h2>
					<div className="flex flex-col gap-1.5">
						{rest.map((row, index) => (
							// `podium.length + index + 1` is the row's place in the whole
							// board, which is what an anonymous row is numbered by.
							<LeaderboardRow
								key={`${row.rank}-${index}`}
								row={row}
								position={podium.length + index + 1}
							/>
						))}
					</div>
				</section>
			)}

			{pinned && (
				<div className="flex flex-col gap-1.5">
					<span
						aria-hidden="true"
						className="text-center text-muted-foreground"
					>
						···
					</span>
					{/* Always labelled "You", so the position is never rendered. */}
					<LeaderboardRow row={board.me} position={board.me.rank ?? 0} />
				</div>
			)}

			<p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
				{t('namesHiddenNote')} {t('minMarksNote', { count: board.minMarks })}
			</p>
		</>
	);
}
