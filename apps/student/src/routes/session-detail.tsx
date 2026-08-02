import { Link, useParams } from '@tanstack/react-router';
import {
	AlertTriangle,
	ArrowLeft,
	BookOpen,
	CalendarDays,
	Clock,
	Info,
	MapPin,
	User,
} from 'lucide-react';

import { Card, DetailRows, EmptyState, Skeleton, StatusBadge } from '@repo/ui';
import type { DetailRow } from '@repo/ui';
import { formatShortDate, formatTime } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { MarkChip } from '@/features/progress/components/MarkChip';
import { scaleNameLabel } from '@/features/progress/lib/mark-format';
import { useSessionDetail } from '@/features/schedule/api/sessions.queries';
import { useAppT } from '@/locales';

/**
 * Read-only session detail (`GET /student/sessions/:id`), per the design: back link, a
 * header card with the status badge and date, a cancellation note when the center
 * cancelled the class, this session's daily mark in its stamped scale, and the
 * time/room/teacher/topic rows.
 */
export function SessionDetailRoute() {
	const t = useAppT('schedule');
	const tProgress = useAppT('progress');
	const statusLabel = useStatusLabel();
	const { sessionId } = useParams({ from: '/_authed/schedule/$sessionId' });
	const { data, isPending, isError } = useSessionDetail(Number(sessionId));

	return (
		<div className="mx-auto w-full max-w-170 pb-8">
			<Link
				to="/schedule"
				className="mb-3.5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				{t('backToSchedule')}
			</Link>

			{isPending ? (
				<Skeleton className="h-80 w-full rounded-2xl" />
			) : isError || !data ? (
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<AlertTriangle />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
			) : (
				<>
					<Card className="gap-0 overflow-hidden py-0">
						<div className="bg-tone-indigo-bg/60 p-4.5">
							<div className="flex items-center justify-between gap-2">
								<StatusBadge kind="session" status={data.status}>
									{statusLabel('session', data.status)}
								</StatusBadge>
								<span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-foreground/70">
									<CalendarDays className="size-3.5" />
									{formatShortDate(data.sessionDate)}
								</span>
							</div>
							<h1 className="mt-3 text-[21px] font-bold tracking-tight text-foreground">
								{data.groupName}
							</h1>
							<p className="mt-0.5 text-[13px] text-foreground/70">
								{data.courseName}
							</p>
						</div>

						{data.status === 'CANCELLED' && (
							<div className="flex items-start gap-2.5 border-b border-border bg-tone-red-bg px-4 py-3">
								<Info className="mt-0.5 size-4 shrink-0 text-tone-red-fg" />
								<div>
									<p className="text-[12.5px] font-bold text-tone-red-fg">
										{t('classCancelled')}
									</p>
									{data.cancellationReason && (
										<p className="mt-0.5 text-xs leading-relaxed text-foreground/70">
											{data.cancellationReason}
										</p>
									)}
								</div>
							</div>
						)}

						{data.mark && (
							<div className="border-b border-border px-4 py-3.5">
								<div className="flex items-center gap-3">
									<MarkChip mark={data.mark} size="lg" />
									<div className="min-w-0">
										<p className="text-[12.5px] font-bold text-foreground">
											{t('dailyMark')}
										</p>
										<p className="mt-0.5 text-[11.5px] text-muted-foreground">
											{tProgress('singleScaleNote', {
												scale: scaleNameLabel(
													data.mark.scale,
													tProgress,
												),
											})}
										</p>
									</div>
								</div>
								{data.mark.comment && (
									<p className="mt-3 rounded-xl bg-muted px-3 py-2.5 text-[12.5px] leading-relaxed text-foreground/70">
										{data.mark.comment}
									</p>
								)}
							</div>
						)}

						<DetailRows
							className="px-4 pb-2 pt-1"
							rows={
								[
									{
										label: t('rowTime'),
										value: `${formatTime(data.startTime)} – ${formatTime(data.endTime)}`,
										icon: <Clock />,
									},
									data.roomName && {
										label: t('rowRoom'),
										value: data.roomName,
										icon: <MapPin />,
									},
									data.teacherName && {
										label: t('rowTeacher'),
										value: data.teacherName,
										icon: <User />,
									},
									data.topic && {
										label: t('rowTopic'),
										value: data.topic,
										icon: <BookOpen />,
									},
								].filter(Boolean) as DetailRow[]
							}
						/>
					</Card>

					<p className="mt-3.5 text-center text-[11.5px] text-muted-foreground">
						{t('readOnlyHint')}
					</p>
				</>
			)}
		</div>
	);
}
