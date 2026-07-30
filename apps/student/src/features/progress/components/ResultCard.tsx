import { Card, StatusBadge } from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { StudentResult } from '../api/results.queries';

interface ResultCardProps {
	result: StudentResult;
}

/**
 * One published result per the design: a big score block, the assessment-type badge and
 * date, title and group, and — when the teacher wrote one — their feedback in a quoted
 * box with their name.
 */
export function ResultCard({ result }: ResultCardProps) {
	const statusLabel = useStatusLabel();
	const dateLabel = result.examDate ?? result.gradedAt;

	return (
		<Card className="gap-0 rounded-[15px] py-0">
			<div className="p-4">
				<div className="flex items-start gap-3">
					<div className="flex size-15 shrink-0 flex-col items-center justify-center rounded-[15px] bg-tone-indigo-bg text-tone-indigo-fg">
						<span className="text-lg font-extrabold leading-none tracking-tight tabular-nums">
							{result.score ?? result.gradeLabel ?? '—'}
						</span>
						{result.score !== null && (
							<span className="mt-0.5 text-[9px] font-semibold opacity-80">
								/ {result.maxScore}
							</span>
						)}
					</div>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<StatusBadge kind="assessment" status={result.type}>
								{statusLabel('assessment', result.type)}
							</StatusBadge>
							{dateLabel && (
								<span className="text-[11.5px] text-muted-foreground">
									{formatDate(dateLabel)}
								</span>
							)}
						</div>
						<p className="mt-1.5 text-[14.5px] font-bold text-foreground">
							{result.title}
						</p>
						<p className="mt-px flex items-center gap-1.5 text-xs text-muted-foreground">
							<span className="truncate">{result.groupName}</span>
							{result.gradeLabel && result.score !== null && (
								<span className="shrink-0 rounded-md bg-tone-indigo-bg px-1.5 py-0.5 text-[10.5px] font-bold text-tone-indigo-fg">
									{result.gradeLabel}
								</span>
							)}
						</p>
					</div>
				</div>

				{result.feedback && (
					<div className="mt-3 flex gap-2.5 rounded-xl bg-muted px-3 py-2.5">
						{result.teacherName && (
							<span className="flex size-5.5 shrink-0 items-center justify-center rounded-[7px] bg-tone-indigo-bg text-[9px] font-extrabold text-tone-indigo-fg">
								{result.teacherName
									.split(' ')
									.map((w) => w[0])
									.slice(0, 2)
									.join('')
									.toUpperCase()}
							</span>
						)}
						<div className="min-w-0">
							{result.teacherName && (
								<p className="text-[11px] font-bold text-foreground/70">
									{result.teacherName}
								</p>
							)}
							<p className="mt-0.5 text-[12.5px] leading-normal text-foreground/70">
								{result.feedback}
							</p>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
