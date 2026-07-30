import { AlertTriangle } from 'lucide-react';
import { Link } from '@tanstack/react-router';

import { Button, EmptyState, Skeleton } from '@repo/ui';
import { formatShortDate, todayIsoDate } from '@repo/utils';

import { useHome } from '@/features/home/api/home.queries';
import { resolveNextClass } from '@/features/home/lib/next-class';
import { BalanceDueBanner } from '@/features/home/components/BalanceDueBanner';
import { HomeStats } from '@/features/home/components/HomeStats';
import { LatestResultCard } from '@/features/home/components/LatestResultCard';
import { NextClassCard } from '@/features/home/components/NextClassCard';
import { TodaySessionList } from '@/features/home/components/TodaySessionList';
import { useAppT } from '@/locales';

/**
 * The student's Home screen (composed from `GET /student/home`): the next/current class,
 * an outstanding-balance banner, the momentum row (streak / attendance rate), today's
 * timeline, and the latest published result. The greeting and today's date are the app
 * bar's title and subtitle, so this column carries no heading of its own. Each section
 * shows only when its backing data is present — this screen never fabricates content the
 * endpoint didn't return.
 */
export function HomeRoute() {
	const t = useAppT('home');
	const { data, isPending, isError, refetch } = useHome();

	if (isPending) {
		return (
			<div className="mx-auto flex w-full max-w-200 flex-col gap-4">
				<Skeleton className="h-36 w-full rounded-xl" />
				<div className="grid grid-cols-3 gap-3">
					<Skeleton className="h-24 rounded-xl" />
					<Skeleton className="h-24 rounded-xl" />
					<Skeleton className="h-24 rounded-xl" />
				</div>
				<Skeleton className="h-40 w-full rounded-xl" />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="mx-auto w-full max-w-200 rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<AlertTriangle />}
					title={t('errorTitle')}
					description={t('errorDescription')}
					action={
						<Button variant="outline" onClick={() => void refetch()}>
							{t('retry')}
						</Button>
					}
				/>
			</div>
		);
	}

	const nextClass = resolveNextClass(data.todaySessions);

	return (
		<div className="mx-auto flex w-full max-w-200 flex-col gap-4 pb-8">
			{nextClass && <NextClassCard info={nextClass} />}

			{data.outstanding > 0 && (
				<BalanceDueBanner
					outstanding={data.outstanding}
					currency={data.currency}
				/>
			)}

			<HomeStats attendance={data.attendance} />

			<div>
				<div className="mb-2.5 flex items-center justify-between gap-2">
					<h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
						{t('todaySectionTitle')} · {formatShortDate(todayIsoDate())}
					</h2>
					<Link
						to="/schedule"
						className="shrink-0 text-xs font-semibold text-primary hover:underline"
					>
						{t('fullSchedule')}
					</Link>
				</div>
				<TodaySessionList sessions={data.todaySessions} />
			</div>

			{data.latestResult && <LatestResultCard result={data.latestResult} />}
		</div>
	);
}
