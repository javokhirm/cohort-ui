import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@repo/ui';
import { useAppT } from '@/locales';

interface WeekNavProps {
	/** The visible week's range label, e.g. "14 – 20 Jul". */
	rangeLabel: string;
	onPrevWeek: () => void;
	onNextWeek: () => void;
	/** Show the "Today" shortcut (hidden when already viewing today). */
	showJumpToday: boolean;
	onJumpToday: () => void;
}

/**
 * Week paging controls above the week strip: previous / next week and a "Today"
 * shortcut that appears only when the teacher has navigated away from the
 * current week.
 */
export function WeekNav({
	rangeLabel,
	onPrevWeek,
	onNextWeek,
	showJumpToday,
	onJumpToday,
}: WeekNavProps) {
	const t = useAppT('schedule');
	const tShell = useAppT('shell');
	return (
		<div className="mb-2.5 flex items-center justify-between">
			<div className="flex items-center gap-0.5">
				<Button
					variant="ghost"
					size="icon"
					className="size-8 text-muted-foreground"
					onClick={onPrevWeek}
					aria-label={tShell('prevWeek')}
				>
					<ChevronLeft className="size-4" />
				</Button>
				<span className="min-w-[132px] text-center text-[12.5px] font-semibold text-foreground">
					{rangeLabel}
				</span>
				<Button
					variant="ghost"
					size="icon"
					className="size-8 text-muted-foreground"
					onClick={onNextWeek}
					aria-label={tShell('nextWeek')}
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>

			{showJumpToday && (
				<Button
					variant="outline"
					size="sm"
					className="h-7 text-primary"
					onClick={onJumpToday}
				>
					{t('today')}
				</Button>
			)}
		</div>
	);
}
