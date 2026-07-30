import { useState } from 'react';
import { GraduationCap } from 'lucide-react';

import { EmptyState, Pagination, Separator, Skeleton, StatusBadge } from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';
import { STUDENT_TAB_PAGE_SIZE, useStudentResults } from '../api/students.queries';

interface GradesTabProps {
	studentId: number;
}

/**
 * Student detail → Grades. Published assessments only (the backend hard-filters
 * unpublished ones), newest exam first.
 */
export function GradesTab({ studentId }: GradesTabProps) {
	const t = useAppT('people');
	const statusLabel = useStatusLabel();
	const [page, setPage] = useState(1);
	const { data, isLoading } = useStudentResults(studentId, page);

	const results = data?.rows ?? [];
	const total = data?.total ?? 0;

	if (isLoading && !data) {
		return <Skeleton className="h-32 rounded-xl" />;
	}

	if (results.length === 0) {
		return (
			<div className="rounded-xl border bg-card">
				<EmptyState
					icon={<GraduationCap />}
					title={t('detail.grades.emptyTitle')}
					description={t('detail.grades.emptyDescription')}
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="overflow-hidden rounded-xl border bg-card">
				{results.map((r, i) => (
					<div key={r.id}>
						{i > 0 && <Separator />}
						<div className="flex items-center justify-between gap-3 px-4 py-3">
							<div className="min-w-0">
								<div className="flex items-center gap-2">
									<p className="truncate text-sm font-medium">
										{r.title}
									</p>
									<StatusBadge kind="assessment" status={r.type}>
										{statusLabel('assessment', r.type)}
									</StatusBadge>
								</div>
								<p className="text-xs text-muted-foreground">
									{r.examDate ? formatDate(r.examDate) : '—'} ·{' '}
									{r.groupName}
								</p>
							</div>
							<div className="shrink-0 text-right">
								{r.score == null ? (
									<span className="text-sm text-muted-foreground">
										{t('detail.grades.notGraded')}
									</span>
								) : (
									<>
										<span className="text-base font-bold tabular-nums">
											{r.score}
										</span>
										<span className="text-sm text-muted-foreground tabular-nums">
											{' '}
											/ {r.maxScore}
										</span>
										{r.gradeLabel && (
											<p className="text-xs text-muted-foreground">
												{r.gradeLabel}
											</p>
										)}
									</>
								)}
							</div>
						</div>
					</div>
				))}
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
	);
}
