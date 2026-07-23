import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@repo/ui';

import type { MyPayrollPeriod } from '../api/payroll.queries';
import { formatMonthLabel } from '../lib/format';
import { useAppT } from '@/locales';

interface MonthPickerProps {
	/** Newest first — the order the API returns them in. */
	periods: MyPayrollPeriod[];
	month: string;
	onChange: (month: string) => void;
}

/**
 * Steps through the months the teacher actually has pay for. Bounded by the
 * list itself rather than a free calendar: there is nothing to show for a month
 * with no snapshot and no live figure.
 */
export function MonthPicker({ periods, month, onChange }: MonthPickerProps) {
	const tShell = useAppT('shell');
	const index = periods.findIndex((period) => period.month === month);
	// `periods` is newest-first, so "newer" is the lower index.
	const newer = index > 0 ? periods[index - 1] : undefined;
	const older =
		index >= 0 && index < periods.length - 1 ? periods[index + 1] : undefined;

	return (
		<div className="flex items-center justify-between gap-2">
			<Button
				variant="outline"
				size="icon"
				aria-label={tShell('prevMonth')}
				disabled={!older}
				onClick={() => older && onChange(older.month)}
			>
				<ChevronLeft className="size-4" />
			</Button>

			<span className="text-sm font-semibold">{formatMonthLabel(month)}</span>

			<Button
				variant="outline"
				size="icon"
				aria-label={tShell('nextMonth')}
				disabled={!newer}
				onClick={() => newer && onChange(newer.month)}
			>
				<ChevronRight className="size-4" />
			</Button>
		</div>
	);
}
