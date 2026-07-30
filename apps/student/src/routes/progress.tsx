import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { AlertTriangle, Star } from 'lucide-react';

import { Button, EmptyState, Skeleton, Tabs, TabsList, TabsTrigger } from '@repo/ui';

import { useAttendanceHistory, useAttendanceSummary } from '@/features/progress/api/attendance.queries';
import { useMyGroups } from '@/features/progress/api/groups.queries';
import { useResults } from '@/features/progress/api/results.queries';
import { AttendanceHistoryRow } from '@/features/progress/components/AttendanceHistoryRow';
import { AttendanceSummaryCard } from '@/features/progress/components/AttendanceSummaryCard';
import { GroupFilterChips } from '@/features/progress/components/GroupFilterChips';
import { ResultCard } from '@/features/progress/components/ResultCard';
import { useAppT } from '@/locales';

export type ProgressTab = 'grades' | 'attendance';

/** The Grades tab: group filter chips over the published-result cards. */
function GradesTab() {
	const t = useAppT('progress');
	const [groupId, setGroupId] = useState<number | undefined>(undefined);
	const groups = useMyGroups();
	const results = useResults(groupId);

	return (
		<div>
			<GroupFilterChips
				groups={groups.data ?? []}
				selected={groupId}
				onSelect={setGroupId}
			/>

			{results.isPending ? (
				<div className="flex flex-col gap-2.5">
					<Skeleton className="h-36 w-full rounded-[15px]" />
					<Skeleton className="h-36 w-full rounded-[15px]" />
				</div>
			) : results.isError ? (
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<AlertTriangle />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
			) : results.data.rows.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border bg-card">
					<EmptyState
						icon={<Star />}
						title={t('noResultsTitle')}
						description={t('noResultsDescription')}
					/>
				</div>
			) : (
				<div className="flex flex-col gap-2.5">
					{results.data.rows.map((result) => (
						<ResultCard key={result.id} result={result} />
					))}
				</div>
			)}
		</div>
	);
}

/** The Attendance tab: the summary card over the paginated history. */
function AttendanceTab() {
	const t = useAppT('progress');
	const summary = useAttendanceSummary();
	const history = useAttendanceHistory();

	const rows = history.data?.pages.flatMap((p) => p.rows) ?? [];
	const total = history.data?.pages[0]?.total ?? 0;
	const remaining = total - rows.length;

	if (summary.isPending || history.isPending) {
		return (
			<div className="flex flex-col gap-3">
				<Skeleton className="h-56 w-full rounded-[17px]" />
				<Skeleton className="h-16 w-full rounded-[13px]" />
				<Skeleton className="h-16 w-full rounded-[13px]" />
			</div>
		);
	}

	if (summary.isError || history.isError || !summary.data) {
		return (
			<div className="rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<AlertTriangle />}
					title={t('errorTitle')}
					description={t('errorDescription')}
				/>
			</div>
		);
	}

	return (
		<div>
			<AttendanceSummaryCard summary={summary.data} />

			<h2 className="mb-2 mt-4 px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
				{t('historyTitle')}
			</h2>
			{rows.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border bg-card">
					<EmptyState title={t('noHistoryTitle')} description={t('noHistoryDescription')} />
				</div>
			) : (
				<>
					<div className="flex flex-col gap-2">
						{rows.map((record) => (
							<AttendanceHistoryRow key={record.id} record={record} />
						))}
					</div>
					{history.hasNextPage && (
						<Button
							variant="outline"
							className="mt-3 w-full text-primary"
							disabled={history.isFetchingNextPage}
							onClick={() => void history.fetchNextPage()}
						>
							{t('loadMore', { count: Math.min(8, remaining) })}
						</Button>
					)}
				</>
			)}
		</div>
	);
}

/**
 * The student's Progress screen (api-reference §5.4–5.5): published results and the
 * attendance record, split across two tabs. The active tab lives in the `?tab=` search
 * param so notification links can deep-link straight to Attendance.
 */
export function ProgressRoute() {
	const t = useAppT('progress');
	const navigate = useNavigate();
	const { tab = 'grades' } = useSearch({ from: '/_authed/progress' });

	return (
		<div className="mx-auto w-full max-w-210 pb-8">
			<Tabs
				value={tab}
				onValueChange={(value) =>
					void navigate({
						to: '/progress',
						search: { tab: value as ProgressTab },
						replace: true,
					})
				}
			>
				<TabsList className="mb-3 grid w-full grid-cols-2">
					<TabsTrigger value="grades">{t('gradesTab')}</TabsTrigger>
					<TabsTrigger value="attendance">{t('attendanceTab')}</TabsTrigger>
				</TabsList>
			</Tabs>

			{tab === 'grades' ? <GradesTab /> : <AttendanceTab />}
		</div>
	);
}
