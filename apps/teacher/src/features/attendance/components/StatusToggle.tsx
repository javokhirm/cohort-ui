import {
	Button,
	cn,
	resolveStatus,
	type StatusTone,
	TONE_ACCENT_CLASSES,
	TONE_CLASSES,
} from '@repo/ui';

import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../api/attendance.queries';

interface StatusToggleProps {
	value: AttendanceStatus | null;
	onChange: (status: AttendanceStatus) => void;
	className?: string;
}

/**
 * A controlled Present / Absent / Late / Excused selector — one tap per student.
 * The active option is filled with its status tone (green/red/amber/slate) from
 * `@repo/ui`'s status system; inactive options are outlined with a tone dot.
 */
export function StatusToggle({ value, onChange, className }: StatusToggleProps) {
	return (
		<div className={cn('grid grid-cols-4 gap-2', className)}>
			{ATTENDANCE_STATUSES.map((status) => {
				const { tone, label } = resolveStatus('attendance', status);
				const active = value === status;
				return (
					<Button
						key={status}
						type="button"
						variant="outline"
						size="sm"
						aria-pressed={active}
						onClick={() => onChange(status)}
						className={cn(
							'justify-center gap-1.5',
							active &&
								cn(
									TONE_CLASSES[tone as StatusTone],
									'border-transparent font-semibold',
								),
						)}
					>
						<span
							className={cn(
								'inline-block size-1.5 rounded-full',
								TONE_ACCENT_CLASSES[tone as StatusTone].dot,
							)}
						/>
						{label}
					</Button>
				);
			})}
		</div>
	);
}
