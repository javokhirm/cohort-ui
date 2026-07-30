import { AlertTriangle } from 'lucide-react';

import { Button, EmptyState, Skeleton } from '@repo/ui';

import { useHome } from '@/features/home/api/home.queries';
import { BalanceDueBanner } from '@/features/home/components/BalanceDueBanner';
import { HomeStats } from '@/features/home/components/HomeStats';
import { LatestResultCard } from '@/features/home/components/LatestResultCard';
import { TodaySessionList } from '@/features/home/components/TodaySessionList';
import { useAppT } from '@/locales';

/**
 * The student's Home screen (composed from `GET /student/home`): today's sessions, the
 * momentum row (attendance rate / streak / unread), an outstanding-balance banner, and
 * the latest published result. The greeting and today's date are the app bar's title and
 * subtitle, so this column carries no heading of its own. Each section shows only when its
 * backing data is present — this screen never fabricates content the endpoint didn't return.
 */
export function HomeRoute() {
	const t = useAppT('home');
	const { data, isPending, isError, refetch } = useHome();

	if (isPending) {
		return (
			<div className="mx-auto flex w-full max-w-200 flex-col gap-4">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-28 w-full rounded-2xl" />
				<div className="grid grid-cols-3 gap-3">
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
					<Skeleton className="h-24 rounded-2xl" />
				</div>
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

	return (
		<div className="mx-auto flex w-full max-w-200 flex-col gap-4 pb-8">
			{data.outstanding > 0 && (
				<BalanceDueBanner
					outstanding={data.outstanding}
					currency={data.currency}
				/>
			)}

			<HomeStats attendance={data.attendance} unreadCount={data.unreadCount} />

			<div>
				<h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
					{t('todaySectionTitle')}
				</h2>
				<TodaySessionList sessions={data.todaySessions} />
			</div>

			{data.latestResult && <LatestResultCard result={data.latestResult} />}
		</div>
	);
}
