import { useState } from 'react';
import { CalendarCheck } from 'lucide-react';

import {
	Card,
	CardContent,
	EmptyState,
	Pagination,
	Separator,
	Skeleton,
	StatusBadge,
} from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';
import {
	STUDENT_TAB_PAGE_SIZE,
	useStudentAttendances,
	useStudentAttendanceSummary,
} from '../api/students.queries';

interface AttendanceTabProps {
	studentId: number;
}

/**
 * Student detail → Attendance. The rate card reads a separate summary endpoint
 * that aggregates the student's whole marked history, so paging the list below
 * never moves the headline figure.
 */
export function AttendanceTab({ studentId }: AttendanceTabProps) {
	const t = useAppT('people');
	const statusLabel = useStatusLabel();
	const [page, setPage] = useState(1);

	const { data: summary, isLoading: summaryLoading } =
		useStudentAttendanceSummary(studentId);
	const { data, isLoading } = useStudentAttendances(studentId, page);

	const records = data?.rows ?? [];
	const total = data?.total ?? 0;

	// Both queries gate the skeleton: settling the list first would flash the
	// whole-tab empty state below before the summary can say otherwise.
	if ((isLoading && !data) || (summaryLoading && !summary)) {
		return (
			<div className="grid gap-4 lg:grid-cols-4">
				<Skeleton className="h-40 rounded-xl" />
				<Skeleton className="h-40 rounded-xl lg:col-span-3" />
			</div>
		);
	}

	// `totalMarked === 0` is the "nothing marked yet" case; the rate card would
	// otherwise render a meaningless 0% next to an empty list.
	const hasHistory = (summary?.totalMarked ?? 0) > 0;

	if (!hasHistory && total === 0) {
		return (
			<div className="rounded-xl border bg-card">
				<EmptyState
					icon={<CalendarCheck />}
					title={t('detail.attendance.emptyTitle')}
					description={t('detail.attendance.emptyDescription')}
				/>
			</div>
		);
	}

	return (
		<div className="grid items-start gap-4 lg:grid-cols-4">
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-2 text-center">
					<p className="text-sm text-muted-foreground">
						{t('detail.attendance.rate')}
					</p>
					{summary?.rate == null ? (
						<p className="mt-1 text-4xl font-bold text-muted-foreground">—</p>
					) : (
						<p className="mt-1 text-4xl font-bold text-tone-green-fg tabular-nums">
							{summary.rate}%
						</p>
					)}
					<p className="mt-1 text-xs text-muted-foreground">
						{t('detail.attendance.rateWindow')}
					</p>
					{summary && (
						<>
							<Separator className="my-4" />
							<dl className="grid w-full grid-cols-2 gap-y-2 text-left text-xs">
								<dt className="text-muted-foreground">
									{statusLabel('attendance', 'PRESENT')}
								</dt>
								<dd className="text-right font-semibold tabular-nums">
									{summary.counts.present}
								</dd>
								<dt className="text-muted-foreground">
									{statusLabel('attendance', 'LATE')}
								</dt>
								<dd className="text-right font-semibold tabular-nums">
									{summary.counts.late}
								</dd>
								<dt className="text-muted-foreground">
									{statusLabel('attendance', 'ABSENT')}
								</dt>
								<dd className="text-right font-semibold tabular-nums">
									{summary.counts.absent}
								</dd>
								<dt className="text-muted-foreground">
									{statusLabel('attendance', 'EXCUSED')}
								</dt>
								<dd className="text-right font-semibold tabular-nums">
									{summary.counts.excused}
								</dd>
							</dl>
						</>
					)}
				</CardContent>
			</Card>

			<div className="flex flex-col gap-3 lg:col-span-3">
				<div className="overflow-hidden rounded-xl border bg-card">
					{records.length === 0 ? (
						<EmptyState
							icon={<CalendarCheck />}
							title={t('detail.attendance.emptyTitle')}
							description={t('detail.attendance.emptyDescription')}
						/>
					) : (
						records.map((r, i) => (
							<div key={r.id}>
								{i > 0 && <Separator />}
								<div className="flex items-center justify-between gap-3 px-4 py-3">
									<div className="min-w-0">
										<p className="truncate text-sm font-medium">
											{r.groupName}
										</p>
										<p className="text-xs text-muted-foreground">
											{formatDate(r.sessionDate)}
											{r.note ? ` · ${r.note}` : ''}
										</p>
									</div>
									<StatusBadge kind="attendance" status={r.status}>
										{statusLabel('attendance', r.status)}
									</StatusBadge>
								</div>
							</div>
						))
					)}
				</div>

				{total > STUDENT_TAB_PAGE_SIZE && (
					<Pagination
						page={page}
						pageSize={STUDENT_TAB_PAGE_SIZE}
						total={total}
						onPageChange={setPage}
					/>
				)}
			</div>
		</div>
	);
}
