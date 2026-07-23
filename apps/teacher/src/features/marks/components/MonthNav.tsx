import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@repo/ui';
import { useAppT } from '@/locales';

interface MonthNavProps {
	label: string;
	onPrev: () => void;
	onNext: () => void;
	showToday: boolean;
	onToday: () => void;
}

/**
 * Month stepper for the marks grid — prev / next arrows around the current
 * month, with a "This month" shortcut when the view has moved away. Feature-local
 * (attendance has its own); a shared home is a promotion candidate.
 */
export function MonthNav({ label, onPrev, onNext, showToday, onToday }: MonthNavProps) {
	const tShell = useAppT('shell');
	return (
		<div className="flex items-center gap-2">
			<div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted p-1">
				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-muted-foreground hover:bg-card"
					aria-label={tShell('prevMonth')}
					onClick={onPrev}
				>
					<ChevronLeft className="size-4" />
				</Button>
				<div className="min-w-32 text-center text-xs font-semibold text-foreground">
					{label}
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="size-7 text-muted-foreground hover:bg-card"
					aria-label={tShell('nextMonth')}
					onClick={onNext}
				>
					<ChevronRight className="size-4" />
				</Button>
			</div>
			{showToday && (
				<Button variant="outline" size="sm" onClick={onToday}>
					{tShell('thisMonth')}
				</Button>
			)}
		</div>
	);
}
