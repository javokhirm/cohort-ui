import { Button, cn, resolveStatus, TONE_CLASSES } from '@repo/ui';

import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../api/attendance.queries';

interface StatusToggleProps {
	value: AttendanceStatus | null;
	onChange: (status: AttendanceStatus) => void;
	className?: string;
}

/**
 * A controlled Present / Absent / Late / Excused selector — one tap per student.
 * Built as a segmented control: the four options share one track, and the
 * selected one is filled with its status tone (green/red/amber/slate) from
 * `@repo/ui`'s status system.
 *
 * The label rides along with the fill rather than being replaced by it, so the
 * choice never rests on colour alone, and dropping the per-option dot buys back
 * the width four labels need at 375px.
 */
export function StatusToggle({ value, onChange, className }: StatusToggleProps) {
	return (
		<div
			role="group"
			className={cn(
				'grid grid-cols-4 gap-1 rounded-xl border border-border bg-muted p-1',
				className,
			)}
		>
			{ATTENDANCE_STATUSES.map((status) => {
				const { tone, label } = resolveStatus('attendance', status);
				const active = value === status;
				return (
					<Button
						key={status}
						type="button"
						variant="ghost"
						size="sm"
						aria-pressed={active}
						onClick={() => onChange(status)}
						className={cn(
							'h-8 justify-center rounded-lg px-1 text-xs font-semibold',
							active
								? cn(TONE_CLASSES[tone], 'shadow-sm')
								: 'text-muted-foreground hover:bg-card hover:text-foreground',
						)}
					>
						{label}
					</Button>
				);
			})}
		</div>
	);
}
