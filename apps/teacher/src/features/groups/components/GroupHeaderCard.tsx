import { CalendarDays, ClipboardCheck, PenLine } from 'lucide-react';

import { Button, cn } from '@repo/ui';
import { formatTime } from '@repo/utils';

import type { TeachGroupDetail } from '../api/groups.queries';
import { capacityLabel, capacityToneClass } from '../lib/capacity';
import { useAppT } from '@/locales';

interface GroupHeaderCardProps {
	group: TeachGroupDetail;
	/** Branch name for the "Branch" cell; the payload carries only `branchId`. */
	branchName?: string;
	onOpenAttendance: () => void;
	onOpenMarks: () => void;
}

interface FactProps {
	label: string;
	value: string;
	valueClassName?: string;
}

function Fact({ label, value, valueClassName }: FactProps) {
	return (
		<div className="min-w-0">
			<div className="text-[10.5px] font-semibold tracking-wider text-muted-foreground/70 uppercase">
				{label}
			</div>
			<div
				className={cn(
					'mt-0.5 truncate text-[13px] font-semibold',
					valueClassName,
				)}
			>
				{value}
			</div>
		</div>
	);
}

/**
 * The group screen's header: the weekly schedule line, then the four facts a
 * teacher checks before class — course, room, branch and how full the group is.
 *
 * It also carries the entry points into the month grids. Those used to hang off
 * the group card on the Groups list; the card now opens this screen, so without
 * these buttons attendance would be unreachable from Groups entirely.
 */
export function GroupHeaderCard({
	group,
	branchName,
	onOpenAttendance,
	onOpenMarks,
}: GroupHeaderCardProps) {
	const t = useAppT('groups');
	const tAttendance = useAppT('attendance');
	const tMarks = useAppT('marks');
	const rule = group.scheduleRule;

	return (
		<div className="rounded-xl border border-border bg-card p-3.75 shadow-xs">
			{rule && (
				<div className="mb-2.5 flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground">
					<CalendarDays className="size-3 shrink-0" />
					<span>{rule.days.join('/')}</span>
					<span className="size-0.75 rounded-full bg-muted-foreground/40" />
					<span className="tabular-nums">
						{formatTime(rule.startTime)}–{formatTime(rule.endTime)}
					</span>
				</div>
			)}

			{/* Two-up on a phone: four columns at 375px clips "Filled" and a branch name. */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<Fact label={t('field.course')} value={group.courseName} />
				<Fact label={t('field.room')} value={group.roomName ?? '—'} />
				<Fact label={t('field.branch')} value={branchName ?? '—'} />
				<Fact
					label={t('field.filled')}
					value={capacityLabel(group.activeEnrollmentsCount, group.capacity)}
					valueClassName={cn(
						'tabular-nums',
						capacityToneClass(group.activeEnrollmentsCount, group.capacity),
					)}
				/>
			</div>

			<div className="mt-3.5 flex gap-2 border-t border-border pt-3.5">
				<Button variant="outline" size="sm" onClick={onOpenAttendance}>
					<ClipboardCheck className="size-3.5" />
					{tAttendance('title')}
				</Button>
				<Button variant="outline" size="sm" onClick={onOpenMarks}>
					<PenLine className="size-3.5" />
					{tMarks('title')}
				</Button>
			</div>
		</div>
	);
}
