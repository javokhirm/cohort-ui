import { AlertTriangle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';

import { Button, Card, EmptyState } from '@repo/ui';

import { useHome } from '@/features/home/api/home.queries';
import { useNow } from '@/features/home/hooks/useNow';
import { dayProgress } from '@/features/home/lib/day-progress';
import { resolveNextClass } from '@/features/home/lib/next-class';
import { BalanceDueBanner } from '@/features/home/components/BalanceDueBanner';
import { DayDoneCard } from '@/features/home/components/DayDoneCard';
import { HomeSkeleton } from '@/features/home/components/HomeSkeleton';
import { HomeStats } from '@/features/home/components/HomeStats';
import { LatestMarkCard } from '@/features/home/components/LatestMarkCard';
import { NextClassCard } from '@/features/home/components/NextClassCard';
import { RestDayCard } from '@/features/home/components/RestDayCard';
import { TodayHeader } from '@/features/home/components/TodayHeader';
import { TodaySessionList } from '@/features/home/components/TodaySessionList';
import { HomeLeaderboardCard } from '@/features/leaderboard/components/HomeLeaderboardCard';
import { useAppT } from '@/locales';

/**
 * The student's Home screen (composed from `GET /student/home`): a hero for the
 * state of the day, an outstanding-balance banner, today's timeline, the
 * momentum pair (streak / attendance rate), this month's leaderboard standing,
 * and the latest daily class mark. The greeting and today's date are the app
 * bar's title and subtitle, so this column carries no heading of its own.
 *
 * The hero is one of three, never a blank space: the running or next class, a
 * finished-day card once none remain, or a rest-day card when the day holds no
 * classes at all. `useNow()` drives the first of those — the countdown ticks
 * because this screen re-derives `nextClass` on every tick, not because the card
 * holds a timer.
 *
 * Every other section still shows only when its backing data is present — this
 * screen never fabricates content the endpoint didn't return.
 * Layout is phone-first: one column, hero → today → momentum → standing → mark.
 * From `lg` it splits into "the day" (hero, balance, timeline) beside "how I'm
 * doing" (momentum, standing, mark), which is also the mobile reading order, so
 * no source order is reshuffled per breakpoint.
 */
export function HomeRoute() {
	const t = useAppT('home');
	const navigate = useNavigate();
	const now = useNow();
	const { data, isPending, isError, refetch } = useHome();

	const openSession = (sessionId: number) =>
		void navigate({
			to: '/schedule/$sessionId',
			params: { sessionId: String(sessionId) },
		});

	if (isPending) return <HomeSkeleton />;

	if (isError || !data) {
		return (
			<div className="mx-auto w-full max-w-200">
				<Card className="gap-0 py-0">
					<EmptyState
						icon={<AlertTriangle />}
						title={t('errorTitle')}
						description={t('errorDescription')}
						action={
							<Button
								variant="outline"
								className="rounded-full"
								onClick={() => void refetch()}
							>
								{t('retry')}
							</Button>
						}
					/>
				</Card>
			</div>
		);
	}

	const nextClass = resolveNextClass(data.todaySessions, now);
	const progress = dayProgress(data.todaySessions);
	// The timeline highlights the class the hero is about — nothing, once the day is over.
	const nowSessionId = nextClass && !nextClass.isDone ? nextClass.session.id : null;

	return (
		<div className="mx-auto w-full max-w-200 pb-8 lg:max-w-5xl">
			<div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
				<div className="flex flex-col gap-4">
					{!nextClass ? (
						<RestDayCard />
					) : nextClass.isDone ? (
						<DayDoneCard
							info={nextClass}
							onOpen={() => openSession(nextClass.session.id)}
						/>
					) : (
						<NextClassCard
							info={nextClass}
							onOpen={() => openSession(nextClass.session.id)}
						/>
					)}

					{data.outstanding > 0 && (
						<BalanceDueBanner
							outstanding={data.outstanding}
							currency={data.currency}
							onOpen={() => void navigate({ to: '/billing' })}
						/>
					)}

					{/* Skipped entirely on a day with no classes — `RestDayCard` above
					    already says so, and repeating it as an empty list would too. */}
					{data.todaySessions.length > 0 && (
						<section>
							<TodayHeader progress={progress} />
							<TodaySessionList
								sessions={data.todaySessions}
								nowSessionId={nowSessionId}
								onOpenSession={openSession}
							/>
						</section>
					)}
				</div>

				<div className="flex flex-col gap-4">
					<HomeStats attendance={data.attendance} />

					{data.leaderboard && (
						<HomeLeaderboardCard
							standing={data.leaderboard}
							onOpen={() =>
								void navigate({
									to: '/leaderboard',
									// Land on the board for the group the standing describes.
									search: {
										groupId: data.leaderboard!.groupId,
										period: 'month',
									},
								})
							}
						/>
					)}

					{data.latestMark && (
						<LatestMarkCard
							latest={data.latestMark}
							onOpen={() =>
								void navigate({
									to: '/progress',
									// Land on the log already filtered to the mark's group.
									search: { groupId: data.latestMark!.groupId },
								})
							}
						/>
					)}
				</div>
			</div>
		</div>
	);
}
