import { useNavigate, useSearch } from '@tanstack/react-router';
import { AlertTriangle, ClipboardList } from 'lucide-react';

import { Button, EmptyState, Skeleton } from '@repo/ui';

import { useAttendanceSummary } from '@/features/progress/api/attendance.queries';
import {
	CLASS_LOG_PAGE_SIZE,
	useClassLog,
} from '@/features/progress/api/class-log.queries';
import { useMyGroups } from '@/features/progress/api/groups.queries';
import { useMarkSummary } from '@/features/progress/api/marks.queries';
import { AttendanceSummaryCard } from '@/features/progress/components/AttendanceSummaryCard';
import { ClassLogRow } from '@/features/progress/components/ClassLogRow';
import { ClassMarkAverageCard } from '@/features/progress/components/ClassMarkAverageCard';
import { GroupFilterChips } from '@/features/progress/components/GroupFilterChips';
import { earlierScaleNameFor, scaleNameLabel } from '@/features/progress/lib/mark-format';
import { useAppT } from '@/locales';

/**
 * The student's Progress screen (api-reference §5.5) — a **class log built on
 * daily session marks**, replacing the old Grades/Attendance tab split.
 *
 * One scroll, four sections driven by a single filter: the class mark average
 * with its chart, the group chips, the attendance donut/strip, and the log
 * itself. The selected group lives in `?groupId=` so a notification link can
 * deep-link into one group's record and the filter survives a refresh.
 *
 * Published assessment results are no longer shown here; `GET /student/results`
 * still exists but has no screen (see §5.6).
 */
export function ProgressRoute() {
	const t = useAppT('progress');
	const navigate = useNavigate();
	const { groupId } = useSearch({ from: '/_authed/progress' });

	const groups = useMyGroups();
	const marks = useMarkSummary(groupId);
	const attendance = useAttendanceSummary(groupId);
	const log = useClassLog(groupId);

	// `groupId: undefined` drops the param entirely, which is the "all groups" state.
	const selectGroup = (next: number | undefined) =>
		void navigate({ to: '/progress', search: { groupId: next }, replace: true });

	const rows = log.data?.pages.flatMap((page) => page.rows) ?? [];
	const total = log.data?.pages[0]?.total ?? 0;
	const remaining = total - rows.length;

	// The chips name the scope for the attendance card; `undefined` = all groups.
	const scopeLabel =
		groups.data?.find((group) => group.id === groupId)?.name ?? t('allGroups');

	if (marks.isPending || attendance.isPending || log.isPending) {
		return (
			<div className="mx-auto flex w-full max-w-210 flex-col gap-3 pb-8">
				<Skeleton className="h-64 w-full rounded-[17px]" />
				<Skeleton className="h-10 w-full rounded-[9px]" />
				<Skeleton className="h-56 w-full rounded-[17px]" />
				<Skeleton className="h-16 w-full rounded-[13px]" />
				<Skeleton className="h-16 w-full rounded-[13px]" />
			</div>
		);
	}

	if (marks.isError || attendance.isError || log.isError || !attendance.data) {
		return (
			<div className="mx-auto w-full max-w-210 rounded-2xl border border-border bg-card">
				<EmptyState
					icon={<AlertTriangle />}
					title={t('errorTitle')}
					description={t('errorDescription')}
				/>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-210 pb-8">
			<ClassMarkAverageCard summary={marks.data} />

			<div className="py-3">
				<GroupFilterChips
					groups={groups.data ?? []}
					selected={groupId}
					onSelect={selectGroup}
				/>
			</div>

			<AttendanceSummaryCard summary={attendance.data} scopeLabel={scopeLabel} />

			<div className="mb-2 mt-4.5 flex items-baseline justify-between gap-2.5 px-0.5">
				<h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
					{t('classLogTitle')}
				</h2>
				{marks.data.scales.length > 0 && (
					<span className="text-[11px] text-muted-foreground">
						{marks.data.scales.length === 1
							? scaleNameLabel(marks.data.scales[0]!, t)
							: t('scalesInUse', { count: marks.data.scales.length })}
					</span>
				)}
			</div>

			{rows.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border bg-card">
					<EmptyState
						icon={<ClipboardList />}
						title={t('noLogTitle')}
						description={t('noLogDescription')}
					/>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-2">
						{rows.map((entry, i) => (
							<ClassLogRow
								key={entry.id}
								entry={entry}
								// Rows run newest → oldest, so the next index is the older class.
								olderScaleName={earlierScaleNameFor(
									entry,
									rows[i + 1],
									t,
								)}
							/>
						))}
					</div>
					{log.hasNextPage && (
						<Button
							variant="outline"
							className="mt-3 w-full text-primary"
							disabled={log.isFetchingNextPage}
							onClick={() => void log.fetchNextPage()}
						>
							{t('loadMore', {
								count: Math.min(CLASS_LOG_PAGE_SIZE, remaining),
							})}
						</Button>
					)}
				</>
			)}
		</div>
	);
}
