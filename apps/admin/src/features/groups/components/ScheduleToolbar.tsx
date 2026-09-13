import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button, cn, resolveStatus, TONE_ACCENT_CLASSES } from '@repo/ui';
import { useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import type { SessionStatus } from '../api/groups.queries';

/** The statuses a class can carry, in the order the legend reads them. */
const SESSION_STATUS_LEGEND: SessionStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

interface ScheduleToolbarProps {
	/**
	 * The date control itself — a plain range label on the calendar screens, a
	 * `DatePicker` on room availability, where the date is what's being asked
	 * about rather than a caption.
	 */
	children: ReactNode;
	/** Steps by whatever the screen shows: a week, a month, a day. */
	onStep: (delta: number) => void;
	onToday: () => void;
	/** Greys out "Today" when the view already sits on it. */
	isToday: boolean;
}

/**
 * The date navigation every schedule screen shares — prev/next, the date
 * control, a jump to today, and the session-status legend.
 *
 * One component rather than three copies so the weekly, monthly and room
 * screens keep an identical header; only the middle control differs, which is
 * why it's a slot.
 */
export function ScheduleToolbar({
	children,
	onStep,
	onToday,
	isToday,
}: ScheduleToolbarProps) {
	const t = useAppT('groups');
	const tc = useT('common');

	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="icon"
					onClick={() => onStep(-1)}
					aria-label={tc('action.previous')}
				>
					<ChevronLeft className="size-4" />
				</Button>
				{children}
				<Button
					variant="outline"
					size="icon"
					onClick={() => onStep(1)}
					aria-label={tc('action.next')}
				>
					<ChevronRight className="size-4" />
				</Button>
				<Button variant="ghost" size="sm" disabled={isToday} onClick={onToday}>
					{t('schedule.today')}
				</Button>
			</div>

			<div className="flex items-center gap-3 text-xs text-muted-foreground">
				{SESSION_STATUS_LEGEND.map((s) => {
					const { tone } = resolveStatus('session', s);
					return (
						<span key={s} className="flex items-center gap-1.5">
							<span
								className={cn(
									'size-2 rounded-full',
									TONE_ACCENT_CLASSES[tone].dot,
								)}
							/>
							{t(`sessionStatus.${s}`)}
						</span>
					);
				})}
			</div>
		</div>
	);
}
