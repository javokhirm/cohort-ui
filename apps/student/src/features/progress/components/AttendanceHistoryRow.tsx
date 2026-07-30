import { cn, StatusBadge } from '@repo/ui';
import { formatDayOfMonth, formatMonthShort } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { StudentAttendanceRecord } from '../api/attendance.queries';

interface AttendanceHistoryRowProps {
	record: StudentAttendanceRecord;
}

/**
 * One attendance history row per the design: a date block, the group name with the
 * teacher's note underneath, and the status badge. Absences get a red-tinted border.
 */
export function AttendanceHistoryRow({ record }: AttendanceHistoryRowProps) {
	const statusLabel = useStatusLabel();

	return (
		<div
			className={cn(
				'flex items-center gap-3 rounded-[13px] border bg-card px-3.5 py-3 shadow-sm',
				record.status === 'ABSENT' ? 'border-tone-red-fg/40' : 'border-border',
			)}
		>
			<div className="w-11.5 shrink-0 text-center">
				<div className="text-[13px] font-bold text-foreground">
					{formatDayOfMonth(record.sessionDate)}
				</div>
				<div className="text-[10px] text-muted-foreground">
					{formatMonthShort(record.sessionDate.slice(0, 7))}
				</div>
			</div>
			<div className="w-px self-stretch bg-border" />
			<div className="min-w-0 flex-1">
				<p className="truncate text-[13.5px] font-semibold text-foreground">
					{record.groupName}
				</p>
				{record.note && (
					<p className="mt-px truncate text-[11.5px] text-muted-foreground">
						{record.note}
					</p>
				)}
			</div>
			<StatusBadge kind="attendance" status={record.status} className="shrink-0">
				{statusLabel('attendance', record.status)}
			</StatusBadge>
		</div>
	);
}
