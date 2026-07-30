import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@repo/ui';

import { useAppT } from '@/locales';

interface WeekNavProps {
	/** The visible week's range label, e.g. "24 – 30 Nov". */
	rangeLabel: string;
	/** Under the label, e.g. "6 classes · 9h" or "No classes this week". */
	summary: string;
	onPrevWeek: () => void;
	onNextWeek: () => void;
}

/**
 * Week paging per the design: chevron buttons flanking the centered week label with the
 * week's class count/hours underneath.
 */
export function WeekNav({ rangeLabel, summary, onPrevWeek, onNextWeek }: WeekNavProps) {
	const t = useAppT('schedule');

	return (
		<div className="flex items-center gap-2">
			<Button
				variant="outline"
				size="icon"
				className="size-9 shrink-0 rounded-xl text-muted-foreground"
				onClick={onPrevWeek}
				aria-label={t('prevWeek')}
			>
				<ChevronLeft className="size-4" />
			</Button>
			<div className="min-w-0 flex-1 text-center">
				<div className="text-[13.5px] font-bold text-foreground">
					{rangeLabel}
				</div>
				<div className="mt-px text-[11px] text-muted-foreground">{summary}</div>
			</div>
			<Button
				variant="outline"
				size="icon"
				className="size-9 shrink-0 rounded-xl text-muted-foreground"
				onClick={onNextWeek}
				aria-label={t('nextWeek')}
			>
				<ChevronRight className="size-4" />
			</Button>
		</div>
	);
}
