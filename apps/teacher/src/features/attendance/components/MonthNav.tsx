import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@repo/ui';

interface MonthNavProps {
	label: string;
	onPrev: () => void;
	onNext: () => void;
	showToday: boolean;
	onToday: () => void;
}

/**
 * Month stepper for the grid — prev / next arrows around the current month, with
 * a "This month" shortcut when the view has moved away from it. Modelled on the
 * schedule feature's `WeekNav`; promote to `@repo/ui` if a second app needs it.
 */
export function MonthNav({ label, onPrev, onNext, showToday, onToday }: MonthNavProps) {
	return (
		<div className="flex items-center justify-between gap-2">
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon"
					aria-label="Previous month"
					onClick={onPrev}
				>
					<ChevronLeft className="size-4" />
				</Button>
				<div className="min-w-32 text-center font-semibold">{label}</div>
				<Button
					variant="ghost"
					size="icon"
					aria-label="Next month"
					onClick={onNext}
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>
			{showToday && (
				<Button variant="outline" size="sm" onClick={onToday}>
					This month
				</Button>
			)}
		</div>
	);
}
