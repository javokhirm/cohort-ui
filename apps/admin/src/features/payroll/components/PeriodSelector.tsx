import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@repo/ui';

import { addMonths, currentMonth, formatMonthLabel } from '../lib/month';
import { useAppT } from '@/locales';
import { useT } from '@repo/i18n';

interface PeriodSelectorProps {
	/** The selected `YYYY-MM`. */
	month: string;
	onMonthChange: (month: string) => void;
}

/**
 * Month stepper for the payroll period — prev / next chevrons around the month
 * label, with a "This month" shortcut when the view has moved away from it.
 * Stepping past the current Tashkent month is disabled: future periods have no
 * completed sessions to compute from.
 */
export function PeriodSelector({ month, onMonthChange }: PeriodSelectorProps) {
	const t = useAppT('payroll');
	const tc = useT('common');
	const thisMonth = currentMonth();
	const nextDisabled = month >= thisMonth;

	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1">
				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-muted-foreground hover:bg-card"
					aria-label={tc('action.previous')}
					onClick={() => onMonthChange(addMonths(month, -1))}
				>
					<ChevronLeft className="size-4" />
				</Button>
				<div className="min-w-32 text-center text-xs font-semibold text-foreground">
					{formatMonthLabel(month)}
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-muted-foreground hover:bg-card"
					aria-label={tc('action.next')}
					disabled={nextDisabled}
					onClick={() => onMonthChange(addMonths(month, 1))}
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>
			{month !== thisMonth && (
				<Button
					variant="outline"
					size="sm"
					onClick={() => onMonthChange(thisMonth)}
				>
					{t('thisMonth')}
				</Button>
			)}
		</div>
	);
}
