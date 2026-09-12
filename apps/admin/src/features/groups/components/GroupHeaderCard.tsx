import type { ReactNode } from 'react';
import { CalendarDays } from 'lucide-react';

import { cn, ProgressBar, Separator, StatusBadge } from '@repo/ui';
import { formatDate } from '@repo/utils';

import { useAppT } from '@/locales';
import { useBranches } from '@/api/branches';

import { useGroupEnrollments, type GroupDetail } from '../api/groups.queries';
import { useGroupGradingConfig } from '../api/grading-config.queries';
import {
	capacityLabel,
	capacityPercent,
	capacityToneClass,
	formatScheduleRule,
	gradingPreview,
	GROUP_STATUS_TONES,
	occupiesSeat,
} from '../lib/group-options';

interface GroupHeaderCardProps {
	group: GroupDetail;
	/** Edit button + actions menu, composed by the page. */
	actions: ReactNode;
}

interface FactProps {
	label: string;
	value: ReactNode;
	className?: string;
}

/**
 * One label→value cell. Deliberately not `StatCard`: that renders its value at
 * `text-2xl font-bold` with no truncation, which is right for a KPI number and
 * wrong for a teacher's name — it used to set a person's name in 24px bold and
 * wrap the card. Matches the `Stat` cell on the course screen.
 *
 * Values wrap rather than truncate. The point of this header is that every fact
 * is readable in one place, so a long teacher name or a two-ended date range
 * takes a second line instead of ending in an ellipsis.
 */
function Fact({ label, value, className }: FactProps) {
	return (
		<div className={cn('min-w-0', className)}>
			<div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
				{label}
			</div>
			<div className="mt-0.5 break-words text-sm font-semibold">{value}</div>
		</div>
	);
}

/**
 * The group screen's header: what the group *is* on one line, then the five
 * facts an admin checks — how full it is, who teaches it, where, in which
 * branch, and over what dates — plus how it is graded.
 *
 * Each fact appears exactly **once** on the whole screen. The course and the
 * weekly schedule live on the subtitle, the seat figure lives here and nowhere
 * else, and the page no longer carries an Overview tab restating all of it.
 *
 * The seat figure is derived from the enrollment list rather than from
 * `activeEnrollmentsCount` — see {@link occupiesSeat} for why. It shares its
 * query with the Students tab, so this costs no extra request.
 */
export function GroupHeaderCard({ group, actions }: GroupHeaderCardProps) {
	const t = useAppT('groups');
	const schedule = formatScheduleRule(t, group.scheduleRule);
	const { data: branches = [] } = useBranches();
	const { data: enrollments } = useGroupEnrollments(group.id);
	const { data: grading } = useGroupGradingConfig(group.id);

	const branchName = branches.find((b) => b.id === group.branchId)?.name ?? '—';
	const filled = enrollments?.filter((e) => occupiesSeat(e.status)).length;
	const current = grading?.current ?? null;

	const dateRange =
		group.startDate && group.endDate
			? `${formatDate(group.startDate)} → ${formatDate(group.endDate)}`
			: (group.startDate ?? group.endDate)
				? formatDate(group.startDate ?? group.endDate!)
				: t('notSet');

	return (
		<div className="rounded-xl border bg-card p-5">
			<div className="flex items-start justify-between gap-4">
				<div className="flex min-w-0 items-center gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<CalendarDays className="size-5" />
					</div>
					<div className="min-w-0">
						<div className="flex flex-wrap items-center gap-2.5">
							<h1 className="text-lg font-bold">{group.name}</h1>
							<StatusBadge tone={GROUP_STATUS_TONES[group.status]}>
								{t(`status.${group.status}`)}
							</StatusBadge>
						</div>
						<div className="mt-0.5 text-sm text-muted-foreground">
							{group.courseName}
							{schedule ? ` · ${schedule}` : ''}
						</div>
					</div>
				</div>

				<div className="flex shrink-0 items-center gap-2">{actions}</div>
			</div>

			<Separator className="my-4" />

			{/* Two-up on a phone: five columns at 375px clips a branch name. */}
			<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
				<Fact
					label={t('column.seats')}
					value={
						<span className="flex flex-col gap-1.5">
							<span
								className={cn(
									'tabular-nums',
									filled != null &&
										capacityToneClass(filled, group.capacity),
								)}
							>
								{filled == null
									? '—'
									: capacityLabel(filled, group.capacity)}
							</span>
							{filled != null && group.capacity != null && (
								<ProgressBar
									value={capacityPercent(filled, group.capacity)}
									tone={
										filled >= group.capacity
											? 'red'
											: filled / group.capacity > 0.85
												? 'amber'
												: 'indigo'
									}
								/>
							)}
						</span>
					}
				/>
				<Fact
					label={t('column.teacher')}
					value={group.defaultTeacherName ?? t('unassigned')}
				/>
				<Fact label={t('column.room')} value={group.roomName ?? t('noRoom')} />
				<Fact label={t('column.branch')} value={branchName} />
				<Fact label={t('form.field.dateRange')} value={dateRange} />
			</div>

			<div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
				<span className="font-semibold">{t('grading.title')}: </span>
				{current
					? gradingPreview(
							t,
							current.type,
							current.maxPoints != null ? String(current.maxPoints) : '',
						)
					: t('grading.none')}
			</div>
		</div>
	);
}
